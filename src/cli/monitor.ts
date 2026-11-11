import type { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { CkbDocsAdapter } from '../adapters/docs/ckb-docs-adapter';
import { RfcsAdapter } from '../adapters/docs/rfcs-adapter';
import { ExplorerApiAdapter } from '../adapters/explorer/explorer-api-adapter';
import { OnChainAdapter } from '../adapters/onchain/ckb-rpc-adapter';
import { CccSdkAdapter } from '../adapters/sdk/ccc-sdk-adapter';
import { Baseline } from '../engine/baseline';
import { applyAuthorizedUpgrades } from '../engine/baseline-writer';
import { MonitorRunner } from '../engine/monitor';
import { MonitorState } from '../engine/state';
import { DiscordNotifier } from '../notifier/discord';
import { FeishuNotifier } from '../notifier/feishu';
import { GithubIssueNotifier } from '../notifier/github-issue';
import { Notifier } from '../notifier/notifier';
import { TelegramNotifier } from '../notifier/telegram';
import { WebhookNotifier } from '../notifier/webhook';
import type { Network, ScriptSourceAdapter } from '../types/adapter';
import {
  isAtLeast,
  type MonitorReport,
  parseRiskLevel,
  RiskLevel,
} from '../types/report';

export interface MonitorCliOptions {
  network?: string;
  sources?: string;
  deploymentsDir?: string;
  out?: string;
  state?: string;
  notify?: boolean;
  failOn?: string;
  watch?: string;
  apply?: boolean;
  force?: boolean;
}

const ALL_SOURCES = ['docs-nervos', 'rfcs-nervos', 'ckb-explorer', 'sdk-ccc'];

function parseNetworks(value?: string): Network[] {
  if (!value || value === 'both' || value === 'all')
    return ['mainnet', 'testnet'];
  if (value === 'mainnet' || value === 'testnet') return [value];
  throw new Error(
    `Unknown network "${value}" (expected mainnet, testnet or both)`
  );
}

function makeAdapters(ids: string[]): ScriptSourceAdapter[] {
  const available: Record<string, () => ScriptSourceAdapter> = {
    'docs-nervos': () => new CkbDocsAdapter(),
    'rfcs-nervos': () => new RfcsAdapter(),
    'ckb-explorer': () => new ExplorerApiAdapter(),
    'sdk-ccc': () => new CccSdkAdapter(),
  };
  return ids.map((id) => {
    const factory = available[id];
    if (!factory)
      throw new Error(
        `Unknown source "${id}" (available: onchain-rpc, ${ALL_SOURCES.join(', ')})`
      );
    return factory();
  });
}

function selectedSources(value?: string): string[] {
  if (!value || value === 'all') return ALL_SOURCES;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && v !== 'onchain-rpc');
}

function writeReport(report: MonitorReport, outDir: string): string {
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = report.finishedAt.replace(/[:.]/g, '-');
  const file = path.join(outDir, `monitor-${stamp}.json`);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(
    path.join(outDir, 'latest-report.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(outDir, 'latest-status.json'),
    `${JSON.stringify(
      {
        status: report.highestRisk,
        finishedAt: report.finishedAt,
        counts: report.counts,
        networks: report.networks,
        sources: report.sources.map((s) => ({
          id: s.id,
          network: s.network,
          ok: s.ok,
          count: s.count,
          error: s.error,
        })),
      },
      null,
      2
    )}\n`
  );
  return file;
}

function printReport(report: MonitorReport, file: string): void {
  console.log('\n📊 CKB security monitor summary');
  console.log('='.repeat(60));
  console.log(
    `Networks: ${report.networks.join(', ')} | baseline scripts: ${report.baselineScripts}`
  );
  console.log(
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s | highest risk: ${report.highestRisk}`
  );
  console.log(
    `P0=${report.counts.P0_CRITICAL} P1=${report.counts.P1_HIGH} P2=${report.counts.P2_MEDIUM} P3=${report.counts.P3_INFO}`
  );
  for (const source of report.sources) {
    console.log(
      `  ${source.ok ? '✅' : '❌'} ${source.id} [${source.network}] ${source.count} entries${source.error ? ` — ${source.error}` : ''}`
    );
  }
  const important = report.mismatches.filter(
    (m) => m.riskLevel !== RiskLevel.P3_INFO
  );
  for (const m of important.slice(0, 30)) {
    console.log(
      `\n[${m.riskLevel}] ${m.network}/${m.scriptName} ${m.kind} (${m.sourceId})`
    );
    console.log(`  ${m.description}`);
  }
  if (important.length > 30)
    console.log(`\n... ${important.length - 30} more findings in ${file}`);
  if (report.upgrades.length > 0) {
    console.log('\nUpgrade events:');
    for (const event of report.upgrades) {
      console.log(
        `  ${event.network}/${event.scriptName}: ${event.status}, authorized=${event.authorized}, latest=${event.latestOutPoint?.txHash ?? 'none'}`
      );
    }
  }
  console.log(`\n📝 Full report: ${file}`);
}

function createNotifier(): Notifier {
  return new Notifier(
    [
      TelegramNotifier.fromEnv(),
      FeishuNotifier.fromEnv(),
      DiscordNotifier.fromEnv(),
      GithubIssueNotifier.fromEnv(),
      WebhookNotifier.fromEnv(),
    ].filter((c): c is NonNullable<typeof c> => !!c)
  );
}

export async function runMonitorCommand(
  options: MonitorCliOptions
): Promise<MonitorReport> {
  const networks = parseNetworks(options.network);
  const baseline = new Baseline(options.deploymentsDir);
  const onchain = new OnChainAdapter(baseline);
  const adapters = makeAdapters(selectedSources(options.sources));
  const state = new MonitorState(
    options.state ?? './results/monitor-state.json'
  );
  const runner = new MonitorRunner();
  const report = await runner.run({
    networks,
    baseline,
    onchain,
    adapters,
    onSource: (status) => state.updateSource(status),
  });
  const file = writeReport(report, options.out ?? './results');
  printReport(report, file);

  if (options.apply) {
    const applied = applyAuthorizedUpgrades(baseline, report.upgrades, {
      force: options.force,
    });
    if (applied.length) {
      console.log('\n✍️  Applied authorized baseline updates:');
      for (const item of applied)
        console.log(
          `  ${item.file}: ${item.oldOutPoint} -> ${item.newOutPoint}`
        );
    } else {
      console.log('\nNo authorized baseline updates to apply.');
    }
  }

  if (options.notify !== false) {
    const notifier = createNotifier();
    await notifier.notify(report, state);
  }
  state.save();

  const failOn =
    options.failOn && options.failOn !== 'none'
      ? parseRiskLevel(options.failOn)
      : undefined;
  if (failOn && isAtLeast(report.highestRisk, failOn)) {
    process.exitCode = 1;
  }
  return report;
}

export function registerMonitorCommands(program: Command): void {
  const monitor = program
    .command('monitor')
    .description(
      'Cross-check canonical deployments against chain, docs, Explorer and SDK'
    );

  const addOptions = (command: Command) =>
    command
      .option('--network <network>', 'mainnet, testnet or both', 'both')
      .option(
        '--sources <ids>',
        `comma-separated sources (default: ${ALL_SOURCES.join(',')})`
      )
      .option('--deployments-dir <dir>', 'canonical deployment JSON directory')
      .option('--out <dir>', 'report output directory', './results')
      .option(
        '--state <file>',
        'dedup/failure state file',
        './results/monitor-state.json'
      )
      .option(
        '--no-notify',
        'disable configured Telegram/Feishu/Discord/GitHub alerts'
      )
      .option('--fail-on <level>', 'exit 1 at P0/P1/P2/P3, or none', 'P0');

  addOptions(monitor).action(async (options: MonitorCliOptions) => {
    const watchSeconds = Number(options.watch ?? 0);
    do {
      await runMonitorCommand(options);
      if (watchSeconds > 0) {
        console.log(`\n⏳ Next pass in ${watchSeconds}s (Ctrl-C to stop)`);
        await new Promise((resolve) =>
          setTimeout(resolve, watchSeconds * 1000)
        );
      }
    } while (watchSeconds > 0);
  });
  monitor.option('--watch <seconds>', 'run continuously at this interval');

  const upgrade = monitor
    .command('upgrade')
    .description(
      'Trace dead deployment cells and optionally update whitelisted baselines'
    )
    .option('--apply', 'write authorized upgrades to deployment JSON files')
    .option(
      '--force',
      'also apply non-whitelisted upgrades (dangerous, requires review)'
    );
  upgrade.action(async (options: MonitorCliOptions, command: Command) => {
    // Parent options are shared with the subcommand; optsWithGlobals preserves
    // values supplied after the `upgrade` keyword as well.
    await runMonitorCommand({
      ...command.optsWithGlobals(),
      ...options,
      sources: 'onchain-rpc',
    });
  });
}

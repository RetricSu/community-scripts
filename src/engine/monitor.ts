import type { BaseAdapter } from '../adapters/base';
import type { OnChainAdapter } from '../adapters/onchain/ckb-rpc-adapter';
import type {
  Network,
  NormalizedScriptInfo,
  ScriptSourceAdapter,
} from '../types/adapter';
import type {
  MonitorReport,
  SourceStatus,
  UpgradeEvent,
  VerificationMismatch,
} from '../types/report';
import { withRetry } from '../utils/http';
import { errorMessage } from '../utils/normalize';
import { Baseline } from './baseline';
import { RiskEvaluator } from './risk-evaluator';
import { UpgradeTracker } from './upgrade-tracker';
import { CrossVerifier, makeTruthMap } from './verifier';

export interface MonitorRunOptions {
  networks: Network[];
  /** External adapters; the on-chain adapter is always supplied separately. */
  adapters: ScriptSourceAdapter[];
  baseline?: Baseline;
  onchain: OnChainAdapter;
  tracker?: UpgradeTracker;
  onSource?: (status: SourceStatus) => void;
}

/** Orchestrates one complete, fault-isolated monitoring pass. */
export class MonitorRunner {
  async run(options: MonitorRunOptions): Promise<MonitorReport> {
    const started = Date.now();
    const baseline = options.baseline ?? new Baseline();
    const tracker = options.tracker ?? new UpgradeTracker(options.onchain);
    const verifier = new CrossVerifier(
      baseline,
      options.onchain,
      tracker,
      new RiskEvaluator()
    );
    const sources: SourceStatus[] = [];
    const mismatches: VerificationMismatch[] = [];
    const upgrades: UpgradeEvent[] = [];

    for (const network of options.networks) {
      let truths: NormalizedScriptInfo[] = [];
      const onchainStart = Date.now();
      try {
        truths = await withRetry(() => options.onchain.fetchScripts(network), {
          retries: 1,
        });
        const status: SourceStatus = {
          id: options.onchain.id,
          name: options.onchain.name,
          type: options.onchain.type,
          network,
          ok: true,
          count: truths.length,
          durationMs: Date.now() - onchainStart,
        };
        sources.push(status);
        options.onSource?.(status);

        const baselineResult = await verifier.verifyBaseline(truths);
        mismatches.push(...baselineResult.mismatches);
        upgrades.push(...baselineResult.upgrades);
      } catch (error) {
        const status: SourceStatus = {
          id: options.onchain.id,
          name: options.onchain.name,
          type: options.onchain.type,
          network,
          ok: false,
          count: 0,
          durationMs: Date.now() - onchainStart,
          error: errorMessage(error),
        };
        sources.push(status);
        options.onSource?.(status);
        mismatches.push(
          new RiskEvaluator().createMismatch({
            scriptName: '*',
            network,
            sourceId: options.onchain.id,
            field: 'source',
            kind: 'SOURCE_UNAVAILABLE',
            expected: 'RPC response',
            actual: status.error,
            description: `On-chain source failed for ${network}: ${status.error}`,
            actionRequired:
              'Check CKB RPC connectivity and retry; external results are not authoritative without it.',
          })
        );
      }

      const truthMap = makeTruthMap(truths);
      for (const adapter of options.adapters) {
        if (adapter.type === 'onchain') continue;
        if (adapter instanceof Object && 'supports' in adapter) {
          const supports = (adapter as BaseAdapter).supports(network);
          if (!supports) continue;
        }
        const start = Date.now();
        try {
          const infos = await withRetry(() => adapter.fetchScripts(network), {
            retries: 1,
          });
          const status: SourceStatus = {
            id: adapter.id,
            name: adapter.name,
            type: adapter.type,
            network,
            ok: true,
            count: infos.length,
            durationMs: Date.now() - start,
          };
          sources.push(status);
          options.onSource?.(status);
          mismatches.push(
            ...(await verifier.verifySource(adapter.id, infos, truthMap))
          );
        } catch (error) {
          const status: SourceStatus = {
            id: adapter.id,
            name: adapter.name,
            type: adapter.type,
            network,
            ok: false,
            count: 0,
            durationMs: Date.now() - start,
            error: errorMessage(error),
          };
          sources.push(status);
          options.onSource?.(status);
          mismatches.push(
            new RiskEvaluator().createMismatch({
              scriptName: '*',
              network,
              sourceId: adapter.id,
              field: 'source',
              kind: 'SOURCE_UNAVAILABLE',
              expected: 'source response',
              actual: status.error,
              description: `${adapter.name} failed for ${network}: ${status.error}`,
              actionRequired:
                'Retry with backoff; repeated failures are tracked in monitor-state.json.',
            })
          );
        }
      }
    }

    const uniqueMismatches = dedupeMismatches(mismatches);
    const risk = new RiskEvaluator();
    const sorted = risk.sort(uniqueMismatches);
    const summary = risk.summarize(sorted);
    const finished = Date.now();
    return {
      startedAt: new Date(started).toISOString(),
      finishedAt: new Date(finished).toISOString(),
      durationMs: finished - started,
      networks: options.networks,
      baselineScripts: baseline.size,
      sources,
      mismatches: sorted,
      upgrades,
      counts: summary.counts,
      highestRisk: summary.highestRisk,
    };
  }
}

function dedupeMismatches(
  mismatches: VerificationMismatch[]
): VerificationMismatch[] {
  const map = new Map<string, VerificationMismatch>();
  for (const mismatch of mismatches) {
    if (!map.has(mismatch.fingerprint)) map.set(mismatch.fingerprint, mismatch);
  }
  return [...map.values()];
}

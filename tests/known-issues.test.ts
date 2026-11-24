import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { KnownIssuesRegistry } from '../src/engine/known-issues';
import { RiskEvaluator } from '../src/engine/risk-evaluator';
import { MonitorState } from '../src/engine/state';
import { Notifier } from '../src/notifier/notifier';
import { RiskLevel, type VerificationMismatch } from '../src/types/report';

const FP = 'ckb-explorer:mainnet:demo:codeHash:CODE_HASH_MISMATCH';

function mismatch(fingerprint = FP): VerificationMismatch {
  return {
    scriptName: 'demo',
    network: 'mainnet',
    sourceId: 'ckb-explorer',
    field: 'codeHash',
    kind: 'CODE_HASH_MISMATCH',
    expected: '0x1',
    actual: '0x2',
    riskLevel: RiskLevel.P0_CRITICAL,
    description: 'fixture',
    actionRequired: 'fixture',
    fingerprint,
  };
}

function writeRegistry(content: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-known-'));
  const file = path.join(dir, 'known.json');
  fs.writeFileSync(
    file,
    typeof content === 'string' ? content : JSON.stringify(content)
  );
  return file;
}

test('known-issues registry marks exact fingerprint matches as known', () => {
  const file = writeRegistry({
    version: 1,
    issues: [
      {
        fingerprint: FP,
        note: 'Explorer data lag officially confirmed',
        recordedAt: '2026-02-20T00:00:00Z',
        expiresAt: '2026-12-31T00:00:00Z',
      },
    ],
  });
  const registry = KnownIssuesRegistry.load(file);
  const findings = [mismatch(), mismatch('other:mainnet:demo:x:y')];
  const known = registry.annotate(findings);
  assert.equal(known, 1);
  assert.equal(findings[0].known, true);
  assert.equal(findings[0].knownNote, 'Explorer data lag officially confirmed');
  assert.equal(findings[0].knownExpiresAt, '2026-12-31T00:00:00Z');
  assert.equal(findings[1].known, undefined);
});

test('expired known-issue entries stop matching so findings resurface', () => {
  const file = writeRegistry({
    version: 1,
    issues: [
      {
        fingerprint: FP,
        note: 'outdated acknowledgement',
        recordedAt: '2025-01-01T00:00:00Z',
        expiresAt: '2025-02-01T00:00:00Z',
      },
    ],
  });
  const registry = KnownIssuesRegistry.load(file);
  const findings = [mismatch()];
  assert.equal(registry.annotate(findings), 0);
  assert.equal(findings[0].known, undefined);
});

test('missing or corrupt registry file degrades to empty registry', () => {
  const missing = KnownIssuesRegistry.load('/nonexistent/known.json');
  assert.equal(missing.size, 0);
  assert.equal(missing.annotate([mismatch()]), 0);

  const corrupt = KnownIssuesRegistry.load(writeRegistry('{not json'));
  assert.equal(corrupt.size, 0);
  assert.equal(corrupt.annotate([mismatch()]), 0);
});

test('invalid registry entries are dropped, valid ones kept', () => {
  const file = writeRegistry({
    version: 1,
    issues: [
      { fingerprint: FP, note: 'ok', recordedAt: '2026-02-20T00:00:00Z' },
      { note: 'no fingerprint', recordedAt: '2026-02-20T00:00:00Z' },
      {
        fingerprint: FP,
        note: 'bad expiry',
        recordedAt: 'x',
        expiresAt: 'nope',
      },
    ],
  });
  const registry = KnownIssuesRegistry.load(file);
  assert.equal(registry.size, 1);
});

test('risk summary of unresolved findings excludes known ones', () => {
  const evaluator = new RiskEvaluator();
  const knownFinding = mismatch(FP);
  knownFinding.known = true;
  const freshFinding = mismatch('other:mainnet:demo:x:y');
  freshFinding.riskLevel = RiskLevel.P1_HIGH;
  const unresolved = [knownFinding, freshFinding].filter((m) => !m.known);
  const summary = evaluator.summarize(unresolved);
  assert.equal(summary.highestRisk, RiskLevel.P1_HIGH);
  assert.equal(summary.counts[RiskLevel.P0_CRITICAL], 0);
});

test('notifier never sends known findings, still sends fresh ones', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-notify-'));
  const state = new MonitorState(path.join(dir, 'state.json'));
  const sent: string[] = [];
  const channel = {
    id: 'test',
    minLevel: RiskLevel.P3_INFO,
    send: async (_report: unknown, mismatches: VerificationMismatch[]) => {
      sent.push(...mismatches.map((m) => m.fingerprint));
    },
  };
  const knownFinding = mismatch(FP);
  knownFinding.known = true;
  const freshFinding = mismatch('fresh:mainnet:demo:x:y');
  await new Notifier([channel]).notify(
    {
      startedAt: '',
      finishedAt: '',
      durationMs: 0,
      networks: ['mainnet'],
      baselineScripts: 1,
      sources: [],
      mismatches: [knownFinding, freshFinding],
      upgrades: [],
      counts: {
        [RiskLevel.P0_CRITICAL]: 2,
        [RiskLevel.P1_HIGH]: 0,
        [RiskLevel.P2_MEDIUM]: 0,
        [RiskLevel.P3_INFO]: 0,
      },
      highestRisk: RiskLevel.P0_CRITICAL,
    },
    state
  );
  assert.deepEqual(sent, ['fresh:mainnet:demo:x:y']);
});

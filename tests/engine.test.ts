import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Baseline } from '../src/engine/baseline';
import { CrossVerifier, makeTruthMap } from '../src/engine/verifier';
import { RiskEvaluator } from '../src/engine/risk-evaluator';
import { RiskLevel } from '../src/types/report';
import type { CellDepStatus, NormalizedScriptInfo } from '../src/types/adapter';
import { UpgradeTracker } from '../src/engine/upgrade-tracker';
import { MonitorState } from '../src/engine/state';
import { Notifier, formatAlertText } from '../src/notifier/notifier';

const DATA = `0x${'a'.repeat(64)}`;
const TYPE = `0x${'b'.repeat(64)}`;
const TX = `0x${'c'.repeat(64)}`;
const OTHER_TX = `0x${'d'.repeat(64)}`;

function fixtureBaseline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-baseline-'));
  fs.writeFileSync(
    path.join(dir, 'demo.json'),
    JSON.stringify({
      name: 'demo',
      description: 'fixture',
      scriptType: 'lock',
      mainnet: {
        dataHash: DATA,
        typeHash: TYPE,
        cellDeps: [{ depType: 'code', outPoint: { txHash: TX, index: '0x0' } }],
      },
    })
  );
  return new Baseline(dir);
}

function liveStatus(outPoint = { txHash: TX, index: '0x0' }): CellDepStatus {
  return {
    cellDep: { depType: 'code', outPoint },
    exists: true,
    isLive: true,
    dataHash: DATA,
    typeHash: TYPE,
  };
}

function truth(): NormalizedScriptInfo {
  return {
    canonicalName: 'demo',
    sourceName: 'demo',
    network: 'mainnet',
    codeHash: TYPE,
    hashType: 'type',
    cellDeps: [{ depType: 'code', outPoint: { txHash: TX, index: '0x0' } }],
    metadata: {
      fetchedAt: Date.now(),
      actualDataHash: DATA,
      actualTypeHash: TYPE,
      isLive: true,
      cellDepStatus: [liveStatus()],
    },
  };
}

function fakeOnchain(status = liveStatus()) {
  return {
    inspectCellDep: async () => status,
  } as any;
}

test('risk evaluator assigns P0 to code poisoning and P1 to dead cells', () => {
  const risk = new RiskEvaluator();
  assert.equal(
    risk.createMismatch({
      scriptName: 'x',
      network: 'mainnet',
      sourceId: 'docs',
      field: 'codeHash',
      kind: 'CODE_HASH_MISMATCH',
      expected: DATA,
      actual: TYPE,
      description: 'x',
      actionRequired: 'x',
    }).riskLevel,
    RiskLevel.P0_CRITICAL
  );
  assert.equal(
    risk.createMismatch({
      scriptName: 'x',
      network: 'mainnet',
      sourceId: 'docs',
      field: 'liveness',
      kind: 'CELLDEP_DEAD',
      expected: 'live',
      actual: 'dead',
      description: 'x',
      actionRequired: 'x',
    }).riskLevel,
    RiskLevel.P1_HIGH
  );
});

test('cross verifier accepts matching source and flags poisoned code hash', async () => {
  const baseline = fixtureBaseline();
  const verifier = new CrossVerifier(baseline, fakeOnchain());
  const good = await verifier.verifySource(
    'docs',
    [truth()],
    makeTruthMap([truth()])
  );
  assert.equal(good.length, 0);
  const bad = await verifier.verifySource(
    'docs',
    [{ ...truth(), codeHash: DATA, hashType: 'type' }],
    makeTruthMap([truth()])
  );
  assert.equal(bad[0].kind, 'CODE_HASH_MISMATCH');
  assert.equal(bad[0].riskLevel, RiskLevel.P0_CRITICAL);
});

test('cross verifier treats auxiliary dep groups as drift, not code poisoning', async () => {
  const baseline = fixtureBaseline();
  const group = liveStatus({ txHash: OTHER_TX, index: '0x0' });
  group.cellDep.depType = 'dep_group';
  group.members = [];
  const verifier = new CrossVerifier(baseline, fakeOnchain(group));
  const source = {
    ...truth(),
    cellDeps: [
      { depType: 'code' as const, outPoint: { txHash: TX, index: '0x0' } },
      {
        depType: 'dep_group' as const,
        outPoint: { txHash: OTHER_TX, index: '0x0' },
      },
    ],
  };
  const result = await verifier.verifySource(
    'sdk-ccc',
    [source],
    makeTruthMap([truth()])
  );
  assert.ok(result.some((m) => m.kind === 'CELLDEP_EXTRA'));
  assert.ok(!result.some((m) => m.kind === 'CELLDEP_UNKNOWN_CODE'));
});

test('cross verifier reports a dead external cell as P1', async () => {
  const baseline = fixtureBaseline();
  const dead = { ...liveStatus(), isLive: false };
  const verifier = new CrossVerifier(baseline, fakeOnchain(dead));
  const source = {
    ...truth(),
    cellDeps: [
      {
        depType: 'code' as const,
        outPoint: { txHash: OTHER_TX, index: '0x0' },
      },
    ],
  };
  const result = await verifier.verifySource(
    'docs',
    [source],
    makeTruthMap([truth()])
  );
  assert.ok(
    result.some(
      (m) => m.kind === 'CELLDEP_DEAD' && m.riskLevel === RiskLevel.P1_HIGH
    )
  );
});

test('upgrade whitelist requires script, network and transaction hash', () => {
  const tracker = new UpgradeTracker(fakeOnchain(), [
    { scriptName: 'demo', network: 'mainnet', txHash: TX, newDataHash: DATA },
  ]);
  assert.ok(tracker.isWhitelisted('demo', 'mainnet', TX, DATA));
  assert.equal(tracker.isWhitelisted('demo', 'testnet', TX, DATA), undefined);
  assert.equal(tracker.isWhitelisted('other', 'mainnet', TX, DATA), undefined);
});

test('monitor state deduplicates notifications per channel', async () => {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-state-')),
    'state.json'
  );
  const state = new MonitorState(file);
  const mismatch = new RiskEvaluator().createMismatch({
    scriptName: 'demo',
    network: 'mainnet',
    sourceId: 'docs',
    field: 'codeHash',
    kind: 'CODE_HASH_MISMATCH',
    expected: DATA,
    actual: TYPE,
    description: 'bad',
    actionRequired: 'fix',
  });
  assert.equal(state.shouldNotify('telegram', mismatch), true);
  state.markNotified('telegram', mismatch);
  assert.equal(state.shouldNotify('telegram', mismatch), false);
  assert.equal(state.shouldNotify('discord', mismatch), true);
  state.save();
  assert.equal(
    new MonitorState(file).shouldNotify('telegram', mismatch),
    false
  );
  assert.ok(
    formatAlertText(
      {
        highestRisk: RiskLevel.P0_CRITICAL,
        finishedAt: 'now',
        networks: ['mainnet'],
        counts: { P0_CRITICAL: 1, P1_HIGH: 0, P2_MEDIUM: 0, P3_INFO: 0 },
      } as any,
      [mismatch]
    ).includes('demo')
  );
  await new Notifier([]).notify({ mismatches: [mismatch] } as any, state);
});

test('baseline audit separates authorized upgrades from integrity failures', async () => {
  const baseline = fixtureBaseline();
  const deadTruth = {
    ...truth(),
    metadata: {
      ...truth().metadata,
      fetchedAt: Date.now(),
      isLive: false,
      cellDepStatus: [{ ...liveStatus(), isLive: false }],
    },
  };
  const event = {
    scriptName: 'demo',
    network: 'mainnet' as const,
    oldOutPoint: { txHash: TX, index: '0x0' },
    status: 'upgraded' as const,
    hops: [],
    latestOutPoint: { txHash: OTHER_TX, index: '0x0' },
    authorized: true,
  };
  const tracker = { trace: async () => event } as any;
  const verifier = new CrossVerifier(baseline, fakeOnchain(), tracker);
  const result = await verifier.verifyBaseline([deadTruth]);
  assert.equal(result.upgrades[0], event);
  assert.ok(
    result.mismatches.some(
      (m) =>
        m.kind === 'UPGRADE_AUTHORIZED' && m.riskLevel === RiskLevel.P1_HIGH
    )
  );

  const badTruth = {
    ...truth(),
    metadata: {
      ...truth().metadata,
      fetchedAt: Date.now(),
      cellDepStatus: [{ ...liveStatus(), dataHash: TYPE }],
    },
  };
  const integrity = await new CrossVerifier(
    baseline,
    fakeOnchain()
  ).verifyBaseline([badTruth]);
  assert.ok(
    integrity.mismatches.some(
      (m) =>
        m.kind === 'BASELINE_INTEGRITY' && m.riskLevel === RiskLevel.P0_CRITICAL
    )
  );
});

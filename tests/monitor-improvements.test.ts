import assert from 'node:assert/strict';
import test from 'node:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { writeReport } from '../src/cli/monitor';
import { Baseline } from '../src/engine/baseline';
import { MonitorRunner } from '../src/engine/monitor';
import { RiskEvaluator } from '../src/engine/risk-evaluator';
import {
  applyLiveSuccessorHashes,
  CrossVerifier,
  makeTruthMap,
} from '../src/engine/verifier';
import type {
  CellDepStatus,
  NormalizedScriptInfo,
} from '../src/types/adapter';
import {
  type MonitorReport,
  RiskLevel,
  type UpgradeEvent,
  type VerificationMismatch,
} from '../src/types/report';
import {
  findingMarker,
  groupFindings,
  groupKey,
  groupsToOpen,
  isGroupCovered,
  issueBody,
  rootCauseId,
} from '../src/notifier/issue-grouping';

const OLD_DATA = `0x${'a'.repeat(64)}`;
const NEW_DATA = `0x${'e'.repeat(64)}`;
const BAD_DATA = `0x${'f'.repeat(64)}`;
const TYPE = `0x${'b'.repeat(64)}`;
const TX = `0x${'c'.repeat(64)}`;
const TIP_TX = `0x${'d'.repeat(64)}`;

function fixtureBaseline() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-mon-base-'));
  fs.writeFileSync(
    path.join(dir, 'demo.json'),
    JSON.stringify({
      name: 'demo',
      description: 'fixture',
      scriptType: 'lock',
      testnet: {
        dataHash: OLD_DATA,
        typeHash: TYPE,
        cellDeps: [
          { depType: 'code', outPoint: { txHash: TX, index: '0x0' } },
        ],
      },
    })
  );
  return new Baseline(dir);
}

function deadStatus(): CellDepStatus {
  return {
    cellDep: { depType: 'code', outPoint: { txHash: TX, index: '0x0' } },
    exists: true,
    isLive: false,
    dataHash: OLD_DATA,
    typeHash: TYPE,
  };
}

function deadTruth(): NormalizedScriptInfo {
  return {
    canonicalName: 'demo',
    sourceName: 'demo',
    network: 'testnet',
    codeHash: TYPE,
    hashType: 'type',
    cellDeps: [{ depType: 'code', outPoint: { txHash: TX, index: '0x0' } }],
    metadata: {
      fetchedAt: Date.now(),
      actualDataHash: OLD_DATA,
      actualTypeHash: TYPE,
      isLive: false,
      cellDepStatus: [deadStatus()],
    },
  };
}

function upgradeEvent(
  overrides: Partial<UpgradeEvent> = {}
): UpgradeEvent {
  return {
    scriptName: 'demo',
    network: 'testnet',
    oldOutPoint: { txHash: TX, index: '0x0' },
    status: 'upgraded',
    hops: [
      {
        consumedOutPoint: { txHash: TX, index: '0x0' },
        consumingTxHash: TIP_TX,
        oldDataHash: OLD_DATA,
        newOutPoint: { txHash: TIP_TX, index: '0x0' },
        newDataHash: NEW_DATA,
      },
    ],
    latestOutPoint: { txHash: TIP_TX, index: '0x0' },
    latestDataHash: NEW_DATA,
    latestTypeHash: TYPE,
    authorized: false,
    ...overrides,
  };
}

function explorerInfo(declaredDataHash: string): NormalizedScriptInfo {
  return {
    canonicalName: 'demo',
    sourceName: 'OMNI Lock V2',
    network: 'testnet',
    codeHash: TYPE,
    hashType: 'type',
    cellDeps: [
      { depType: 'code', outPoint: { txHash: TIP_TX, index: '0x0' } },
    ],
    metadata: {
      fetchedAt: Date.now(),
      declaredDataHash,
      declaredTypeHash: TYPE,
    },
  };
}

function mismatch(partial: Partial<VerificationMismatch> & { fingerprint: string }): VerificationMismatch {
  return {
    scriptName: 'anyone_can_pay',
    network: 'testnet',
    sourceId: 'ckb-explorer',
    field: 'codeHash',
    kind: 'CODE_HASH_MISMATCH',
    expected: '0x1',
    actual: '0x2',
    riskLevel: RiskLevel.P0_CRITICAL,
    description: 'hash differs',
    actionRequired: 'investigate',
    ...partial,
  };
}

function sampleReport(
  mismatches: VerificationMismatch[]
): MonitorReport {
  return {
    startedAt: '2026-11-11T06:42:15.988Z',
    finishedAt: '2026-11-11T06:42:15.988Z',
    durationMs: 1,
    networks: ['testnet'],
    baselineScripts: 1,
    sources: [],
    mismatches,
    upgrades: [],
    counts: {
      P0_CRITICAL: mismatches.filter((m) => m.riskLevel === RiskLevel.P0_CRITICAL)
        .length,
      P1_HIGH: mismatches.filter((m) => m.riskLevel === RiskLevel.P1_HIGH)
        .length,
      P2_MEDIUM: 0,
      P3_INFO: 0,
    },
    highestRisk: mismatches[0]?.riskLevel ?? RiskLevel.P3_INFO,
  };
}

test('writeReport keeps latest-report.json when updateLatest is false', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-mon-out-'));
  const full = sampleReport([
    mismatch({
      fingerprint: 'ckb-explorer:testnet:anyone_can_pay:codeHash:CODE_HASH_MISMATCH',
    }),
  ]);
  full.sources = [
    {
      id: 'docs-nervos',
      name: 'docs',
      type: 'docs',
      network: 'testnet',
      ok: true,
      count: 3,
      durationMs: 1,
    },
  ];
  writeReport(full, dir);
  const latestBefore = fs.readFileSync(
    path.join(dir, 'latest-report.json'),
    'utf8'
  );
  const statusBefore = fs.readFileSync(
    path.join(dir, 'latest-status.json'),
    'utf8'
  );

  const narrow = sampleReport([]);
  narrow.finishedAt = '2026-11-11T06:42:28.137Z';
  narrow.sources = [
    {
      id: 'onchain-rpc',
      name: 'rpc',
      type: 'onchain',
      network: 'testnet',
      ok: true,
      count: 1,
      durationMs: 1,
    },
  ];
  const upgradeFile = writeReport(narrow, dir, { updateLatest: false });
  assert.match(upgradeFile, /monitor-2026-11-11T06-42-28-137Z\.json$/);
  assert.equal(
    fs.readFileSync(path.join(dir, 'latest-report.json'), 'utf8'),
    latestBefore
  );
  assert.equal(
    fs.readFileSync(path.join(dir, 'latest-status.json'), 'utf8'),
    statusBefore
  );
  const written = JSON.parse(fs.readFileSync(upgradeFile, 'utf8'));
  assert.deepEqual(
    written.sources.map((s: { id: string }) => s.id),
    ['onchain-rpc']
  );
  const fullParsed = JSON.parse(latestBefore);
  assert.deepEqual(
    fullParsed.sources.map((s: { id: string }) => s.id),
    ['docs-nervos']
  );
});

test('writeReport updates latest files by default', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-mon-out-'));
  writeReport(sampleReport([]), dir);
  const next = sampleReport([]);
  next.finishedAt = '2026-11-11T07:00:00.000Z';
  writeReport(next, dir);
  const latest = JSON.parse(
    fs.readFileSync(path.join(dir, 'latest-report.json'), 'utf8')
  );
  assert.equal(latest.finishedAt, '2026-11-11T07:00:00.000Z');
});

test('Type ID successor hashes are used for comparison without authorizing the upgrade', async () => {
  const baseline = fixtureBaseline();
  const event = upgradeEvent();
  const truth = applyLiveSuccessorHashes([deadTruth()], [event])[0];
  assert.equal(truth.metadata?.actualDataHash, NEW_DATA);
  assert.equal(truth.metadata?.actualTypeHash, TYPE);
  assert.equal(truth.metadata?.cellDepStatus?.[0].dataHash, OLD_DATA);
  assert.equal(truth.metadata?.cellDepStatus?.[0].isLive, false);
  assert.match(truth.metadata?.note ?? '', /does not authorize/);

  const tipStatus: CellDepStatus = {
    cellDep: { depType: 'code', outPoint: { txHash: TIP_TX, index: '0x0' } },
    exists: true,
    isLive: true,
    dataHash: NEW_DATA,
    typeHash: TYPE,
  };
  const verifier = new CrossVerifier(baseline, {
    inspectCellDep: async () => tipStatus,
  } as any);
  const matching = await verifier.verifySource(
    'ckb-explorer',
    [explorerInfo(NEW_DATA)],
    makeTruthMap([truth])
  );
  assert.ok(
    !matching.some((m) => m.kind === 'CODE_HASH_MISMATCH'),
    `unexpected hash mismatch: ${matching.map((m) => m.kind).join(',')}`
  );

  const stale = await verifier.verifySource(
    'ckb-explorer',
    [explorerInfo(OLD_DATA)],
    makeTruthMap([truth])
  );
  const staleHash = stale.find((m) => m.kind === 'CODE_HASH_MISMATCH');
  assert.ok(staleHash);
  assert.equal(staleHash?.riskLevel, RiskLevel.P0_CRITICAL);
  assert.equal(staleHash?.expected, NEW_DATA);
  assert.equal(staleHash?.actual, OLD_DATA);

  const malicious = await verifier.verifySource(
    'ckb-explorer',
    [explorerInfo(BAD_DATA)],
    makeTruthMap([truth])
  );
  const poisoned = malicious.find((m) => m.kind === 'CODE_HASH_MISMATCH');
  assert.ok(poisoned);
  assert.equal(poisoned?.riskLevel, RiskLevel.P0_CRITICAL);
  assert.equal(poisoned?.expected, NEW_DATA);
  assert.equal(poisoned?.actual, BAD_DATA);
  assert.match(poisoned?.actionRequired ?? '', /inferences to confirm|inferences, not conclusions|Confirm whether/);
});

test('destroyed cells do not donate hashes, and same lock does not authorize', async () => {
  const destroyed = upgradeEvent({
    status: 'destroyed',
    latestOutPoint: undefined,
    latestDataHash: undefined,
    latestTypeHash: undefined,
    hops: [
      {
        consumedOutPoint: { txHash: TX, index: '0x0' },
        consumingTxHash: TIP_TX,
        oldDataHash: OLD_DATA,
        signerLocks: [
          {
            codeHash: TYPE,
            hashType: 'type',
            args: '0x20da6b70dfe59586e89635dbb3adc7aa998e7189',
          },
        ],
      },
    ],
    signerLocks: [
      {
        codeHash: TYPE,
        hashType: 'type',
        args: '0x20da6b70dfe59586e89635dbb3adc7aa998e7189',
      },
    ],
  });
  const [truth] = applyLiveSuccessorHashes([deadTruth()], [destroyed]);
  assert.equal(truth.metadata?.actualDataHash, OLD_DATA);

  const tracker = { trace: async () => destroyed };
  const verifier = new CrossVerifier(
    fixtureBaseline(),
    { inspectCellDep: async () => deadStatus() } as any,
    tracker as any
  );
  const result = await verifier.verifyBaseline([deadTruth()]);
  const finding = result.mismatches.find(
    (m) => m.kind === 'DEPLOYMENT_DESTROYED'
  );
  assert.ok(finding);
  assert.equal(finding?.riskLevel, RiskLevel.P0_CRITICAL);
  assert.equal(
    finding?.fingerprint,
    `upgrade-tracker:testnet:demo:liveness:DEPLOYMENT_DESTROYED:${TX}:0x0`
  );
  assert.match(finding?.description ?? '', /Finding:/);
  assert.match(finding?.description ?? '', /not by itself authorization/);
  assert.doesNotMatch(finding?.description ?? '', /Treat as a security incident/);
  assert.doesNotMatch(
    finding?.actionRequired ?? '',
    /Treat as a security incident/
  );
  assert.match(finding?.actionRequired ?? '', /matching official lock/);
  assert.equal(result.upgrades[0].authorized, false);
  assert.deepEqual(result.upgrades[0].hops, destroyed.hops);
});

test('MonitorRunner keeps unauthorized upgrades after using successor hashes', async () => {
  const event = upgradeEvent();
  const tipStatus: CellDepStatus = {
    cellDep: { depType: 'code', outPoint: { txHash: TIP_TX, index: '0x0' } },
    exists: true,
    isLive: true,
    dataHash: NEW_DATA,
    typeHash: TYPE,
  };
  const onchain = {
    id: 'onchain-rpc',
    name: 'CKB RPC',
    type: 'onchain' as const,
    fetchScripts: async () => [deadTruth()],
    inspectCellDep: async () => tipStatus,
  };
  const explorer = {
    id: 'ckb-explorer',
    name: 'Explorer',
    type: 'explorer' as const,
    fetchScripts: async () => [explorerInfo(NEW_DATA)],
  };
  const report = await new MonitorRunner().run({
    networks: ['testnet'],
    baseline: fixtureBaseline(),
    onchain: onchain as any,
    adapters: [explorer as any],
    tracker: { trace: async () => event } as any,
  });
  assert.ok(report.upgrades[0]);
  assert.equal(report.upgrades[0].authorized, false);
  assert.deepEqual(report.upgrades[0].hops, event.hops);
  assert.ok(
    report.mismatches.some(
      (m) =>
        m.kind === 'UPGRADE_UNAUTHORIZED' &&
        m.riskLevel === RiskLevel.P0_CRITICAL
    )
  );
  assert.ok(!report.mismatches.some((m) => m.kind === 'CODE_HASH_MISMATCH'));
  const unauthorized = report.mismatches.find(
    (m) => m.kind === 'UPGRADE_UNAUTHORIZED'
  );
  assert.match(
    unauthorized?.description ?? '',
    /not on the upgrade whitelist/
  );
  assert.match(
    unauthorized?.actionRequired ?? '',
    /not treat Explorer, docs or SDK agreement as authorization/
  );
});

test('GitHub issues group by network+script+root cause and honor legacy fingerprints', () => {
  const acp = [
    mismatch({
      field: 'codeHash',
      fingerprint:
        'ckb-explorer:testnet:anyone_can_pay:codeHash:CODE_HASH_MISMATCH',
    }),
    mismatch({
      field: 'dataHash',
      fingerprint:
        'ckb-explorer:testnet:anyone_can_pay:dataHash:CODE_HASH_MISMATCH',
    }),
    mismatch({
      field: 'typeHash',
      fingerprint:
        'ckb-explorer:testnet:anyone_can_pay:typeHash:CODE_HASH_MISMATCH',
    }),
  ];
  const groups = groupFindings(acp);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].rootCause, 'hash-mismatch');
  assert.equal(
    groups[0].key,
    'testnet:anyone_can_pay:hash-mismatch'
  );
  assert.equal(groups[0].items.length, 3);

  const legacyBody = [
    findingMarker(acp[0].fingerprint),
    'existing issue for codeHash only',
  ].join('\n');
  assert.equal(isGroupCovered([legacyBody], groups[0]), true);

  const report = sampleReport(acp);
  assert.equal(
    groupsToOpen(report, acp, [legacyBody], RiskLevel.P1_HIGH).length,
    0
  );
  const opened = groupsToOpen(report, acp, [], RiskLevel.P1_HIGH);
  assert.equal(opened.length, 1);
  const body = issueBody(report, opened[0]);
  for (const item of acp) {
    assert.ok(body.includes(findingMarker(item.fingerprint)));
    assert.ok(body.includes(item.field));
  }
  assert.ok(body.includes('<!-- ckb-monitor-group:testnet:anyone_can_pay:hash-mismatch -->'));
});

test('CELLDEP_UNKNOWN_CODE stays its own root cause and keeps P0', () => {
  const risk = new RiskEvaluator();
  const unknown = risk.createMismatch({
    scriptName: 'demo',
    network: 'testnet',
    sourceId: 'ckb-explorer',
    field: 'cellDeps',
    kind: 'CELLDEP_UNKNOWN_CODE',
    expected: NEW_DATA,
    actual: BAD_DATA,
    description: 'unknown code',
    actionRequired: 'block use',
  });
  const alternative = risk.createMismatch({
    scriptName: 'demo',
    network: 'testnet',
    sourceId: 'ckb-explorer',
    field: 'cellDeps',
    kind: 'CELLDEP_ALTERNATIVE',
    expected: TX,
    actual: TIP_TX,
    description: 'alt',
    actionRequired: 'review',
  });
  assert.equal(unknown.riskLevel, RiskLevel.P0_CRITICAL);
  assert.equal(rootCauseId(unknown), 'unknown-code');
  assert.equal(rootCauseId(alternative), 'celldep-or-record-gap');
  assert.notEqual(groupKey(unknown), groupKey(alternative));
  const docsDead = risk.createMismatch({
    scriptName: 'demo',
    network: 'testnet',
    sourceId: 'docs-nervos',
    field: 'liveness',
    kind: 'CELLDEP_DEAD',
    expected: 'live',
    actual: 'dead',
    description: 'dead',
    actionRequired: 'update',
    fingerprintSuffix: `${TX}:0x0`,
  });
  const rfcDead = risk.createMismatch({
    scriptName: 'demo',
    network: 'testnet',
    sourceId: 'rfcs-nervos',
    field: 'liveness',
    kind: 'CELLDEP_DEAD',
    expected: 'live',
    actual: 'dead',
    description: 'dead',
    actionRequired: 'update',
    fingerprintSuffix: `${TX}:0x0`,
  });
  const stale = groupFindings([docsDead, rfcDead, alternative]);
  assert.equal(stale.length, 1);
  assert.equal(stale[0].items.length, 3);
  assert.equal(
    docsDead.fingerprint,
    `docs-nervos:testnet:demo:liveness:CELLDEP_DEAD:${TX}:0x0`
  );
});

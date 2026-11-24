import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { Baseline } from '../src/engine/baseline';
import {
  DEFAULT_UPGRADE_WHITELIST,
  type PlannedUpgrade,
  UpgradeTracker,
} from '../src/engine/upgrade-tracker';
import { CrossVerifier } from '../src/engine/verifier';
import type {
  CellDepStatus,
  Network,
  NormalizedOutPoint,
  NormalizedScriptInfo,
} from '../src/types/adapter';
import type { UpgradeEvent, UpgradeHop } from '../src/types/report';
import { RiskLevel } from '../src/types/report';

/** Recorded Omnilock testnet Type ID upgrade chain (RPC evidence; offline fixture). */
const OLD_OUTPOINT: NormalizedOutPoint = {
  txHash: '0x3d4296df1bd2cc2bd3f483f61ab7ebeac462a2f336f2b944168fe6ba5d81c014',
  index: '0x0',
};
const HOP1_TX =
  '0x7d9c9ccd12f40eebe508bbbf24b0d746c991e055f2f1b61c6fe8ca60467ae750';
const HOP1_DATA =
  '0x3f303aa87238dbc34a81a1c42109e07aad9c8e4ab3e8741d87fffca43851b2d7';
const HOP2_TX =
  '0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602';
const HOP2_DATA =
  '0x6b29b6f10346b43c540e53806ba88ba0fe3a0c3a29d7448ef555840c8f8318fa';
const TYPE_HASH =
  '0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb';
const OLD_DATA =
  '0x768f306681da232ceb0b94f436c5f813377179762a831c5ad8797bd4fd2d118d';
const UNKNOWN_TX = `0x${'ab'.repeat(32)}`;

const PRESERVED_ENTRIES: Array<
  Pick<PlannedUpgrade, 'scriptName' | 'network' | 'txHash' | 'newDataHash'>
> = [
  {
    scriptName: 'omnilock',
    network: 'mainnet',
    txHash:
      '0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842',
    newDataHash:
      '0x768f306681da232ceb0b94f436c5f813377179762a831c5ad8797bd4fd2d118d',
  },
  {
    scriptName: 'nostr_binding',
    network: 'mainnet',
    txHash:
      '0x86d21ad7d41c5b16e18f6e74a1a603ec398ca03b9d604d46e406f9acca88e7bd',
    newDataHash:
      '0xee39c944c5bea6857d1b55fc1d4ff9fc1e22e59fd89d1a0fed8e6eabc08dda66',
  },
  {
    scriptName: 'nostr_lock',
    network: 'mainnet',
    txHash:
      '0x99b116dd1e4f1fa903b70112ae672c18bb34241d3d03a9ad555cd2a611be7327',
    newDataHash:
      '0x2effea19ff3024b5b0fb4c0c59c379e7610110e7e3fe7ae003247b1115e59795',
  },
];

/** Historical two-hop chain starting at the pre-upgrade testnet OutPoint. */
function recordedHops(): UpgradeHop[] {
  return [
    {
      consumedOutPoint: OLD_OUTPOINT,
      consumingTxHash: HOP1_TX,
      newOutPoint: { txHash: HOP1_TX, index: '0x0' },
      oldDataHash: OLD_DATA,
      newDataHash: HOP1_DATA,
    },
    {
      consumedOutPoint: { txHash: HOP1_TX, index: '0x0' },
      consumingTxHash: HOP2_TX,
      newOutPoint: { txHash: HOP2_TX, index: '0x0' },
      oldDataHash: HOP1_DATA,
      newDataHash: HOP2_DATA,
    },
  ];
}

/**
 * Walks a recorded hop fixture instead of calling RPC, so the test can start
 * from the old baseline without the live tip short-circuiting history.
 * Authorization still goes through UpgradeTracker.isWhitelisted.
 */
class RecordedHistoryTracker extends UpgradeTracker {
  constructor(
    private readonly history: UpgradeHop[],
    whitelist?: PlannedUpgrade[]
  ) {
    super(
      { inspectCellDep: async () => ({ exists: false, isLive: false }) } as any,
      whitelist
    );
  }

  async trace(
    scriptName: string,
    network: Network,
    deadOutPoint: NormalizedOutPoint
  ): Promise<UpgradeEvent> {
    const hops = this.history;
    const whitelistHits = hops.map((h) =>
      h.consumingTxHash
        ? this.isWhitelisted(
            scriptName,
            network,
            h.consumingTxHash,
            h.newDataHash
          )
        : undefined
    );
    const authorized =
      hops.length > 0 && whitelistHits.every((w) => w !== undefined);
    const notes = whitelistHits
      .map((w) => w?.note)
      .filter((n): n is string => !!n);
    const last = hops[hops.length - 1];
    return {
      scriptName,
      network,
      oldOutPoint: deadOutPoint,
      status: 'upgraded',
      hops,
      latestOutPoint: last?.newOutPoint,
      latestDataHash: last?.newDataHash,
      latestTypeHash: TYPE_HASH,
      authorized,
      whitelistNote: notes.length ? notes.join('; ') : undefined,
    };
  }
}

function oldOmnilockBaseline(): Baseline {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckb-old-omnilock-'));
  fs.writeFileSync(
    path.join(dir, 'omnilock.json'),
    JSON.stringify({
      name: 'omnilock',
      description: 'OmniLock lock script (historical testnet baseline)',
      scriptType: 'lock',
      testnet: {
        dataHash: OLD_DATA,
        typeHash: TYPE_HASH,
        cellDeps: [{ depType: 'code', outPoint: OLD_OUTPOINT }],
      },
    })
  );
  const baseline = new Baseline(dir);
  const entry = baseline.get('omnilock', 'testnet');
  if (entry?.info.cellDeps[0].outPoint.txHash !== OLD_OUTPOINT.txHash) {
    throw new Error('fixture baseline must start at the pre-upgrade OutPoint');
  }
  return baseline;
}

function deadOldCellStatus(): CellDepStatus {
  return {
    cellDep: { depType: 'code', outPoint: OLD_OUTPOINT },
    exists: true,
    isLive: false,
    dataHash: OLD_DATA,
    typeHash: TYPE_HASH,
  };
}

function oldBaselineTruth(): NormalizedScriptInfo {
  return {
    canonicalName: 'omnilock',
    sourceName: 'omnilock',
    network: 'testnet',
    codeHash: TYPE_HASH,
    hashType: 'type',
    cellDeps: [{ depType: 'code', outPoint: OLD_OUTPOINT }],
    metadata: {
      fetchedAt: Date.now(),
      actualDataHash: OLD_DATA,
      actualTypeHash: TYPE_HASH,
      isLive: false,
      cellDepStatus: [deadOldCellStatus()],
    },
  };
}

function fakeOnchain() {
  return {
    inspectCellDep: async () => deadOldCellStatus(),
  } as any;
}

function findEntry(
  scriptName: string,
  network: Network,
  txHash: string
): PlannedUpgrade | undefined {
  return DEFAULT_UPGRADE_WHITELIST.find(
    (w) =>
      w.scriptName === scriptName &&
      w.network === network &&
      w.txHash === txHash
  );
}

test('default whitelist keeps Nostr and mainnet Omnilock entries and adds both testnet hops', () => {
  for (const expected of PRESERVED_ENTRIES) {
    const found = findEntry(
      expected.scriptName,
      expected.network,
      expected.txHash
    );
    assert.ok(found, `missing preserved entry ${expected.scriptName}`);
    assert.equal(found.newDataHash, expected.newDataHash);
  }

  const hop1 = findEntry('omnilock', 'testnet', HOP1_TX);
  assert.ok(hop1);
  assert.equal(hop1.newDataHash, HOP1_DATA);
  assert.ok(hop1.note?.includes('https://github.com/ckb-js/lumos/pull/665'));
  assert.ok(hop1.note?.includes('not a contract-author signed announcement'));

  const hop2 = findEntry('omnilock', 'testnet', HOP2_TX);
  assert.ok(hop2);
  assert.equal(hop2.newDataHash, HOP2_DATA);
  assert.ok(hop2.note?.includes('https://github.com/ckb-js/lumos/pull/669'));
  assert.ok(hop2.note?.includes('not a contract-author signed announcement'));

  assert.equal(
    DEFAULT_UPGRADE_WHITELIST.filter((w) => w.scriptName === 'omnilock').length,
    3
  );
});

test('default whitelist matches both recorded testnet hops only for omnilock/testnet', () => {
  // undefined whitelist argument loads DEFAULT_UPGRADE_WHITELIST
  const tracker = new UpgradeTracker(fakeOnchain());
  assert.ok(tracker.isWhitelisted('omnilock', 'testnet', HOP1_TX, HOP1_DATA));
  assert.ok(tracker.isWhitelisted('omnilock', 'testnet', HOP2_TX, HOP2_DATA));
  assert.equal(
    tracker.isWhitelisted('omnilock', 'mainnet', HOP1_TX, HOP1_DATA),
    undefined
  );
  assert.equal(
    tracker.isWhitelisted('nostr_lock', 'testnet', HOP2_TX, HOP2_DATA),
    undefined
  );
  assert.equal(
    tracker.isWhitelisted('omnilock', 'testnet', UNKNOWN_TX, HOP2_DATA),
    undefined
  );
  assert.equal(
    tracker.isWhitelisted('omnilock', 'testnet', HOP1_TX, HOP2_DATA),
    undefined
  );
});

test('old baseline fixture plus recorded hops is authorized by the default whitelist', async () => {
  const baseline = oldOmnilockBaseline();
  const tracker = new RecordedHistoryTracker(recordedHops());
  const result = await new CrossVerifier(
    baseline,
    fakeOnchain(),
    tracker
  ).verifyBaseline([oldBaselineTruth()]);

  assert.equal(result.upgrades.length, 1);
  assert.equal(result.upgrades[0].authorized, true);
  assert.equal(result.upgrades[0].status, 'upgraded');
  assert.equal(result.upgrades[0].hops.length, 2);
  assert.equal(result.upgrades[0].hops[0].consumingTxHash, HOP1_TX);
  assert.equal(result.upgrades[0].hops[0].newDataHash, HOP1_DATA);
  assert.equal(result.upgrades[0].hops[1].consumingTxHash, HOP2_TX);
  assert.equal(result.upgrades[0].hops[1].newDataHash, HOP2_DATA);
  assert.equal(result.upgrades[0].latestOutPoint?.txHash, HOP2_TX);
  assert.ok(result.upgrades[0].whitelistNote?.includes('lumos/pull/665'));
  assert.ok(result.upgrades[0].whitelistNote?.includes('lumos/pull/669'));
  assert.ok(
    result.mismatches.some(
      (m) =>
        m.kind === 'UPGRADE_AUTHORIZED' &&
        m.riskLevel === RiskLevel.P1_HIGH &&
        m.scriptName === 'omnilock' &&
        m.network === 'testnet'
    )
  );
  assert.ok(!result.mismatches.some((m) => m.kind === 'UPGRADE_UNAUTHORIZED'));
});

test('old baseline still alerts if either recorded hop or an unknown tx is not confirmed', async () => {
  const baseline = oldOmnilockBaseline();
  const truth = oldBaselineTruth();

  const withoutHop1 = DEFAULT_UPGRADE_WHITELIST.filter(
    (w) => w.txHash !== HOP1_TX
  );
  const missingHop1 = await new CrossVerifier(
    baseline,
    fakeOnchain(),
    new RecordedHistoryTracker(recordedHops(), withoutHop1)
  ).verifyBaseline([truth]);
  assert.equal(missingHop1.upgrades[0].authorized, false);
  assert.ok(
    missingHop1.mismatches.some(
      (m) =>
        m.kind === 'UPGRADE_UNAUTHORIZED' &&
        m.riskLevel === RiskLevel.P0_CRITICAL
    )
  );

  const withoutHop2 = DEFAULT_UPGRADE_WHITELIST.filter(
    (w) => w.txHash !== HOP2_TX
  );
  const missingHop2 = await new CrossVerifier(
    baseline,
    fakeOnchain(),
    new RecordedHistoryTracker(recordedHops(), withoutHop2)
  ).verifyBaseline([truth]);
  assert.equal(missingHop2.upgrades[0].authorized, false);
  assert.ok(
    missingHop2.mismatches.some((m) => m.kind === 'UPGRADE_UNAUTHORIZED')
  );

  const unknownHistory = recordedHops();
  unknownHistory[1] = {
    ...unknownHistory[1],
    consumingTxHash: UNKNOWN_TX,
    newOutPoint: { txHash: UNKNOWN_TX, index: '0x0' },
  };
  const unknownTx = await new CrossVerifier(
    baseline,
    fakeOnchain(),
    new RecordedHistoryTracker(unknownHistory)
  ).verifyBaseline([truth]);
  assert.equal(unknownTx.upgrades[0].authorized, false);
  assert.ok(
    unknownTx.mismatches.some((m) => m.kind === 'UPGRADE_UNAUTHORIZED')
  );
});

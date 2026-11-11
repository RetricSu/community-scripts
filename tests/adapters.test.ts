import test from 'node:test';
import assert from 'node:assert/strict';
import { ccc } from '@ckb-ccc/core';
import {
  CccSdkAdapter,
  toCanonicalCccName,
} from '../src/adapters/sdk/ccc-sdk-adapter';
import {
  decodeOutPointVec,
  isZeroLock,
} from '../src/adapters/onchain/ckb-rpc-adapter';
import {
  normalizeIndex,
  normalizeOutPoint,
  outPointKey,
} from '../src/utils/normalize';
import { parseExplorerOutPoint } from '../src/adapters/explorer/explorer-api-adapter';

test('decodes molecule OutPointVec used by dep groups', () => {
  const bytes = new Uint8Array(4 + 36);
  new DataView(bytes.buffer).setUint32(0, 1, true);
  bytes.set(ccc.bytesFrom(`0x${'ab'.repeat(32)}`), 4);
  new DataView(bytes.buffer).setUint32(36, 2, true);
  const result = decodeOutPointVec(ccc.hexFrom(bytes));
  assert.equal(result.length, 1);
  assert.equal(result[0].txHash, `0x${'ab'.repeat(32)}`);
  assert.equal(result[0].index, '0x2');
});

test('normalizes outpoints and Explorer notation', () => {
  assert.equal(normalizeIndex('0x00'), '0x0');
  assert.equal(normalizeIndex('2'), '0x2');
  assert.equal(
    outPointKey(
      normalizeOutPoint({ txHash: `0x${'A'.repeat(64)}`, index: '0x0' })
    ),
    `0x${'a'.repeat(64)}:0x0`
  );
  assert.deepEqual(parseExplorerOutPoint(`0x${'a'.repeat(64)}-2`), {
    txHash: `0x${'a'.repeat(64)}`,
    index: '0x2',
  });
  assert.equal(parseExplorerOutPoint('-'), undefined);
});

test('zero lock detection does not require a Type ID', () => {
  assert.equal(
    isZeroLock({
      codeHash: `0x${'0'.repeat(64)}`,
      hashType: 'data',
      args: '0x',
    }),
    true
  );
  assert.equal(
    isZeroLock({
      codeHash: `0x${'0'.repeat(64)}`,
      hashType: 'type',
      args: '0x',
    }),
    false
  );
});

test('CCC adapter normalizes static script table without RPC calls', async () => {
  const adapter = new CccSdkAdapter();
  const scripts = await adapter.fetchScripts('mainnet');
  assert.ok(scripts.length > 10);
  assert.ok(scripts.some((s) => s.canonicalName === 'omnilock'));
  assert.ok(scripts.every((s) => s.codeHash && s.cellDeps));
  assert.equal(toCanonicalCccName('NervosDao'), 'nervos_dao');
});

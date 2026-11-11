import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { Baseline } from '../src/engine/baseline';

const baseline = new Baseline(path.join(process.cwd(), 'src', 'deployments'));

test('omnilock testnet baseline points at the live Type ID tip', () => {
  const entry = baseline.get('omnilock', 'testnet');
  assert.ok(entry);
  assert.equal(
    entry.info.typeHash,
    '0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb'
  );
  assert.equal(
    entry.info.dataHash,
    '0x6b29b6f10346b43c540e53806ba88ba0fe3a0c3a29d7448ef555840c8f8318fa'
  );
  assert.equal(entry.info.cellDeps.length, 1);
  assert.equal(entry.info.cellDeps[0].depType, 'code');
  assert.equal(
    entry.info.cellDeps[0].outPoint.txHash,
    '0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602'
  );
  assert.equal(entry.info.cellDeps[0].outPoint.index, '0x0');
});

test('omnilock mainnet baseline is unchanged', () => {
  const entry = baseline.get('omnilock', 'mainnet');
  assert.ok(entry);
  assert.equal(
    entry.info.typeHash,
    '0x9b819793a64463aed77c615d6cb226eea5487ccfc0783043a587254cda2b6f26'
  );
  assert.equal(
    entry.info.cellDeps[0].outPoint.txHash,
    '0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842'
  );
});

test('dob_0 testnet baseline points at the official live redeploy and keeps the same data hash', () => {
  const entry = baseline.get('dob_0', 'testnet');
  assert.ok(entry);
  assert.equal(
    entry.info.dataHash,
    '0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c'
  );
  assert.equal(entry.info.typeHash, '0x');
  assert.equal(
    entry.info.cellDeps[0].outPoint.txHash,
    '0x4a8a0d079f8438bed89e0ece1b14e67ab68e2aa7688a5f4917a59a185e0f8fd5'
  );
  assert.equal(entry.info.cellDeps[0].outPoint.index, '0x0');
  assert.equal(entry.info.cellDeps[0].depType, 'code');
});

test('dob_0 mainnet baseline is unchanged', () => {
  const entry = baseline.get('dob_0', 'mainnet');
  assert.ok(entry);
  assert.equal(
    entry.info.cellDeps[0].outPoint.txHash,
    '0x71023885a2178648be6a7f138ee49379000a82cda98dd8adabee99eaaca42fde'
  );
  assert.equal(
    entry.info.dataHash,
    '0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c'
  );
});

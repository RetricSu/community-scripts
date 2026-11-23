// Godwoken custodian-lock — godwokenrises/godwoken gwos/contracts/custodian-lock/src/entry.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390
// @requires godwoken_state_validator
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g) {
    const a = H(g.script.args || '0x'), p = { rollup: a.length >= 32 ? X(a.subarray(0, 32)) : null };
    try { const f = R.parseTable(a.subarray(32), 3); p.blk = X(f[0]); p.fin = R.gw.u64(f[1], 0); p.dep = R.gw.depositArgs(f[2]); } catch (e) { p.blk = null; }
    p.fields = [['rollup_type_hash', p.rollup || '—']];
    if (p.blk) p.fields.push(['deposit_block_hash', p.blk], ['deposit_finalized_timepoint', R.gw.tp(p.fin).s], ['deposit_lock_args.owner_lock_hash', p.dep.owner]);
    p.layouts = [{ label: 'args = rollup_type_hash ‖ CustodianLockArgs (molecule table)', layout: [{ name: 'rollup_type_hash', size: '32', color: 1, flex: 2 }, { name: 'deposit_block_hash', size: '32', color: 2, flex: 2 }, { name: 'deposit_finalized_timepoint', size: '8', color: 3 }, { name: 'deposit_lock_args', size: 'DepositLockArgs', color: 4, flex: 3 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!p.rollup && !!p.blk, 'args = 32B rollup_type_hash ‖ 合法 CustodianLockArgs', 'args = 32B rollup_type_hash ‖ valid CustodianLockArgs', 5)]; if (!p.blk) return c;
    c.push(R.check(R.gw.rollupIn(ctx, p.rollup) >= 0, '输入中有 rollup cell（读取其 GlobalState）', 'a rollup cell is in inputs (its GlobalState is read)', 9));
    c.push(R.NOT_CHECKED('已终结（deposit_finalized_timepoint ≤ last_finalized_timepoint，需 RollupConfig）→ 放行；否则须证明存款区块被回滚', 'finalized (deposit_finalized_timepoint ≤ last_finalized_timepoint, needs RollupConfig) → pass; otherwise prove the deposit block was reverted', '10 / 7 / 29'));
    return c;
  }
  R.register({ id: 'godwoken_custodian_lock', kind: 'lock', name: { zh: 'Godwoken 托管（custodian-lock）', en: 'Godwoken custodian (custodian-lock)' }, match: [
    { code_hash: '0x000f87062a2fe9bb4a6cc475212ea11014b84deb32e0375ee51e6ec4a553e009', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json custodian_lock' },
    { code_hash: '0x85ae4db0dd83f428a31deb342e4000af37ce2c9645d9e619df00096e3c50a2bb', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json custodian_lock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

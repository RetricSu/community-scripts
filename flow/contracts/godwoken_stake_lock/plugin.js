// Godwoken stake-lock — godwokenrises/godwoken gwos/contracts/stake-lock/src/entry.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390
// @requires godwoken_state_validator
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g) {
    const a = H(g.script.args || '0x'), p = { ok: a.length === 32 + 40 };
    if (a.length >= 72) { p.rollup = X(a.subarray(0, 32)); p.owner = X(a.subarray(32, 64)); p.fin = R.gw.u64(a, 64); }
    p.fields = p.rollup ? [['rollup_type_hash', p.rollup], ['owner_lock_hash', p.owner], ['stake_finalized_timepoint', R.gw.tp(p.fin).s]] : [['args', g.script.args]];
    p.layouts = [{ label: 'args (72 B) = rollup_type_hash ‖ StakeLockArgs struct', layout: [{ name: 'rollup_type_hash', size: '32', color: 1, flex: 2 }, { name: 'owner_lock_hash', size: '32', color: 2, flex: 2 }, { name: 'stake_finalized_timepoint', size: '8 LE', color: 3 }], hex: p.rollup ? [['rollup_type_hash', p.rollup], ['owner_lock_hash', p.owner], ['stake_finalized_timepoint', X(a.subarray(64, 72))]] : [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.ok, 'args = 32B rollup_type_hash ‖ 40B StakeLockArgs', 'args = 32B rollup_type_hash ‖ 40B StakeLockArgs', 5)]; if (!p.ok) return c;
    if (R.gw.rollupIn(ctx, p.rollup) >= 0) { c.push(R.check(true, '输入中有 rollup cell → 放行（由 state-validator 验证）', 'a rollup cell is in inputs → pass (state-validator checks the rest)', 0)); return c; }
    const own = ctx.inputs.some(x => R.scriptHash(x.output.lock) === p.owner);
    c.push(R.check(own, '用户取回：输入中有 owner_lock_hash 的 cell', 'user unlock: an input under owner_lock_hash', 22), R.NOT_CHECKED('用户取回：cell_deps 中 rollup cell 的 GlobalState 显示 stake_finalized_timepoint 已终结', 'user unlock: the rollup cell in cell_deps shows stake_finalized_timepoint finalized', 22));
    return c;
  }
  R.register({ id: 'godwoken_stake_lock', kind: 'lock', name: { zh: 'Godwoken 出块质押（stake-lock）', en: 'Godwoken block-producer stake (stake-lock)' }, match: [
    { code_hash: '0xb619184ab9142c51b0ee75f4e24bcec3d077eefe513115bad68836d06738fd2c', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json stake_lock' },
    { code_hash: '0x7f5a09b8bd0e85bcf2ccad96411ccba2f289748a1c16900b0635c2ed9126f288', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json stake_lock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// Godwoken deposit-lock — godwokenrises/godwoken gwos/contracts/deposit-lock/src/entry.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390
// @requires godwoken_state_validator
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g, ctx) {
    const a = H(g.script.args || '0x'), p = { rollup: a.length >= 32 ? X(a.subarray(0, 32)) : null };
    try { p.d = R.gw.depositArgs(a.subarray(32)); } catch (e) { p.d = null; }
    p.fields = [['rollup_type_hash', p.rollup || '—']];
    if (p.d) p.fields.push(['owner_lock_hash', p.d.owner], ['layer2_lock.code_hash', p.d.l2lock.code_hash], ['layer2_lock.args', p.d.l2lock.args], ['cancel_timeout', p.d.cancel + ' (since)'], ['registry_id', String(p.d.registry)]);
    p.layouts = [{ label: 'args = rollup_type_hash ‖ DepositLockArgs (molecule table)', layout: [{ name: 'rollup_type_hash', size: '32', color: 1, flex: 2 }, { name: 'owner_lock_hash', size: '32', color: 2, flex: 2 }, { name: 'layer2_lock', size: 'Script', color: 3, flex: 3 }, { name: 'cancel_timeout', size: '8', color: 4 }, { name: 'registry_id', size: '4', color: 5 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!p.rollup && !!p.d, 'args = 32B rollup_type_hash ‖ 合法 DepositLockArgs', 'args = 32B rollup_type_hash ‖ valid DepositLockArgs', 5)]; if (!p.d) return c;
    if (R.gw.rollupIn(ctx, p.rollup) >= 0) { c.push(R.check(true, '路径 1：输入中有 type hash = rollup_type_hash 的 rollup cell（后续由 state-validator 验证）', 'path 1: a rollup cell (type hash = rollup_type_hash) is in inputs (state-validator checks the rest)', 0)); return c; }
    const s = BigInt(ctx.inputs[g.inputs[0]].input.since), t = p.d.cancelV;
    c.push(R.check((s >> 56n) === (t >> 56n) && s >= t, `路径 2（取消）：since ${'0x' + s.toString(16)} 与 cancel_timeout 同 flags 且 ≥`, `path 2 (cancel): since ${'0x' + s.toString(16)} has cancel_timeout's flags and is ≥`, 6),
      R.check(ctx.inputs.some(x => R.scriptHash(x.output.lock) === p.d.owner), '输入中有 lock hash = owner_lock_hash 的 cell', 'an input whose lock hash = owner_lock_hash', 8));
    return c;
  }
  R.register({ id: 'godwoken_deposit_lock', kind: 'lock', name: { zh: 'Godwoken 存款请求（deposit-lock）', en: 'Godwoken deposit request (deposit-lock)' }, match: [
    { code_hash: '0xff602581f07667eef54232cce850cbca2c418b3418611c132fca849d1edcd775', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json deposit_lock' },
    { code_hash: '0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json deposit_lock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

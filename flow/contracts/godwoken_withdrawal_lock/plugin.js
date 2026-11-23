// Godwoken withdrawal-lock — godwokenrises/godwoken gwos/contracts/withdrawal-lock/src/entry.rs + gw-utils/src/withdrawal.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390
// @requires godwoken_state_validator
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g, ctx) {
    const a = H(g.script.args || '0x'), p = {};
    if (a.length >= 136) { p.rollup = X(a.subarray(0, 32)); p.blk = X(a.subarray(32, 64)); p.fin = R.gw.u64(a, 64); p.acct = X(a.subarray(72, 104)); p.owner = X(a.subarray(104, 136));
      if (a.length > 140) { const n = (a[136] << 24 | a[137] << 16 | a[138] << 8 | a[139]) >>> 0; p.lenOk = 140 + n === a.length; try { p.ownerLock = R.gw.script(a.subarray(140)); p.ownerOk = R.scriptHash(p.ownerLock) === p.owner; } catch (e) { p.ownerLock = null; } } }
    const w = ctx.witnesses[g.inputs[0]]; p.wl = w && w.args && w.args.lock ? H(w.args.lock) : null; p.via = p.wl && p.wl.length >= 4 ? R.gw.u32(p.wl, 0) : null;
    p.fields = p.rollup ? [['rollup_type_hash', p.rollup], ['withdrawal_block_hash', p.blk], ['withdrawal_finalized_timepoint', R.gw.tp(p.fin).s], ['account_script_hash', p.acct], ['owner_lock_hash', p.owner], ['owner_lock', p.ownerLock ? p.ownerLock.code_hash + ' / ' + p.ownerLock.args : '—'], [{ zh: '解锁方式 witness.lock', en: 'unlock witness.lock' }, p.via === 0 ? 'UnlockWithdrawalViaFinalize' : p.via === 1 ? 'UnlockWithdrawalViaRevert' : '—']] : [['args', g.script.args]];
    p.layouts = [{ label: 'args = rollup_type_hash ‖ WithdrawalLockArgs (104B struct) ‖ owner_lock_len (u32 BE) ‖ owner_lock (Script)', layout: [{ name: 'rollup_type_hash', size: '32', color: 1, flex: 2 }, { name: 'withdrawal_block_hash', size: '32', color: 2, flex: 2 }, { name: 'finalized_timepoint', size: '8', color: 3 }, { name: 'account_script_hash', size: '32', color: 4, flex: 2 }, { name: 'owner_lock_hash', size: '32', color: 5, flex: 2 }, { name: 'len', size: '4 BE', color: 6 }, { name: 'owner_lock', size: 'Script', color: 1, flex: 2 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!p.rollup && p.lenOk && !!p.ownerLock && p.ownerOk, 'args 解析成功，owner_lock 长度吻合且 hash(owner_lock) = owner_lock_hash', 'args parse; owner_lock length matches and hash(owner_lock) = owner_lock_hash', 5)];
    if (!p.ownerOk) return c;
    c.push(R.check(p.via === 0 || p.via === 1, 'witnesses[0].lock 为 UnlockWithdrawalWitness 联合', 'witnesses[0].lock is an UnlockWithdrawalWitness union', 11));
    if (p.via === 1) { c.push(R.check(R.gw.rollupOut(ctx, p.rollup) >= 0, '回滚路径：输出中有 rollup cell（SubmitBlock，reverted_block_hashes 含 withdrawal_block_hash）', 'revert path: a rollup cell in outputs (SubmitBlock whose reverted_block_hashes contain withdrawal_block_hash)', 9), R.NOT_CHECKED('输出中有内容相同的 custodian cell（deposit_block_hash = 0，timepoint = 0）', 'an output custodian cell with identical content (deposit_block_hash = 0, timepoint = 0)', '29 / 7')); return c; }
    if (p.via !== 0) return c;
    if (!(p.fin >> 63n)) c.push(R.NOT_CHECKED('区块号 timepoint：cell_deps 或输入中 rollup cell 的 GlobalState 显示已终结', 'block-number timepoint: rollup cell GlobalState (cell_deps or inputs) shows finalized', '9 / 45'));
    else { const s = BigInt(ctx.inputs[g.inputs[0]].input.since), ts = p.fin & ((1n << 63n) - 1n); c.push(R.check((s >> 56n) === 0x40n && (s & ((1n << 56n) - 1n)) >= ts, `时间戳 timepoint：since 为绝对时间戳且 ≥ ${ts} ms`, `timestamp timepoint: since is an absolute timestamp ≥ ${ts} ms`, '6 / 45')); }
    const lh = R.scriptHash(g.script); let same = true;
    ctx.inputs.forEach((x, i) => { if (R.scriptHash(x.output.lock) !== lh) return; const o = ctx.tx.outputs[i]; if (!o || o.capacity !== x.output.capacity || ctx.tx.outputs_data[i] !== x.data || (o.type ? R.scriptHash(o.type) : null) !== (x.output.type ? R.scriptHash(x.output.type) : null) || R.scriptHash(o.lock) !== p.owner) same = false; });
    c.push(same ? R.check(true, '每个 withdrawal 输入 i 对应 output[i]：capacity / data / type 相同，lock = owner_lock', 'each withdrawal input i maps to output[i]: same capacity / data / type, lock = owner_lock', 0)
      : R.check(ctx.inputs.some(x => R.scriptHash(x.output.lock) === p.owner), '否则：输入中有 owner_lock_hash 的 cell', 'otherwise: an input under owner_lock_hash', 8));
    return c;
  }
  R.register({ id: 'godwoken_withdrawal_lock', kind: 'lock', name: { zh: 'Godwoken 提款（withdrawal-lock）', en: 'Godwoken withdrawal (withdrawal-lock)' }, match: [
    { code_hash: '0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json withdrawal_lock' },
    { code_hash: '0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json withdrawal_lock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

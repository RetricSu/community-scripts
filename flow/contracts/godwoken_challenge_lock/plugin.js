// Godwoken challenge-lock — godwokenrises/godwoken gwos/contracts/challenge-lock/src/entry.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390 (no L1 usage found)
// @requires godwoken_state_validator
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g) { const a = H(g.script.args || '0x'), p = { rollup: a.length >= 32 ? X(a.subarray(0, 32)) : null };
    try { const f = R.parseTable(a.subarray(32), 2); p.t = { blk: X(f[0].subarray(0, 32)), idx: R.gw.u32(f[0], 32), type: f[0][36] }; p.recv = R.gw.script(f[1]); } catch (e) { p.t = null; }
    p.fields = [['rollup_type_hash', p.rollup || '—']]; if (p.t) p.fields.push(['target.block_hash', p.t.blk], ['target.target_index', String(p.t.idx)], ['target.target_type', ['0 tx execution', '1 tx signature', '2 withdrawal'][p.t.type] || String(p.t.type)]); return p; }
  function check(g, ctx, p) { const c = [R.check(!!p.t, 'args = rollup_type_hash ‖ ChallengeLockArgs', 'args = rollup_type_hash ‖ ChallengeLockArgs', 5)]; if (!p.t) return c;
    const o = R.gw.rollupOut(ctx, p.rollup); c.push(R.check(o >= 0, '输出中有 rollup cell', 'a rollup cell in outputs', 9)); if (o < 0) return c;
    const a = R.gw.action(ctx, o); c.push(R.check(!!a && a.id >= 1, `动作 ${a ? a.name : '—'}：EnterChallenge / Revert 直接放行，CancelChallenge 需证明`, `action ${a ? a.name : '—'}: EnterChallenge / Revert pass, CancelChallenge must prove`, 5));
    if (a && a.id === 2) c.push(R.NOT_CHECKED('取消挑战：按 target_type 验证交易执行 / 交易签名 / 提款签名', 'cancel: verify tx execution / tx signature / withdrawal signature per target_type', '5 / 10 / 32 / 41')); return c; }
  R.register({ id: 'godwoken_challenge_lock', kind: 'lock', name: { zh: 'Godwoken 挑战（challenge-lock）', en: 'Godwoken challenge (challenge-lock)' }, match: [
    { code_hash: '0x628b5f956b46ae27b50819a9ebab79ce5f957e6899ba0c75b8e142de2ed0dcd2', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json challenge_lock', deps: { mainnet: { tx_hash: '0x8eca99207a462a9005bd91d04e24911627769096220f867d1cc0a32e75a287a6', index: '0x0' } } },
    { code_hash: '0x5a86c3bf1e8648b6a6f8abe6875720ccf9745ab225b68fa7c195f9d6635dea80', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json challenge_lock', deps: { testnet: { tx_hash: '0x15598fb4d3fc4b7e0afcffc80ed0c02b62edb3f7875771f0397f17eef712b65d', index: '0x0' } } }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

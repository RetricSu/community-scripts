// CROWDCELL_RECEIPT — alesfer001/CrowdCell contracts/receipt/src/main.rs @acbb40e (testnet only, community)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, Z = '0x' + '00'.repeat(32), GRACE = 1944000n;
  // receipt data (80B): amount u64 LE [0..8] ‖ backer_lock_hash [8..40] ‖ campaign_type_hash [40..72] ‖ deadline u64 LE [72..80]
  const dec = h => { const d = H(h || '0x'); if (d.length < 80) return null;
    return { amount: R.leToBig(d.subarray(0, 8)), backer: X(d.subarray(8, 40)), campaign: X(d.subarray(40, 72)), deadline: R.leToBig(d.subarray(72, 80)) }; };
  // Absolute block-number since (no flag bits set) at or past deadline + grace period
  const graceOver = (since, deadline) => since !== 0n && (since >> 56n) === 0n && (since & ((1n << 56n) - 1n)) >= deadline + GRACE;

  function parse(g, ctx) { const a = H(g.script.args), p = { pch: a.length >= 32 ? X(a.subarray(0, 32)) : null, plch: a.length >= 64 ? X(a.subarray(32, 64)) : null };
    p.path = !g.inputs.length && g.outputs.length ? 'create' : g.inputs.length && !g.outputs.length ? 'destroy' : g.inputs.length ? 'modify' : 'none';
    p.r = dec(p.path === 'create' ? ctx.tx.outputs_data[g.outputs[0]] : g.inputs.length ? ctx.inputs[g.inputs[0]].data : null);
    p.fields = [[{ zh: '路径', en: 'path' }, p.path], ['pledge_code_hash (args)', p.pch || '(< 32B)'], ['pledge_lock_code_hash (args)', p.plch || '(< 64B)']];
    if (p.r) p.fields.push(['pledge_amount', (Number(p.r.amount) / 1e8) + ' CKB'], ['backer_lock_hash', p.r.backer], ['campaign_type_hash', p.r.campaign], ['deadline_block', p.r.deadline.toString()]);
    return p; }

  function checkCreate(g, ctx, p) {
    const r = [R.check(g.outputs.length <= 1, '同一交易最多 1 个回执', 'at most 1 receipt per transaction', 27)];
    r.push(R.check(!!(p.pch && p.plch), 'args ≥ 64 字节', 'args ≥ 64 bytes', 20)); if (!(p.pch && p.plch)) return r;
    r.push(R.check(!!p.r, 'data ≥ 80 字节', 'data ≥ 80 bytes', 10)); if (!p.r) return r;
    r.push(R.check(p.r.amount > 0n, 'pledge_amount > 0', 'pledge_amount > 0', 12), R.check(p.r.backer !== Z, 'backer_lock_hash ≠ 0', 'backer_lock_hash ≠ 0', 13));
    // First output with the pledge type code_hash and data >= 72 bytes (same selection as the contract)
    const outs = ctx.tx.outputs; let j = -1;
    for (let k = 0; k < outs.length; k++) if (outs[k].type && outs[k].type.code_hash === p.pch && H(ctx.tx.outputs_data[k]).length >= 72) { j = k; break; }
    r.push(R.check(j >= 0, '输出中有匹配的 pledge', 'a matching pledge is in outputs', 14)); if (j < 0) return r;
    const d = H(ctx.tx.outputs_data[j]), la = H(outs[j].lock.args);
    r.push(R.check(R.leToBig(d.subarray(64, 72)) === p.r.amount, '金额 = pledge amount', 'amount = pledge amount', 21),
      R.check(X(d.subarray(32, 64)) === p.r.backer, 'backer = pledge backer', 'backer = pledge backer', 22),
      R.check(outs[j].lock.code_hash === p.plch, 'pledge 位于 pledge lock 之下', 'pledge is under the pledge lock', 26),
      R.check(la.length >= 72 && X(la.subarray(0, 32)) === p.r.campaign && R.leToBig(la.subarray(32, 40)) === p.r.deadline,
        'campaign hash / deadline 与 pledge lock args 一致', 'campaign hash / deadline match the pledge lock args', 24));
    return r; }

  function checkDestroy(g, ctx) {
    const recs = g.inputs.map(ii => dec(ctx.inputs[ii].data));
    const r = [R.check(recs.every(x => !!x), 'data ≥ 80 字节', 'data ≥ 80 bytes', 10)];
    if (!recs.every(x => !!x)) return r;
    // Settlement is checked per receipt: a cell_dep with the campaign hash and status != 0, or the grace period
    g.inputs.forEach((ii, i) => {
      if (graceOver(BigInt(ctx.inputs[ii].input.since), recs[i].deadline)) { r.push(R.check(true, '宽限期已过：允许', 'grace period over: allowed', null)); return; }
      r.push(R.NOT_CHECKED('campaign 是否已结算（cell_deps 中 status ≠ 0）未离线解析；若未结算则 23', 'whether the campaign is settled (status ≠ 0 in cell_deps) not resolved offline; if not settled, 23', 23));
    });
    return r; }

  function check(g, ctx, p) {
    if (p.path === 'modify') return [R.check(false, '回执不可修改', 'receipt cannot be modified', 11)];
    if (p.path === 'create') return checkCreate(g, ctx, p);
    if (p.path === 'destroy') return checkDestroy(g, ctx);
    return []; }

  R.register({ id: 'crowdcell_receipt', kind: 'type', name: { zh: 'CrowdCell 回执', en: 'CrowdCell receipt' },
    match: [{ code_hash: '0x523716e6c46501480391965a9305d2be33045ce3be19300f62546ff3aa8bf8b5', hash_type: 'data2', net: 'testnet', src: 'alesfer001/CrowdCell@acbb40ed deployment/deployed-contracts-testnet.json (receipt codeHash, deployedAt 2026-10-31) + deployment/checksums-testnet.txt', deps: { testnet: { tx_hash: '0xe40519d726f365e0d24baf31f5e4402d021efca4a62449f5d4215a800e60436d', index: '0x0' } } }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

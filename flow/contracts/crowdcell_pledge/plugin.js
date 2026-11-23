// CROWDCELL_PLEDGE — alesfer001/CrowdCell contracts/pledge/src/main.rs @acbb40e (testnet only, community)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, Z = '0x' + '00'.repeat(32), U64_MAX = (1n << 64n) - 1n;
  const dec = h => { const d = H(h || '0x'); return d.length < 72 ? null : { cid: X(d.subarray(0, 32)), backer: X(d.subarray(32, 64)), amount: R.leToBig(d.subarray(64, 72)) }; };
  function parse(g, ctx) { const a = H(g.script.args), p = { rch: a.length >= 32 ? X(a.subarray(0, 32)) : null };
    p.ins = g.inputs.map(i => dec(ctx.inputs[i].data)); p.outs = g.outputs.map(j => dec(ctx.tx.outputs_data[j]));
    const ni = p.ins.length, no = p.outs.length; p.path = !ni && no ? 'create' : ni && !no ? 'destroy' : ni >= 2 && no === 1 ? 'merge' : ni === 1 && no === 1 ? 'partial_refund' : ni || no ? 'bad' : 'none';
    const c = p.outs[0] || p.ins[0];
    p.fields = [[{ zh: '路径', en: 'path' }, p.path], ['receipt_code_hash (args)', p.rch || '(none)']]; if (c) p.fields.push(['campaign_id', c.cid], ['backer_lock_hash', c.backer], ['amount', (Number(c.amount) / 1e8) + ' CKB']);
    return p; }
  const LEN72 = R.check(false, 'data ≥ 72 字节', 'data ≥ 72 bytes', 1);
  function check(g, ctx, p) {
    // Creation: only the first group output is checked (main.rs validate_creation); output count is not limited.
    if (p.path === 'create') { const o = p.outs[0]; if (!o) return [LEN72];
      return [R.check(true, 'data ≥ 72 字节', 'data ≥ 72 bytes', 1), R.check(o.cid !== Z, 'campaign_id ≠ 0', 'campaign_id ≠ 0', 3), R.check(o.backer !== Z, 'backer_lock_hash ≠ 0', 'backer_lock_hash ≠ 0', 4), R.check(o.amount > 0n, 'amount > 0', 'amount > 0', 5)]; }
    // Destruction: always allowed here; routing is enforced by pledge-lock.
    if (p.path === 'destroy') return [R.check(true, '销毁总是允许（资金去向由 pledge-lock 约束）', 'destruction always allowed (routing enforced by pledge-lock)', null)];
    if (p.path === 'bad') return [R.check(false, '形状为 n→1（n≥2 且 1 个输出）或 1→1', 'shape is n→1 (n≥2, one output) or 1→1', 10)];
    // Merge: every input and the output need ≥ 72 bytes (code 1); campaign ids equal (11); u64 sum (13); output amount = sum (12).
    if (p.path === 'merge') { if (p.ins.some(x => !x) || !p.outs[0]) return [LEN72];
      const c0 = p.ins[0].cid, sum = p.ins.reduce((s, x) => s + x.amount, 0n);
      if (!p.ins.every(x => x.cid === c0)) return [R.check(false, 'campaign_id 全部相同', 'campaign_id all equal', 11)];
      if (sum > U64_MAX) return [R.check(false, '累加溢出', 'addition overflows', 13)];
      return [R.check(p.outs[0].cid === c0, 'campaign_id 全部相同', 'campaign_id all equal', 11), R.check(p.outs[0].amount === sum, `输出 amount = Σ输入 ${sum}`, `output amount = Σ inputs ${sum}`, 12)]; }
    // Partial refund: campaign id equal (14), amount decreases (15), then receipt checks only when args ≥ 32 bytes (17 / 16).
    if (p.path === 'partial_refund') { const i = p.ins[0], o = p.outs[0]; if (!i || !o) return [LEN72];
      const r = [R.check(i.cid === o.cid, 'campaign_id 不变', 'campaign_id unchanged', 14), R.check(o.amount < i.amount, '输出 amount < 输入 amount', 'output amount < input amount', 15)];
      if (!p.rch || o.amount >= i.amount) return r;
      const rc = ctx.inputs.find(x => x.output && x.output.type && x.output.type.code_hash === p.rch && H(x.data).length >= 8);
      r.push(R.check(!!rc, '输入中有 receipt', 'a receipt is in inputs', 17));
      if (rc) r.push(R.check(R.leToBig(H(rc.data).subarray(0, 8)) === i.amount - o.amount, 'receipt 金额 = 减少额', 'receipt amount = decrease', 16));
      return r; }
    return []; }
  R.register({ id: 'crowdcell_pledge', kind: 'type', name: { zh: 'CrowdCell pledge 类型', en: 'CrowdCell pledge type' },
    match: [{ code_hash: '0xe45d09f08d0e842340afb004cfb6b6b6414ad387f9cd2f3e0b9abcd6ae8eb024', hash_type: 'data2', net: 'testnet', src: 'alesfer001/CrowdCell@acbb40e deployment/deployed-contracts-testnet.json (pledge, deployedAt 2026-10-31; code cell 0x49961d44…:0, data hash = code_hash checked on chain); hash_type data2 seen on chain (pledge type scripts in 2026-10-31 txs)', deps: { testnet: { tx_hash: '0x49961d44d1712cdeade84d86fe2ca2466b8a1d77462a61dcfc9c27944277af3d', index: '0x0' } } }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

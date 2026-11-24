// iCKB logic — ickb/contracts scripts/contracts/ickb_logic/src/{entry,celltype,utils,constants,error}.rs + utils crate
// Exposes R.ickb (shared helpers) for owned_owner / limit_order.
// @requires nervos_dao
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const CODE = '0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3';
  const DAO = { code_hash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e', hash_type: 'type', args: '0x' };
  const DAO_HASH = R.scriptHash(DAO), XUDT = '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95';
  const AR0 = 10n ** 16n, MIN = 1000n * 10n ** 8n, MAX = 1000000n * 10n ** 8n, SOFT = 100000n * 10n ** 8n;
  const leN = (b, o, n) => R.leToBig(b.subarray(o, o + n));
  // every cell in the tx as {src, index, lock, type, data, capacity, lockHash, typeHash, metapoint, blockHash}
  function cells(ctx) {
    const ins = ctx.inputs.map((x, i) => x.output ? { src: 'in', index: i, ...x.output, data: x.data, blockHash: x.blockHash, mp: x.input.previous_output.tx_hash + ':' + parseInt(x.input.previous_output.index, 16), tx: x.input.previous_output.tx_hash, idx: parseInt(x.input.previous_output.index, 16) } : null).filter(Boolean);
    const outs = ctx.tx.outputs.map((o, j) => ({ src: 'out', index: j, ...o, data: ctx.tx.outputs_data[j], blockHash: ctx.status && ctx.status.block_hash, tx: null, idx: j }));
    for (const c of [...ins, ...outs]) { c.lockHash = R.scriptHash(c.lock); c.typeHash = c.type ? R.scriptHash(c.type) : null; }
    return { ins, outs };
  }
  const isDepositData = d => d === '0x0000000000000000';
  const isWithdrawData = d => H(d || '0x').length === 8 && d !== '0x0000000000000000';
  const unoccupied = c => BigInt(c.capacity) - R.occupied(c, c.data);
  const arOf = (ctx, c) => { const h = c.blockHash && ctx.headers[c.blockHash]; return h ? leN(H(h.dao), 8, 8) : null; };
  // has_empty_args: own args empty and no output lock with the same code but different args
  const emptyArgs = (g, ctx) => g.script.args === '0x' && !ctx.tx.outputs.some(o => o.lock.code_hash === g.script.code_hash && o.lock.hash_type === g.script.hash_type && o.lock.args !== g.script.args);
  R.ickb = { cells, isDepositData, isWithdrawData, emptyArgs, DAO_HASH };
  function deposit2ickb(amount, ar) { const v = amount * AR0 / ar; return v > SOFT ? v - (v - SOFT) / 10n : v; }
  function parse(g, ctx) {
    const self = R.scriptHash({ code_hash: g.script.code_hash, hash_type: g.script.hash_type, args: g.script.args });
    const udtHash = R.scriptHash({ code_hash: XUDT, hash_type: 'data1', args: self + '00000080' });
    const { ins, outs } = cells(ctx), p = { self, udtHash, misuse: [], rows: [], sum: { inUdt: 0n, inReceipt: 0n, inDeposit: 0n, outUdt: 0n }, acct: new Map(), errs: [] };
    const st = (h, c) => h === DAO_HASH ? (isDepositData(c.data) ? 'dao' : 'unknown') : h === udtHash ? 'udt' : h === self ? 'logic' : 'unknown';
    for (const c of [...ins, ...outs]) {
      const L = st(c.lockHash, c), T = c.typeHash ? st(c.typeHash, c) : 'none', tag = `${c.src}[${c.index}]`;
      if (L === 'dao' || L === 'udt' || (L === 'logic' && T !== 'dao')) { p.misuse.push(tag); continue; }
      let kind = L === 'logic' ? 'deposit' : T === 'logic' ? 'receipt' : T === 'udt' ? 'udt' : null; if (!kind) continue;
      const row = { tag, kind, c };
      if (kind === 'deposit') { row.amount = unoccupied(c); if (c.src === 'in') { const ar = arOf(ctx, c); row.ar = ar; row.ickb = ar ? deposit2ickb(row.amount, ar) : null; if (row.ickb == null) p.missingHeader = true; else p.sum.inDeposit += row.ickb; }
        else { if (row.amount < MIN) p.errs.push([7, tag]); if (row.amount > MAX) p.errs.push([8, tag]); const a = p.acct.get(row.amount) || { d: 0n, r: 0n }; a.d++; p.acct.set(row.amount, a); } }
      if (kind === 'receipt') { const d = H(c.data || '0x'); if (d.length < 12) { p.errs.push([4, tag]); continue; } const b = d.subarray(0, 12); row.qty = leN(b, 0, 4); row.amount = leN(b, 4, 8);
        if (c.src === 'in') { const ar = arOf(ctx, c); row.ar = ar; if (ar == null) p.missingHeader = true; else { row.ickb = row.qty * deposit2ickb(row.amount, ar); p.sum.inReceipt += row.ickb; } }
        else { if (row.qty === 0n) p.errs.push([9, tag]); const a = p.acct.get(row.amount) || { d: 0n, r: 0n }; a.r += row.qty; p.acct.set(row.amount, a); } }
      if (kind === 'udt') { const d = H(c.data || '0x'); if (d.length < 16) { p.errs.push([4, tag]); continue; } const b = d.subarray(0, 16); row.amount = R.leToBig(b);
        if (c.src === 'in') p.sum.inUdt += row.amount; else { if (row.amount > 0xffffffffffffffffn) p.errs.push([12, tag]); p.sum.outUdt += row.amount; } }
      p.rows.push(row);
    }
    const fmt = v => v == null ? '?' : (Number(v) / 1e8).toLocaleString('en-US', { maximumFractionDigits: 8 });
    p.fields = [['iCKB xUDT type hash', udtHash], ...p.rows.map(r => [`${r.tag} ${r.kind}`, r.kind === 'udt' ? fmt(r.amount) + ' iCKB' : r.kind === 'deposit' ? fmt(r.amount) + ' CKB unoccupied' + (r.ickb != null ? ' → ' + fmt(r.ickb) + ' iCKB' : '') : `${r.qty} × ${fmt(r.amount)} CKB` + (r.ickb != null ? ' → ' + fmt(r.ickb) + ' iCKB' : '')]),
      [{ zh: 'Σ 输入 UDT + 回执', en: 'Σ input UDT + receipts' }, fmt(p.sum.inUdt + p.sum.inReceipt)], [{ zh: 'Σ 输出 UDT + 输入存款', en: 'Σ output UDT + input deposits' }, fmt(p.sum.outUdt + p.sum.inDeposit)]];
    p.layouts = [{ label: 'receipt data (ReceiptData struct 12B)', layout: [{ name: 'deposit_quantity u32', size: '4B', color: 2 }, { name: 'deposit_amount u64', size: '8B', color: 1, flex: 2 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(emptyArgs(g, ctx), 'args 为空，且输出中同 code 的 lock 也无 args', 'args empty, and no output lock of the same code has args', 5),
      R.check(p.misuse.length === 0, '无误用：DAO 存款/iCKB UDT 不能做 lock；iCKB logic lock 必须配 DAO 存款 type' + (p.misuse.length ? '：' + p.misuse.join(',') : ''), 'no misuse: DAO deposit / iCKB UDT never as lock; iCKB-logic lock only with a DAO deposit type' + (p.misuse.length ? ': ' + p.misuse.join(',') : ''), 6)];
    const errText = { 4: ['回执 data ≥ 12 字节、UDT data ≥ 16 字节', 'receipt data ≥ 12 bytes, UDT data ≥ 16 bytes'], 7: ['输出存款 unoccupied ≥ 1,000 CKB', 'output deposit unoccupied ≥ 1,000 CKB'], 8: ['输出存款 unoccupied ≤ 1,000,000 CKB', 'output deposit unoccupied ≤ 1,000,000 CKB'], 9: ['输出回执 quantity > 0', 'output receipt quantity > 0'], 12: ['输出 UDT 数量 ≤ u64::MAX', 'output UDT amount ≤ u64::MAX'] };
    for (const code of [7, 8, 9, 12, 4]) { const bad = p.errs.filter(e => e[0] === code).map(e => e[1]); if (bad.length || code === 7) c.push(R.check(bad.length === 0, errText[code][0] + (bad.length ? '：' + bad.join(',') : ''), errText[code][1] + (bad.length ? ': ' + bad.join(',') : ''), code)); }
    const mm = [...p.acct.entries()].filter(([, a]) => a.d !== a.r);
    c.push(R.check(mm.length === 0, '输出中每种存款金额：存款数 = 回执 quantity 之和', 'per deposit amount in outputs: number of deposits = Σ receipt quantity', 10));
    if (p.missingHeader) c.push(R.NOT_CHECKED('缺少输入所在块的 header，无法计算 iCKB 价值', 'missing input block header, cannot value iCKB', 11));
    else { const l = p.sum.inUdt + p.sum.inReceipt, r = p.sum.outUdt + p.sum.inDeposit;
      c.push(R.check(l === r, `Σ输入 UDT + Σ输入回执价值 ${l} = Σ输出 UDT + Σ输入存款价值 ${r}`, `Σ input UDT + Σ input receipt value ${l} = Σ output UDT + Σ input deposit value ${r}`, 11)); }
    return c;
  }
  R.register({ id: 'ickb_logic', kind: 'type', name: 'iCKB logic', needsInputHeaders: true, match: [{ code_hash: CODE, hash_type: 'data1', net: 'mainnet', src: 'blake2b of ickb/contracts release binary, confirmed on mainnet' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

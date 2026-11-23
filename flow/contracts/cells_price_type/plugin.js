// cells price-cell-type — LusoCryptoLabs/cells-contracts contracts/price-cell-type/src/main.rs + cells-core parse_price_factor / price_step_ok @6d29dab
// code_hash: cellula-sdk@0.2.1 dist/deployments.js (official SDK) + docs/TRUST.md (mainnet)
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const factor = hex => { const d = H(hex || '0x'); if (d.length !== 5 || d[0] !== 1) return null; const v = d[1] | d[2] << 8 | d[3] << 16 | (d[4] << 24 >>> 0); return v >= 126 && v <= 10000 ? v >>> 0 : null; };
  function parse(g, ctx) {
    const p = { inF: g.inputs.length ? factor(ctx.inputs[g.inputs[0]].data) : null, outF: g.outputs.length ? factor(ctx.tx.outputs_data[g.outputs[0]]) : null };
    p.fields = [['args (type id)', g.script.args], [{ zh: '操作', en: 'operation' }, g.inputs.length ? { zh: '更新', en: 'update' } : { zh: '创建', en: 'create' }]];
    if (p.inF != null) p.fields.push([{ zh: '旧系数', en: 'old factor' }, p.inF + ' bps']); if (p.outF != null) p.fields.push([{ zh: '新系数', en: 'new factor' }, p.outF + ' bps (' + (p.outF / 100) + '%)']);
    const d = g.outputs.length ? ctx.tx.outputs_data[g.outputs[0]] : null;
    p.layouts = [{ label: 'data (5 B)', layout: [{ name: 'version = 0x01', size: '1', color: 1, flex: 1 }, { name: 'factor bps', size: '4 LE u32', color: 2, flex: 3 }], hex: d ? [['version', d.slice(0, 4)], ['factor', '0x' + d.slice(4)]] : [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(g.outputs.length === 1, `恰好 1 个价格 cell 输出（${g.outputs.length}）`, `exactly 1 price cell output (${g.outputs.length})`, 3)]; if (g.outputs.length !== 1) return c;
    c.push(R.check(p.outF != null, '输出 data = 0x01 ‖ u32 LE，126 ≤ bps ≤ 10000', 'output data = 0x01 ‖ u32 LE, 126 ≤ bps ≤ 10000', 6));
    if (!g.inputs.length) { c.push(R.check(g.script.args === R.typeId(ctx, g.outputs[0]), 'args = blake2b(inputs[0] ‖ 输出序号 u64 LE)', 'args = blake2b(inputs[0] ‖ output index u64 LE)', 2)); return c; }
    c.push(R.check(g.inputs.length === 1, '更新：恰好 1 个输入', 'update: exactly 1 input', 3)); if (g.inputs.length !== 1) return c;
    const i = ctx.inputs[g.inputs[0]], o = ctx.tx.outputs[g.outputs[0]];
    c.push(R.check(R.scriptHash(i.output.lock) === R.scriptHash(o.lock), 'lock 不变', 'lock unchanged', 4), R.check(BigInt(o.capacity) >= BigInt(i.output.capacity), 'capacity 不减', 'capacity not reduced', 5),
      R.check(p.inF != null, '输入 data 合法', 'input data valid', 6));
    if (p.inF != null && p.outF != null) c.push(R.check(p.outF * 16 >= p.inF * 15 && p.outF * 16 <= p.inF * 17, `步长 ≤ 1/16：${p.inF} → ${p.outF}`, `step ≤ 1/16: ${p.inF} → ${p.outF}`, 7));
    const s = BigInt(i.input.since); c.push(R.check((s >> 56n) === 0xC0n && (s & 0xFFFFFFFFFFFFFFn) >= 21600n, `since = 相对时间戳 ≥ 21600 s（${i.input.since}）`, `since = relative timestamp ≥ 21600 s (${i.input.since})`, 8));
    return c;
  }
  R.register({ id: 'cells_price_type', kind: 'type', name: { zh: 'Cells 价格 cell（price-cell-type）', en: 'Cells price cell (price-cell-type)' }, match: [
    { code_hash: '0x97bf5f760cf72f918f13704d7184933b79d4ddc1fd85075762373e531152d4f9', hash_type: 'type', net: 'mainnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.price; cells-contracts docs/TRUST.md' },
    { code_hash: '0xe1057caf161b3c720fcdb80190e89c6efc36b6b4256b3c99635fda63a9dd4294', hash_type: 'type', net: 'testnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.price' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

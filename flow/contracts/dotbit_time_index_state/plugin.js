// DOTBIT_TIME_INDEX_STATE — .bit time oracle Index State type; dotbitHQ/ckb-time-script contracts/index-state-type/src/{entry,error}.rs
(function (R) {
  const H = R.hexToBytes, SUM = 12;
  const same = (s, g) => s && s.code_hash === g.script.code_hash; // the script compares code_hash only
  function parse(g, ctx) {
    const ins = ctx.inputs.filter(x => x.output && same(x.output.type, g)), outs = ctx.tx.outputs.map((o, i) => [o, i]).filter(([o]) => same(o.type, g));
    const p = { anyIn: ins.length > 0, anyOut: outs.length > 0, gIn: g.inputs.length ? H(ctx.inputs[g.inputs[0]].data) : null, gOut: g.outputs.length ? H(ctx.tx.outputs_data[g.outputs[0]]) : null };
    p.mode = !p.anyIn ? 'create' : !p.anyOut ? 'burn' : 'update';
    const f = d => d ? `index=${d[0]} · sum=${d[1]} (${d.length}B)` : '—';
    p.fields = [[{ zh: '动作', en: 'action' }, p.mode], [{ zh: '输入 data', en: 'input data' }, f(p.gIn)], [{ zh: '输出 data', en: 'output data' }, f(p.gOut)]];
    return p;
  }
  function outData(c, d) {
    c.push(R.check(d.length === 2, '输出 data 长 2 字节（index ‖ sum）', 'output data is 2 bytes (index ‖ sum)', 7));
    if (d.length !== 2) return false;
    c.push(R.check(d[0] < SUM, `index < ${SUM}`, `index < ${SUM}`, 9));
    c.push(R.check(d[1] === SUM, `sum_of_time_info_cells = ${SUM}`, `sum_of_time_info_cells = ${SUM}`, 8));
    return true;
  }
  function check(g, ctx, p) {
    const c = [];
    if (p.mode === 'burn') return [R.check(true, '输入有、输出没有同 code hash 的 type：回收，直接通过', 'in inputs but not outputs (same code hash): recycle, always passes', 0)];
    c.push(R.check(!!p.gOut, '本脚本组有输出', 'the script group has an output', 6));
    if (!p.gOut) return c;
    if (p.mode === 'update') c.push(R.check(!!p.gIn, '本脚本组有输入', 'the script group has an input', 6));
    if (!outData(c, p.gOut) || p.mode !== 'update' || !p.gIn) return c;
    const want = p.gIn[0] >= SUM - 1 ? 0 : p.gIn[0] + 1;
    c.push(R.check(p.gOut[0] === want, `index 递增（${p.gIn[0]} → ${want}，到 ${SUM - 1} 后回到 0）`, `index advances (${p.gIn[0]} → ${want}, wraps to 0 after ${SUM - 1})`, 10));
    return c;
  }
  R.register({ id: 'dotbit_time_index_state', kind: 'type', name: '.bit Time Index State Type', match: [
    { code_hash: '0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43', hash_type: 'type', net: 'mainnet', src: 'ckb-time-script migrations/mainnet/2021-08-24-000000.json' },
    { code_hash: '0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8', hash_type: 'type', net: 'testnet', src: 'ckb-time-script migrations/testnet/2021-08-09-103746.json' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

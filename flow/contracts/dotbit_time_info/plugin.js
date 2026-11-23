// DOTBIT_TIME_INFO — .bit time oracle Info type (timestamp / block number); dotbitHQ/ckb-time-script contracts/info-type/src/{entry,error}.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const same = (s, g) => s && s.code_hash === g.script.code_hash; // the script compares code_hash only
  const be = d => { let v = 0n; for (let i = 2; i < 10; i++) v = (v << 8n) | BigInt(d[i]); return v; };
  const T = { 0: 'Arbitrage', 1: 'Timestamp', 2: 'BlockNumber' };
  function parse(g, ctx) {
    const ins = ctx.inputs.filter(x => x.output && same(x.output.type, g)), outs = ctx.tx.outputs.filter(o => same(o.type, g));
    const p = { anyIn: ins.length > 0, anyOut: outs.length > 0, gIn: g.inputs.length ? H(ctx.inputs[g.inputs[0]].data) : null, gOut: g.outputs.length ? H(ctx.tx.outputs_data[g.outputs[0]]) : null };
    p.mode = !p.anyIn ? 'create' : !p.anyOut ? 'burn' : 'update';
    p.out0 = ctx.tx.outputs[0]; p.out0Data = ctx.tx.outputs_data[0] ? H(ctx.tx.outputs_data[0]) : new Uint8Array();
    p.since = g.inputs.length ? BigInt(ctx.tx.inputs[g.inputs[0]].since) : null;
    const f = d => d ? (d.length === 10 ? `index=${d[0]} · ${T[d[1]] || d[1]} · ${be(d)}` : `${X(d)} (${d.length}B)`) : '—';
    p.fields = [[{ zh: '动作', en: 'action' }, p.mode], [{ zh: '输入 data', en: 'input data' }, f(p.gIn)], [{ zh: '输出 data', en: 'output data' }, f(p.gOut)], ['since', p.since == null ? '—' : '0x' + p.since.toString(16)]];
    return p;
  }
  function check(g, ctx, p) {
    const c = [];
    if (p.mode === 'burn') return [R.check(true, '输入有、输出没有同 code hash 的 type：回收，直接通过', 'in inputs but not outputs (same code hash): recycle, always passes', 0)];
    c.push(R.check(!!p.gOut, '本脚本组有输出', 'the script group has an output', 8));
    if (!p.gOut) return c;
    if (p.mode === 'create') {
      const t = p.out0 && p.out0.type;
      c.push(R.check(!!t, '输出 #0 有 type（Index State）', 'output #0 has a type (Index State)', 13));
      if (t) c.push(R.check(t.args === g.script.args, 'args = 输出 #0 type 的 args', 'args = output #0 type args', 5));
      c.push(R.check(p.gOut.length === 10, '输出 data 长 10 字节', 'output data is 10 bytes', 6));
      return c;
    }
    c.push(R.check(!!p.gIn, '本脚本组有输入', 'the script group has an input', 8));
    if (!p.gIn) return c;
    c.push(R.check(p.out0Data.length === 2, '输出 #0（Index State）data 长 2 字节', 'output #0 (Index State) data is 2 bytes', 7));
    if (p.out0Data.length !== 2) return c;
    c.push(R.check(p.gIn.length === 10 && p.gOut.length === 10, '输入、输出 data 都是 10 字节', 'input and output data are both 10 bytes', 6));
    if (p.gIn.length !== 10 || p.gOut.length !== 10) return c;
    c.push(R.check(p.gOut[0] === p.out0Data[0], 'index = Index State 新 index', 'index = new Index State index', 9));
    const a = be(p.gIn), b = be(p.gOut);
    if (p.gOut[1] === 1) {
      c.push(R.check(a < b, '时间戳变大', 'timestamp increases', 10));
      c.push(R.check(p.since === (1n << 62n) + b, 'since = 绝对时间戳（1<<62）+ 新时间戳', 'since = absolute-timestamp flag (1<<62) + new timestamp', 12));
    } else if (p.gOut[1] === 2) {
      c.push(R.check(a < b, '区块高度变大', 'block number increases', 11));
      c.push(R.check(p.since === b, 'since = 新区块高度', 'since = new block number', 12));
    } else c.push(R.check(true, `data type ${p.gOut[1]}：不再检查内容`, `data type ${p.gOut[1]}: content not checked by the script`, 0));
    return c;
  }
  R.register({ id: 'dotbit_time_info', kind: 'type', name: '.bit Time Info Type', match: [
    { code_hash: '0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79', hash_type: 'type', net: 'mainnet', src: 'ckb-time-script migrations/mainnet/2021-08-24-000000.json' },
    { code_hash: '0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a', hash_type: 'type', net: 'testnet', src: 'ckb-time-script migrations/testnet/2021-08-09-103746.json' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// Simple UDT — RFC 0025, ckb-production-scripts/c/simple_udt.c@e570c11
// Also exposes R.udt (amount parsing / owner mode) for xudt.
(function (R) {
  function amounts(g, ctx) {
    const ins = g.inputs.map(i => [i, R.u128(ctx.inputs[i].data)]), outs = g.outputs.map(j => [j, R.u128(ctx.tx.outputs_data[j])]);
    const sum = l => l.reduce((s, [, a]) => s + (a || 0n), 0n);
    const ownerHash = R.bytesToHex(R.hexToBytes(g.script.args).subarray(0, 32));
    const owner = ctx.inputs.some(x => x.output && R.scriptHash(x.output.lock) === ownerHash);
    return { ins, outs, sumIn: sum(ins), sumOut: sum(outs), owner,
      fields: [...ins.map(([i, a]) => [`in[${i}] amount`, String(a)]), ...outs.map(([j, a]) => [`out[${j}] amount`, String(a)]),
        ['Σin / Σout', String(sum(ins)) + ' / ' + String(sum(outs))], ['owner mode', owner ? 'yes' : 'no']] };
  }
  function check(g, ctx, p, codes) {
    codes = codes || { args: -1, data: -2, amount: -52 };
    const c = [];
    if (codes.argsExact) c.push(R.check(R.hexToBytes(g.script.args).length === 32, 'args 为 32 字节', 'args is 32 bytes', codes.args));
    if (p.owner) { c.push(R.check(true, 'owner 模式（存在 lock hash = args 的输入），不检查数量', 'owner mode (an input lock hash = args); amounts not checked', null)); return c; }
    c.push(R.check([...p.ins, ...p.outs].every(([, a]) => a != null), 'data ≥ 16 字节', 'data ≥ 16 bytes', codes.data),
      R.check(p.sumIn >= p.sumOut, `Σin ${p.sumIn} ≥ Σout ${p.sumOut}`, `Σin ${p.sumIn} ≥ Σout ${p.sumOut}`, codes.amount));
    return c;
  }
  R.udt = { amounts, check };
  R.register({ id: 'sudt', kind: 'type', name: 'sUDT',
    match: [{ code_hash: '0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5', hash_type: 'type', net: 'mainnet', src: 'RFC 0025' },
            { code_hash: '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4', hash_type: 'type', net: 'testnet', src: 'RFC 0025' }],
    parse: amounts, check: (g, ctx, p) => check(g, ctx, p, { args: -1, data: -2, amount: -52, argsExact: true }) });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

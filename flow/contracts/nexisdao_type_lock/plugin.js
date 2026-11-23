// NEXISDAO_TYPE_LOCK — NexisDAO dCKB "Type lock" (locks the dCKB NervosDAO deposits); NexisDao-core contracts/type_lock/src/{entry,error}.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length };
    if (a.length) { p.mode = a.length === 32 ? 0 : a[0]; p.target = X(a.length === 32 ? a : a.subarray(1)); }
    const th = s => s ? R.scriptHash(s) : null;
    p.inTypes = ctx.inputs.map(x => x.output && th(x.output.type)).filter(Boolean); p.outTypes = ctx.tx.outputs.map(o => th(o.type)).filter(Boolean);
    p.inHit = p.inTypes.includes(p.target); p.outHit = p.outTypes.includes(p.target);
    const M = { 1: { zh: '1：只查输入', en: '1: inputs only' }, 2: { zh: '2：只查输出', en: '2: outputs only' } };
    p.fields = [['mode', p.mode == null ? '—' : M[p.mode] || { zh: `${p.mode}（args 为 32 字节时为 0）：先查输入再查输出`, en: `${p.mode} (0 when args is 32 bytes): inputs, then outputs` }], [{ zh: '要求的 type hash', en: 'required type hash' }, p.target || '—']];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen > 0, 'args 非空', 'args not empty', 5)];
    if (!p.argsLen) return c;
    if (p.target.length !== 66) c.push(R.check(false, `type hash 部分长 ${(p.target.length - 2) / 2} 字节，不可能与 32 字节 type hash 相等`, `the type-hash part is ${(p.target.length - 2) / 2} bytes and can never equal a 32-byte type hash`, 6));
    else if (p.mode === 1) c.push(R.check(p.inHit, '某个输入的 type hash = args 中的 type hash', 'some input type hash = the type hash in args', 6));
    else if (p.mode === 2) c.push(R.check(p.outHit, '某个输出的 type hash = args 中的 type hash', 'some output type hash = the type hash in args', 6));
    else c.push(R.check(p.inHit || p.outHit, '某个输入或输出的 type hash = args 中的 type hash', 'some input or output type hash = the type hash in args', 6));
    return c;
  }
  R.register({ id: 'nexisdao_type_lock', kind: 'lock', name: 'NexisDAO dCKB Type Lock', match: [
    { code_hash: '0x8baa01f58baab0cb58fc319136ea4f6866ed59c323fa94bf7d6b72bea21c74de', hash_type: 'data', net: 'mainnet', src: 'dckb-rescuer/v1-core README ("Type lock … deployed with this code hash"); seen on chain as a data lock of dCKB NervosDAO deposits' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

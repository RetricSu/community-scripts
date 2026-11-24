// TIME_LOCK — ckb-devrel/ckb-proxy-locks contracts/time-lock/src/entry.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  // ckb-std Since::partial_cmp: None (so "lt" is false) when the flag bytes differ; epochs compare as number + index/length
  const lt = (a, b) => { if ((a >> 56n) !== (b >> 56n)) return false; const v = x => x & 0xffffffffffffffn;
    if (((a >> 61n) & 3n) !== 1n) return v(a) < v(b);
    const e = x => [x & 0xffffffn, (x >> 24n) & 0xffffn, (x >> 40n) & 0xffffn], [n1, i1, l1] = e(a), [n2, i2, l2] = e(b);
    const L1 = l1 || 1n, L2 = l2 || 1n; return (n1 * L1 + i1) * L2 < (n2 * L2 + i2) * L1; };
  function parse(g, ctx) { const a = H(g.script.args); const p = { ok: a.length >= 40 };
    if (p.ok) { p.lock = X(a.subarray(0, 32)); p.until = R.leToBig(a.subarray(32, 40)); }
    p.sinces = g.inputs.map(i => BigInt(ctx.inputs[i].input.since));
    p.fields = p.ok ? [[{ zh: '所需 lock hash', en: 'required lock hash' }, p.lock], [{ zh: 'locked_until (since)', en: 'locked_until (since)' }, '0x' + p.until.toString(16)]] : [['args', '(< 40B)']]; return p; }
  function check(g, ctx, p) { if (!p.ok) return [R.check(false, 'args ≥ 40 字节', 'args ≥ 40 bytes', 5)];
    return [R.check(inLock(ctx).includes(p.lock), '输入中存在 lock hash = args[0..32] 的 cell', 'an input cell has lock hash = args[0..32]', 7),
      R.check(p.sinces.every(s => !lt(s, p.until)), '每个 group 输入的 since 不小于 locked_until（标志位不同视为不可比较，按源码通过）', 'every group input since is not less than locked_until (different flags are incomparable and pass, as in source)', 6)]; }
  R.register({ id: 'time_lock', kind: 'lock', name: 'Time Lock (proxy-locks)', match: [{ code_hash: '0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/time-lock (mainnet and testnet)', deps: { mainnet: { tx_hash: '0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b', index: '0x1' }, testnet: { tx_hash: '0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792', index: '0x1' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

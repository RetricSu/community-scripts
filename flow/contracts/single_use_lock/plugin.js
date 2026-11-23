// SINGLE_USE_LOCK — ckb-devrel/ckb-proxy-locks contracts/single-use-lock/src/entry.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  function parse(g) { const a = H(g.script.args); const p = { ok: a.length >= 36 };
    if (p.ok) { p.tx = X(a.subarray(0, 32)); p.index = a[32] | a[33] << 8 | a[34] << 16 | a[35] << 24 >>> 0; }
    p.fields = [[{ zh: 'OutPoint (args[0..36])', en: 'OutPoint (args[0..36])' }, p.ok ? p.tx + ':' + p.index : '(args < 36B)']]; return p; }
  function check(g, ctx, p) { return [R.check(p.ok, 'args ≥ 36 字节（OutPoint）', 'args ≥ 36 bytes (OutPoint)', 4),
    R.check(p.ok && ctx.tx.inputs.some(i => i.previous_output.tx_hash === p.tx && parseInt(i.previous_output.index, 16) === p.index), '输入中消耗了 args 指定的 OutPoint', 'the OutPoint in args is consumed as an input', 7)]; }
  R.register({ id: 'single_use_lock', kind: 'lock', name: 'Single Use Lock', match: [{ code_hash: '0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/single-use-lock (mainnet and testnet)', deps: { mainnet: { tx_hash: '0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b', index: '0x4' }, testnet: { tx_hash: '0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93', index: '0x4' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

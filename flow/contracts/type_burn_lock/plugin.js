// TYPE_BURN_LOCK — ckb-devrel/ckb-proxy-locks contracts/type-burn-lock/src/entry.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  function parse(g) { const o = a32(g); return { t: o, fields: [[{ zh: '需销毁的 type hash (args[0..32])', en: 'type hash to burn (args[0..32])' }, o || '(args < 32B)']] }; }
  function check(g, ctx, p) { return [R.check(!!p.t, 'args ≥ 32 字节', 'args ≥ 32 bytes', 4),
    R.check(!!p.t && inType(ctx).includes(p.t) && !outType(ctx).includes(p.t), '该 type 出现在输入且不出现在任何输出（被销毁）', 'that type is in an input and in no output (burnt)', 6)]; }
  R.register({ id: 'type_burn_lock', kind: 'lock', name: 'Type Burn Lock', match: [{ code_hash: '0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/type-burn-lock (mainnet and testnet)', deps: { mainnet: { tx_hash: '0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b', index: '0x5' }, testnet: { tx_hash: '0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93', index: '0x5' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

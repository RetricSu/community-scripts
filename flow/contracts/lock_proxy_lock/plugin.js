// LOCK_PROXY_LOCK — ckb-devrel/ckb-proxy-locks contracts/lock-proxy-lock/src/entry.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  function parse(g) { const o = a32(g); return { owner: o, fields: [[{ zh: 'owner hash (args[0..32])', en: 'owner hash (args[0..32])' }, o || '(args < 32B)']] }; }
  function check(g, ctx, p) { return [R.check(!!p.owner, 'args ≥ 32 字节', 'args ≥ 32 bytes', 4), R.check(!!p.owner && inLock(ctx).includes(p.owner), '输入中存在 lock hash = args[0..32] 的 cell', 'an input cell has lock hash = args[0..32]', 6)]; }
  R.register({ id: 'lock_proxy_lock', kind: 'lock', name: 'Lock Proxy Lock', match: [{ code_hash: '0x5d41e32e224c15f152b7e6529100ebeac83b162f5f692a5365774dad2c1a1d02', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/lock-proxy-lock (mainnet and testnet)', deps: { mainnet: { tx_hash: '0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b', index: '0x3' }, testnet: { tx_hash: '0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93', index: '0x3' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// ALWAYS_SUCCESS — ckb-devrel/ckb-proxy-locks contracts/always-success/src/main.rs (program_entry returns 0)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  function parse(g) { return { fields: [['args', g.script.args]] }; }
  function check() { return [R.check(true, '脚本总是返回 0：任何人都能解锁 / 任意转换', 'script always returns 0: anyone can unlock / any transition', 0)]; }
  R.register({ id: 'always_success', kind: 'lock', name: 'Always Success', match: [{ code_hash: '0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/always-success (mainnet and testnet)', deps: { mainnet: { tx_hash: '0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b', index: '0x0' }, testnet: { tx_hash: '0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93', index: '0x0' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// EASY_TO_DISCOVER_TYPE — ckb-devrel/ckb-proxy-locks contracts/easy-to-discover-type/src/entry.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const inLock = ctx => ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock));
  const inType = ctx => ctx.inputs.filter(x => x.output && x.output.type).map(x => R.scriptHash(x.output.type));
  const outType = ctx => ctx.tx.outputs.filter(o => o.type).map(o => R.scriptHash(o.type));
  const a32 = g => { const a = H(g.script.args); return a.length >= 32 ? X(a.subarray(0, 32)) : null; };
  function parse(g, ctx) { const o = a32(g); return { h: o, fields: [[{ zh: 'data hash (args[0..32])', en: 'data hash (args[0..32])' }, o || '(args < 32B)']] }; }
  function check(g, ctx, p) { return [R.check(!!p.h, 'args ≥ 32 字节', 'args ≥ 32 bytes', 5),
    R.check(!!p.h && g.outputs.every(j => R.ckbHash(H(ctx.tx.outputs_data[j])) === p.h), '每个 group 输出 blake2b(data) = args[0..32]（输入不检查）', 'every group output blake2b(data) = args[0..32] (inputs not checked)', 6)]; }
  R.register({ id: 'easy_to_discover_type', kind: 'type', name: 'Easy-to-discover Type', match: [{ code_hash: '0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af', hash_type: 'data1', src: 'ckb-devrel/ckb-proxy-locks contracts/easy-to-discover-type (mainnet and testnet)', deps: { mainnet: { tx_hash: '0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b', index: '0x0' }, testnet: { tx_hash: '0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792', index: '0x0' } } /* cell deps: ccc clientPublic*.advanced.ts */ }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

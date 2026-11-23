// FIBER_FUNDING_LOCK — nervosnetwork/fiber-scripts contracts/funding-lock/src/main.rs; deployments: nervosnetwork/fiber config/{mainnet,testnet}/config.yml
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const EMPTY = '0x10000000100000001000000010000000';
  function parse(g, ctx) {
    const w = H(ctx.tx.witnesses[g.inputs[0]] || '0x'), p = { wlen: w.length, prefix: X(w.subarray(0, 16)) };
    p.fields = [['pubkey_hash (args[0..20])', X(H(g.script.args).subarray(0, 20))], ['witness', `${w.length} B`]];
    if (w.length === 112) { p.pubkey = X(w.subarray(16, 48)); p.fields.push(['pubkey (x-only)', p.pubkey], ['blake160(pubkey)', R.blake160(w.subarray(16, 48))], ['signature (Schnorr)', X(w.subarray(48))]); }
    return p;
  }
  function check(g, ctx, p) {
    return [R.check(g.inputs.length === 1, `group 输入 ${g.inputs.length} = 1`, `group inputs ${g.inputs.length} = 1`, 5),
      R.check(p.wlen === 112, `witness 长度 ${p.wlen} = 16 + 32 + 64`, `witness length ${p.wlen} = 16 + 32 + 64`, 6),
      R.check(p.prefix === EMPTY, 'witness 前 16 字节 = 空 WitnessArgs 占位', 'witness first 16 bytes = empty WitnessArgs placeholder', 7),
      R.NOT_CHECKED('ckb-auth Schnorr（算法 7）：聚合签名覆盖 blake2b(raw tx 去掉 cell_deps)，公钥哈希 = args[0..20]', 'ckb-auth Schnorr (algorithm 7): aggregated signature over blake2b(raw tx without cell_deps), pubkey hash = args[0..20]', 8)];
  }
  R.register({ id: 'fiber_funding_lock', kind: 'lock', name: 'Fiber Funding Lock', match: [
    { code_hash: '0xe45b1f8f21bff23137035a3ab751d75b36a981deec3e7820194b9c042967f4f1', hash_type: 'type', net: 'mainnet', src: 'nervosnetwork/fiber config/mainnet/config.yml' },
    { code_hash: '0x6c67887fe201ee0c7853f1682c0b77c0e6214044c156c7558269390a8afa6d7c', hash_type: 'type', net: 'testnet', src: 'nervosnetwork/fiber config/testnet/config.yml' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

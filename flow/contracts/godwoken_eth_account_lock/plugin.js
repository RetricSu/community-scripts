// Godwoken eth-account-lock — godwokenrises/godwoken gwos/contracts/eth-account-lock/src/entry.rs + eth_signature.rs @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwoken-info scripts-deploy-result.json @8ce6390. An L2 account lock; on L1 it only runs in challenge-cancel txs (none found).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parse(g, ctx) { const a = H(g.script.args || '0x'), d = H(ctx.inputs[g.inputs[0]].data || '0x'), p = { ok: a.length === 52, dok: d.length === 65 };
    p.fields = [['rollup_script_hash', X(a.subarray(0, 32))], ['eth_address', X(a.subarray(32))]]; if (p.dok) { p.owner = X(d.subarray(0, 32)); p.fields.push(['data.owner_lock_hash', p.owner], ['data.signing_type', d[32] === 0 ? '0 Raw' : d[32] === 1 ? '1 WithPrefix' : String(d[32])], ['data.message', X(d.subarray(33))]); p.st = d[32]; } return p; }
  function check(g, ctx, p) { const c = [R.check(p.ok, 'args = 52 字节（rollup_script_hash 32 ‖ eth_address 20）', 'args = 52 bytes (rollup_script_hash 32 ‖ eth_address 20)', 5), R.check(p.dok && (p.st === 0 || p.st === 1), 'data = 65 字节：owner_lock_hash ‖ signing_type(0/1) ‖ message', 'data = 65 bytes: owner_lock_hash ‖ signing_type (0/1) ‖ message', 4)];
    if (p.dok) c.push(R.check(ctx.inputs.some(x => R.scriptHash(x.output.lock) === p.owner), '输入中有 lock hash = data.owner_lock_hash 的 cell', 'an input whose lock hash = data.owner_lock_hash', 8));
    c.push(R.NOT_CHECKED('witnesses[0].lock = 65B secp256k1 签名，恢复出的以太坊地址 = eth_address', 'witnesses[0].lock = 65B secp256k1 signature recovering to eth_address', 41)); return c; }
  R.register({ id: 'godwoken_eth_account_lock', kind: 'lock', name: { zh: 'Godwoken 以太坊账户 lock（eth-account-lock）', en: 'Godwoken Ethereum account lock (eth-account-lock)' }, match: [
    { code_hash: '0x096df264f38fff07f3acd318995abc2c71ae0e504036fe32bc38d5b6037364d4', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json eth_account_lock', deps: { mainnet: { tx_hash: '0xf0cfb02fb435bf2f061cbf33b1b024a4944b3f4a95968a9d997d95dd2f76a7f9', index: '0x0' } } },
    { code_hash: '0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json eth_account_lock', deps: { testnet: { tx_hash: '0x21da20f275af89ca7172cb1cd7fcb8676056e4212ba3782e8c77afebae57c6ed', index: '0x0' } } }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

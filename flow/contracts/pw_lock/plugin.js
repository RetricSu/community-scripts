// PW lock — lay2dev/pw-lock c/secp256k1_keccak256_sighash_all_acpl.c (+ anyone_can_pay_lock.h, secp256k1_keccak256_lock.h, common.h)
// The deployed variant (ccc KnownScript.PWLock) is ASSUMED to be the _acpl build (unverified: type-id deployment, binary not rebuilt here).
// @requires acp
(function (R) {
  function parse(g, ctx) {
    const p = R.acp.parse(g, ctx);
    p.hasSig = p.lockLen > 0; // has_signature(): witness.lock size > 0
    p.fields = p.fields.map(f => f[0] === 'pubkey hash' ? [{ zh: 'ETH 地址（keccak256(pubkey)[12..32]）', en: 'ETH address (keccak256(pubkey)[12..32])' }, f[1]] : (f[0] && f[0].en === 'unlock path') ? [f[0], p.hasSig ? { zh: '签名（keccak256 / 以太坊）', en: 'signature (keccak256 / Ethereum)' } : f[1]] : f);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen >= 20 && p.argsLen <= 22, `args 长度 ${p.argsLen} ∈ [20,22]`, `args length ${p.argsLen} in [20,22]`, -1)];
    if (p.hasSig) return c.concat(R.check(p.lockLen === 65, 'witness.lock 恰为 65 字节', 'witness.lock is exactly 65 bytes', -1),
      R.NOT_CHECKED('keccak256 签名恢复出的地址 = args[0..20]（未检查）', 'address recovered from the keccak256 signature = args[0..20] (not checked)', -31));
    return c.concat(R.acp.payment(g, ctx, p));
  }
  R.register({ id: 'pw_lock', kind: 'lock', name: 'PW lock', match: [
    { code_hash: '0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc', hash_type: 'type', net: 'mainnet', src: 'ccc KnownScript.PWLock' },
    { code_hash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63', hash_type: 'type', net: 'testnet', src: 'ccc KnownScript.PWLock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

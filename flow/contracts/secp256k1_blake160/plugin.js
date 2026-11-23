// secp256k1_blake160_sighash_all — ckb-system-scripts/c/secp256k1_blake160_sighash_all.c (+ common.h)
(function (R) {
  R.register({
    id: 'secp256k1_blake160', kind: 'lock', name: 'SECP256K1/blake160',
    match: [{ code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', hash_type: 'type', src: 'RFC 0024 (Lina & Aggron)' }],
    parse(g, ctx) {
      const w = ctx.witnesses[g.witnessIndex]; const lock = w && w.args && w.args.lock;
      return { lock, fields: [['args = blake160(pubkey)', g.script.args], [{ zh: 'witness.lock（签名）', en: 'witness.lock (signature)' }, lock ? lock + ' (' + (lock.length - 2) / 2 + 'B)' : 'None']] };
    },
    check(g, ctx, p) {
      const w = ctx.witnesses[g.witnessIndex];
      return [
        R.check(R.hexToBytes(g.script.args).length === 20, 'args 为 20 字节', 'args is 20 bytes', -1),
        R.check(!!(w && w.args && w.args.lock), 'witness 为合法 WitnessArgs 且 lock 非空', 'witness is a valid WitnessArgs with non-empty lock', -2),
        R.check(!!p.lock && R.hexToBytes(p.lock).length === 65, 'witness.lock 为 65 字节', 'witness.lock is 65 bytes', -1),
        R.NOT_CHECKED('签名恢复出的 blake160(pubkey) = args（未检查）', 'recovered blake160(pubkey) = args (not checked)', -31),
      ];
    },
  });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

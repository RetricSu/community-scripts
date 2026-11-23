// Cobuild OTX lock — xcshuan/cobuild-otx-contracts contracts/cobuild-otx-lock/src + crates/cobuild-core/src @ f18eeaf22f29820ecd9a089481ab45b78b2b7454
// No official deployment (reference implementation). match is empty: static page only.
(function (R) {
  const H = R.hexToBytes;
  const IDS = { 0xff000001: 'SighashAll', 0xff000002: 'SighashAllOnly', 0xff000003: 'Otx', 0xff000004: 'OtxStart' };
  const unionId = hex => { const b = H(hex || '0x'); return b.length >= 4 ? (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0 : null; };
  R.register({
    id: 'cobuild_otx_lock', kind: 'lock', name: { zh: 'Cobuild OTX lock', en: 'Cobuild OTX lock' }, match: [],
    parse(g, ctx) {
      const w = ctx.witnesses[g.witnessIndex], id = w && w.raw ? unionId(w.raw) : null;
      return { fields: [['args (identity)', g.script.args], [{ zh: 'carrier witness 类型', en: 'carrier witness layout' }, IDS[id] || 'legacy / WitnessArgs']], layoutName: IDS[id] };
    },
    check(g, ctx, p) {
      const a = H(g.script.args || '0x');
      return [R.check(a.length === 20, 'args 长度 = 20', 'args length = 20', 20),
        R.NOT_CHECKED('Cobuild witness 扫描、OTX 布局、action 目标、seal 选择与签名 hash', 'Cobuild witness scan, OTX layout, action targets, seal selection and signing hashes', '30–40'),
        R.NOT_CHECKED('secp256k1 可恢复签名（公钥 blake160 = args）', 'recoverable secp256k1 signature (pubkey blake160 = args)', 50)];
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

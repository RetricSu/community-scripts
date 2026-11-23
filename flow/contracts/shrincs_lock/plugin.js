// SHRINCS lock — XuJiandong/shrincs-lock contracts/shrincs-lock/src/main.rs @ d9326f524216acf3c6972e82ea600041631efeed
// Deployment: README.md "Deployment" + deployment/testnet/migrations/2026-09-07-012703.json (testnet only). SHRINCS verification NOT_CHECKED.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  R.register({
    id: 'shrincs_lock', kind: 'lock', name: { zh: 'SHRINCS 抗量子 lock', en: 'SHRINCS post-quantum lock' },
    match: [{ code_hash: '0x387496fafe46562bb3bb2fa4446f1fc1054ba2f1b4df229a88056d5422a196ac', hash_type: 'type', net: 'testnet', src: 'shrincs-lock README.md "Deployment" (testnet) + deployment/testnet/migrations/2026-09-07-012703.json (type_id)' }],
    parse(g, ctx) {
      const p = { fields: [], layouts: [] }, a = H(g.script.args || '0x'); p.args = a;
      if (a.length === 32) {
        p.fields.push(['seed', X(a.subarray(0, 16))], ['root', X(a.subarray(16))]);
        p.layouts.push({ label: 'lock.args (SHRINCS pubkey)', layout: [{ name: 'seed', size: '16B', color: 0, flex: 1 }, { name: 'root', size: '16B', color: 1, flex: 1 }], hex: [['seed', X(a.subarray(0, 16))], ['root', X(a.subarray(16))]] });
      }
      p.w = ctx.witnesses[g.witnessIndex];
      const sig = p.w && p.w.args && p.w.args.lock;
      if (sig) { p.sigLen = H(sig).length;
        p.fields.push([{ zh: '签名长度', en: 'signature length' }, p.sigLen + 'B' + (p.sigLen === 324 ? ' (stateful)' : p.sigLen === 2568 ? ' (stateless)' : '')]); }
      return p;
    },
    check(g, ctx, p) {
      const c = [];
      if (!p.w || p.w.empty || p.w.error) { c.push(R.check(false, 'group 第一个 witness 是合法 WitnessArgs', 'group\'s first witness is valid WitnessArgs', p.w && p.w.error ? 72 : 71)); return c; }
      c.push(R.check(true, 'group 第一个 witness 是合法 WitnessArgs', 'group\'s first witness is valid WitnessArgs', 72));
      c.push(R.check(p.sigLen != null, 'WitnessArgs.lock 存在（SHRINCS 签名）', 'WitnessArgs.lock present (SHRINCS signature)', 73));
      c.push(R.check(p.args.length === 32, `args 长度 ${p.args.length} = 32（seed ‖ root）`, `args length ${p.args.length} = 32 (seed ‖ root)`, 74));
      c.push(R.NOT_CHECKED('CKB_TX_MESSAGE_ALL（personal "ckb-shrincs-msg-"）+ SHRINCS_B 签名验证', 'CKB_TX_MESSAGE_ALL (personal "ckb-shrincs-msg-") + SHRINCS_B signature verification', '75 / 76'));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

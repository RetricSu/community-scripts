// JoyID lock — NO PUBLIC SOURCE FOUND. Match-only: identifies the script, performs no rule checks.
// Constants: ckb-devrel/ccc clientPublic{Mainnet,Testnet}.advanced.ts (KnownScript.JoyId)
(function (R) {
  R.register({ id: 'joyid', kind: 'lock', name: 'JoyID lock', noSource: true, match: [
    { code_hash: '0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323', hash_type: 'type', net: 'mainnet', src: 'ccc KnownScript.JoyId' },
    { code_hash: '0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac', hash_type: 'type', net: 'testnet', src: 'ccc KnownScript.JoyId' }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['witness.lock', w && w.args && w.args.lock ? (H => H.length)(R.hexToBytes(w.args.lock)) + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码：只识别脚本，不检查规则', 'no public source: script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

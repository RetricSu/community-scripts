// CoTA type — NO PUBLIC SOURCE FOUND. Match-only: identifies the script, performs no rule checks.
// Constants: ckb-devrel/ccc clientPublic{Mainnet,Testnet}.advanced.ts (KnownScript.COTA)
(function (R) {
  R.register({ id: 'cota', kind: 'type', name: 'CoTA', noSource: true, match: [
    { code_hash: '0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df', hash_type: 'type', net: 'mainnet', src: 'ccc KnownScript.COTA' },
    { code_hash: '0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8', hash_type: 'type', net: 'testnet', src: 'ccc KnownScript.COTA' }],
    parse(g, ctx) { return { fields: [['args', g.script.args], ...g.inputs.map(i => [`in[${i}] data`, (R.hexToBytes(ctx.inputs[i].data || '0x').length) + ' B']), ...g.outputs.map(j => [`out[${j}] data`, (R.hexToBytes(ctx.tx.outputs_data[j] || '0x').length) + ' B'])] }; },
    check() { return [R.NOT_CHECKED('无公开源码：只识别脚本，不检查规则', 'no public source: script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

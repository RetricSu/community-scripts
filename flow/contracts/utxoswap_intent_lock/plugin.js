// UTXOSwap Intent Lock — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, mainnet) | on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, testnet)
(function (R) {
  R.register({ id: 'utxoswap_intent_lock', kind: 'lock', name: {"zh":"UTXOSwap Intent Lock","en":"UTXOSwap Intent Lock"}, noSource: true, match: [
    { code_hash: '0x3547c9aa563804e47ba3ebd37e6012e447c91a238f7aa71b1a75319f11df060e', hash_type: 'type', net: 'mainnet', src: "on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, mainnet)" },
    { code_hash: '0x4e9c30c8d6ce275740fbe69eae49c3d8c213578c5bd066f4938fe3c7dec6e101', hash_type: 'type', net: 'testnet', src: "on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, testnet)" }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['args length', (R.hexToBytes(g.script.args).length) + ' B'], ['witness.lock', w && w.args && w.args.lock ? R.hexToBytes(w.args.lock).length + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

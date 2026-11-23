// UTXOSwap pool proxy lock (sequencer proxy lock) — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: on chain: lock of the Pool Cell whose type = pool_type_code_hash 0xc70a8b00…3c98 (UTXOSwap docs, mainnet) | on chain: lock of the Pool Cell whose type = pool_type_code_hash 0x5b9228b1…8735 (UTXOSwap docs, testnet)
(function (R) {
  R.register({ id: 'utxoswap_proxy_lock', kind: 'lock', name: {"zh":"UTXOSwap 池代理锁（sequencer proxy lock）","en":"UTXOSwap pool proxy lock (sequencer proxy lock)"}, noSource: true, match: [
    { code_hash: '0x7ef6e226ca9a3514ac76759f0b1550e70c9aa10aff89111fedf2c9d800d256f7', hash_type: 'type', net: 'mainnet', src: "on chain: lock of the Pool Cell whose type = pool_type_code_hash 0xc70a8b00…3c98 (UTXOSwap docs, mainnet)" },
    { code_hash: '0x30e2c8a0cc9c27b2b2125ecf3aabe74acd692fe2b6635bcee02dab6973fbb593', hash_type: 'type', net: 'testnet', src: "on chain: lock of the Pool Cell whose type = pool_type_code_hash 0x5b9228b1…8735 (UTXOSwap docs, testnet)" }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['args length', (R.hexToBytes(g.script.args).length) + ' B'], ['witness.lock', w && w.args && w.args.lock ? R.hexToBytes(w.args.lock).length + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

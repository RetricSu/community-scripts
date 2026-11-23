// ccBTC Asset — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: UTXOSwap docs (utxoswap.gitbook.io/zh, pools API example: BTC xudt typeHash 0x3cd44aec…fa57 → codeHash 0x092c…5ae3); confirmed on chain
(function (R) {
  R.register({ id: 'ccbtc_asset', kind: 'type', name: {"zh":"ccBTC Asset","en":"ccBTC Asset"}, noSource: true, match: [
    { code_hash: '0x092c2c4a26ea475a8e860c29cf00502103add677705e2ccd8d6fe5af3caa5ae3', hash_type: 'type', net: 'mainnet', src: "UTXOSwap docs (utxoswap.gitbook.io/zh, pools API example: BTC xudt typeHash 0x3cd44aec…fa57 → codeHash 0x092c…5ae3); confirmed on chain" }],
    parse(g, ctx) { return { fields: [['args', g.script.args], ...g.inputs.map(i => [`in[${i}] data`, R.hexToBytes(ctx.inputs[i].data || '0x').length + ' B']), ...g.outputs.map(j => [`out[${j}] data`, R.hexToBytes(ctx.tx.outputs_data[j] || '0x').length + ' B'])] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

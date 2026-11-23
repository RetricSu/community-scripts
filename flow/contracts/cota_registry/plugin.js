// CoTA Registry (deprecated) — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74
(function (R) {
  R.register({ id: 'cota_registry', kind: 'type', name: {"zh":"CoTA Registry（已废弃）","en":"CoTA Registry (deprecated)"}, noSource: true, match: [
    { code_hash: '0x90ca618be6c15f5857d3cbd09f9f24ca6770af047ba9ee70989ec3b229419ac7', hash_type: 'type', net: 'mainnet', src: "nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74" },
    { code_hash: '0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075', hash_type: 'type', net: 'testnet', src: "nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74" }],
    parse(g, ctx) { return { fields: [['args', g.script.args], ...g.inputs.map(i => [`in[${i}] data`, R.hexToBytes(ctx.inputs[i].data || '0x').length + ' B']), ...g.outputs.map(j => [`out[${j}] data`, R.hexToBytes(ctx.tx.outputs_data[j] || '0x').length + ' B'])] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

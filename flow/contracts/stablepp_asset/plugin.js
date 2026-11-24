// Stable++ Asset — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74
(function (R) {
  R.register({ id: 'stablepp_asset', kind: 'type', name: {"zh":"Stable++ Asset","en":"Stable++ Asset"}, noSource: true, match: [
    { code_hash: '0x26a33e0815888a4a0614a0b7d09fa951e0993ff21e55905510104a0b1312032b', hash_type: 'type', net: 'mainnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74" }],
    parse(g, ctx) { return { fields: [['args', g.script.args], ...g.inputs.map(i => [`in[${i}] data`, R.hexToBytes(ctx.inputs[i].data || '0x').length + ' B']), ...g.outputs.map(j => [`out[${j}] data`, R.hexToBytes(ctx.tx.outputs_data[j] || '0x').length + ' B'])] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

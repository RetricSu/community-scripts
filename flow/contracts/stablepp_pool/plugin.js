// Stable++ Pool — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74
(function (R) {
  R.register({ id: 'stablepp_pool', kind: 'type', name: {"zh":"Stable++ Pool","en":"Stable++ Pool"}, noSource: true, match: [
    { code_hash: '0x26622198b66240e437e323e0fecf1c26ba3c8c28a45f03ed3ebb9f7f2bdc0055', hash_type: 'type', net: 'mainnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74" }],
    parse(g, ctx) { return { fields: [['args', g.script.args], ...g.inputs.map(i => [`in[${i}] data`, R.hexToBytes(ctx.inputs[i].data || '0x').length + ' B']), ...g.outputs.map(j => [`out[${j}] data`, R.hexToBytes(ctx.tx.outputs_data[j] || '0x').length + ' B'])] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

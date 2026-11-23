// Stable++ Intent Lock — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74
(function (R) {
  R.register({ id: 'stablepp_intent_lock', kind: 'lock', name: {"zh":"Stable++ Intent Lock","en":"Stable++ Intent Lock"}, noSource: true, match: [
    { code_hash: '0x56fb632a13abdad7308d2e034baae1cb049e8e8ff23cc7c0b69449f617549733', hash_type: 'type', net: 'mainnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74" }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['args length', (R.hexToBytes(g.script.args).length) + ' B'], ['witness.lock', w && w.args && w.args.lock ? R.hexToBytes(w.args.lock).length + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

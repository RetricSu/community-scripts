// Stable++ Vault Lock — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06) (named "Stable++ Vault Lock") | nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74 (named "Stable++ Vault Lock")
(function (R) {
  R.register({ id: 'stablepp_vault_lock', kind: 'lock', name: {"zh":"Stable++ Vault Lock","en":"Stable++ Vault Lock"}, noSource: true, match: [
    { code_hash: '0xff352022029a6ecf03e8a838b979a46e1231f05f9a3df9b4198f7eeb4afc2e67', hash_type: 'type', net: 'mainnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06) (named \"Stable++ Vault Lock\")" },
    { code_hash: '0x4ed68fcb7eaa4ff78d46a2fad88a32ce9caffd4b96a0a4bba96ff4871f018675', hash_type: 'type', net: 'mainnet', src: "nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74 (named \"Stable++ Vault Lock\")" }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['args length', (R.hexToBytes(g.script.args).length) + ' B'], ['witness.lock', w && w.args && w.args.lock ? R.hexToBytes(w.args.lock).length + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

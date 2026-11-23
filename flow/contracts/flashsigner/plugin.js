// FlashSigner lock — NO PUBLIC SOURCE FOUND (unconfirmed with maintainer). Match-only: identifies the script, performs no rule checks.
// Constants: CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2 (tag flashsigner)
(function (R) {
  R.register({ id: 'flashsigner', kind: 'lock', name: {"zh":"FlashSigner lock","en":"FlashSigner lock"}, noSource: true, match: [
    { code_hash: '0x081dbffa88dab54ba426d231ca64eb760cea2fe9e16761a1da400da1b2cbe128', hash_type: 'type', net: 'mainnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2 (tag flashsigner)" },
    { code_hash: '0x577a5e5930e2ecdd6200765f3442e6119dc99e87df474f22f13cab819c80b242', hash_type: 'type', net: 'testnet', src: "CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2 (tag flashsigner)" }],
    parse(g, ctx) { const w = ctx.witnesses[g.witnessIndex]; return { fields: [['args', g.script.args], ['args length', (R.hexToBytes(g.script.args).length) + ' B'], ['witness.lock', w && w.args && w.args.lock ? R.hexToBytes(w.args.lock).length + ' B' : 'None']] }; },
    check() { return [R.NOT_CHECKED('无公开源码（未向维护方确认）：只识别脚本，不检查规则', 'no public source (unconfirmed with maintainer): script identified only, rules not checked', null)]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

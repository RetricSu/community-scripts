// cells account-lock — LusoCryptoLabs/cells-contracts contracts/account-lock/src/main.rs @6d29dab (always returns 0)
// code_hash: cellula-sdk@0.2.1 dist/deployments.js (official SDK) + docs/TRUST.md (mainnet)
(function (R) {
  R.register({ id: 'cells_account_lock', kind: 'lock', name: { zh: 'Cells 名字 lock（account-lock）', en: 'Cells name lock (account-lock)' },
    match: [
      { code_hash: '0x9f0f0ba142b58cba2fe047546cfd8481d5b1769437cd3533e6458b21b61871ab', hash_type: 'type', net: 'mainnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.lock; cells-contracts docs/TRUST.md' },
      { code_hash: '0xede6a3d80717c3d7927eea678d095abbe68dbb08ca6fdbbbdd9de906455a4afd', hash_type: 'type', net: 'testnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.lock' }],
    parse(g) { return { fields: [['args', g.script.args || '0x']] }; },
    check(g, ctx) {
      const t = g.inputs.filter(i => ctx.inputs[i].output.type).length;
      return [R.check(true, 'program_entry 恒返回 0（任何人可解锁）', 'program_entry always returns 0 (anyone can unlock)', 0),
        R.check(true, `${t}/${g.inputs.length} 个输入带 type（应为 account-cell-type，由它守护）`, `${t}/${g.inputs.length} inputs carry a type (should be account-cell-type, the real guard)`, '—')];
    } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

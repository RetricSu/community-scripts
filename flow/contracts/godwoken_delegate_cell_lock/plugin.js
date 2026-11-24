// Godwoken delegate-cell-lock — godwokenrises/godwoken gwos/contracts/delegate-cell-lock/src/entry.rs + error.rs @c2b1f85
// No official deployment found (not in godwoken-info scripts-deploy-result.json; the v1 rollup cells use the omni_lock deployment). match is empty: static page only.
(function (R) {
  R.register({ id: 'godwoken_delegate_cell_lock', kind: 'lock', name: { zh: 'Godwoken 委托 cell lock（delegate-cell-lock）', en: 'Godwoken delegate-cell lock' }, match: [],
    parse(g) { return { fields: [['args (delegate cell type hash)', g.script.args]] }; },
    check(g, ctx) { const a = R.hexToBytes(g.script.args || '0x'); const c = [R.check(a.length === 32, 'args = 32 字节 delegate-cell type hash', 'args = 32-byte delegate-cell type hash', 5)];
      const w = ctx.witnesses[g.inputs[0]]; c.push(R.check(!(w && w.args && w.args.lock), 'witnesses[0].lock 为空', 'witnesses[0].lock is empty', 9));
      c.push(R.NOT_CHECKED('cell_deps 中 type hash = args 的 cell，data = 20B blake160(lock)，且有输入 lock hash[0..20] 与之相等', 'a cell_dep with type hash = args whose data is a 20B lock-hash prefix, and an input whose lock hash[0..20] equals it', '6 / 7 / 8')); return c; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

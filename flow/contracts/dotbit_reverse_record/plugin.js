// DOTBIT_REVERSE_RECORD — .bit ReverseRecordCell type; dotbitHQ/did-contracts contracts/reverse-record-cell-type/src/entry.rs
// Also exposes R.dotbit.action(ctx): the action name from the .bit "das" ActionData witness (witness-parser, das-types).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const u32 = (b, o) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24) >>> 0;
  // "das" (0x646173) ‖ u32 LE DataType (0 = ActionData) ‖ molecule table ActionData { action: Bytes, params: Bytes }
  function action(ctx) {
    for (let i = 0; i < ctx.tx.witnesses.length; i++) {
      const w = H(ctx.tx.witnesses[i] || '0x');
      if (w.length < 7 || w[0] !== 0x64 || w[1] !== 0x61 || w[2] !== 0x73 || u32(w, 3) !== 0) continue;
      try {
        const t = w.subarray(7), o0 = u32(t, 4), o1 = u32(t, 8), n = u32(t, o0);
        const s = new TextDecoder().decode(t.subarray(o0 + 4, o0 + 4 + n)), pn = u32(t, o1);
        return { index: i, name: s, params: X(t.subarray(o1 + 4, o1 + 4 + pn)) };
      } catch (e) { return { index: i, error: e.message }; }
    }
    return null;
  }
  R.dotbit = Object.assign(R.dotbit || {}, { action });
  const same = (a, b) => a && b && a.code_hash === b.code_hash && a.hash_type === b.hash_type && a.args === b.args;
  function parse(g, ctx) {
    const p = { act: action(ctx), ins: [], outs: [] };
    ctx.inputs.forEach((x, i) => { if (x.output && same(x.output.type, g.script)) p.ins.push(i); });
    ctx.tx.outputs.forEach((o, i) => { if (same(o.type, g.script)) p.outs.push(i); });
    p.fields = [['action', p.act ? (p.act.name || p.act.error) : '—'], [{ zh: '本类型输入', en: 'inputs of this type' }, p.ins.join(', ') || '—'], [{ zh: '本类型输出', en: 'outputs of this type' }, p.outs.join(', ') || '—']];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!(p.act && p.act.name), '能读出 das ActionData witness', 'the das ActionData witness can be read', 46),
      R.NOT_CHECKED('系统开关 ConfigCellMain.status ≠ off（配置在 cell_deps）', 'system switch ConfigCellMain.status ≠ off (config lives in cell_deps)', -1)];
    if (!p.act || !p.act.name) return c;
    if (/^(re)?declare_reverse_record$/.test(p.act.name)) { c.push(R.NOT_CHECKED(`${p.act.name}：当前源码只支持 retract_reverse_record（其他返回 27）；该动作由更早部署的二进制处理，其规则不在所读源码中`, `${p.act.name}: the current source only supports retract_reverse_record (others return 27); this action was handled by an earlier deployed binary whose rules are not in the source read`, 27)); return c; }
    c.push(R.check(p.act.name === 'retract_reverse_record', `action = retract_reverse_record（当前 ${p.act.name}）`, `action = retract_reverse_record (got ${p.act.name})`, 27));
    if (p.act.name !== 'retract_reverse_record') return c;
    c.push(R.check(p.ins.length > 0, '输入中至少 1 个 ReverseRecordCell', 'at least 1 ReverseRecordCell in inputs', 6));
    c.push(R.check(p.outs.length === 0, '输出中没有 ReverseRecordCell', 'no ReverseRecordCell in outputs', 6));
    if (!p.ins.length) return c;
    const contiguous = p.ins.every((v, k) => v === k) && p.ins.length === ctx.inputs.length;
    c.push(R.check(contiguous, 'ReverseRecordCell 从输入 #0 起连续，且之后没有其他输入', 'ReverseRecordCells start at input #0, are contiguous, and no other input follows', 6));
    const l0 = ctx.inputs[p.ins[0]].output.lock;
    c.push(R.check(p.ins.every(i => same(ctx.inputs[i].output.lock, l0)), '所有 ReverseRecordCell 的 lock 相同', 'all ReverseRecordCells share one lock', 6));
    const total = p.ins.reduce((s, i) => s + BigInt(ctx.inputs[i].output.capacity), 0n);
    c.push(R.NOT_CHECKED(`退款：输出中 lock = 该 lock 的 BalanceCell 容量 ≥ ${total} − common_fee（BalanceCell type id 与 common_fee 来自配置）`, `refund: outputs that are BalanceCells with this lock hold ≥ ${total} − common_fee (BalanceCell type id and common_fee come from config)`, 34));
    return c;
  }
  R.register({ id: 'dotbit_reverse_record', kind: 'type', name: '.bit ReverseRecordCell Type', match: [
    { code_hash: '0xebc9e13658f6df13593cf59b7e9cd159602b6c3c7d54b14dea43bae600ebae11', hash_type: 'type', net: 'mainnet', src: 'dotbitHQ/das-lib core/env.go EnvMainNet ReverseRecordCellType type-id args 0x000f3e1a…; code hash = Type ID script hash; live code cell 0x302a1db6…:0' },
    { code_hash: '0x61711416468fa5211ead5f24c6f3efadfbbc332274c5d40e50c6feadcb5f9606', hash_type: 'type', net: 'testnet', src: 'das-lib core/env.go EnvTestnet2 ReverseRecordCellType type-id args 0x334d7841…' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

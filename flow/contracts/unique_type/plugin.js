// UNIQUE_TYPE — utxostack/unique-cell contracts/unique-type/src/entry.rs (uses R.typeId from type_id)
// @requires type_id
(function (R) {
  const same = (a, b) => !!a && !!b && a.code_hash === b.code_hash && a.hash_type === b.hash_type && a.args === b.args;
  function parse(g, ctx) {
    const outs = ctx.tx.outputs.map((o, i) => same(o.type, g.script) ? i : -1).filter(i => i >= 0);
    const full = outs.length ? R.typeId(ctx, outs[0]) : null;
    const p = { argsLen: R.hexToBytes(g.script.args).length, first: outs.length ? outs[0] : -1, expected: full ? full.slice(0, 42) : null };
    p.fields = [['unique_id (args, 20B)', g.script.args]];
    if (p.expected) p.fields.push([{ zh: '期望 args = blake2b(inputs[0] ‖ 首个输出序号 u64 LE)[0..20]', en: 'expected args = blake2b(inputs[0] ‖ first output index u64 LE)[0..20]' }, p.expected]);
    return p;
  }
  function check(g, ctx, p) {
    return [
      R.check(g.outputs.length <= 1, `group 输出 ${g.outputs.length} ≤ 1`, `group outputs ${g.outputs.length} ≤ 1`, 8),
      R.check(p.first >= 0, '输出中存在该 type', 'the type appears in outputs', 4),
      R.check(p.argsLen === 20 && p.expected === g.script.args, 'args = blake2b(第一个 CellInput ‖ 首个输出序号)[0..20]', 'args = blake2b(first CellInput ‖ first output index)[0..20]', 6),
      R.check(g.inputs.length === 0, '输入中不得出现 unique cell（不可更新/销毁）', 'no unique cell in inputs (cannot be updated or destroyed)', 7)];
  }
  R.register({ id: 'unique_type', kind: 'type', name: 'Unique Cell', match: [
    { code_hash: '0x2c8c11c985da60b0a330c61a85507416d6382c130ba67f0c47ab071e00aec628', hash_type: 'data1', src: 'utxostack/unique-cell (mainnet)' },
    { code_hash: '0x8e341bcfec6393dcd41e635733ff2dca00a6af546949f70c57a706c0f344df8b', hash_type: 'type', src: 'utxostack/unique-cell (testnet)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

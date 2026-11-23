// TYPE_ID — built-in (also exposes R.typeId(ctx, outputIndex)) system script, nervosnetwork/ckb script/src/type_id.rs
(function (R) {
  const H = R.hexToBytes;
  const u64le = n => { const b = new Uint8Array(8); let v = BigInt(n); for (let i = 0; i < 8; i++) { b[i] = Number(v & 0xffn); v >>= 8n; } return b; };
  const u32le = n => u64le(n).subarray(0, 4);
  const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
  // CellInput { since: u64, previous_output: OutPoint { tx_hash: Byte32, index: u32 } } (struct, 44 bytes)
  const cellInput = i => cat(u64le(i.since), H(i.previous_output.tx_hash), u32le(parseInt(i.previous_output.index, 16)));
  R.typeId = (ctx, outIndex) => ctx.tx.inputs.length ? R.ckbHash(cat(cellInput(ctx.tx.inputs[0]), u64le(outIndex))) : null;
  function parse(g, ctx) {
    const p = { argsLen: H(g.script.args).length, creating: g.inputs.length === 0 };
    if (p.creating && g.outputs.length && ctx.tx.inputs.length) p.expected = R.ckbHash(cat(cellInput(ctx.tx.inputs[0]), u64le(g.outputs[0])));
    p.fields = [['type_id (args)', g.script.args], [{ zh: '操作', en: 'operation' },
      p.creating ? { zh: '创建', en: 'create' } : g.outputs.length ? { zh: '更新（1 进 1 出）', en: 'update (1 in, 1 out)' } : { zh: '销毁', en: 'destroy' }]];
    if (p.expected) p.fields.push([{ zh: '期望 args = blake2b(inputs[0] ‖ 输出序号 u64 LE)', en: 'expected args = blake2b(inputs[0] ‖ output index u64 LE)' }, p.expected]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 32, 'args 恰为 32 字节', 'args is exactly 32 bytes', -1),
      R.check(g.inputs.length <= 1 && g.outputs.length <= 1, `group 输入 ${g.inputs.length} ≤ 1 且输出 ${g.outputs.length} ≤ 1`, `group inputs ${g.inputs.length} ≤ 1 and outputs ${g.outputs.length} ≤ 1`, -2)];
    if (p.creating) c.push(R.check(!!p.expected && p.expected === g.script.args, '创建：args = blake2b(第一个 CellInput ‖ 第一个 group 输出序号)', 'create: args = blake2b(first CellInput ‖ first group output index)', -3));
    return c;
  }
  R.register({ id: 'type_id', kind: 'type', name: 'Type ID', match: [
    { code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944', hash_type: 'type', src: 'ckb script/src/type_id.rs (built-in, both networks)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// MNFT_ISSUER — nervina-labs/ckb-nft-scripts @b5af002 (Lina deployment commit) contracts/issuer-type/src/entry.rs + contracts/script-utils/src/{issuer,helper,error}.rs
// Also exposes R.mnft (data parsers + the shared "group input witness" rule) for mnft_class / mnft_nft.
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0, be16 = (b, o) => (b[o] << 8) | b[o + 1];
  const ser = s => X(R.serializeScript(s));
  // issuer data: version u8 ‖ class_count u32 BE ‖ set_count u32 BE ‖ info <u16 BE len> ‖ …
  function issuer(hex) { const d = H(hex || '0x'); if (d.length < 11) return { err: 5 }; if (d[0] !== 0) return { err: 11 };
    const info = be16(d, 9) + 2; if (d.length < info + 9) return { err: 5 }; return { class_count: be32(d, 1), set_count: be32(d, 5) }; }
  // class data: version ‖ total u32 ‖ issued u32 ‖ configure u8 ‖ name ‖ description ‖ renderer (each <u16 len>) ‖ [extinfo]
  function klass(hex) { const d = H(hex || '0x'); if (d.length < 16) return { err: 12 }; if (d[0] !== 0) return { err: 11 };
    const total = be32(d, 1), issued = be32(d, 5); if (total > 0 && issued > total) return { err: 13 };
    const nl = be16(d, 10) + 2; if (d.length < 10 + nl + 2) return { err: 12 }; const di = 10 + nl, dl = be16(d, di) + 2;
    if (d.length < di + dl + 2) return { err: 12 }; const ri = di + dl, rl = be16(d, ri) + 2; if (d.length < ri + rl) return { err: 12 };
    const txt = (o, l) => { try { return new TextDecoder('utf-8', { fatal: true }).decode(d.subarray(o + 2, o + l)); } catch (e) { return X(d.subarray(o + 2, o + l)); } };
    return { total, issued, configure: d[9], name: X(d.subarray(10, 10 + nl)), description: X(d.subarray(di, di + dl)), nameText: txt(10, nl) }; }
  // NFT data: version ‖ characteristic [8] ‖ configure u8 ‖ state u8 ‖ [extinfo]
  function nft(hex) { const d = H(hex || '0x'); if (d.length < 11) return { err: 19 }; if (d[0] !== 0) return { err: 11 };
    return { characteristic: X(d.subarray(1, 9)), configure: d[9], state: d[10], ext: X(d.subarray(11)), len: d.length, claimed: !!(d[10] & 1), locked: !!(d[10] & 2) }; }
  // helper.rs check_group_input_witness_is_none_with_type: first input with this exact type → its lock → first input with that lock → WitnessArgs.lock must be Some
  function witnessNone(ctx, script) {
    const s = ser(script), i = ctx.inputs.findIndex(x => x.output && x.output.type && ser(x.output.type) === s); if (i < 0) return { none: true, idx: null };
    const l = ser(ctx.inputs[i].output.lock), j = ctx.inputs.findIndex(x => x.output && ser(x.output.lock) === l), w = ctx.tx.witnesses[j];
    if (w == null) return { none: true, idx: j }; try { return { none: R.parseWitnessArgs(w).lock == null, idx: j }; } catch (e) { return { none: true, idx: j }; } }
  const wCheck = (ctx, g) => { const r = witnessNone(ctx, g.script); return R.check(!r.none, `首个此 type 输入的 lock 对应的 witness[${r.idx}] 有 WitnessArgs.lock（禁用 ACP 类无签名 lock）`, `the witness[${r.idx}] of the first input sharing that input's lock has WitnessArgs.lock (disables signature-less locks such as ACP)`, 40); };
  const err = (code, zh, en) => R.check(false, zh, en, code);
  const dataCheck = (r, what) => r.err ? err(r.err, `${what} data 解析失败`, `${what} data failed to parse`) : R.check(true, `${what} data 格式正确（version = 0）`, `${what} data well-formed (version = 0)`, '5/11/12/13/19');
  R.mnft = { be32, ser, issuer, klass, nft, witnessNone, wCheck, dataCheck };
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length, op: !g.inputs.length ? 'create' : !g.outputs.length ? 'destroy' : 'update', nIn: g.inputs.length, nOut: g.outputs.length };
    if (g.outputs.length) p.out = issuer(ctx.tx.outputs_data[g.outputs[0]]);
    if (g.inputs.length) p.in = issuer(ctx.inputs[g.inputs[0]].data);
    if (p.op === 'create' && g.outputs.length) { const t = R.typeId(ctx, g.outputs[0]); p.expected = t ? t.slice(0, 42) : null; }
    p.fields = [['issuer id (args)', g.script.args], [{ zh: '操作', en: 'operation' }, { create: { zh: '创建', en: 'create' }, update: { zh: '更新', en: 'update' }, destroy: { zh: '销毁', en: 'destroy' } }[p.op]]];
    if (p.expected) p.fields.push([{ zh: '期望 args', en: 'expected args' }, p.expected]);
    for (const k of ['in', 'out']) if (p[k] && !p[k].err) p.fields.push([`${k}.class_count / set_count`, `${p[k].class_count} / ${p[k].set_count}`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 20, `args ${p.argsLen} = 20 字节`, `args ${p.argsLen} = 20 bytes`, 7)];
    c.push(R.check((p.nIn === 0 && p.nOut === 1) || (p.nIn === 1 && p.nOut <= 1), `issuer cell 数量（输入 ${p.nIn}，输出 ${p.nOut}）为 0→1、1→1 或 1→0`, `issuer cell count (in ${p.nIn}, out ${p.nOut}) is 0→1, 1→1 or 1→0`, 6));
    if (p.op === 'create') {
      c.push(R.check(!!p.expected && p.expected === g.script.args, '创建：args = blake2b(第一个 CellInput ‖ 首个此 type 输出序号)[0..20]', 'create: args = blake2b(first CellInput ‖ first output index with this type)[0..20]', 7), dataCheck(p.out, 'issuer'));
      if (!p.out.err) c.push(R.check(p.out.class_count === 0, '创建：class_count = 0', 'create: class_count = 0', 8), R.check(p.out.set_count === 0, '创建：set_count = 0', 'create: set_count = 0', 9));
    } else if (p.op === 'update') {
      c.push(wCheck(ctx, g), dataCheck(p.in, 'in'), dataCheck(p.out, 'out'));
      if (!p.in.err && !p.out.err) c.push(R.check(p.out.set_count >= p.in.set_count, `set_count 不减（${p.in.set_count} → ${p.out.set_count}）`, `set_count does not decrease (${p.in.set_count} → ${p.out.set_count})`, 9),
        R.check(p.out.class_count >= p.in.class_count, `class_count 不减（${p.in.class_count} → ${p.out.class_count}）`, `class_count does not decrease (${p.in.class_count} → ${p.out.class_count})`, 8));
    } else {
      c.push(wCheck(ctx, g), dataCheck(p.in, 'in'));
      if (!p.in.err) c.push(R.check(p.in.class_count === 0 && p.in.set_count === 0, '销毁：class_count = set_count = 0', 'destroy: class_count = set_count = 0', 10));
    }
    return c;
  }
  R.register({ id: 'mnft_issuer', kind: 'type', name: 'M-NFT Issuer', match: [
    { code_hash: '0x24b04faf80ded836efc05247778eec4ec02548dab6e2012c0107374aa3f68b81', hash_type: 'type', net: 'mainnet', src: 'ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:0)' },
    { code_hash: '0xb59879b6ea6fff985223117fa499ce84f8cfb028c4ffdfdf5d3ec19e905a11ed', hash_type: 'type', net: 'testnet', src: 'ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:0)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

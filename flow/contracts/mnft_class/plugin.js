// MNFT_CLASS — nervina-labs/ckb-nft-scripts @b5af002 contracts/class-type/src/entry.rs + contracts/script-utils/src/{class,issuer,helper}.rs (uses R.mnft from mnft_issuer)
// @requires mnft_issuer
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, M = R.mnft;
  const sameClass = (s, me) => s && s.code_hash === me.code_hash && s.hash_type === me.hash_type && H(s.args).length === 24 && s.args.slice(0, 42) === me.args.slice(0, 42);
  function parse(g, ctx) {
    const me = g.script, a = H(me.args), id = me.args.slice(0, 42), p = { argsLen: a.length };
    p.cin = ctx.inputs.filter(x => x.output && sameClass(x.output.type, me)).length;
    p.cout = ctx.tx.outputs.filter(o => sameClass(o.type, me)).length;
    p.op = p.cin === 0 ? 'create' : p.cout === 0 ? 'destroy' : p.cin === p.cout ? 'update' : 'bad';
    if (g.outputs.length) p.out = M.klass(ctx.tx.outputs_data[g.outputs[0]]);
    if (g.inputs.length) p.in = M.klass(ctx.inputs[g.inputs[0]].data);
    if (p.op === 'create') {
      const isIss = s => s && R.scriptHash(s).slice(0, 42) === id;
      p.issIn = ctx.inputs.filter(x => x.output && isIss(x.output.type)).length;
      const ii = ctx.inputs.findIndex(x => x.output && isIss(x.output.type)), oi = ctx.tx.outputs.findIndex(o => isIss(o.type));
      p.issuerIn = ii < 0 ? { err: 5 } : M.issuer(ctx.inputs[ii].data); p.issuerOut = oi < 0 ? { err: 5 } : M.issuer(ctx.tx.outputs_data[oi]);
      p.ids = ctx.tx.outputs.filter(o => sameClass(o.type, me)).map(o => M.be32(H(o.type.args), 20));
    }
    p.fields = [['issuer id (args[0..20])', id], ['class id (args[20..24], u32 BE)', a.length >= 24 ? String(M.be32(a, 20)) : '—'],
      [{ zh: '操作', en: 'operation' }, { create: { zh: '创建', en: 'create' }, update: { zh: '更新', en: 'update' }, destroy: { zh: '销毁', en: 'destroy' }, bad: { zh: '数量不符', en: 'count mismatch' } }[p.op]]];
    for (const k of ['in', 'out']) if (p[k] && !p[k].err) p.fields.push([`${k}.name`, p[k].nameText], [`${k}.total / issued / configure`, `${p[k].total} / ${p[k].issued} / 0x${p[k].configure.toString(16).padStart(2, '0')}`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 24, `args ${p.argsLen} = 24 字节`, `args ${p.argsLen} = 24 bytes`, 7),
      R.check(p.op !== 'bad', `同一 issuer 的 class cell 数：输入 ${p.cin}，输出 ${p.cout}（输入 0 = 创建，输出 0 = 销毁，否则须相等）`, `class cells of this issuer: in ${p.cin}, out ${p.cout} (in 0 = create, out 0 = destroy, else must be equal)`, 14)];
    if (p.op === 'bad') return c;
    if (p.op === 'create') {
      c.push(M.dataCheck(p.out, 'class')); if (p.out.err) return c;
      c.push(R.check(p.out.issued === 0, '创建：issued = 0', 'create: issued = 0', 15),
        R.check(p.issIn === 1, `输入中 type hash[0..20] = issuer id 的 cell 恰 1 个（实际 ${p.issIn}）`, `exactly 1 input whose type hash[0..20] = issuer id (got ${p.issIn})`, 6),
        M.dataCheck(p.issuerIn, 'issuer in'), M.dataCheck(p.issuerOut, 'issuer out'));
      if (p.issuerIn.err || p.issuerOut.err) return c;
      const a = p.issuerIn.class_count, b = p.issuerOut.class_count, want = []; for (let i = a; i < b; i++) want.push(i);
      c.push(R.check(b > a, `issuer class_count 增加（${a} → ${b}）`, `issuer class_count increases (${a} → ${b})`, 8),
        R.check(p.ids.length === Math.max(0, b - a), `新 class 输出数 ${p.ids.length} = class_count 增量 ${b - a}`, `new class outputs ${p.ids.length} = class_count increase ${b - a}`, 14),
        R.check(JSON.stringify(p.ids) === JSON.stringify(want), `输出 class id [${p.ids}] = [${a}..${b})（按输出顺序）`, `output class ids [${p.ids}] = [${a}..${b}) (in output order)`, 18));
    } else if (p.op === 'update') {
      c.push(M.wCheck(ctx, g), M.dataCheck(p.in, 'in'), M.dataCheck(p.out, 'out'));
      if (!p.in.err && !p.out.err) c.push(R.check(p.out.issued >= p.in.issued, `issued 不减（${p.in.issued} → ${p.out.issued}）`, `issued does not decrease (${p.in.issued} → ${p.out.issued})`, 15),
        R.check(p.in.total === p.out.total && p.in.configure === p.out.configure && p.in.name === p.out.name && p.in.description === p.out.description, 'total / configure / name / description 不变', 'total / configure / name / description unchanged', 16));
    } else {
      c.push(M.wCheck(ctx, g), M.dataCheck(p.in, 'in'));
      if (!p.in.err) c.push(R.check(p.in.issued === 0, `销毁：issued = 0（实际 ${p.in.issued}）`, `destroy: issued = 0 (got ${p.in.issued})`, 17));
    }
    return c;
  }
  R.register({ id: 'mnft_class', kind: 'type', name: 'M-NFT Class', match: [
    { code_hash: '0xd51e6eaf48124c601f41abe173f1da550b4cbca9c6a166781906a287abbb3d9a', hash_type: 'type', net: 'mainnet', src: 'ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:1)' },
    { code_hash: '0x095b8c0b4e51a45f953acd1fcd1e39489f2675b4bc94e7af27bb38958790e3fc', hash_type: 'type', net: 'testnet', src: 'ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:1)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

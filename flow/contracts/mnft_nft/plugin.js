// MNFT_NFT — nervina-labs/ckb-nft-scripts @b5af002 contracts/nft-type/src/{entry,validator}.rs + contracts/script-utils/src/{nft,class,helper}.rs (uses R.mnft from mnft_issuer)
// @requires mnft_issuer
(function (R) {
  const H = R.hexToBytes, M = R.mnft;
  // helper.rs CLASS_TYPE_CODE_HASH is a build-time constant: Lina build = mainnet class type, Aggron build (d0a844d) = testnet class type
  const CLASS = { '0x2b24f0d644ccbdd77bbf86b27c8cca02efa0ad051e447c212636d9ee7acaaec9': '0xd51e6eaf48124c601f41abe173f1da550b4cbca9c6a166781906a287abbb3d9a',
    '0xb1837b5ad01a88558731953062d1f5cb547adf89ece01e8934a9f0aeed2d959f': '0x095b8c0b4e51a45f953acd1fcd1e39489f2675b4bc94e7af27bb38958790e3fc' };
  const sameNft = (s, me) => s && s.code_hash === me.code_hash && s.hash_type === me.hash_type && H(s.args).length === 28 && s.args.slice(0, 50) === me.args.slice(0, 50);
  function parse(g, ctx) {
    const me = g.script, a = H(me.args), p = { argsLen: a.length };
    p.classType = { code_hash: CLASS[me.code_hash], hash_type: 'type', args: me.args.slice(0, 50) }; const cs = M.ser(p.classType);
    const isClass = s => s && M.ser(s) === cs;
    p.nin = ctx.inputs.filter(x => x.output && sameNft(x.output.type, me)).length;
    p.nout = ctx.tx.outputs.filter(o => sameNft(o.type, me)).length;
    p.op = p.nin === 0 ? 'create' : p.nout === 0 ? 'destroy' : p.nin === p.nout ? 'update' : 'bad';
    if (g.outputs.length) p.out = M.nft(ctx.tx.outputs_data[g.outputs[0]]);
    if (g.inputs.length) p.in = M.nft(ctx.inputs[g.inputs[0]].data);
    if (p.op === 'create') {
      p.clsIn = ctx.inputs.filter(x => x.output && isClass(x.output.type)).length;
      const ii = ctx.inputs.findIndex(x => x.output && isClass(x.output.type)), oi = ctx.tx.outputs.findIndex(o => isClass(o.type));
      p.classIn = ii < 0 ? { err: 12 } : M.klass(ctx.inputs[ii].data); p.classOut = oi < 0 ? { err: 12 } : M.klass(ctx.tx.outputs_data[oi]);
      p.ids = ctx.tx.outputs.filter(o => sameNft(o.type, me)).map(o => M.be32(H(o.type.args), 24));
    }
    if (p.op === 'update') { p.lockIn = M.ser(ctx.inputs[g.inputs[0]].output.lock); p.lockOut = M.ser(ctx.tx.outputs[g.outputs[0]].lock); }
    p.fields = [['class (args[0..24])', me.args.slice(0, 50)], ['token id (args[24..28], u32 BE)', a.length >= 28 ? String(M.be32(a, 24)) : '—'],
      [{ zh: '操作', en: 'operation' }, { create: { zh: '铸造', en: 'mint' }, update: { zh: '更新 / 转移', en: 'update / transfer' }, destroy: { zh: '销毁', en: 'destroy' }, bad: { zh: '数量不符', en: 'count mismatch' } }[p.op]]];
    for (const k of ['in', 'out']) if (p[k] && !p[k].err) p.fields.push([`${k}.configure / state`, `0x${p[k].configure.toString(16).padStart(2, '0')} / ${p[k].claimed ? 'claimed' : 'unclaimed'}${p[k].locked ? ', locked' : ''}`], [`${k}.characteristic`, p[k].characteristic]);
    return p;
  }
  const allow = (n, bit) => !(n.configure & bit);
  // a rule skipped when cell_deps[0] approves (same lock as inputs[0] and issuer / class type): pass → true, fail → not checked
  const gated = (ok, zh, en, code) => ok ? R.check(true, zh, en, code) : R.NOT_CHECKED(zh + '——不满足，除非 cell_deps[0] 是同一 lock 的 issuer / class cell（解码器不读取 cell_deps）', en + ' — not met unless cell_deps[0] is the issuer / class cell under inputs[0]\'s lock (the decoder does not load cell_deps)', code);
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 28, `args ${p.argsLen} = 28 字节`, `args ${p.argsLen} = 28 bytes`, 7),
      R.check(p.op !== 'bad', `同一 class 的 NFT cell 数：输入 ${p.nin}，输出 ${p.nout}（输入 0 = 铸造，输出 0 = 销毁，否则须相等）`, `NFT cells of this class: in ${p.nin}, out ${p.nout} (in 0 = mint, out 0 = destroy, else must be equal)`, 20)];
    if (p.op === 'bad') return c;
    if (p.op === 'create') {
      c.push(R.check(p.clsIn === 1, `输入中该 class cell 恰 1 个（实际 ${p.clsIn}）`, `exactly 1 input with this class type (got ${p.clsIn})`, 14), M.dataCheck(p.classIn, 'class in'), M.dataCheck(p.classOut, 'class out'));
      if (p.classIn.err || p.classOut.err) return c;
      const a = p.classIn.issued, b = p.classOut.issued, want = []; for (let i = a; i < b; i++) want.push(i);
      c.push(R.check(b > a, `class issued 增加（${a} → ${b}）`, `class issued increases (${a} → ${b})`, 15), M.dataCheck(p.out, 'NFT'));
      if (p.out.err) return c;
      c.push(R.check(p.out.configure === p.classIn.configure, 'NFT configure = class configure', 'NFT configure = class configure', 22),
        R.check(p.ids.length === Math.max(0, b - a), `新 NFT 输出数 ${p.ids.length} = issued 增量 ${b - a}`, `new NFT outputs ${p.ids.length} = issued increase ${b - a}`, 20),
        R.check(JSON.stringify(p.ids) === JSON.stringify(want), `输出 token id [${p.ids.length > 8 ? p.ids.slice(0, 8) + ',…' : p.ids}] = [${a}..${b})（按输出顺序）`, `output token ids [${p.ids.length > 8 ? p.ids.slice(0, 8) + ',…' : p.ids}] = [${a}..${b}) (in output order)`, 21));
      return c;
    }
    c.push(M.wCheck(ctx, g));
    if (p.op === 'destroy') {
      c.push(M.dataCheck(p.in, 'in')); if (p.in.err) return c; const n = p.in;
      c.push(gated(!n.locked, '销毁：NFT 未锁定', 'destroy: NFT not locked', 38));
      c.push(n.claimed ? gated(allow(n, 0x80), '销毁（已 claim）：configure 允许 claim 后销毁', 'destroy (claimed): configure allows destroying after claim', 34) : gated(allow(n, 0x40), '销毁（未 claim）：configure 允许 claim 前销毁', 'destroy (unclaimed): configure allows destroying before claim', 33));
      return c;
    }
    c.push(M.dataCheck(p.in, 'in'), M.dataCheck(p.out, 'out')); if (p.in.err || p.out.err) return c;
    const I = p.in, O = p.out;
    if (I.characteristic !== O.characteristic) c.push(R.check(allow(I, 0x08), 'characteristic 改变：configure 允许', 'characteristic changed: allowed by configure', 23), R.check(!I.locked, 'characteristic 改变：NFT 未锁定', 'characteristic changed: NFT not locked', 39));
    c.push(R.check(I.configure === O.configure, 'configure 不变', 'configure unchanged', 24));
    if (!I.claimed && O.claimed) c.push(gated(!I.locked, 'claim：NFT 未锁定', 'claim: NFT not locked', 35), gated(allow(I, 0x01), 'claim：configure 允许 claim', 'claim: allowed by configure', 27));
    if (I.claimed && !O.claimed) c.push(gated(false, '不能从已 claim 变回未 claim', 'cannot go from claimed back to unclaimed', 25));
    if (!I.locked && O.locked) c.push(gated(allow(I, 0x02), 'lock：configure 允许锁定', 'lock: allowed by configure', 28));
    if (I.locked && !O.locked) c.push(gated(false, '不能从锁定变回未锁定', 'cannot go from locked back to unlocked', 26));
    if (p.lockIn !== p.lockOut) c.push(R.check(!I.locked, '转移：NFT 未锁定', 'transfer: NFT not locked', 36),
      I.claimed ? R.check(allow(I, 0x20), '转移（已 claim）：configure 允许', 'transfer (claimed): allowed by configure', 30) : R.check(allow(I, 0x10), '转移（未 claim）：configure 允许', 'transfer (unclaimed): allowed by configure', 29));
    const ie = I.ext, oe = O.ext;
    if (!(I.len === O.len && ie === oe)) {
      if (allow(I, 0x04)) c.push(R.check(I.len <= O.len, 'ext_info 只能追加（输出不短于输入）', 'ext_info may only be appended (output not shorter)', 31), R.check(oe.startsWith(ie), 'ext_info：原有内容保持为前缀', 'ext_info: existing bytes kept as a prefix', 32), R.check(!I.locked, 'ext_info 追加：NFT 未锁定', 'ext_info append: NFT not locked', 37));
      else c.push(R.check(I.len === O.len, 'configure 不允许 ext_info：数据长度不变（源码只比较长度）', 'ext_info not allowed by configure: data length unchanged (the source compares lengths only)', 31));
    }
    return c;
  }
  R.register({ id: 'mnft_nft', kind: 'type', name: 'M-NFT NFT', match: [
    { code_hash: '0x2b24f0d644ccbdd77bbf86b27c8cca02efa0ad051e447c212636d9ee7acaaec9', hash_type: 'type', net: 'mainnet', src: 'ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:2)' },
    { code_hash: '0xb1837b5ad01a88558731953062d1f5cb547adf89ece01e8934a9f0aeed2d959f', hash_type: 'type', net: 'testnet', src: 'ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:2)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

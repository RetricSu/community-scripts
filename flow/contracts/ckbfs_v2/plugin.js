// CKBFS_V2 — code-monad/ckbfs @db973a8 contracts/ckbfs/src/{entry,error}.rs + contracts/ckb-adler32/src/process.rs (mode 1); data = ckbfs-types 0.2.1 schemas/ckbfs.mol
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, u32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
  const utf8 = b => { try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return X(b); } };
  // adler crate: Adler32::from_checksum(c) → a = c & 0xffff, b = c >> 16; checksum = b << 16 | a
  const adler = (parts, recover) => { let a = recover == null ? 1 : recover & 0xffff, b = recover == null ? 0 : recover >>> 16;
    for (const p of parts) for (const x of p) { a = (a + x) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; };
  const hex32 = n => '0x' + n.toString(16).padStart(8, '0');
  const indexes = f => { if (f.length < 4) throw new Error('Indexes too short'); const n = u32(f, 0); if (f.length !== 4 + 4 * n) throw new Error('Indexes length mismatch'); return Array.from({ length: n }, (_, i) => u32(f, 4 + 4 * i)); };
  // table CKBFSData { indexes: Indexes, checksum: Uint32, content_type: Bytes, filename: Bytes, backlinks: BackLinkVec }
  // table BackLink { indexes: Indexes, checksum: Uint32, tx_hash: Byte32 }; vector BackLinkVec <BackLink> (dynvec)
  function dynvec(b) { if (b.length < 4) throw new Error('vec too short'); const t = u32(b, 0); if (t !== b.length) throw new Error('vec size mismatch'); if (t === 4) return [];
    const n = u32(b, 4) / 4 - 1, o = []; for (let i = 0; i < n; i++) o.push(u32(b, 4 + 4 * i)); o.push(t); return o.slice(0, n).map((x, i) => b.subarray(x, o[i + 1])); }
  function data(hex) {
    const f = R.parseTable(H(hex), 5);
    if (f[1].length !== 4) throw new Error('checksum must be 4 bytes');
    const bl = dynvec(f[4]).map(x => { const g = R.parseTable(x, 3); if (g[1].length !== 4 || g[2].length !== 32) throw new Error('bad BackLink'); return { indexes: indexes(g[0]), checksum: u32(g[1], 0), tx_hash: X(g[2]), raw: X(x) }; });
    return { indexes: indexes(f[0]), checksum: u32(f[1], 0), content_type: X(R.parseBytes(f[2])), filename: X(R.parseBytes(f[3])), backlinks: bl, blRaw: X(f[4]) };
  }
  // ckb-adler32 mode 1: content = witnesses[i][6..] for each i in indexes (Source::Output → tx.witnesses[i]); a missing / short witness panics
  function sum(ctx, idx, recover) { const parts = []; for (const i of idx) { const w = ctx.tx.witnesses[i]; if (w == null) return { err: `witness ${i} missing` }; const b = H(w); if (b.length < 6) return { err: `witness ${i} < 6 bytes` }; parts.push(b.subarray(6)); } return { v: adler(parts, recover), bytes: parts.reduce((s, x) => s + x.length, 0) }; }
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length, nOut: g.outputs.length, op: !g.inputs.length ? 'create' : !g.outputs.length ? 'destroy' : 'update' };
    const rd = (hex, k) => { try { p[k] = data(hex); } catch (e) { p[k + 'Err'] = e.message; } };
    if (g.outputs.length) rd(ctx.tx.outputs_data[g.outputs[0]], 'out');
    if (g.inputs.length) rd(ctx.inputs[g.inputs[0]].data, 'in');
    if (a.length >= 64) p.hasher = X(a.subarray(32, 64));
    if (p.op === 'create' && g.outputs.length) { p.expectedId = R.typeId(ctx, g.outputs[0]); p.typeId = X(a.subarray(0, 32)); }
    if (p.op === 'update') p.prevTx = ctx.tx.inputs[g.inputs[0]].previous_output.tx_hash;
    p.fields = [[{ zh: '操作', en: 'operation' }, { create: { zh: '创建', en: 'create' }, update: { zh: '更新（追加 / 转移）', en: 'update (append / transfer)' }, destroy: { zh: '销毁', en: 'destroy' } }[p.op]],
      ['type_id (args[0..32])', X(a.subarray(0, 32))], [{ zh: '校验器 code hash (args[32..64])', en: 'hasher code hash (args[32..64])' }, p.hasher || { zh: '（默认 ckb-adler32）', en: '(default ckb-adler32)' }]];
    for (const k of ['in', 'out']) if (p[k]) p.fields.push([`${k}.filename`, utf8(H(p[k].filename))], [`${k}.content_type`, utf8(H(p[k].content_type))],
      [`${k}.indexes`, JSON.stringify(p[k].indexes)], [`${k}.checksum`, hex32(p[k].checksum)], [`${k}.backlinks`, String(p[k].backlinks.length)]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.nOut <= 1, `group 输出 ${p.nOut} ≤ 1`, `group outputs ${p.nOut} ≤ 1`, 107)];
    if (p.op === 'destroy') { c.push(R.check(false, '禁止销毁 CKBFS cell', 'a CKBFS cell cannot be destroyed', 103)); return c; }
    c.push(R.check(p.argsLen >= 32, `args ${p.argsLen} ≥ 32 字节`, `args ${p.argsLen} ≥ 32 bytes`, -3));
    for (const k of p.op === 'create' ? ['out'] : ['in', 'out']) c.push(R.check(!!p[k], `${k} data 是合法的 CKBFSData（molecule）`, `${k} data is a valid CKBFSData (molecule)` + (p[k + 'Err'] ? ': ' + p[k + 'Err'] : ''), -4));
    const hasher = R.NOT_CHECKED('cell_deps 中有 data hash = 校验器 code hash 的 cell（解码器不读取 cell_deps 数据）', 'a cell_dep whose data hash = the hasher code hash (the decoder does not load cell_dep data)', 106);
    if (p.op === 'create') {
      c.push(R.check(!!p.expectedId && p.expectedId === p.typeId, '创建：args[0..32] = blake2b(第一个 CellInput ‖ 输出序号 u64)', 'create: args[0..32] = blake2b(first CellInput ‖ output index u64)', 102));
      if (!p.out) return c;
      c.push(R.check(p.out.indexes.length > 0, '创建：indexes 非空', 'create: indexes not empty', 101));
      c.push(R.check(p.out.backlinks.length === 0, '创建：backlinks 为空（源码中 backlinks 非空的分支比较 32 字节 code_hash 与整个序列化 Script，永远不相等 → 101）', 'create: backlinks empty (the non-empty-backlinks branch compares a 32-byte code_hash with the whole serialized Script, which never matches → 101)', 101));
      c.push(hasher);
      const s = sum(ctx, p.out.indexes, null);
      c.push(R.check(!s.err && s.v === p.out.checksum, `adler32(witnesses[indexes][6..]) = ${s.err || hex32(s.v)}，data.checksum = ${hex32(p.out.checksum)}`, `adler32(witnesses[indexes][6..]) = ${s.err || hex32(s.v)}, data.checksum = ${hex32(p.out.checksum)}`, s.err ? 'panic' : -101));
      return c;
    }
    if (!p.in || !p.out) return c;
    const I = p.in, O = p.out;
    c.push(R.check(I.content_type === O.content_type, 'content_type 不变', 'content_type unchanged', 105), R.check(I.filename === O.filename, 'filename 不变', 'filename unchanged', 105));
    if (!O.indexes.length) {
      c.push(R.check(I.checksum === O.checksum, '转移（输出 indexes 为空）：checksum 不变', 'transfer (output indexes empty): checksum unchanged', 105));
      if (!I.backlinks.length) c.push(R.check(O.backlinks.length === 1 && O.backlinks[0].tx_hash === p.prevTx, '转移：输入无 backlink → 输出恰有 1 个，且其 tx_hash = 该输入的 out_point.tx_hash', 'transfer: input has no backlink → output has exactly 1, whose tx_hash = the input out_point.tx_hash', 109));
      else c.push(R.check(I.blRaw === O.blRaw, '转移：backlinks 完全相同', 'transfer: backlinks identical', 105));
      return c;
    }
    if (I.indexes.length || I.backlinks.length > 1) {
      c.push(R.check(O.backlinks.length === I.backlinks.length + 1, `追加：输出 backlinks ${O.backlinks.length} = 输入 ${I.backlinks.length} + 1`, `append: output backlinks ${O.backlinks.length} = input ${I.backlinks.length} + 1`, 108));
      const last = O.backlinks[O.backlinks.length - 1];
      if (last) c.push(R.check(last.tx_hash === p.prevTx || JSON.stringify(last.indexes) === JSON.stringify(I.indexes), '追加：最后一个 backlink 的 tx_hash = 输入 out_point.tx_hash，或其 indexes = 输入 indexes（源码用 && 组合两个不等，只要一项相等即通过）', 'append: last backlink tx_hash = input out_point.tx_hash, or its indexes = input indexes (the source joins the two inequalities with &&, so either match passes)', 108));
    }
    c.push(R.check(I.backlinks.every((b, i) => O.backlinks[i] && O.backlinks[i].raw === b.raw), '追加：输入的 backlinks 原样保留为输出前缀', 'append: input backlinks kept unchanged as the output prefix', 108));
    c.push(hasher);
    const s = sum(ctx, O.indexes, I.checksum);
    c.push(R.check(!s.err && s.v === O.checksum, `从输入 checksum ${hex32(I.checksum)} 恢复后 adler32(witnesses[indexes][6..]) = ${s.err || hex32(s.v)}，输出 checksum = ${hex32(O.checksum)}`, `adler32 resumed from input checksum ${hex32(I.checksum)} over witnesses[indexes][6..] = ${s.err || hex32(s.v)}, output checksum = ${hex32(O.checksum)}`, s.err ? 'panic' : -101));
    return c;
  }
  R.register({ id: 'ckbfs_v2', kind: 'type', name: 'CKBFS V2', match: [
    { code_hash: '0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a', hash_type: 'data1', src: 'code-monad/ckbfs README "Version 20241025.db973a8e8032" (mainnet + testnet, data1)' },
    { code_hash: '0xfd2058c9a0c0183354cf637e25d2707ffa9bb6fa2ba9b29f4ebc6be3e54ad7eb', hash_type: 'type', net: 'mainnet', src: 'code-monad/ckbfs README (mainnet type id)' },
    { code_hash: '0x7c6dcab8268201f064dc8676b5eafa60ca2569e5c6209dcbab0eb64a9cb3aaa3', hash_type: 'type', net: 'testnet', src: 'code-monad/ckbfs README (testnet type id)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

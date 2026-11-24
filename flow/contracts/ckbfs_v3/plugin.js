// CKBFS_V3 — code-monad/ckbfs @4ee6689 (tag v3) contracts/ckbfs/src/{entry,error}.rs + contracts/ckb-adler32/src/process.rs (mode 3); data = ckbfs-types 0.3.0 schemas/ckbfs.mol
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, u32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
  const utf8 = b => { try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return X(b); } };
  const adler = (parts, recover) => { let a = recover == null ? 1 : recover & 0xffff, b = recover == null ? 0 : recover >>> 16;
    for (const p of parts) for (const x of p) { a = (a + x) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; };
  const hex32 = n => '0x' + n.toString(16).padStart(8, '0'), ZERO = '0x' + '00'.repeat(32);
  // table CKBFSData { index: Uint32, checksum: Uint32, content_type: Bytes, filename: Bytes }
  function data(hex) { const f = R.parseTable(H(hex), 4); if (f[0].length !== 4 || f[1].length !== 4) throw new Error('index / checksum must be 4 bytes');
    return { index: u32(f[0], 0), checksum: u32(f[1], 0), content_type: X(R.parseBytes(f[2])), filename: X(R.parseBytes(f[3])) }; }
  // Head witness: "CKBFS"(5) ‖ version(1) ‖ prev tx_hash(32) ‖ prev witness index u32 ‖ prev checksum u32 ‖ next index u32 ‖ content
  function head(ctx, i) { const w = ctx.tx.witnesses[i]; if (w == null) return { missing: true }; const b = H(w);
    if (b.length < 50) return { short: b.length, b };
    return { b, magic: X(b.subarray(0, 5)), version: b[5], prevTx: X(b.subarray(6, 38)), prevIdx: u32(b, 38), prevSum: u32(b, 42), next: u32(b, 46) }; }
  // ckb-adler32 mode 3: content = head[50..] ‖ w[next][4..] ‖ …; recover from head prev checksum when ≠ 0 (args[3] is ignored)
  function sum(ctx, h) { if (h.version !== 3) return { err: 'head witness version ≠ 0x03' }; const parts = [h.b.subarray(50)]; let n = h.next, k = 0;
    while (n) { if (++k > ctx.tx.witnesses.length) return { err: 'witness chain loops' }; const w = ctx.tx.witnesses[n]; if (w == null) return { err: `witness ${n} missing` };
      const b = H(w); if (b.length < 4) return { err: `witness ${n} < 4 bytes` }; parts.push(b.subarray(4)); n = u32(b, 0); }
    return { v: adler(parts, h.prevSum || null), n: parts.length }; }
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length, nOut: g.outputs.length, op: !g.inputs.length ? 'create' : !g.outputs.length ? 'destroy' : 'update' };
    const rd = (hex, k) => { try { p[k] = data(hex); } catch (e) { p[k + 'Err'] = e.message; } };
    if (g.outputs.length) rd(ctx.tx.outputs_data[g.outputs[0]], 'out');
    if (g.inputs.length) rd(ctx.inputs[g.inputs[0]].data, 'in');
    if (a.length >= 64) p.hasher = X(a.subarray(32, 64));
    if (p.op === 'create' && g.outputs.length) { p.expectedId = R.typeId(ctx, g.outputs[0]); p.typeId = X(a.subarray(0, 32)); }
    if (p.op === 'update') p.prevTx = ctx.tx.inputs[g.inputs[0]].previous_output.tx_hash;
    if (p.out) p.head = head(ctx, p.out.index);
    p.fields = [[{ zh: '操作', en: 'operation' }, { create: { zh: '创建', en: 'create' }, update: { zh: p.in && p.out && p.in.checksum === p.out.checksum ? '转移（checksum 不变）' : '追加', en: p.in && p.out && p.in.checksum === p.out.checksum ? 'transfer (checksum unchanged)' : 'append' }, destroy: { zh: '销毁', en: 'destroy' } }[p.op]],
      ['type_id (args[0..32])', X(a.subarray(0, 32))], [{ zh: '校验器 code hash (args[32..64])', en: 'hasher code hash (args[32..64])' }, p.hasher || { zh: '（默认 ckb-adler32）', en: '(default ckb-adler32)' }]];
    for (const k of ['in', 'out']) if (p[k]) p.fields.push([`${k}.filename`, utf8(H(p[k].filename))], [`${k}.content_type`, utf8(H(p[k].content_type))], [`${k}.index`, String(p[k].index)], [`${k}.checksum`, hex32(p[k].checksum)]);
    if (p.head && p.head.prevTx) p.fields.push([{ zh: 'head witness 上一位置', en: 'head witness previous position' }, `${p.head.prevTx}#${p.head.prevIdx}`], [{ zh: 'head witness 上一 checksum / next', en: 'head witness previous checksum / next' }, `${hex32(p.head.prevSum)} / ${p.head.next}`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.nOut <= 1, `group 输出 ${p.nOut} ≤ 1`, `group outputs ${p.nOut} ≤ 1`, 107)];
    if (p.op === 'destroy') { c.push(R.check(false, '禁止销毁 CKBFS cell', 'a CKBFS cell cannot be destroyed', 103)); return c; }
    c.push(R.check(p.argsLen >= 32, `args ${p.argsLen} ≥ 32 字节`, `args ${p.argsLen} ≥ 32 bytes`, -3));
    for (const k of p.op === 'create' ? ['out'] : ['in', 'out']) c.push(R.check(!!p[k], `${k} data 是合法的 CKBFSData v3（molecule）`, `${k} data is a valid CKBFSData v3 (molecule)` + (p[k + 'Err'] ? ': ' + p[k + 'Err'] : ''), -4));
    if (p.op === 'create') c.push(R.check(!!p.expectedId && p.expectedId === p.typeId, '创建：args[0..32] = blake2b(第一个 CellInput ‖ 输出序号 u64)', 'create: args[0..32] = blake2b(first CellInput ‖ output index u64)', 102));
    if (!p.out || (p.op === 'update' && !p.in)) return c;
    if (p.op === 'update') c.push(R.check(p.in.content_type === p.out.content_type, 'content_type 不变', 'content_type unchanged', 105), R.check(p.in.filename === p.out.filename, 'filename 不变', 'filename unchanged', 105));
    const h = p.head;
    c.push(R.check(!h.missing, `witnesses[${p.out.index}]（head witness）存在`, `witnesses[${p.out.index}] (head witness) exists`, -1));
    if (h.missing) return c;
    c.push(R.check(!h.short, `head witness ≥ 50 字节${h.short != null ? '（实际 ' + h.short + '）' : ''}`, `head witness ≥ 50 bytes${h.short != null ? ' (got ' + h.short + ')' : ''}`, -3));
    if (h.short != null) return c;
    if (p.op === 'create') c.push(R.check(h.prevTx === ZERO && h.prevIdx === 0, '创建：head witness 上一位置 = 32 字节 0 ‖ 0', 'create: head witness previous position = 32 zero bytes ‖ 0', 112));
    else c.push(R.check(h.prevTx === p.prevTx && h.prevIdx === p.in.index, `更新：head witness 上一位置 = 输入 out_point.tx_hash ‖ 输入 data.index (${p.in.index})`, `update: head witness previous position = input out_point.tx_hash ‖ input data.index (${p.in.index})`, 112));
    c.push(R.NOT_CHECKED('cell_deps 中有 data hash = 校验器 code hash 的 cell（解码器不读取 cell_deps 数据）', 'a cell_dep whose data hash = the hasher code hash (the decoder does not load cell_dep data)', 106));
    const s = sum(ctx, h);
    c.push(R.check(!s.err && s.v === p.out.checksum, `adler32（从 head 上一 checksum ${hex32(h.prevSum)} 恢复，0 表示从头）沿 witness 链 = ${s.err || hex32(s.v)}，输出 checksum = ${hex32(p.out.checksum)}`, `adler32 (resumed from head previous checksum ${hex32(h.prevSum)}, 0 = fresh) along the witness chain = ${s.err || hex32(s.v)}, output checksum = ${hex32(p.out.checksum)}`, -101));
    return c;
  }
  R.register({ id: 'ckbfs_v3', kind: 'type', name: 'CKBFS V3', match: [
    { code_hash: '0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695', hash_type: 'data1', src: 'CKB Explorer registry "CKBFS V3" code cell data hash (mainnet 0xd25f2c32…:1, testnet 0x1488b592…:0), data1' },
    { code_hash: '0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add', hash_type: 'type', net: 'mainnet', src: 'type hash of the mainnet V3 code cell 0xd25f2c32…:1' },
    { code_hash: '0xaebf5a7b541da9603c2066a9768d3d18fea2e7f3c1943821611545155fecc671', hash_type: 'type', net: 'testnet', src: 'CKB Explorer registry "CKBFS V3" (testnet type id) = type hash of 0x1488b592…:0' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// DID_CKB — web5fans/did-ckb contracts/did-ckb-ts/src/{entry,molecules,error}.rs (uses R.typeId from type_id)
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, utf8 = b => new TextDecoder().decode(b);
  // minimal CBOR well-formedness: returns end offset of one item, throws on malformed input
  function cbor(b, o) {
    if (o >= b.length) throw new Error('cbor eof'); const ib = b[o++], mt = ib >> 5, ai = ib & 31; let n;
    if (ai < 24) n = ai; else if (ai <= 27) { const k = 1 << (ai - 24); if (o + k > b.length) throw new Error('cbor eof'); n = 0; for (let i = 0; i < k; i++) n = n * 256 + b[o + i]; o += k; }
    else if (ai === 31 && mt >= 2 && mt <= 5) { while (b[o] !== 0xff) { o = cbor(b, o); if (mt === 5) o = cbor(b, o); } return o + 1; }
    else throw new Error('cbor bad additional info');
    if (mt === 2 || mt === 3) { if (o + n > b.length) throw new Error('cbor eof'); return o + n; }
    if (mt === 4) { for (let i = 0; i < n; i++) o = cbor(b, o); return o; }
    if (mt === 5) { for (let i = 0; i < 2 * n; i++) o = cbor(b, o); return o; }
    if (mt === 6) return cbor(b, o);
    return o;
  }
  const cborOk = d => { try { return cbor(d, 0) > 0; } catch (e) { return false; } };
  // DidCkbData = union { DidCkbDataV1 }: item_id u32 LE (0) ‖ table { document: Bytes, local_id: StringOpt }
  function data(hex) {
    const b = H(hex); if (b.length < 4 || (b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24) !== 0) throw new Error('union id ≠ 0 (DidCkbDataV1)');
    const f = R.parseTable(b.subarray(4), 2); if (f.length < 2) throw new Error('DidCkbDataV1 needs 2 fields');
    const doc = R.parseBytes(f[0]); return { doc, docOk: cborOk(doc), localId: f[1].length ? utf8(R.parseBytes(f[1])) : null };
  }
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length, op: g.inputs.length && g.outputs.length ? 'update' : g.outputs.length ? 'mint' : 'burn' };
    if (!g.inputs.length && g.outputs.length) { const t = R.typeId(ctx, g.outputs[0]); p.expected = t ? t.slice(0, 42) : null; p.got = X(a.subarray(0, 20)); }
    const rd = (hex, k) => { try { p[k] = data(hex); } catch (e) { p[k + 'Err'] = e.message; } };
    if (g.outputs.length) rd(ctx.tx.outputs_data[g.outputs[0]], 'out');
    if (g.inputs.length) rd(ctx.inputs[g.inputs[0]].data, 'in');
    p.fields = [['did id (args[0..20])', X(a.subarray(0, 20))], [{ zh: '操作', en: 'operation' }, { mint: { zh: '铸造', en: 'mint' }, update: { zh: '更新', en: 'update' }, burn: { zh: '销毁', en: 'burn' } }[p.op]]];
    if (p.expected) p.fields.push([{ zh: '期望 args[0..20]', en: 'expected args[0..20]' }, p.expected]);
    for (const k of ['in', 'out']) if (p[k]) p.fields.push([`${k}.local_id`, p[k].localId ?? '(none)'], [`${k}.document`, `${p[k].doc.length} B CBOR`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen >= 20 && g.inputs.length <= 1 && g.outputs.length <= 1, 'type_id：args ≥ 20 字节，group 输入/输出各 ≤ 1', 'type_id: args ≥ 20 bytes, group inputs/outputs ≤ 1 each', 26)];
    if (p.op === 'mint') c.push(R.check(p.expected === p.got, '铸造：args[0..20] = blake2b(第一个 CellInput ‖ 首个 group 输出序号)[0..20]', 'mint: args[0..20] = blake2b(first CellInput ‖ first group output index)[0..20]', 26));
    for (const k of p.op === 'mint' ? ['out'] : p.op === 'update' ? ['in', 'out'] : []) {
      c.push(R.check(!!p[k], `${k} data 是合法的 DidCkbData（V1）`, `${k} data is a valid DidCkbData (V1)` + (p[k + 'Err'] ? ': ' + p[k + 'Err'] : ''), 51));
      if (p[k]) c.push(R.check(p[k].docOk, `${k} document 是合法 CBOR`, `${k} document is valid CBOR`, 52));
    }
    if (p.op === 'mint' && p.out && p.out.localId != null) c.push(R.NOT_CHECKED('铸造带 local_id：验证 did:plc 操作历史与 tx_hash 签名（output_type 见 witness）', 'mint with local_id: verify the did:plc operation history and its signature over tx_hash (output_type witness)', '31–46'));
    if (p.op === 'update' && p.in && p.out) c.push(R.check(p.in.localId === p.out.localId, '更新：local_id 不变', 'update: local_id unchanged', 53));
    if (p.op === 'burn') c.push(R.check(true, '销毁：无额外限制', 'burn: no further rule', null));
    return c;
  }
  R.register({ id: 'did_ckb', kind: 'type', name: 'DID CKB', match: [
    { code_hash: '0x4a06164dc34dccade5afe3e847a97b6db743e79f5477fa3295acf02849c5984a', hash_type: 'type', src: 'web5fans/did-ckb (mainnet)' },
    { code_hash: '0x510150477b10d6ab551a509b71265f3164e9fd4137fcb5a4322f49f03092c7c5', hash_type: 'type', src: 'web5fans/did-ckb (testnet)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

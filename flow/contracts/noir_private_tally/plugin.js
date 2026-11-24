// NOIR_PRIVATE_TALLY — wamimi/noir-ckb-verifier contracts/crates/private-tally/src/main.rs (+ build.rs policy pins) @ e4ba787626031a8bed92beaa567a87fe51a6b5f8
// Deployment + compiled-in policy (network domain, guard / VK data hashes): evidence/private-tally-testnet/deployment.json + evidence/private-tally-testnet.md (testnet only)
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const NETWORK_DOMAIN = '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606';
  const GUARD_DATA_HASH = '0xe683b04139344768348499c23eb1326d5a52d6db006c0d2fece00a831f3660d7';
  const VK_DATA_HASH = '0x91ad18ee79bb03a2702545bf4a8d095189139dfa9d320fcf047a33fce5912e5b';
  const VK_CELL = { tx_hash: '0x39ef90b8e6a882af3a658dc5c01cf17476e39907741541358d7155954547b1f9', index: '0x1' };
  const MOD = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001n;
  const enc = s => new TextEncoder().encode(s);
  const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
  const u64le = v => { const b = new Uint8Array(8); let x = BigInt(v); for (let i = 0; i < 8; i++) { b[i] = Number(x & 0xffn); x >>= 8n; } return b; };
  const u32le = v => { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = (v >>> (8 * i)) & 0xff; return b; };
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const sameCode = (s, g) => !!s && s.code_hash === g.script.code_hash && s.hash_type === g.script.hash_type;
  const okData = d => { const b = H(d || '0x'); return b.length === 33 && b[0] === 1; };
  const com = d => H(d).subarray(1, 33);
  const canon = c => { const v = R.leToBig(c); return v !== 0n && v < MOD; };
  const guardOk = l => !!l && l.code_hash === GUARD_DATA_HASH && l.hash_type === 'data1' && (l.args === '0x' || !l.args);
  function decodeWitness(hex) { // Groth16Witness{version Uint16, content union{Bn254Witness{proof 128B, public FrVec}}}
    const b = H(hex); if (b.length < 18) return null;
    const tot = u32(b, 0), o0 = u32(b, 4), o1 = u32(b, 8); if (tot !== b.length || o0 !== 12 || o1 !== 14) return null;
    const version = b[12] | (b[13] << 8), unionId = u32(b, 14), inner = b.subarray(18);
    if (inner.length < 12) return null; const it = u32(inner, 0), p0 = u32(inner, 4), p1 = u32(inner, 8); if (it !== inner.length) return null;
    const proof = inner.subarray(p0, p1), fv = inner.subarray(p1), n = fv.length >= 4 ? u32(fv, 0) : -1;
    if (n < 0 || fv.length !== 4 + 32 * n) return null;
    return { version, unionId, proof, pub: fv }; // FrVec molecule = u32 count ‖ items: same bytes as the arkworks public buffer
  }
  function parse(g, ctx) {
    const p = { fields: [], layouts: [] }, a = H(g.script.args || '0x'), t = ctx.tx;
    p.argsOk = a.length === 33 && a[0] === 1 && g.script.hash_type === 'data1';
    p.inApp = ctx.inputs.filter(x => x.output && sameCode(x.output.type, g)).length;
    p.outApp = t.outputs.filter(o => sameCode(o.type, g)).length;
    p.create = g.inputs.length === 0;
    const oi = g.outputs[0]; p.out = oi != null ? t.outputs[oi] : null; p.newData = oi != null ? t.outputs_data[oi] : null;
    p.fields.push([{ zh: '操作', en: 'operation' }, p.create ? { zh: '创建（证明 c_old = 0 → c_new）', en: 'creation (proof, c_old = 0 → c_new)' } : { zh: '更新（隐藏增量的证明）', en: 'update (hidden-amount proof)' }]);
    if (a.length === 33) p.layouts.push({ label: 'type.args', layout: [{ name: 'ver', size: '1B', color: 0, flex: 1 }, { name: 'type_id', size: '32B', color: 1, flex: 6 }], hex: [['ver', X(a.subarray(0, 1))], ['type_id', X(a.subarray(1))]] });
    if (p.newData) p.fields.push([{ zh: '新承诺 c_new', en: 'new commitment c_new' }, okData(p.newData) ? X(com(p.newData)) : p.newData]);
    if (p.create && oi != null) p.expectedId = R.typeId(ctx, oi);
    let opB = new Uint8Array(36), cOld = new Uint8Array(32);
    if (!p.create) {
      const ii = g.inputs[0]; p.inp = ctx.inputs[ii]; p.oldData = p.inp.data;
      p.fields.push([{ zh: '旧承诺 c_old', en: 'old commitment c_old' }, okData(p.oldData) ? X(com(p.oldData)) : p.oldData]);
      const op = p.inp.input.previous_output; opB = cat(H(op.tx_hash), u32le(parseInt(op.index, 16)));
      if (okData(p.oldData)) cOld = com(p.oldData);
    }
    const wi = p.create ? oi : g.inputs[0]; const w = wi != null ? ctx.witnesses[wi] : null;
    p.wRaw = w && w.raw; const field = w && w.args ? (p.create ? w.args.output_type : w.args.input_type) : null; p.field = field;
    if (field) { p.w = decodeWitness(field);
      if (p.w) p.layouts.push({ label: { zh: `witness[${wi}].${p.create ? 'output_type' : 'input_type'}（Groth16Witness）`, en: `witness[${wi}].${p.create ? 'output_type' : 'input_type'} (Groth16Witness)` },
        layout: [{ name: 'hdr', size: '12B', color: 0, flex: 1 }, { name: 'version', size: '2B', color: 1, flex: 1 }, { name: 'union', size: '4B', color: 2, flex: 1 }, { name: 'proof', size: p.w.proof.length + 'B', color: 3, flex: 4 }, { name: 'public', size: p.w.pub.length + 'B', color: 4, flex: 4 }],
        hex: [['version', String(p.w.version)], ['proof', X(p.w.proof)], ['public', X(p.w.pub)]] }); }
    if (p.out && okData(p.newData) && a.length === 33) {
      const d = R.blake2b(cat(enc('noir-ckb/private-tally/context/v2\0'), H(NETWORK_DOMAIN), R.blake2b(enc('noir-ckb/private-tally/v2')), H(g.hash), a.subarray(1),
        new Uint8Array([p.create ? 0 : 1]), opB, cOld, com(p.newData), H(R.scriptHash(p.out.lock)), u64le(p.out.capacity)));
      const e = new Uint8Array(132); e.set(u32le(4), 0); e.set(cOld, 4); e.set(com(p.newData), 36); e.set(d.subarray(0, 16), 68); e.set(d.subarray(16), 100);
      p.expected = X(e); p.fields.push(['context digest', X(d)]);
    }
    return p;
  }
  function check(g, ctx, p) {
    const c = [], t = ctx.tx, a = H(g.script.args || '0x');
    c.push(R.check(p.argsOk, 'args 33B、args[0]=1、hash_type=data1', 'args 33B, args[0]=1, hash_type=data1', 41));
    c.push(R.check(t.inputs.length <= 64 && t.outputs.length <= 64, `inputs ${t.inputs.length} / outputs ${t.outputs.length} ≤ 64`, `inputs ${t.inputs.length} / outputs ${t.outputs.length} ≤ 64`, 52));
    c.push(R.NOT_CHECKED('展开后的 cell_deps ≤ 64（dep_group 未展开）', 'expanded cell_deps ≤ 64 (dep_groups not expanded)', 52));
    c.push(R.check(p.inApp <= 1 && p.outApp === 1 && g.outputs.length === 1 && g.inputs.length === p.inApp, `同 code 输入 ${p.inApp} ≤ 1、输出 ${p.outApp} = 1、group 输出 ${g.outputs.length} = 1、group 输入 = 同 code 输入`, `same-code inputs ${p.inApp} ≤ 1, outputs ${p.outApp} = 1, group outputs ${g.outputs.length} = 1, group inputs = same-code inputs`, 42));
    if (p.create) c.push(R.check(!!p.expectedId && a.length === 33 && X(a.subarray(1)) === p.expectedId, 'type_id = blake2b(inputs[0] ‖ 输出序号)', 'type_id = blake2b(inputs[0] ‖ output index)', 44));
    else c.push(R.check(g.inputs.length === 1 && g.outputs.length === 1, 'type_id：更新时 1 进 1 出', 'type_id: 1 in 1 out on update', 44));
    c.push(R.check(guardOk(p.out && p.out.lock), '输出 lock = guard（code_hash = always-success data hash、data1、args 空）', 'output lock = guard (code_hash = always-success data hash, data1, empty args)', 45));
    c.push(R.check(okData(p.newData), '输出 data 33B 且 data[0]=1', 'output data 33B and data[0]=1', 43));
    if (okData(p.newData)) c.push(R.check(canon(com(p.newData)), 'c_new ≠ 0 且 < BN254 模数', 'c_new ≠ 0 and < BN254 modulus', 54));
    if (!p.create) {
      c.push(R.check(guardOk(p.inp.output.lock), '输入 lock = guard', 'input lock = guard', 45));
      c.push(R.check(okData(p.oldData), '输入 data 33B 且 data[0]=1', 'input data 33B and data[0]=1', 43));
      if (okData(p.oldData)) c.push(R.check(canon(com(p.oldData)), 'c_old ≠ 0 且 < BN254 模数', 'c_old ≠ 0 and < BN254 modulus', 54));
      c.push(R.check(!!p.out && BigInt(p.inp.output.capacity) === BigInt(p.out.capacity), 'capacity 不变', 'capacity unchanged', 47));
    }
    const wlen = p.wRaw && p.wRaw !== '0x' ? H(p.wRaw).length : 0;
    c.push(R.check(!!p.w && wlen <= 512 && p.w.version === 1 && p.w.proof.length === 128, `witness ${wlen}B ≤ 512、${p.create ? 'output_type' : 'input_type'} 可解码为 Groth16Witness v1`, `witness ${wlen}B ≤ 512, ${p.create ? 'output_type' : 'input_type'} decodes as Groth16Witness v1`, 48));
    c.push(R.check(!!p.w && !!p.expected && X(p.w.pub) === p.expected, 'public inputs = 重建的 [c_old, c_new, ctx_lo, ctx_hi]', 'public inputs = rebuilt [c_old, c_new, ctx_lo, ctx_hi]', 49));
    const vk = t.cell_deps.filter(d => d.out_point.tx_hash === VK_CELL.tx_hash && d.out_point.index === VK_CELL.index).length;
    c.push(R.NOT_CHECKED(`VK cell_dep（data hash ${VK_DATA_HASH.slice(0, 10)}…）恰好 1 个（未离线计算 data hash；已知 VK OutPoint 出现 ${vk} 次）`, `exactly one VK cell_dep (data hash ${VK_DATA_HASH.slice(0, 10)}…; not computed offline; known VK OutPoint present ${vk}×)`, 50));
    c.push(R.NOT_CHECKED('Groth16(BN254) 配对验证未在 JS 中复现', 'Groth16 (BN254) pairing verification not reproduced in JS', 51));
    return c;
  }
  R.register({ id: 'noir_private_tally', kind: 'type', name: { zh: 'Noir 隐私计数（private tally v2）', en: 'Noir private tally (v2)' }, match: [
    { code_hash: '0x3cc448db51cdc14453fff7bdf2c3d39e1dd7a238091b982069d20e169e8337d1', hash_type: 'data1', net: 'testnet', src: 'noir-ckb-verifier evidence/private-tally-testnet/deployment.json (artifacts.type.data_hash) + evidence/private-tally-testnet.md' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

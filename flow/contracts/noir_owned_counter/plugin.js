// NOIR_OWNED_COUNTER — wamimi/noir-ckb-verifier contracts/crates/owned-counter/src/main.rs @ bf09ccfa8bf2e474b98d47a23440a6ed29a1af07
// Deployment: releases/owned-counter-v1-testnet/manifest.json + evidence/week-15-testnet.md (testnet only)
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const NETWORK_DOMAIN = '0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606';
  const OWNER_CODE_HASH = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8';
  const VK_CELL = { tx_hash: '0x0ee39d547101eb348bc72a93f9a08b301353267487f3061f54a0070c44f27ad1', index: '0x1' };
  const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
  const u64le = v => { const b = new Uint8Array(8); let x = BigInt(v); for (let i = 0; i < 8; i++) { b[i] = Number(x & 0xffn); x >>= 8n; } return b; };
  const u32le = v => { const b = new Uint8Array(4); for (let i = 0; i < 4; i++) b[i] = (v >>> (8 * i)) & 0xff; return b; };
  const sameCode = (s, g) => !!s && s.code_hash === g.script.code_hash && s.hash_type === g.script.hash_type;
  const okData = d => { const b = H(d || '0x'); return b.length === 9 && b[0] === 1; };
  const cnt = d => R.leToBig(H(d).subarray(1, 9));
  const u32 = (b, o) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] * 16777216);
  function decodeWitness(hex) { // Groth16Witness{version Uint16, content union{Bn254Witness{proof 128B, public FrVec}}}
    const b = H(hex); if (b.length < 12) return null;
    const tot = u32(b, 0), o0 = u32(b, 4), o1 = u32(b, 8); if (tot !== b.length || o0 !== 12 || o1 !== 14) return null;
    const version = b[12] | (b[13] << 8), unionId = u32(b, 14), inner = b.subarray(18);
    const it = u32(inner, 0), p0 = u32(inner, 4), p1 = u32(inner, 8); if (it !== inner.length) return null;
    const proof = inner.subarray(p0, p1), pub = inner.subarray(p1);
    return { version, unionId, proof, pub };
  }
  function parse(g, ctx) {
    const p = { fields: [], layouts: [] }, a = H(g.script.args);
    p.argsOk = a.length === 33 && a[0] === 1 && g.script.hash_type === 'data1';
    p.inApp = ctx.inputs.filter(x => x.output && sameCode(x.output.type, g)).length;
    p.outApp = ctx.tx.outputs.filter(o => sameCode(o.type, g)).length;
    p.create = g.inputs.length === 0;
    const oi = g.outputs[0], out = oi != null ? ctx.tx.outputs[oi] : null, nd = oi != null ? ctx.tx.outputs_data[oi] : null;
    p.out = out; p.newData = nd;
    p.fields.push(['args', g.script.args], [{ zh: '操作', en: 'operation' }, p.create ? { zh: '创建', en: 'create' } : { zh: '更新（需证明）', en: 'update (proof)' }]);
    if (nd) p.fields.push([{ zh: '新 count', en: 'new count' }, okData(nd) ? cnt(nd).toString() : nd]);
    if (out) p.fields.push([{ zh: 'owner lock args', en: 'owner lock args' }, out.lock.args]);
    if (p.create && oi != null) p.expectedId = R.typeId(ctx, oi);
    if (!p.create) {
      const ii = g.inputs[0], inp = ctx.inputs[ii]; p.oldData = inp.data; p.inp = inp;
      p.fields.push([{ zh: '旧 count', en: 'old count' }, okData(inp.data) ? cnt(inp.data).toString() : inp.data]);
      const w = ctx.witnesses[ii]; p.wRaw = w && w.raw; p.wa = w && w.args; const it = p.wa && p.wa.input_type;
      if (it && it !== '0x') {
        p.w = decodeWitness(it);
        if (p.w) {
          p.layouts.push({ label: { zh: 'witness.input_type（Groth16Witness）', en: 'witness.input_type (Groth16Witness)' },
            layout: [{ name: 'hdr', size: '12B', color: 0, flex: 1 }, { name: 'version', size: '2B', color: 1, flex: 1 }, { name: 'union', size: '4B', color: 2, flex: 1 }, { name: 'proof', size: p.w.proof.length + 'B', color: 3, flex: 4 }, { name: 'public', size: p.w.pub.length + 'B', color: 4, flex: 4 }],
            hex: [['version', String(p.w.version)], ['union id', String(p.w.unionId)], ['proof', X(p.w.proof)], ['public', X(p.w.pub)]] });
        }
      }
      if (okData(inp.data) && okData(nd) && out) {
        const prefix = new TextEncoder().encode('noir-ckb/owned-counter/context/v1\0');
        const op = inp.input.previous_output;
        const d = R.blake2b(cat(prefix, H(NETWORK_DOMAIN), R.blake2b(new TextEncoder().encode('noir-ckb/owned-counter/v1')), H(g.hash), a.subarray(1),
          new Uint8Array([1]), H(op.tx_hash), u32le(parseInt(op.index, 16)), H(inp.data), H(nd), H(R.scriptHash(out.lock)), u64le(out.capacity)));
        const e = new Uint8Array(132); e.set(u32le(4), 0); e.set(H(inp.data).subarray(1), 4); e.set(H(nd).subarray(1), 36); e.set(d.subarray(0, 16), 68); e.set(d.subarray(16), 100);
        p.expected = X(e);
        p.fields.push([{ zh: 'context digest', en: 'context digest' }, X(d)]);
      }
    }
    return p;
  }
  function check(g, ctx, p) {
    const c = [], t = ctx.tx, a = H(g.script.args);
    c.push(R.check(p.argsOk, 'args 33B、args[0]=1、hash_type=data1', 'args 33B, args[0]=1, hash_type=data1', 41));
    c.push(R.check(t.inputs.length < 64 && t.outputs.length < 64 && t.cell_deps.length < 64, 'inputs/outputs/cell_deps 数量 < 64（cell_deps 按未展开计）', 'inputs/outputs/cell_deps count < 64 (cell_deps counted unexpanded)', 52));
    c.push(R.check(p.inApp <= 1 && p.outApp === 1 && g.outputs.length === 1 && g.inputs.length === p.inApp, `同 code 输入 ${p.inApp} ≤ 1、输出 ${p.outApp} = 1、group 输出 ${g.outputs.length} = 1`, `same-code inputs ${p.inApp} ≤ 1, outputs ${p.outApp} = 1, group outputs ${g.outputs.length} = 1`, 42));
    if (p.create) c.push(R.check(!!p.expectedId && a.length === 33 && X(a.subarray(1)) === p.expectedId, 'type_id = blake2b(inputs[0] ‖ 输出序号)', 'type_id = blake2b(inputs[0] ‖ output index)', 44));
    else c.push(R.check(g.inputs.length === 1 && g.outputs.length === 1, 'type_id：更新时 1 进 1 出', 'type_id: 1 in 1 out on update', 44));
    c.push(R.check(okData(p.newData), '输出 data 9B 且 data[0]=1', 'output data 9B and data[0]=1', 43));
    const lk = p.out && p.out.lock;
    c.push(R.check(!!lk && lk.code_hash === OWNER_CODE_HASH && lk.hash_type === 'type' && H(lk.args).length === 20, '输出 lock = secp256k1_blake160（type，args 20B）', 'output lock = secp256k1_blake160 (type, args 20B)', 45));
    c.push(R.NOT_CHECKED('cell_deps 展开后恰好 1 个 secp256k1 代码 cell 且 data hash 匹配（dep_group 未展开）', 'exactly one secp256k1 code cell in expanded cell_deps with matching data hash (dep_group not expanded)', 45));
    if (p.create) {
      c.push(R.check(okData(p.newData) && cnt(p.newData) === 0n, '初始 count = 0', 'initial count = 0', 53));
      const first = ctx.inputs[0] && ctx.inputs[0].output;
      c.push(R.check(!!first && !!lk && R.scriptHash(first.lock) === R.scriptHash(lk), 'inputs[0].lock hash = 输出 lock hash', 'inputs[0].lock hash = output lock hash', 46));
      return c;
    }
    c.push(R.check(okData(p.oldData), '输入 data 9B 且 data[0]=1', 'input data 9B and data[0]=1', 43));
    c.push(R.check(!!lk && R.scriptHash(p.inp.output.lock) === R.scriptHash(lk), '输入/输出 lock hash 相同', 'input/output lock hash equal', 46));
    c.push(R.check(!!p.out && BigInt(p.inp.output.capacity) === BigInt(p.out.capacity), 'capacity 不变', 'capacity unchanged', 47));
    const wlen = p.wRaw ? H(p.wRaw).length : 0;
    c.push(R.check(!!p.w && wlen <= 512 && p.w.proof.length === 128 && p.w.pub.length === 132, `witness ${wlen}B ≤ 512、input_type 可解码（proof 128B、public 132B）`, `witness ${wlen}B ≤ 512, input_type decodes (proof 128B, public 132B)`, 48));
    c.push(R.check(!!p.w && !!p.expected && X(p.w.pub) === p.expected, 'public inputs = 重建的 expected（old/new/context digest）', 'public inputs = rebuilt expected (old/new/context digest)', 49));
    c.push(R.check(okData(p.oldData) && okData(p.newData) && cnt(p.newData) === cnt(p.oldData) + 1n, '电路规则 new = old + 1（由证明强制，非脚本代码直接比较）', 'circuit rule new = old + 1 (enforced via proof, not compared by the script code)', 'circuit'));
    const vk = t.cell_deps.filter(d => d.out_point.tx_hash === VK_CELL.tx_hash && d.out_point.index === VK_CELL.index).length;
    c.push(R.NOT_CHECKED(`VK cell_dep 恰好 1 个（data hash 未离线计算；已知 VK OutPoint 出现 ${vk} 次）`, `exactly one VK cell_dep (data hash not computed offline; known VK OutPoint present ${vk}×)`, 50));
    c.push(R.NOT_CHECKED('Groth16(BN254) 配对验证未在 JS 中复现', 'Groth16 (BN254) pairing verification not reproduced in JS', 51));
    return c;
  }
  R.register({ id: 'noir_owned_counter', kind: 'type', name: { zh: 'Noir 证明计数器', en: 'Noir owned counter' }, match: [
    { code_hash: '0x79d7e7614ff1689cb6c6fbbd376ab2fa959dc92394abea35cbafb1bd2b7d0a88', hash_type: 'data1', net: 'testnet', src: 'noir-ckb-verifier releases/owned-counter-v1-testnet/manifest.json (artifacts.type.data_hash) + evidence/week-15-testnet.md' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

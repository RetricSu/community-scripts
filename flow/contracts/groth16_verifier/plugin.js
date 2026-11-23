// groth16-ckb verifier type script — CECILIA-MULANDI/groth16-ckb script/crates/{ckb-script,verifier-core,wire-decode} @ e969ad154ea2c00df57f68238ddfbcbc9ceb1419
// Deployment: no published code_hash; testnet code cell taken from the cell_deps of the README-linked e2e tx 0xc658f9e8…3c96 (pre-audit). Pairing NOT_CHECKED.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  function decodeWitness(hex) { // Groth16Witness{version Uint16, content: union{0: Bn254Witness{proof ProofBn254(128B), public_inputs FrVec}}}
    const b = H(hex); if (b.length < 18) return null;
    if (u32(b, 0) !== b.length || u32(b, 4) !== 12 || u32(b, 8) !== 14) return null;
    const version = b[12] | (b[13] << 8), unionId = u32(b, 14), inner = b.subarray(18);
    if (unionId !== 0 || inner.length < 12 || u32(inner, 0) !== inner.length || u32(inner, 4) !== 12 || u32(inner, 8) !== 140) return null;
    const proof = inner.subarray(12, 140), fv = inner.subarray(140); if (fv.length < 4) return null;
    const n = u32(fv, 0); if (fv.length !== 4 + 32 * n) return null;
    return { version, proof, n, pub: fv };
  }
  R.register({
    id: 'groth16_verifier', kind: 'type', name: { zh: 'groth16-ckb 验证器', en: 'groth16-ckb verifier' },
    match: [{ code_hash: '0xc884d0c2b45ebe5db3e559b5a2450f52defaf6945f78c5d7e9da6ed0b5852dfb', hash_type: 'data1', net: 'testnet', src: 'no published code_hash: data hash of cell_dep 0x8e849c96…a75e:0 of the e2e tx 0xc658f9e8…3c96 linked in groth16-ckb README.md (Phase 3, Pudge)' }],
    parse(g, ctx) {
      const p = { fields: [['args (vk_data_hash)', g.script.args]], layouts: [] }; p.args = H(g.script.args || '0x');
      p.spend = g.inputs.length > 0;
      p.fields.push([{ zh: '操作', en: 'operation' }, p.spend ? { zh: '消费：验证证明', en: 'spend: verify proof' } : { zh: '创建：不验证', en: 'create: no verification' }]);
      if (p.spend) {
        p.w = ctx.witnesses[g.inputs[0]]; const it = p.w && p.w.args && p.w.args.input_type; p.it = it;
        if (it) { p.dec = decodeWitness(it);
          if (p.dec) { p.fields.push([{ zh: '公开输入个数', en: 'public inputs' }, String(p.dec.n)]);
            p.layouts.push({ label: 'witness.input_type (Groth16Witness)', layout: [{ name: 'hdr', size: '12B', color: 0, flex: 1 }, { name: 'version', size: '2B', color: 1, flex: 1 }, { name: 'union', size: '4B', color: 2, flex: 1 }, { name: 'proof', size: '128B', color: 3, flex: 4 }, { name: 'public_inputs', size: p.dec.pub.length + 'B', color: 4, flex: 3 }],
              hex: [['version', String(p.dec.version)], ['proof', X(p.dec.proof)], ['public_inputs', X(p.dec.pub)]] }); } }
      }
      return p;
    },
    check(g, ctx, p) {
      const c = [R.check(p.args.length === 32, 'args 长度 = 32（VK data hash）', 'args length = 32 (VK data hash)', 11)];
      if (!p.spend) { c.push(R.check(true, '无 group 输入：创建时不验证（返回 0）', 'no group input: creation is not verified (returns 0)', null)); return c; }
      if (!p.w || p.w.empty || p.w.error) { c.push(R.check(false, 'group 输入 0 的 witness 是 WitnessArgs', 'witness of group input 0 is WitnessArgs', 15)); return c; }
      c.push(R.check(!!p.it, 'WitnessArgs.input_type 存在', 'WitnessArgs.input_type present', 16)); if (!p.it) return c;
      c.push(R.NOT_CHECKED('cell_deps 中 data hash = args 的 VK cell 存在且为合法 Groth16VerifyingKey v1（未加载 cell_dep 数据）', 'a VK cell with data hash = args exists in cell_deps and is a valid Groth16VerifyingKey v1 (cell_dep data not loaded)', '12–14'));
      c.push(R.check(!!p.dec, 'input_type 是合法 Groth16Witness（Bn254Witness）', 'input_type is a valid Groth16Witness (Bn254Witness)', 17)); if (!p.dec) return c;
      c.push(R.check(p.dec.version === 1, `witness version ${p.dec.version} = 1`, `witness version ${p.dec.version} = 1`, 18));
      c.push(R.NOT_CHECKED('VK/proof/public 反序列化、n + 1 = ic_len、BN254 配对检查', 'VK / proof / public deserialization, n + 1 = ic_len, BN254 pairing check', '1–5'));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

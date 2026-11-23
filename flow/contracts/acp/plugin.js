// anyone_can_pay — RFC 0026, ckb-production-scripts/c/anyone_can_pay.c@e570c11
// Exposes R.acp {parse, check, payment} for pw_lock (same payment rules).
(function (R) {
  const H = R.hexToBytes;
  const MAX64 = (1n << 64n) - 1n, MAX128 = (1n << 128n) - 1n;
  const pow10 = (x, max) => { const n = 10n ** BigInt(x); return n > max ? max : n; };
  function wallet(cell, data) { const t = cell.type ? R.scriptHash(cell.type) : null, d = H(data || '0x');
    return { type: t, ckb: BigInt(cell.capacity), udt: t ? (d.length >= 16 ? R.leToBig(d.subarray(0, 16)) : null) : 0n, dataLen: d.length }; }
  function parse(g, ctx) {
    const a = H(g.script.args), w = ctx.witnesses[g.witnessIndex], lock = w && w.args && w.args.lock;
    const p = { argsLen: a.length, ckbMinExp: a.length > 20 ? a[20] : null, udtMinExp: a.length > 21 ? a[21] : null,
      hasSig: !!lock && H(lock).length === 65, lockLen: lock ? H(lock).length : 0 };
    p.minCkb = p.ckbMinExp == null ? 0n : pow10(p.ckbMinExp, MAX64); p.minUdt = p.udtMinExp == null ? 0n : pow10(p.udtMinExp, MAX128);
    p.ins = g.inputs.map(i => [i, wallet(ctx.inputs[i].output, ctx.inputs[i].data)]);
    p.outs = g.outputs.map(j => [j, wallet(ctx.tx.outputs[j], ctx.tx.outputs_data[j])]);
    p.fields = [['args', g.script.args], ['pubkey hash', R.bytesToHex(a.subarray(0, 20))],
      [{ zh: '最小 CKB 转入', en: 'min CKB payment' }, p.ckbMinExp == null ? '0' : `10^${p.ckbMinExp} shannon`],
      [{ zh: '最小 UDT 转入', en: 'min UDT payment' }, p.udtMinExp == null ? '0' : `10^${p.udtMinExp}`],
      [{ zh: '解锁方式', en: 'unlock path' }, p.hasSig ? { zh: '签名（同 secp256k1_blake160）', en: 'signature (as secp256k1_blake160)' } : { zh: '无签名 → 付款解锁', en: 'no signature → payment unlock' }],
      ...p.ins.map(([i, x]) => [`in[${i}]`, `${x.ckb} shannon, udt ${x.udt}`]), ...p.outs.map(([j, x]) => [`out[${j}]`, `${x.ckb} shannon, udt ${x.udt}`])];
    p.layouts = [{ label: 'args', layout: [{ name: 'pubkey hash', size: '20B', color: 1, flex: 4 }, { name: 'ckb min exp?', size: '1B', color: 3 }, { name: 'udt min exp?', size: '1B', color: 4 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen >= 20 && p.argsLen <= 22, `args 长度 ${p.argsLen} ∈ [20,22]`, `args length ${p.argsLen} in [20,22]`, -1)];
    if (p.hasSig) { c.push(R.NOT_CHECKED('签名恢复 blake160(pubkey) = args[0..20]（未检查）', 'recovered blake160(pubkey) = args[0..20] (not checked)', -31)); return c; }
    return c.concat(payment(g, ctx, p));
  }
  function payment(g, ctx, p) {
    const c = [];
    c.push(R.check(p.ins.length < 256, '同 lock 输入数 < 256（源码先检查数组边界，再读取终止标记）', 'group inputs < 256 (source checks array bounds before reading the end marker)', -43));
    const enc = [...p.ins, ...p.outs].every(([, x]) => x.type ? x.udt != null : x.dataLen === 0);
    c.push(R.check(enc, '无 type 的 cell data 为空；有 type 的 data ≥ 16 字节', 'cells without type have empty data; with type data ≥ 16 bytes', -2));
    const cnt = p.ins.map(() => 0);
    for (const [j, o] of p.outs) {
      const m = p.ins.map(([, x], k) => [x, k]).filter(([x]) => x.type === o.type);
      if (m.length === 0) { c.push(R.check(false, `out[${j}] 找到同 type 的输入`, `out[${j}] pairs with an input of the same type`, -44)); continue; }
      if (m.length > 1) { c.push(R.check(false, `out[${j}] 只对应一个输入`, `out[${j}] pairs with exactly one input`, -45)); continue; }
      const [x, k] = m[0]; cnt[k]++;
      const okC = x.ckb + p.minCkb <= MAX64 && o.ckb >= x.ckb + p.minCkb, okU = o.udt != null && x.udt != null && x.udt + p.minUdt <= MAX128 && o.udt >= x.udt + p.minUdt;
      const ok = (okC || okU) && (okC || o.ckb === x.ckb) && (okU || o.udt === x.udt);
      c.push(R.check(ok, `out[${j}] 相对 in[${p.ins[k][0]}]：CKB 或 UDT 至少满足最小增量；未满足增量条件的资产必须保持不变`, `out[${j}] vs in[${p.ins[k][0]}]: CKB or UDT meets its minimum increase; an asset not meeting its threshold stays equal`, -42));
    }
    cnt.forEach((n, k) => c.push(R.check(n === 1, `in[${p.ins[k][0]}] 恰好对应一个输出`, `in[${p.ins[k][0]}] pairs with exactly one output`, n === 0 ? -44 : -46)));
    return c;
  }
  R.acp = { parse, check, payment };
  R.register({ id: 'acp', kind: 'lock', name: { zh: 'Anyone-can-pay', en: 'Anyone-can-pay' }, match: [
    { code_hash: '0xd369597ff47f29fbc0d47d2e3775370d1250b85140c670e4718af712983a2354', hash_type: 'type', net: 'mainnet', src: 'RFC 0026' },
    { code_hash: '0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356', hash_type: 'type', net: 'testnet', src: 'RFC 0026' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

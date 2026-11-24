// RGB++ lock — utxostack/rgbpp contracts/rgbpp-lock/src/main.rs + crates/core (error.rs, rgbpp.rs, bitcoin/*)
// Exposes R.rgbpp (sha256, BTC tx parser, BTCTimeLock args parser) for btc_time_lock.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  // ---- sha256 (FIPS 180-4) ----
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  function sha256(m) {
    const l = m.length, n = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(n); b.set(m); b[l] = 0x80;
    const bl = l * 8; for (let i = 0; i < 8; i++) b[n - 1 - i] = Math.floor(bl / 2 ** (8 * i)) & 0xff;
    const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, bb, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) { const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0; }
      h[0] += a; h[1] += bb; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    const out = new Uint8Array(32); for (let i = 0; i < 8; i++) { out[4 * i] = h[i] >>> 24; out[4 * i + 1] = h[i] >>> 16; out[4 * i + 2] = h[i] >>> 8; out[4 * i + 3] = h[i]; } return out;
  }
  const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
  const u32 = v => new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
  const u64 = v => { v = BigInt(v); const o = new Uint8Array(8); for (let i = 0; i < 8; i++) { o[i] = Number(v & 255n); v >>= 8n; } return o; };
  // ---- BTC tx (legacy serialization, as parse_btc_tx) ----
  function parseBtcTx(b) {
    let o = 0; const rd = n => { if (o + n > b.length) throw new Error('eof'); const s = b.subarray(o, o + n); o += n; return s; };
    const le = s => s.reduce((a, x, i) => a + x * 2 ** (8 * i), 0);
    const vi = () => { const f = rd(1)[0]; return f < 0xfd ? f : f === 0xfd ? le(rd(2)) : f === 0xfe ? le(rd(4)) : le(rd(8)); };
    const version = le(rd(4)), ins = [], outs = [];
    for (let i = 0, n = vi(); i < n; i++) ins.push({ txid: X(rd(32)), vout: le(rd(4)), script: X(rd(vi())), seq: le(rd(4)) });
    for (let i = 0, n = vi(); i < n; i++) outs.push({ value: R.leToBig(rd(8)), script: rd(vi()) });
    const lockTime = le(rd(4)); if (o !== b.length) throw new Error('trailing bytes');
    return { txid: X(sha256(sha256(b))), version, ins, outs, lockTime };
  }
  const displayTxid = h => '0x' + h.slice(2).match(/../g).reverse().join('');
  function commitmentOf(tx) { const o = tx.outs.find(x => x.script[0] === 0x6a); if (!o || o.script[1] !== 0x20 || o.script.length !== 34) return null; return X(o.script.subarray(2)); }
  // BTCTimeLock { lock_script: Script, after: Uint32, btc_txid: Byte32 }
  function parseBtcTimeLock(hex) { try { const f = R.parseTable(H(hex), 3); const s = R.parseTable(f[0], 3);
    if (f[1].length !== 4 || f[2].length !== 32) return null;
    return { lock: { code_hash: X(s[0]), hash_type: ({ 0: 'data', 1: 'type', 2: 'data1', 4: 'data2' })[s[1][0]], args: X(R.parseBytes(s[2])) }, after: R.leToBig(f[1]), btcTxid: X(f[2]) }; } catch (e) { return null; } }
  const isBtl = s => { const p = R.identify(s); return !!p && p.id === 'btc_time_lock'; };
  const sameCode = (a, b) => a.code_hash === b.code_hash && a.hash_type === b.hash_type;
  const cellOutput = (o, lock) => { const cap = u64(o.capacity), l = R.serializeScript(lock), t = o.type ? R.serializeScript(o.type) : new Uint8Array(0);
    const tot = 16 + 8 + l.length + t.length; return cat(u32(tot), u32(16), u32(24), u32(24 + l.length), cap, l, t); };
  const zeroTail = (hex, from, to) => { const a = H(hex).slice(); a.fill(0, from, to); return X(a); };
  function commitment(ctx, self, ver, il, ol) {
    const parts = [new TextEncoder().encode('RGB++'), new Uint8Array([ver & 255, ver >> 8]), new Uint8Array([il, ol])];
    for (const i of ctx.tx.inputs.slice(0, il)) parts.push(H(i.previous_output.tx_hash), u32(parseInt(i.previous_output.index, 16)));
    ctx.tx.outputs.slice(0, ol).forEach((o, j) => { let lock = o.lock;
      if (isBtl(lock)) { const a = H(lock.args); lock = { ...lock, args: zeroTail(lock.args, a.length - 32, a.length) }; }
      else if (sameCode(lock, self)) lock = { ...lock, args: zeroTail(lock.args, 4, 36) };
      const d = H(ctx.tx.outputs_data[j] || '0x'); parts.push(cellOutput(o, lock), u32(d.length), d); });
    return X(sha256(sha256(cat(...parts))));
  }
  function loadUnlock(ctx, wi) {
    const w = ctx.witnesses[wi]; if (!(w && w.args && w.args.lock)) return { missing: true };
    let lock = H(w.args.lock), via = null;
    if (lock.length === 4) { via = R.leToBig(lock); const w2 = ctx.witnesses[Number(via)]; if (!(w2 && w2.args && w2.args.lock)) return { missing: true, via }; lock = H(w2.args.lock); }
    try { const f = R.parseTable(lock, 4); if (f[0].length !== 2 || f[1].length !== 2) throw 0;
      return { via, version: f[0][0] | (f[0][1] << 8), inputLen: f[1][0], outputLen: f[1][1], btcTx: R.parseBytes(f[2]), proofLen: R.parseBytes(f[3]).length }; } catch (e) { return { bad: true, via }; }
  }
  R.rgbpp = { sha256, parseBtcTx, parseBtcTimeLock, displayTxid };
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsOk: a.length === 36 };
    if (p.argsOk) { p.outIndex = Number(R.leToBig(a.subarray(0, 4))); p.btcTxid = X(a.subarray(4)); }
    p.unlock = loadUnlock(ctx, g.witnessIndex);
    if (p.unlock.btcTx) { try { p.btc = parseBtcTx(p.unlock.btcTx); } catch (e) { p.btcErr = e.message; } }
    p.fields = [['args', g.script.args]];
    if (p.argsOk) p.fields.push([{ zh: '绑定的 BTC UTXO', en: 'bound BTC UTXO' }, displayTxid(p.btcTxid) + ':' + p.outIndex]);
    if (p.unlock.via != null) p.fields.push([{ zh: 'RGBPPUnlock 位于 witness', en: 'RGBPPUnlock at witness' }, String(p.unlock.via)]);
    if (p.unlock.btcTx) p.fields.push(['version / input_len / output_len', `${p.unlock.version} / ${p.unlock.inputLen} / ${p.unlock.outputLen}`], [{ zh: 'BTC 交易 txid', en: 'BTC tx txid' }, p.btc ? displayTxid(p.btc.txid) : 'parse error: ' + p.btcErr], ['btc_tx_proof', p.unlock.proofLen + ' B']);
    if (p.btc) { p.commit = commitmentOf(p.btc); p.fields.push(['OP_RETURN commitment', p.commit || 'None']);
      if (p.commit && p.unlock.inputLen && p.unlock.outputLen && p.unlock.inputLen <= ctx.tx.inputs.length && p.unlock.outputLen <= ctx.tx.outputs.length) { p.calc = commitment(ctx, g.script, p.unlock.version, p.unlock.inputLen, p.unlock.outputLen); p.fields.push([{ zh: '按 CKB 交易重算', en: 'recomputed from CKB tx' }, p.calc]); } }
    p.layouts = [{ label: 'args (RGBPPLock struct)', layout: [{ name: 'out_index u32', size: '4B', color: 2 }, { name: 'btc_txid', size: '32B', color: 1, flex: 4 }], hex: [] },
      { label: 'witness.lock (RGBPPUnlock table)', layout: [{ name: 'version u16', size: '2B', color: 0 }, { name: 'input_len‖output_len', size: '2B', color: 2 }, { name: 'btc_tx', size: 'Bytes', color: 3, flex: 3 }, { name: 'btc_tx_proof', size: 'Bytes', color: 5, flex: 3 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsOk, 'args 是 36 字节 RGBPPLock', 'args is a 36-byte RGBPPLock', 0x31)];
    const u = p.unlock;
    c.push(R.check(!u.missing, 'group 第一个 witness.lock 存在（或 4 字节指向另一个 witness）', 'group first witness.lock exists (or 4 bytes pointing to another witness)', 0x02));
    if (u.missing) return c;
    c.push(R.check(!u.bad, 'witness.lock 是合法 RGBPPUnlock', 'witness.lock is a valid RGBPPUnlock', 0x34));
    if (u.bad) return c;
    c.push(R.check(!!p.btc, 'btc_tx 可解析（无 witness 序列化）', 'btc_tx parses (non-witness serialization)', 0x30));
    if (!p.btc || !p.argsOk) return c;
    c.push(R.check(p.btc.ins.some(i => i.txid === p.btcTxid && i.vout === p.outIndex), 'BTC 交易花费了 args 绑定的 UTXO', 'the BTC tx spends the UTXO bound in args', 0x44),
      R.NOT_CHECKED('BTC 交易在轻客户端中存在（SPV 证明，未检查）', 'BTC tx exists in the light client (SPV proof, not checked)', '0x20–0x23'),
      R.check(!!p.commit, 'BTC 交易第一个 OP_RETURN 为 32 字节 commitment', 'first OP_RETURN of the BTC tx is a 32-byte commitment', 0x33),
      R.check(u.version === 0, 'commitment version = 0', 'commitment version = 0', 0x43),
      R.check(u.inputLen > 0 && u.outputLen > 0, 'input_len > 0 且 output_len > 0', 'input_len > 0 and output_len > 0', 0x33),
      R.check(ctx.inputs.slice(u.inputLen).every(x => !(x.output && x.output.type)), `第 ${u.inputLen} 个之后的输入都没有 type`, `inputs after #${u.inputLen} have no type`, 0x42),
      R.check(ctx.tx.outputs.slice(u.outputLen).every(o => !o.type), `第 ${u.outputLen} 个之后的输出都没有 type`, `outputs after #${u.outputLen} have no type`, 0x42));
    if (p.commit) c.push(R.check(p.calc === p.commit, 'commitment = sha256d("RGB++"‖ver‖lens‖outpoints‖outputs(txid 置 0)‖data)', 'commitment = sha256d("RGB++"‖ver‖lens‖outpoints‖outputs (txid zeroed)‖data)', 0x42));
    const typed = [], bad = [];
    ctx.tx.outputs.forEach((o, j) => { if (!o.type) return; typed.push(j); let ok = false;
      if (sameCode(o.lock, g.script)) { const a = H(o.lock.args); ok = a.length === 36 && X(a.subarray(4)) === p.btc.txid && Number(R.leToBig(a.subarray(0, 4))) < p.btc.outs.length; }
      if (!ok && isBtl(o.lock)) { const t = parseBtcTimeLock(o.lock.args); ok = !!t && t.btcTxid === p.btc.txid && t.after >= 6n; }
      if (!ok) bad.push(j); });
    c.push(R.check(bad.length === 0, `所有 ${typed.length} 个带 type 的输出都由 RGB++ lock（绑定本 BTC 交易输出）或 BTC time lock（after ≥ 6）保护` + (bad.length ? `；不满足：out[${bad.join(',')}]` : ''),
      `all ${typed.length} typed outputs are guarded by an RGB++ lock sealed to this BTC tx or a BTC time lock (after ≥ 6)` + (bad.length ? `; failing: out[${bad.join(',')}]` : ''), 0x41));
    return c;
  }
  R.register({ id: 'rgbpp_lock', kind: 'lock', name: 'RGB++ lock', match: [
    { code_hash: '0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936', hash_type: 'type', net: 'mainnet', src: 'rgbpp-sdk packages/ckb/src/constants' },
    { code_hash: '0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248', hash_type: 'type', net: 'testnet', src: 'rgbpp-sdk (BTC testnet3)' },
    { code_hash: '0xd07598deec7ce7b5665310386b4abd06a6d48843e953c5cc2112ad0d5a220364', hash_type: 'type', net: 'testnet', src: 'rgbpp-sdk (BTC signet)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

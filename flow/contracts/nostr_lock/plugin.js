// Nostr lock — nervosnetwork/nostr-binding contracts/nostr-lock/src/{main,config,error,util}.rs + ckb-nostr-utils
// @requires rgbpp_lock
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const KIND = 23334, TAG = 'ckb_sighash_all';
  const CONTENT = 'Signing a CKB transaction\n\nIMPORTANT: Please verify the integrity and authenticity of connected Nostr client before signing this message\n';
  const u64 = n => { let v = BigInt(n); const o = new Uint8Array(8); for (let i = 0; i < 8; i++) { o[i] = Number(v & 255n); v >>= 8n; } return o; };
  const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
  function sighashAll(g, ctx) {
    const w0 = H(ctx.tx.witnesses[g.witnessIndex]).slice(); const off = w0[4] | (w0[5] << 8) | (w0[6] << 16) | (w0[7] << 24), len = w0[off] | (w0[off + 1] << 8) | (w0[off + 2] << 16) | (w0[off + 3] << 24);
    w0.fill(0, off + 4, off + 4 + len);
    const parts = [H(ctx.txHash), u64(w0.length), w0];
    for (const i of g.inputs.slice(1)) { const w = H(ctx.tx.witnesses[i] || '0x'); if (i < ctx.tx.witnesses.length) parts.push(u64(w.length), w); }
    for (let i = ctx.tx.inputs.length; i < ctx.tx.witnesses.length; i++) { const w = H(ctx.tx.witnesses[i]); parts.push(u64(w.length), w); }
    return R.ckbHash(cat(...parts)).slice(2);
  }
  const lz = h => { let r = 0; for (const b of H(h)) { if (b === 0) { r += 8; continue; } return r + Math.clz32(b) - 24; } return r; };
  function parse(g, ctx) {
    const a = H(g.script.args), w = ctx.witnesses[g.witnessIndex], p = { argsLen: a.length };
    if (a.length === 21) { p.pow = a[0]; p.pkh = X(a.subarray(1)); }
    if (w && w.args && w.args.lock) { try { p.event = JSON.parse(new TextDecoder().decode(H(w.args.lock))); } catch (e) { p.jsonErr = e.message; } } else p.noLock = true;
    if (p.event) { const e = p.event; p.sighash = sighashAll(g, ctx);
      try { p.idCalc = X(R.rgbpp.sha256(new TextEncoder().encode(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content])))).slice(2); } catch (er) {}
      try { p.authorHash = R.blake160(H('0x' + e.pubkey)); } catch (er) {} }
    p.fields = [['args', g.script.args]];
    if (p.pkh) p.fields.push(['pow_difficulty', String(p.pow)], ['blake160(schnorr pubkey)', p.pkh]);
    if (p.event) p.fields.push(['event.id', p.event.id], ['event.pubkey', p.event.pubkey], ['event.kind', String(p.event.kind)], ['event.tags', JSON.stringify(p.event.tags)], ['sighash_all', p.sighash]);
    p.layouts = [{ label: 'args (21B)', layout: [{ name: 'pow_difficulty', size: '1B', color: 2 }, { name: 'blake160(schnorr x-only pubkey)', size: '20B', color: 1, flex: 4 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 21, 'args 恰为 21 字节', 'args is exactly 21 bytes', 15)];
    c.push(R.check(!p.noLock, 'group 第一个 witness.lock 存在', 'group first witness.lock exists', 27));
    if (p.noLock) return c;
    c.push(R.check(!!p.event, 'witness.lock 是 Nostr 事件 JSON', 'witness.lock is a Nostr event JSON', 21));
    if (!p.event) return c; const e = p.event;
    c.push(R.check(Array.isArray(e.tags) && e.tags.some(t => t.length === 2 && t[0] === TAG && t[1] === p.sighash), `存在 tag ["${TAG}", sighash_all]`, `has tag ["${TAG}", sighash_all]`, 11),
      R.check(!!p.idCalc && p.idCalc === e.id, 'event.id = sha256([0,pubkey,created_at,kind,tags,content])', 'event.id = sha256([0,pubkey,created_at,kind,tags,content])', 17),
      R.check(e.kind === KIND, `kind = ${KIND}`, `kind = ${KIND}`, 12), R.check(e.content === CONTENT, 'content = 固定的签名提示文本', 'content = the fixed signing notice', 13));
    if (p.pow === 0) c.push(R.check(p.authorHash === p.pkh, 'blake160(event.pubkey) = args[1..21]', 'blake160(event.pubkey) = args[1..21]', 26), R.NOT_CHECKED('schnorr 签名验证（未检查）', 'schnorr signature verification (not checked)', 18));
    else if (p.pow != null) { const n = (e.tags || []).filter(t => t.length === 3 && t[0] === 'nonce');
      c.push(R.check(n.length > 0, '存在 ["nonce", x, difficulty] tag', 'a ["nonce", x, difficulty] tag exists', 25), R.check(n.every(t => t[2] === String(p.pow)), `nonce tag 目标难度 = ${p.pow}`, `nonce tag target difficulty = ${p.pow}`, 23),
        R.check(lz('0x' + e.id) >= p.pow, `event.id 前导零位 ≥ ${p.pow}`, `event.id leading zero bits ≥ ${p.pow}`, 24), R.check(/^0x0{40}$/.test(p.pkh), 'PoW 模式下 args[1..21] 全 0', 'args[1..21] all zero in PoW mode', 22)); }
    return c;
  }
  R.register({ id: 'nostr_lock', kind: 'lock', name: 'Nostr lock', match: [
    { code_hash: '0x641a89ad2f77721b803cd50d01351c1f308444072d5fa20088567196c0574c68', hash_type: 'type', net: 'mainnet', src: 'ccc KnownScript.NostrLock' },
    { code_hash: '0x6ae5ee0cb887b2df5a9a18137315b9bdc55be8d52637b2de0624092d5f0c91d5', hash_type: 'type', net: 'testnet', src: 'ccc KnownScript.NostrLock' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

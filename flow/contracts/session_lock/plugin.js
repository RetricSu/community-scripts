// SESSION_LOCK — luongthanhtung03/ckb-session-kit contracts/session-lock/src/main.rs @ f51f07ccae4b45fa0c2cacfecc2dd8e799781f4a
// Deployment: src/lock.ts TESTNET_DEPLOYMENT + deployment/testnet.json + docs/SECURITY-EVIDENCE.md (testnet only; legacy 8/13 Oct deployments not matched)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const amt = d => { const b = H(d || '0x'); return b.length >= 16 ? R.leToBig(b.subarray(0, 16)) : null; };
  function parseArgs(hex) {
    const a = H(hex), n = a.length, tok = n === 128 || n === 160, rec = n === 112 ? 80 : n === 160 ? 128 : null;
    if (![80, 112, 128, 160].includes(n)) return null;
    return { owner: X(a.subarray(0, 32)), session: X(a.subarray(32, 64)), maxPerTx: R.leToBig(a.subarray(64, 72)), minInterval: R.leToBig(a.subarray(72, 80)),
      token: tok ? { typeHash: X(a.subarray(80, 112)), max: R.leToBig(a.subarray(112, 128)) } : null, recipient: rec != null ? X(a.subarray(rec, rec + 32)) : null, len: n };
  }
  function parse(g, ctx) {
    const p = { fields: [], layouts: [] }, A = p.args = parseArgs(g.script.args);
    p.fields.push(['args', g.script.args]);
    if (!A) return p;
    const lh = ctx.inputs.map(x => x.output ? R.scriptHash(x.output.lock) : null);
    p.owner = lh.includes(A.owner); p.session = lh.includes(A.session);
    p.mode = p.owner ? 'owner' : p.session ? 'session' : 'none';
    p.fields.push([{ zh: '模式', en: 'mode' }, p.mode === 'owner' ? { zh: 'owner 模式（不受限）', en: 'owner mode (unrestricted)' } : p.mode === 'session' ? { zh: 'session 模式（受限）', en: 'session mode (scoped)' } : { zh: '未授权', en: 'not authorized' }],
      ['owner_lock_hash', A.owner], ['session_lock_hash', A.session], ['max_per_tx', A.maxPerTx.toString() + ' shannon'], ['min_interval', A.minInterval.toString() + ' blocks']);
    if (A.token) p.fields.push(['token_type_hash', A.token.typeHash], ['max_per_tx_token', A.token.max.toString()]);
    if (A.recipient) p.fields.push(['recipient_lock_hash', A.recipient]);
    const L = [{ name: 'owner_lock_hash', size: '32B', color: 0, flex: 3 }, { name: 'session_lock_hash', size: '32B', color: 1, flex: 3 }, { name: 'max_per_tx', size: '8B', color: 2, flex: 1 }, { name: 'min_interval', size: '8B', color: 3, flex: 1 }];
    if (A.token) L.push({ name: 'token_type_hash', size: '32B', color: 4, flex: 3 }, { name: 'max_per_tx_token', size: '16B', color: 5, flex: 2 });
    if (A.recipient) L.push({ name: 'recipient_lock_hash', size: '32B', color: 6, flex: 3 });
    p.layouts.push({ label: `args (${A.len}B)`, layout: L, hex: [] });
    return p;
  }
  function check(g, ctx, p) {
    const c = [], A = p.args, t = ctx.tx;
    c.push(R.check(!!A, 'args 长度 ∈ {80,112,128,160}', 'args length ∈ {80,112,128,160}', 10));
    if (!A) return c;
    c.push(R.check(p.owner || p.session, '交易含 owner lock 或 session key lock 的输入', 'tx consumes an input under the owner lock or the session key lock', 11));
    c.push(R.NOT_CHECKED('签名由 owner / session key 自己的 lock 验证（本脚本委托，不验签）', 'signatures are verified by the owner / session key locks (delegated, not checked here)', null));
    if (p.mode !== 'session') return c;
    const tyH = o => o && o.type ? R.scriptHash(o.type) : null;
    const held = (o, d) => { const h = tyH(o); if (!h) return { k: 'u' }; if (!A.token || h !== A.token.typeHash) return { k: 'o' }; return { k: 't', a: amt(d), len: H(d || '0x').length }; };
    let typedOk = true, tokData = true, tokIn = 0n, spent = 0n;
    for (const i of g.inputs) { const x = ctx.inputs[i], h = held(x.output, x.data); spent += BigInt(x.output.capacity);
      if (h.k === 'o' || (h.k === 't' && !A.token)) typedOk = false; if (h.k === 't') { if (h.a == null) tokData = false; else tokIn += h.a; } }
    if (A.minInterval > 0n) {
      const ok = g.inputs.every(i => { const v = BigInt(t.inputs[i].since); return (v >> 61n) === 4n && (v & ((1n << 56n) - 1n)) >= A.minInterval; });
      c.push(R.check(ok, `每个 group 输入 since 为相对区块数 ≥ ${A.minInterval}`, `every group input has relative block since ≥ ${A.minInterval}`, 14));
    }
    let change = 0n, cells = 0, keyIn = 0n, keyOut = 0n, recOk = true, tokChange = 0n, keyTokIn = 0n, keyTokOut = 0n;
    ctx.inputs.forEach(x => { if (x.output && R.scriptHash(x.output.lock) === A.session) { keyIn += BigInt(x.output.capacity); const h = held(x.output, x.data); if (h.k === 't' && h.a != null) keyTokIn += h.a; } });
    t.outputs.forEach((o, i) => { const lh = R.scriptHash(o.lock), d = t.outputs_data[i], h = held(o, d);
      if (lh === g.hash) { cells++; change += BigInt(o.capacity); if (h.k === 'o') typedOk = false; if (h.k === 't') { if (h.a == null || h.len !== 16) tokData = false; else tokChange = h.a; } }
      else if (A.recipient) {
        if (lh === A.session) { keyOut += BigInt(o.capacity); if (h.k === 't') { if (h.a == null) tokData = false; else keyTokOut += h.a; } }
        else if (lh !== A.recipient && lh !== A.owner) recOk = false;
        else if (h.k === 'o') typedOk = false;
      } });
    c.push(R.check(typedOk, A.token ? 'group 输入 / 找零 / 收款 cell 无 type 或仅为 token type' : 'group 输入 / 找零 / 收款 cell 无 type script', A.token ? 'group inputs / change / payments untyped or the token type only' : 'group inputs / change / payments carry no type script', 18));
    c.push(R.check(cells <= 1, `回到本 lock 的输出 ${cells} ≤ 1`, `outputs back to this lock ${cells} ≤ 1`, 16));
    if (A.recipient) {
      c.push(R.check(recOk, '所有输出 lock ∈ {本 lock, session key, owner, recipient}', 'every output lock ∈ {this lock, session key, owner, recipient}', 13));
      c.push(R.check(keyOut <= keyIn, `key cell 输出 ${keyOut} ≤ 输入 ${keyIn}`, `key cell out ${keyOut} ≤ in ${keyIn}`, 17));
    }
    const out = spent > change ? spent - change : 0n;
    c.push(R.check(out <= A.maxPerTx, `流出 ${out} ≤ max_per_tx ${A.maxPerTx}（含手续费）`, `outflow ${out} ≤ max_per_tx ${A.maxPerTx} (fee included)`, 12));
    if (A.token) {
      c.push(R.check(tokData, 'token 输入 data ≥ 16B，token 找零 data = 16B', 'token input data ≥ 16B, token change data = 16B', 19));
      if (A.recipient) c.push(R.check(keyTokOut <= keyTokIn, 'key cell 的 token 不增加', 'key cell tokens do not grow', 17));
      const to = tokIn > tokChange ? tokIn - tokChange : 0n;
      c.push(R.check(to <= A.token.max, `token 流出 ${to} ≤ ${A.token.max}`, `token outflow ${to} ≤ ${A.token.max}`, 20));
    }
    return c;
  }
  R.register({ id: 'session_lock', kind: 'lock', name: { zh: 'Session lock（会话密钥）', en: 'Session lock (session keys)' },
    match: [{ code_hash: '0xab419466529ea479590d4be7b23580ce2ddc640ba902735c9ad9a22dc64c08ce', hash_type: 'data2', net: 'testnet', src: 'ckb-session-kit src/lock.ts TESTNET_DEPLOYMENT, deployment/testnet.json, docs/SECURITY-EVIDENCE.md' }],
    parse, check });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

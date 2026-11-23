// COMP Shared Lock v0.3 — gpBlockchain/comp-shared-lock contracts/comp-shared-lock/src/{main.rs,json.rs} @ fd2370ab4bfe15892fa2bc99c1cd92506c8bac63
// Deployment: repo deployment.json (= frontend/public/deployment.json), testnet only, Type ID code cell. secp256k1 recovery NOT_CHECKED (signing digest shown).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const CODE_HASH = '0xbc475946ff0e50276ca152c423cc260b8817de1c42a3be2eafffc55765f873c1';
  const SINCE_ONE = 0x8000000000000001n;
  // Port of json.rs parse_message: top-level object; public_key / signature: string|null; extensions: object|array|null (raw bytes kept);
  // duplicates of those three keys, trailing bytes, bad escapes, control chars, nesting ≥ 64 → WitnessFormat (14). Returns {err} or fields.
  function parseMessage(b) {
    const ws = i => { while (i < b.length && (b[i] === 32 || b[i] === 9 || b[i] === 10 || b[i] === 13)) i++; return i; };
    const fail = () => { throw new Error('14'); };
    const str = i => { if (b[i] !== 34) fail(); let j = i + 1;
      while (j < b.length) { const c = b[j];
        if (c === 92) { const e = b[j + 1]; if (e === undefined) fail();
          if ([34, 92, 47, 98, 102, 110, 114, 116].includes(e)) j += 2;
          else if (e === 117) { const d = b.subarray(j + 2, j + 6); if (d.length < 4 || ![...d].every(x => /[0-9a-fA-F]/.test(String.fromCharCode(x)))) fail(); j += 6; }
          else fail(); }
        else if (c === 34) return [new TextDecoder('utf-8', { fatal: true }).decode(b.subarray(i + 1, j)), j + 1];
        else if (c < 0x20) fail(); else j++; }
      fail(); };
    const num = i => { if (b[i] === 45) i++; if (b[i] === 48) i++; else if (b[i] >= 49 && b[i] <= 57) { i++; while (b[i] >= 48 && b[i] <= 57) i++; } else fail();
      if (b[i] === 46) { i++; const f = i; while (b[i] >= 48 && b[i] <= 57) i++; if (i === f) fail(); }
      if (b[i] === 101 || b[i] === 69) { i++; if (b[i] === 43 || b[i] === 45) i++; const f = i; while (b[i] >= 48 && b[i] <= 57) i++; if (i === f) fail(); } return i; };
    const lit = (i, s) => { for (let k = 0; k < s.length; k++) if (b[i + k] !== s.charCodeAt(k)) return -1; return i + s.length; };
    const val = (i, d) => { if (d >= 64) fail(); const c = b[i];
      if (c === 34) return str(i)[1]; if (c === 123) return obj(i, d + 1); if (c === 91) return arr(i, d + 1);
      for (const s of ['null', 'true', 'false']) { const e = lit(i, s); if (e > 0) return e; }
      if (c === 45 || (c >= 48 && c <= 57)) return num(i); fail(); };
    const obj = (s, d) => { let i = ws(s + 1); if (b[i] === 125) return i + 1;
      for (;;) { i = ws(str(i)[1]); if (b[i] !== 58) fail(); i = ws(val(ws(i + 1), d)); if (b[i] === 44) i = ws(i + 1); else if (b[i] === 125) return i + 1; else fail(); } };
    const arr = (s, d) => { let i = ws(s + 1); if (b[i] === 93) return i + 1;
      for (;;) { i = ws(val(i, d)); if (b[i] === 44) i = ws(i + 1); else if (b[i] === 93) return i + 1; else fail(); } };
    const top = i => { const c = b[i];
      if (c === 34) { const [s, e] = str(i); return { t: 'str', v: s, e }; }
      if (c === 110) { const e = lit(i, 'null'); if (e < 0) fail(); return { t: 'null', e }; }
      if (c === 123 || c === 91) { const e = c === 123 ? obj(i, 1) : arr(i, 1); return { t: 'raw', v: b.subarray(i, e), e }; }
      const t = lit(i, 'true'); if (t > 0) return { t: 'other', e: t }; const f = lit(i, 'false'); if (f > 0) return { t: 'other', e: f };
      if (c === 45 || (c >= 48 && c <= 57)) return { t: 'other', e: num(i) }; fail(); };
    try {
      const out = { public_key: null, signature: null, extensions: null, keys: [] }, seen = {};
      let i = ws(0); if (b[i] !== 123) fail(); i = ws(i + 1);
      if (b[i] !== 125) for (;;) {
        i = ws(i); const [k, ni] = str(i); i = ws(ni); if (b[i] !== 58) fail(); i = ws(i + 1);
        const v = top(i); i = v.e; out.keys.push(k);
        if (k === 'public_key' || k === 'signature' || k === 'extensions') {
          if (seen[k]) fail(); seen[k] = 1;
          if (v.t === 'null') {} else if (k !== 'extensions' && v.t === 'str') out[k] = v.v; else if (k === 'extensions' && v.t === 'raw') out[k] = v.v; else fail();
        }
        i = ws(i); if (b[i] === 44) { i++; continue; } if (b[i] === 125) break; fail();
      }
      if (ws(i + 1) !== b.length) fail();
      return out;
    } catch (e) { return { err: e.message === '14' ? 'WitnessFormat' : e.message }; }
  }
  const hexFixed = (s, n) => { const t = s.startsWith('0x') ? s.slice(2) : s; return t.length === n * 2 && /^[0-9a-fA-F]*$/.test(t) ? H('0x' + t) : null; };
  const isComp = (l, s) => l && l.code_hash === s.code_hash && l.hash_type === s.hash_type;
  const shannon = v => (Number(v) / 1e8).toFixed(8).replace(/\.?0+$/, '') + ' CKB';

  R.register({
    id: 'comp_shared_lock', kind: 'lock', name: { zh: 'COMP 共享 Lock（公共 cell）', en: 'COMP Shared Lock (public cell)' },
    match: [{ code_hash: CODE_HASH, hash_type: 'type', net: 'testnet', src: 'gpBlockchain/comp-shared-lock deployment.json @fd2370a (codeHash = Type ID typeHash, hashType type)' }],
    parse(g, ctx) {
      const p = { fields: [], layouts: [] }, s = g.script, a = H(s.args || '0x'); p.args = a;
      if (a.length === 40) { p.maxFee = R.leToBig(a.subarray(32, 40));
        p.fields.push(['channel_hash', X(a.subarray(0, 32))], ['max_fee', `${p.maxFee} shannon (${shannon(p.maxFee)})`]);
        p.layouts.push({ label: 'lock.args (40B)', layout: [{ name: 'channel_hash', size: '32B', color: 0, flex: 4 }, { name: 'max_fee u64 LE', size: '8B', color: 1, flex: 1 }], hex: [['channel_hash', X(a.subarray(0, 32))], ['max_fee', X(a.subarray(32))]] }); }
      const gi = g.inputs[0], inp = ctx.inputs[gi];
      p.since = inp ? BigInt(inp.input.since) : null; p.fields.push(['since', inp ? inp.input.since : '?']);
      p.compIn = ctx.inputs.map((x, i) => x.output && isComp(x.output.lock, s) ? i : -1).filter(i => i >= 0);
      p.compOut = ctx.tx.outputs.map((o, i) => isComp(o.lock, s) ? i : -1).filter(i => i >= 0);
      p.fields.push([{ zh: 'COMP 输入 / 输出', en: 'COMP inputs / outputs' }, `[${p.compIn}] → [${p.compOut}]`]);
      if (inp && inp.output) { p.inCap = BigInt(inp.output.capacity); p.inType = inp.output.type; }
      if (p.compOut.length === 1) { const o = ctx.tx.outputs[p.compOut[0]]; p.succ = o; p.outCap = BigInt(o.capacity);
        p.fields.push(['capacity', `${shannon(p.inCap)} → ${shannon(p.outCap)} (Δ ${p.outCap - p.inCap} shannon)`]); }
      // witness: missing slot → anonymous; '0x' / bad molecule → WitnessArgs decode error (14)
      const w = ctx.witnesses[g.witnessIndex]; p.w = w;
      if (!w) p.mode = 'anon-nowitness';
      else if (w.empty || w.error) p.mode = 'bad-witnessargs';
      else if (!w.args.lock || H(w.args.lock).length === 0) p.mode = 'anon-nolock';
      else {
        const mb = H(w.args.lock); let txt = null;
        try { txt = new TextDecoder('utf-8', { fatal: true }).decode(mb); } catch (e) { p.mode = 'bad-utf8'; }
        if (txt != null) { const m = parseMessage(mb); p.msg = m;
          if (m.err) p.mode = 'bad-json';
          else if (!m.public_key && !m.signature) p.mode = 'anon-json';
          else if (!m.public_key || !m.signature) p.mode = 'one-identity';
          else p.mode = 'signed';
          if (!m.err) {
            if (m.extensions) { let ext = null; try { ext = JSON.parse(new TextDecoder().decode(m.extensions)); } catch (e) {}
              const pl = ext && typeof ext.payload === 'string' ? ext.payload : null;
              p.fields.push(['extensions', ext && !Array.isArray(ext) ? `protocol=${ext.protocol} version=${ext.version} type=${ext.type}` + (pl != null ? ` payload=${new TextEncoder().encode(pl).length}B${pl.startsWith('CW2:') ? ' (comp-wall v2 CW2:)' : ''}` : '') : `${m.extensions.length}B`]); }
            if (m.public_key) p.fields.push(['public_key', m.public_key]);
            if (m.signature) p.fields.push(['signature', m.signature]);
          }
          if (p.mode === 'signed' && m.extensions) {
            p.pk = hexFixed(m.public_key, 33); p.sig = hexFixed(m.signature, 65);
            const mh = new Uint8Array(65 + m.extensions.length); mh.set(m.extensions, 65);
            p.messageHash = R.ckbHash(mh);
            const dg = new Uint8Array(64); dg.set(H(ctx.txHash || ctx.tx.hash), 0); dg.set(H(p.messageHash), 32);
            p.digest = R.ckbHash(dg);
            p.fields.push(['message_hash', p.messageHash], ['signing_digest', p.digest]);
            if (p.sig) p.layouts.push({ label: 'signature (65B)', layout: [{ name: 'r', size: '32B', color: 2, flex: 2 }, { name: 's', size: '32B', color: 3, flex: 2 }, { name: 'recid', size: '1B', color: 4, flex: 1 }], hex: [['r', X(p.sig.subarray(0, 32))], ['s', X(p.sig.subarray(32, 64))], ['recid', X(p.sig.subarray(64))]] });
          }
        }
      }
      p.fields.unshift([{ zh: '消息模式', en: 'message mode' }, { 'anon-nowitness': { zh: '匿名（无 witness）', en: 'anonymous (no witness)' }, 'anon-nolock': { zh: '匿名（WitnessArgs.lock 为空）', en: 'anonymous (empty WitnessArgs.lock)' }, 'anon-json': { zh: '匿名（public_key / signature 为 null）', en: 'anonymous (public_key / signature null)' }, signed: { zh: '签名消息', en: 'signed message' } }[p.mode] || p.mode]);
      return p;
    },
    check(g, ctx, p) {
      const c = [], s = g.script;
      c.push(R.check(p.args.length === 40, `args 长度 ${p.args.length} = 40（channel_hash ‖ max_fee）`, `args length ${p.args.length} = 40 (channel_hash ‖ max_fee)`, 6));
      c.push(R.check(g.inputs.length === 1, `本 group 输入数 ${g.inputs.length} = 1（不可合并）`, `group input count ${g.inputs.length} = 1 (no merge)`, 8));
      c.push(R.check(p.since === SINCE_ONE, `输入 since = 0x8000000000000001（相对 1 个区块），实际 ${p.since == null ? '?' : '0x' + p.since.toString(16)}`, `input since = 0x8000000000000001 (relative 1 block), got ${p.since == null ? '?' : '0x' + p.since.toString(16)}`, 16));
      c.push(R.check(p.compIn.length === 1, `交易中同 code_hash + hash_type 的 COMP 输入数 ${p.compIn.length} = 1`, `COMP inputs (same code_hash + hash_type) in tx: ${p.compIn.length} = 1`, 7));
      c.push(R.check(p.compOut.length === 1, `COMP 输出（后继）数 ${p.compOut.length} = 1（不可分叉 / 销毁）`, `COMP outputs (successor) ${p.compOut.length} = 1 (no fork / destroy)`, 9));
      if (p.compOut.length !== 1) return c;
      c.push(R.check(!p.inType && !p.succ.type, '输入与后继 cell 都没有 type script', 'input and successor carry no type script', 10));
      const same = p.succ.lock.code_hash === s.code_hash && p.succ.lock.hash_type === s.hash_type && p.succ.lock.args === s.args;
      c.push(R.check(same, '后继 lock 与输入 lock 逐字节相同（channel_hash、max_fee 不可变）', 'successor lock byte-identical to input lock (channel_hash, max_fee immutable)', 11));
      if (p.maxFee != null) c.push(R.check(p.outCap + p.maxFee >= p.inCap, `后继 capacity ${p.outCap} + max_fee ${p.maxFee} ≥ 输入 ${p.inCap}`, `successor capacity ${p.outCap} + max_fee ${p.maxFee} ≥ input ${p.inCap}`, 12));
      const m = p.mode;
      if (m.startsWith('anon')) { c.push(R.check(true, '匿名消息：无身份字段，签名不需要', 'anonymous message: no identity, no signature required', '14')); return c; }
      c.push(R.check(m !== 'bad-witnessargs' && m !== 'bad-utf8' && m !== 'bad-json', 'witness 是合法 WitnessArgs，lock 为合法 UTF-8 JSON（无重复键、无尾随字节）', 'witness is valid WitnessArgs, lock is valid UTF-8 JSON (no duplicate keys, no trailing bytes)', 14));
      if (m === 'bad-witnessargs' || m === 'bad-utf8' || m === 'bad-json') return c;
      c.push(R.check(m === 'signed', 'public_key 与 signature 同时存在或同时缺省', 'public_key and signature both present or both absent', 13));
      if (m !== 'signed') return c;
      c.push(R.check(!!p.msg.extensions, 'signed 消息必须带 extensions（object / array）', 'signed message must carry extensions (object / array)', 14));
      c.push(R.check(!!p.pk, 'public_key = 33 字节压缩公钥 hex', 'public_key = 33-byte compressed key hex', 14));
      c.push(R.check(!!p.sig, 'signature = 65 字节 hex（r ‖ s ‖ recid）', 'signature = 65-byte hex (r ‖ s ‖ recid)', 14));
      if (p.sig) c.push(R.check([0, 1, 2, 3, 27, 28].includes(p.sig[64]), `recid ${p.sig[64]} ∈ {0..3, 27, 28}`, `recid ${p.sig[64]} ∈ {0..3, 27, 28}`, 15));
      c.push(R.NOT_CHECKED(`secp256k1 从 signing_digest ${p.digest ? p.digest.slice(0, 18) + '…' : ''} 恢复公钥并等于 public_key`, `secp256k1 key recovered from signing_digest ${p.digest ? p.digest.slice(0, 18) + '…' : ''} equals public_key`, 15));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

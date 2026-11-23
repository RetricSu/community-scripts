// FIBER_COMMITMENT_LOCK — nervosnetwork/fiber-scripts contracts/commitment-lock/src/main.rs (HEAD e7e1c9ba, 2026-10-01); deployments: nervosnetwork/fiber config/{mainnet,testnet}/config.yml
// @requires rgbpp_lock
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, le = b => R.leToBig(b);
  const EMPTY = '0x10000000100000001000000010000000', SIG = 65, PRE = 32;
  // ckb-std Since ordering: comparable only when the flag byte matches; epochs compare as number + index/length
  const flags = s => s >> 56n, isEpoch = s => ((s >> 61n) & 3n) === 1n, isTs = s => ((s >> 61n) & 3n) === 2n, rel = s => (s >> 63n) === 1n;
  const ep = s => [s & 0xffffffn, (s >> 24n) & 0xffffn, (s >> 40n) & 0xffffn];
  function ge(a, b) { if (flags(a) !== flags(b)) return false; if (!isEpoch(a)) return (a & 0xffffffffffffffn) >= (b & 0xffffffffffffffn);
    const [n1, i1, l1] = ep(a), [n2, i2, l2] = ep(b), L1 = l1 || 1n, L2 = l2 || 1n; return (n1 * L1 + i1) * L2 >= (n2 * L2 + i2) * L1; }
  function mul(d, num, den) { const [n, i, l] = ep(d); const fn = num * (n * l + i), nd = den * l, s = nd > 1800n ? nd / 1800n + 1n : 1n;
    return (0x80n << 56n) | (0x20n << 56n) | ((nd / s) << 40n) | (((fn % nd) / s) << 24n) | (fn / nd); }
  const sinceOk = (since, d) => isEpoch(since) && rel(since) && ge(since, d);
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsLen: a.length, fields: [] };
    p.layout = a.length === 57 ? { len: 85, ph: 20, name: 'legacy' } : a.length === 58 && a[57] === 1 ? { len: 97, ph: 32, name: 'v1 (full payment hash)' } : null;
    if (a.length >= 57) { p.pkh = X(a.subarray(0, 20)); p.delay = le(a.subarray(20, 28)); p.version = X(a.subarray(28, 36)); p.sh = X(a.subarray(36, 56)); p.first = a[56] === 0;
      p.fields.push(['pubkey_hash', p.pkh], ['delay_epoch', (() => { const [n, i, l] = ep(p.delay); return `${rel(p.delay) ? 'relative' : 'absolute'} epoch ${n}+${i}/${l}`; })()], ['version (BE)', p.version], ['settlement_hash', p.sh], ['settlement_flag', p.first ? '0x00 (first)' : '0x01 (subsequent)']); }
    p.fields.push(['HTLC layout', p.layout ? `${p.layout.name}, ${p.layout.len} B/HTLC` : '(invalid args length)']);
    const w = H(ctx.tx.witnesses[g.inputs[0]] || '0x'); p.prefix = X(w.subarray(0, 16)); const b = w.subarray(16);
    if (!b.length) return p; p.count = b[0]; const v = b.subarray(1);
    if (p.count === 0) { p.mode = 'revocation'; p.newVersion = X(v.subarray(0, 8)); p.fields.push([{ zh: '路径', en: 'path' }, { zh: '撤销（revocation）', en: 'revocation' }], ['new version (BE)', p.newVersion]); return p; }
    p.mode = 'settlement'; if (!p.layout) return p;
    const n = v[0], phl = 1 + n * p.layout.len, sl = phl + 72; p.n = n; p.sl = sl; p.vlen = v.length;
    p.fields.push([{ zh: '路径', en: 'path' }, { zh: `结算（unlock_count ${p.count}）`, en: `settlement (unlock_count ${p.count})` }], ['pending_htlc_count', n]);
    if (v.length < sl) return p;
    p.hashOk = X(R.blake2b(v.subarray(0, sl)).subarray(0, 20)) === p.sh;
    const htlcs = []; for (let k = 0; k < n; k++) { const h = v.subarray(1 + k * p.layout.len, 1 + (k + 1) * p.layout.len), o = 17 + p.layout.ph;
      htlcs.push({ raw: h, received: (h[0] & 1) === 1, sha: ((h[0] >> 1) & 1) === 1, amount: le(h.subarray(1, 17)), hash: h.subarray(17, o), remote: X(h.subarray(o, o + 20)), local: X(h.subarray(o + 20, o + 40)), expiry: le(h.subarray(o + 40, o + 48)) });
      p.fields.push([`htlc[${k}]`, `${h[0] & 1 ? 'received' : 'offered'} ${(h[0] >> 1) & 1 ? 'sha256' : 'blake2b'} amount=${htlcs[k].amount} hash=${X(htlcs[k].hash)} expiry=0x${htlcs[k].expiry.toString(16)}`]); }
    const ps = v.subarray(phl, sl); p.remote = { pkh: X(ps.subarray(0, 20)), amt: le(ps.subarray(20, 36)) }; p.local = { pkh: X(ps.subarray(36, 56)), amt: le(ps.subarray(56, 72)) };
    p.fields.push(['settlement_remote', `${p.remote.pkh} amount=${p.remote.amt}`], ['settlement_local', `${p.local.pkh} amount=${p.local.amt}`]);
    const us = []; let i = sl, err = null;
    while (v.length > i) { const t = v[i]; if (t >= n && t !== 0xfe && t !== 0xff) { err = 7; break; } const wp = v[i + 1];
      if (wp === 0) { us.push({ t, pre: null }); i += 2 + SIG; } else if (wp === 1) { us.push({ t, pre: v.subarray(i + 2 + SIG, i + 2 + SIG + PRE) }); i += 2 + SIG + PRE; } else { err = 8; break; } }
    p.unlocks = us; p.unlockErr = err; p.htlcs = htlcs; p.ps = ps;
    us.forEach((u, k) => p.fields.push([`unlock[${k}]`, (u.t === 0xfe ? 'settlement remote' : u.t === 0xff ? 'settlement local' : `htlc[${u.t}]`) + (u.pre ? ' + preimage ' + X(u.pre) : '')]));
    return p;
  }
  function check(g, ctx, p) {
    if (!p.layout && (p.argsLen === 36 || p.argsLen === 56)) return [R.NOT_CHECKED(`args ${p.argsLen} 字节：早期合约版本（type_id 升级前）的格式，本插件按 HEAD 源码解析，不检查`, `args of ${p.argsLen} bytes: format of an earlier contract version (before a type_id upgrade); this plugin follows HEAD source and does not check it`, 12)];
    const c = [R.check(g.inputs.length === 1, `group 输入 ${g.inputs.length} = 1`, `group inputs ${g.inputs.length} = 1`, 5),
      R.check(!!p.layout, `args 长度 ${p.argsLen} = 57（旧版），或 58 且 args[57] = 0x01（完整 payment hash）`, `args length ${p.argsLen} = 57 (legacy), or 58 with args[57] = 0x01 (full payment hash)`, 12),
      R.check(p.prefix === EMPTY, 'witness 前 16 字节 = 空 WitnessArgs 占位', 'witness first 16 bytes = empty WitnessArgs placeholder', 14)];
    if (!p.layout || !p.mode) return c;
    const inp = ctx.inputs[g.inputs[0]], since = BigInt(inp.input.since);
    if (p.mode === 'revocation') {
      c.push(R.check(p.newVersion >= p.version, `撤销：witness 版本 ${p.newVersion} ≥ args 版本 ${p.version}（大端）`, `revocation: witness version ${p.newVersion} ≥ args version ${p.version} (big-endian)`, 17),
        R.NOT_CHECKED('Schnorr 聚合签名覆盖 blake2b(outputs[0] ‖ data_len u32 ‖ data ‖ args[0..28] ‖ new_version)', 'aggregated Schnorr signature over blake2b(outputs[0] ‖ data_len u32 ‖ data ‖ args[0..28] ‖ new_version)', 23));
      return c;
    }
    c.push(R.check(p.vlen >= p.sl, 'witness 包含完整 settlement 脚本（1 + N×HTLC + 72 字节）', 'witness holds the full settlement script (1 + N×HTLC + 72 bytes)', 13));
    if (p.vlen < p.sl) return c;
    c.push(R.check(p.hashOk, 'blake2b(settlement 脚本)[0..20] = args.settlement_hash', 'blake2b(settlement script)[0..20] = args.settlement_hash', 15));
    c.push(R.check(p.unlockErr !== 7, 'unlock_type < pending_htlc_count，或 0xFE / 0xFF', 'unlock_type < pending_htlc_count, or 0xFE / 0xFF', 7), R.check(p.unlockErr !== 8, 'with_preimage ∈ {0, 1}', 'with_preimage ∈ {0, 1}', 8));
    if (p.unlockErr) return c;
    c.push(R.check(p.unlocks.length > 0, '至少一个 unlock', 'at least one unlock', 9));
    const ts = ctx.tx.inputs.map(x => BigInt(x.since)).find(s => isTs(s) && !rel(s)) || 0n;
    let amt = inp.output.type ? le(H(inp.data).subarray(0, 16)) : BigInt(inp.output.capacity);
    const us = p.unlocks.slice(), keep = []; let sigs = 0;
    p.htlcs.forEach((h, k) => {
      if (us.length && us[0].t === k) { const u = us.shift();
        if (ts === 0n) { if (p.first) c.push(R.check(sinceOk(since, mul(p.delay, 1n, 3n)), `htlc[${k}] 用原像：首次结算需相对 epoch since ≥ delay×1/3`, `htlc[${k}] by preimage: first settlement needs relative-epoch since ≥ delay×1/3`, 6));
          const d = u.pre ? (h.sha ? R.rgbpp.sha256(u.pre) : R.blake2b(u.pre)) : null;
          c.push(R.check(!!d && X(d.subarray(0, h.hash.length)) === X(h.hash), `htlc[${k}] 原像哈希（${h.sha ? 'sha256' : 'blake2b'}）= payment_hash`, `htlc[${k}] preimage hash (${h.sha ? 'sha256' : 'blake2b'}) = payment_hash`, 22));
        } else { if (p.first) c.push(R.check(sinceOk(since, mul(p.delay, 2n, 3n)), `htlc[${k}] 超时：首次结算需相对 epoch since ≥ delay×2/3`, `htlc[${k}] timeout: first settlement needs relative-epoch since ≥ delay×2/3`, 6));
          c.push(R.check(ge(ts, h.expiry), `htlc[${k}] 超时：绝对时间戳 since 0x${ts.toString(16)} ≥ htlc_expiry 0x${h.expiry.toString(16)}`, `htlc[${k}] timeout: absolute timestamp since 0x${ts.toString(16)} ≥ htlc_expiry 0x${h.expiry.toString(16)}`, 11)); }
        amt = amt > h.amount ? amt - h.amount : 0n; sigs++;
      } else keep.push(h.raw); });
    const ps = p.ps; let tail, both = false, party = false;
    if (us.length === 1) { const u = us.shift(); if (u.t === 0xfe || u.t === 0xff) {
        if (p.first) c.push(R.check(sinceOk(since, p.delay), '双方结算：首次结算需相对 epoch since ≥ delay_epoch', 'party settlement: first settlement needs relative-epoch since ≥ delay_epoch', 6));
        const z = new Uint8Array(36);
        if (u.t === 0xfe) { amt = amt > p.remote.amt ? amt - p.remote.amt : 0n; tail = [z, ps.subarray(36, 72)]; both = ps.subarray(36, 72).every(x => !x); }
        else { amt = amt > p.local.amt ? amt - p.local.amt : 0n; tail = [ps.subarray(0, 36), z]; both = ps.subarray(0, 36).every(x => !x); }
        party = true; sigs++; } else c.push(R.check(false, '剩余 unlock 必须是 0xFE / 0xFF', 'the remaining unlock must be 0xFE / 0xFF', 7));
    } else if (us.length === 0) tail = [ps]; else c.push(R.check(false, `未匹配的 unlock ${us.length} ≤ 1`, `unmatched unlocks ${us.length} ≤ 1`, 9));
    if (!tail) return c;
    if (amt > 0n && !both) {
      const a = H(g.script.args), ns = [Uint8Array.of(p.n - (p.htlcs.length - keep.length)), ...keep, ...tail], cat = new Uint8Array(ns.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of ns) { cat.set(x, o); o += x.length; }
      const exp = X(a.subarray(0, 36)) + X(R.blake2b(cat).subarray(0, 20)).slice(2) + '01' + (a.length === 58 ? X(a.subarray(57)).slice(2) : '');
      const out = ctx.tx.outputs[0], od = H(ctx.tx.outputs_data[0] || '0x');
      c.push(R.check(!!out && out.lock.code_hash === g.script.code_hash && out.lock.hash_type === g.script.hash_type && out.lock.args === exp, 'outputs[0].lock = 同脚本，args = args[0..36] ‖ 新 settlement_hash ‖ 0x01 (‖ 特性字节)', 'outputs[0].lock = same script, args = args[0..36] ‖ new settlement_hash ‖ 0x01 (‖ feature byte)', 19));
      if (inp.output.type) { if (!party) c.push(R.check(out && out.capacity === inp.output.capacity, 'UDT 通道（HTLC 结算）：输出 capacity = 输入 capacity', 'UDT channel (HTLC settlement): output capacity = input capacity', 18));
        c.push(R.check(out && JSON.stringify(out.type) === JSON.stringify(inp.output.type), '输出 type = 输入 UDT type', 'output type = input UDT type', 20), R.check(od.length >= 16 && le(od.subarray(0, 16)) === amt, `输出 UDT 数量 = 剩余 ${amt}`, `output UDT amount = remaining ${amt}`, 21));
      } else c.push(R.check(out && !out.type, '输出不带 type', 'output has no type', 20), R.check(out && BigInt(out.capacity) === amt, `输出 capacity = 剩余 ${amt}`, `output capacity = remaining ${amt}`, 18));
    }
    c.push(R.check(sigs > 0, '至少一个签名需要验证', 'at least one signature to verify', 10),
      R.NOT_CHECKED(`${sigs} 个 secp256k1 签名（ckb-auth 算法 0）覆盖 blake2b(raw tx 去掉 cell_deps)`, `${sigs} secp256k1 signature(s) (ckb-auth algorithm 0) over blake2b(raw tx without cell_deps)`, 23));
    return c;
  }
  R.register({ id: 'fiber_commitment_lock', kind: 'lock', name: 'Fiber Commitment Lock', match: [
    { code_hash: '0x2d45c4d3ed3e942f1945386ee82a5d1b7e4bb16d7fe1ab015421174ab747406c', hash_type: 'type', net: 'mainnet', src: 'nervosnetwork/fiber config/mainnet/config.yml' },
    { code_hash: '0x740dee83f87c6f309824d8fd3fbdd3c8380ee6fc9acc90b1a748438afcdf81d8', hash_type: 'type', net: 'testnet', src: 'nervosnetwork/fiber config/testnet/config.yml' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

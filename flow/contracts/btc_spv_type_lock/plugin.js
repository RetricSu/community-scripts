// BTC_SPV_TYPE_LOCK — ckb-cell/ckb-bitcoin-spv-contracts @f3e3ba8 (tag btc-mainnet-v0.1.0) contracts/ckb-bitcoin-spv-type-lock/src/{entry,error}.rs + operations/{create,update,reorg}.rs;
// types + verify_new_client from ckb-cell/ckb-bitcoin-spv @a3c43fd verifier/{schemas/types.mol, src/types/extension/packed.rs, src/error.rs}
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  // ---- sha256 (FIPS 180-4), used for Bitcoin block hashes (sha256d) ----
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  function sha256(m) {
    const l = m.length, n = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(n); b.set(m); b[l] = 0x80; const bits = l * 8; for (let i = 0; i < 4; i++) b[n - 1 - i] = (bits / 2 ** (8 * i)) & 255;
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
  const sha256d = b => sha256(sha256(b)), leBig = b => R.leToBig(b), u32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
  const target = bits => { const e = bits >>> 24, m = BigInt(bits & 0x7fffff); return e <= 3 ? m >> BigInt(8 * (3 - e)) : m << BigInt(8 * (e - 3)); };
  const be = b => X(Uint8Array.from(b).reverse()); // display order
  // SpvTypeArgs { type_id 32, clients_count u8, flags u8 } · SpvInfo { tip_client_id u8 } · SpvClient { id u8, tip_block_hash 32, HeaderDigest{min u32, max u32, work U256 LE, children 32}, TargetAdjustInfo{start_time u32, next_compact_target u32} } = 113 B
  const client = d => d.length !== 113 ? null : { id: d[0], tip: X(d.subarray(1, 33)), min: u32(d, 33), max: u32(d, 37), work: leBig(d.subarray(41, 73)), rest: X(d.subarray(1)), tai: X(d.subarray(105, 113)), raw: X(d) };
  const info = d => d.length === 1 ? { tip: d[0] } : null;
  const prev = (c, n) => c === 0 ? n - 1 : c - 1, next = (c, n) => c + 1 < n ? c + 1 : 0;
  // SpvUpdate table { headers: fixvec<[u8;80]>, new_headers_mmr_proof: fixvec<HeaderDigest> }
  function update(hex) { const f = R.parseTable(H(hex), 2), hv = f[0], n = u32(hv, 0); if (hv.length !== 4 + 80 * n) throw new Error('HeaderVec length'); return Array.from({ length: n }, (_, i) => hv.subarray(4 + 80 * i, 84 + 80 * i)); }
  function headersCheck(c, hs, outClient, flags) {
    c.push(R.check(hs.length > 0, `SpvUpdate.headers 非空（${hs.length}）`, `SpvUpdate.headers not empty (${hs.length})`, '0x69'));
    if (!hs.length) return;
    let ok = true, pow = true, tip = null;
    hs.forEach((h, i) => { const hh = sha256d(h); if (i && X(h.subarray(4, 36)) !== tip) ok = false; if (!(flags & 0x80) && leBig(hh) > target(u32(h, 72))) pow = false; tip = X(hh); });
    c.push(R.check(ok, 'headers 之间连续（prev_blockhash = 前一个的 sha256d）', 'headers are continuous among themselves (prev_blockhash = sha256d of the previous)', '0x6a'));
    c.push(R.check(pow, flags & 0x80 ? 'flags 0x80：跳过 PoW 与难度检查' : '每个 header 的 sha256d ≤ 其 bits 目标（PoW）', flags & 0x80 ? 'flags 0x80: PoW and difficulty checks skipped' : 'each header sha256d ≤ its bits target (PoW)', '0x6c'));
    if (outClient) c.push(R.check(outClient.tip === tip, `新 client tip_block_hash = 最后一个 header 的哈希 ${be(H(tip))}`, `new client tip_block_hash = hash of the last header ${be(H(tip))}`, '0x7a'));
    c.push(R.NOT_CHECKED('第一个 header 接在 cell_dep 中 tip client 之后；bits = 期望难度；MMR 增量证明；min/max 高度与 target_adjust_info（需要 cell_dep 中的 tip client，解码器不读取）', 'the first header extends the tip client in cell_deps; bits = expected difficulty; incremental MMR proof; min/max height and target_adjust_info (needs the tip client from cell_deps, which the decoder does not load)', '0x6a/0x6b/0x71/0x72/0x7b–0x7d'));
  }
  function parse(g, ctx) {
    const a = H(g.script.args), p = { argsOk: a.length === 34, nIn: g.inputs.length, nOut: g.outputs.length };
    if (p.argsOk) { p.typeId = X(a.subarray(0, 32)); p.count = a[32]; p.flags = a[33]; }
    p.op = p.nIn === 0 ? 'create' : p.nIn === 2 && p.nOut === 2 ? 'update' : p.nIn === p.nOut && p.nIn > 2 ? 'reorg' : 'unknown';
    const rd = (src, i) => H(src === 'in' ? ctx.inputs[i].data : ctx.tx.outputs_data[i]);
    p.ins = g.inputs.map(i => { const d = rd('in', i); return { i, info: info(d), client: client(d) }; });
    p.outs = g.outputs.map(i => { const d = rd('out', i); return { i, info: info(d), client: client(d) }; });
    p.fields = [['type_id (args[0..32])', p.typeId || '—'], ['clients_count / flags', p.argsOk ? `${p.count} / 0x${p.flags.toString(16).padStart(2, '0')}` : '—'],
      [{ zh: '操作', en: 'operation' }, { create: { zh: '创建实例', en: 'create instance' }, update: { zh: '更新（覆盖最旧 client）', en: 'update (overwrite the oldest client)' }, reorg: { zh: '重组', en: 'reorg' }, unknown: { zh: '未知', en: 'unknown' } }[p.op]]];
    const ic = p.ins.find(x => x.info), oc = p.outs.find(x => x.info);
    if (ic) p.fields.push(['in tip_client_id', String(ic.info.tip)]); if (oc) p.fields.push(['out tip_client_id', String(oc.info.tip)]);
    for (const x of p.outs) if (x.client) p.fields.push([`out client #${x.client.id} (max height)`, `${x.client.max} · tip ${be(H(x.client.tip))}`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsOk, 'args = SpvTypeArgs（34 字节）', 'args = SpvTypeArgs (34 bytes)', '0x04'),
      R.check(p.op !== 'unknown', `cell 数量（输入 ${p.nIn}，输出 ${p.nOut}）为 0→n 创建、2→2 更新或 m→m（m > 2）重组；此版本未启用销毁`, `cell count (in ${p.nIn}, out ${p.nOut}) is 0→n create, 2→2 update or m→m (m > 2) reorg; destroy is disabled in this version`, '0x10')];
    if (!p.argsOk || p.op === 'unknown') return c;
    if (p.op === 'create') {
      const idx = g.outputs;
      c.push(R.check(idx.length >= 4, `输出 ≥ 1 info + 2 client + 1（实际 ${idx.length}）`, `outputs ≥ 1 info + 2 clients + 1 (got ${idx.length})`, '0x20'));
      c.push(R.check(idx.every((x, k) => !k || idx[k - 1] + 1 === x), '这些输出连续排列', 'those outputs are contiguous', '0x21'));
      c.push(R.check(idx.length === 1 + p.count, `输出数 = 1 + clients_count（${1 + p.count}）`, `output count = 1 + clients_count (${1 + p.count})`, '0x22'));
      let tid = null; if (ctx.tx.inputs.length) { const i0 = ctx.tx.inputs[0], b = new Uint8Array(52); const u = v => { let x = BigInt(v); const o = new Uint8Array(8); for (let k = 0; k < 8; k++) { o[k] = Number(x & 255n); x >>= 8n; } return o; };
        b.set(u(i0.since)); b.set(H(i0.previous_output.tx_hash), 8); b.set(u(parseInt(i0.previous_output.index, 16)).subarray(0, 4), 40); b.set(u(idx.length), 44); tid = R.ckbHash(b); }
      c.push(R.check(tid === p.typeId, 'type_id = blake2b(第一个 CellInput ‖ 输出数量 u64)（注意用的是数量不是序号）', 'type_id = blake2b(first CellInput ‖ output count u64) (count, not index)', '0x23'));
      const first = p.outs[0];
      c.push(R.check(!!first.info, '第一个输出是 SpvInfo（1 字节）', 'the first output is an SpvInfo (1 byte)', '0x24'));
      if (first.info) c.push(R.check(first.info.tip === 0, 'tip_client_id = 0', 'tip_client_id = 0', '0x25'));
      const w = ctx.witnesses[first.i], bs = w && w.args && w.args.output_type;
      c.push(R.check(!!bs, `witnesses[${first.i}].output_type 有 SpvBootstrap`, `witnesses[${first.i}].output_type holds an SpvBootstrap`, '0x26'));
      const cl = p.outs.slice(1).map(x => x.client);
      c.push(R.check(cl.every(Boolean), '其余输出都是 SpvClient（113 字节）', 'the remaining outputs are SpvClients (113 bytes)', '0x27'));
      if (cl.every(Boolean)) {
        c.push(R.check(cl.every((x, k) => x.id === k && x.rest === cl[0].rest), 'client id 依次为 0..n-1，其余字段全部相同', 'client ids are 0..n-1 and all other fields identical', '0x28'));
        if (bs) { const b = H(bs); if (b.length === 84) { const hh = sha256d(b.subarray(4)); c.push(R.check(cl[0].tip === X(hh) && cl[0].min === u32(b, 0) && cl[0].max === u32(b, 0), `client tip = sha256d(bootstrap header)，min = max = bootstrap 高度 ${u32(b, 0)}`, `client tip = sha256d(bootstrap header), min = max = bootstrap height ${u32(b, 0)}`, '0x28'));
          c.push(R.check((p.flags & 0x80) || leBig(hh) <= target(u32(b, 76)), 'bootstrap header 满足 PoW', 'bootstrap header satisfies PoW', '0x6a'),
            R.NOT_CHECKED('高度须是难度调整周期起点；chain work / target_adjust_info 由 header 计算', 'height must start a difficulty period; chain work / target_adjust_info derived from the header', '0x69/0x28')); } }
      }
      return c;
    }
    const ii = p.ins.filter(x => x.info), oi = p.outs.filter(x => x.info);
    if (p.op === 'update') {
      const inInfo = ii[0], inCl = p.ins.find(x => x.client), outInfo = oi[0], outCl = p.outs.find(x => x.client);
      c.push(R.check(ii.length >= 1, '输入含 SpvInfo', 'inputs contain the SpvInfo', '0x30'), R.check(!!inCl && ii.length === 1, '另一个输入是 SpvClient', 'the other input is an SpvClient', '0x31'));
      if (!inInfo || !inCl) return c;
      const exp = next(inInfo.info.tip, p.count);
      c.push(R.check(inCl.client.id === exp, `被覆盖的输入 client id = tip 的下一个（${exp}）`, `overwritten input client id = the one after tip (${exp})`, '0x32'));
      c.push(R.check(oi.length >= 1, '输出含 SpvInfo', 'outputs contain the SpvInfo', '0x33'), R.check(!!outCl && oi.length === 1, '另一个输出是 SpvClient', 'the other output is an SpvClient', '0x34'));
      if (!outInfo || !outCl) return c;
      c.push(R.check(outInfo.info.tip === exp, `输出 tip_client_id = ${exp}`, `output tip_client_id = ${exp}`, '0x35'));
      c.push(R.NOT_CHECKED('cell_deps 中恰有一个本实例 client 且 id = 输入 tip（解码器不读取 cell_deps）', 'exactly one client of this instance in cell_deps with id = input tip (the decoder does not load cell_deps)', '0x36–0x39'));
      const w = ctx.witnesses[outInfo.i], up = w && w.args && w.args.output_type;
      c.push(R.check(!!up, `witnesses[${outInfo.i}].output_type 有 SpvUpdate`, `witnesses[${outInfo.i}].output_type holds an SpvUpdate`, '0x3a'));
      if (!up) return c;
      let hs; try { hs = update(up); } catch (e) { c.push(R.check(false, 'SpvUpdate 解析失败：' + e.message, 'SpvUpdate failed to parse: ' + e.message, '0x04')); return c; }
      c.push(R.check(outCl.client.id === exp, `新 client id = ${exp}`, `new client id = ${exp}`, '0x79'));
      headersCheck(c, hs, outCl.client, p.flags);
      return c;
    }
    // reorg
    const inCls = p.ins.filter(x => x.client);
    c.push(R.check(p.ins.every(x => x.info || x.client), '每个输入都是 SpvInfo 或 SpvClient', 'every input is an SpvInfo or SpvClient', '0x41'), R.check(ii.length <= 1, '输入 SpvInfo 不重复', 'no duplicate input SpvInfo', '0x44'), R.check(ii.length === 1, '输入有 SpvInfo', 'inputs have the SpvInfo', '0x42'), R.check(inCls.length >= 2, '输入 client ≥ 2', '≥ 2 input clients', '0x43'));
    if (ii.length !== 1 || inCls.length < 2) return c;
    const tip = ii[0].info.tip, tipCl = inCls.find(x => x.client.id === tip);
    c.push(R.check(!!tipCl, `输入包含 tip client（id ${tip}）`, `inputs include the tip client (id ${tip})`, '0x45'));
    let t = tip, newTip = 0; const want = []; for (let k = 0; k < inCls.length; k++) { want.push(t); newTip = t; t = prev(t, p.count); } want.sort((x, y) => x - y); const fork = t;
    const got = inCls.map(x => x.client.id).sort((x, y) => x - y);
    c.push(R.check(JSON.stringify(got) === JSON.stringify(want), `输入 client id {${got}} = 从 tip 往回连续 ${inCls.length} 个 {${want}}`, `input client ids {${got}} = ${inCls.length} consecutive ids back from tip {${want}}`, '0x47'));
    const outCls = p.outs.filter(x => x.client);
    c.push(R.check(p.outs.every(x => x.info || x.client), '每个输出都是 SpvInfo 或 SpvClient', 'every output is an SpvInfo or SpvClient', '0x48'), R.check(oi.length <= 1, '输出 SpvInfo 不重复', 'no duplicate output SpvInfo', '0x4a'), R.check(oi.length === 1, '输出有 SpvInfo', 'outputs have the SpvInfo', '0x49'));
    if (oi.length !== 1 || !outCls.length) return c;
    c.push(R.check(oi[0].info.tip === newTip, `输出 tip_client_id = 回退后最旧的 id ${newTip}`, `output tip_client_id = the oldest rolled-back id ${newTip}`, '0x35'));
    c.push(R.check(outCls.every(x => x.client.rest === outCls[0].client.rest), '所有输出 client 除 id 外完全相同', 'all output clients identical except id', '0x4d'));
    const oids = outCls.map(x => x.client.id).sort((x, y) => x - y), newCl = outCls.find(x => x.client.id === newTip);
    c.push(R.check(!!newCl, '输出包含新的 tip client', 'outputs include the new tip client', '0x4b'), R.check(JSON.stringify(oids) === JSON.stringify(want), `输出 client id {${oids}} = 输入 id 集合`, `output client ids {${oids}} = the input id set`, '0x4c'));
    if (tipCl && newCl) c.push(R.check(newCl.client.work > tipCl.client.work, '新链 partial_chain_work > 旧 tip（U256 LE）', 'new partial_chain_work > old tip (U256 LE)', '0x40'));
    c.push(R.NOT_CHECKED(`cell_deps 中恰有一个本实例 client 且 id = 分叉点 ${fork}（解码器不读取 cell_deps）`, `exactly one client of this instance in cell_deps with id = fork point ${fork} (the decoder does not load cell_deps)`, '0x4e–0x51'));
    const w = ctx.witnesses[oi[0].i], up = w && w.args && w.args.output_type;
    c.push(R.check(!!up, `witnesses[${oi[0].i}].output_type 有 SpvUpdate`, `witnesses[${oi[0].i}].output_type holds an SpvUpdate`, '0x3a'));
    if (up && newCl) { let hs; try { hs = update(up); } catch (e) { c.push(R.check(false, 'SpvUpdate 解析失败', 'SpvUpdate failed to parse', '0x04')); return c; } headersCheck(c, hs, newCl.client, p.flags); }
    return c;
  }
  R.register({ id: 'btc_spv_type_lock', kind: 'type', name: 'Bitcoin SPV Type Lock', match: [
    { code_hash: '0xa76e227da81b97d23deabf0d8964aa41c042f4bcf2db2b8bd873fe8521de741d', hash_type: 'type', net: 'mainnet', src: 'type of the SPV client cell 0xd6b2fcb7…:1 whose type hash 0x00a2…c6f7 is btc_lc_type_hash in the RGB++ lock config cell 0x04c5c3e6…:1 (mainnet)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

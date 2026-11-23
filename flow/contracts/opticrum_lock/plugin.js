// Opticrum (Fiber liquidity rental) lock — Opticrum/ckb-contract-script contracts/opticrum/src + opticrum-protocol/src @ 803523a472041262b6f1b049067550801d136f66
// Deployment: deployment/testnet/opticrum.json (type_id 0x1f84…0247, latest v0.3.2). Error base CUSTOM_ERROR_START = 20 (ashuralyk/ckb-cinnabar@f50d8e9).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const CODE = '0x1f8452818672fbb60f39c72e2d30dadd1814f322dfc21bf552784d83054f0247';
  const HESITATION = 3600n;
  const FUNDING = ['0x6c67887fe201ee0c7853f1682c0b77c0e6214044c156c7558269390a8afa6d7c', '0xe45b1f8f21bff23137035a3ab751d75b36a981deec3e7820194b9c042967f4f1'];
  const le = b => R.leToBig(b);
  function branch(argsHex, dataHex) {
    const a = H(argsHex || '0x'), d = H(dataHex || '0x');
    if (a.length === 65) return { kind: 'order', a, d, ok: d.length === 32, buyer: X(a.subarray(33, 65)), pub: X(a.subarray(0, 33)),
      xudt: d.length === 32 ? le(d.subarray(0, 16)) : null, cap: d.length === 32 ? le(d.subarray(16, 24)) : null, rate: d.length === 32 ? le(d.subarray(24, 32)) : null };
    if (a.length === 133) return { kind: 'match', a, d, ok: d.length >= 32, buyer: X(a.subarray(33, 65)), pub: X(a.subarray(0, 33)), orderArgs: X(a.subarray(0, 65)),
      chan: { tx_hash: X(a.subarray(65, 97)), index: '0x' + Number(le(a.subarray(97, 101))).toString(16) }, seller: X(a.subarray(101, 133)),
      xudt: d.length >= 32 ? le(d.subarray(0, 16)) : null, rate: d.length >= 32 ? le(d.subarray(16, 24)) : null, leb: d.length >= 32 ? le(d.subarray(24, 32)) : null };
    return { kind: 'unknown', a, d, ok: false };
  }
  const unocc = (o, d) => { const c = BigInt(o.capacity), oc = R.occupied(o, d); return c > oc ? c - oc : 0n; };
  const xudtOf = (o, d) => { const b = H(d || '0x'); return b.length >= 16 && o.type ? { amt: le(b.subarray(0, 16)), type: R.scriptHash(o.type) } : null; };
  const xEq = (x, y) => (!x && !y) || (!!x && !!y && x.amt === y.amt && x.type === y.type);
  const num = h => h ? BigInt(h.number) : null;
  R.register({
    id: 'opticrum_lock', kind: 'lock', name: { zh: 'Opticrum（Fiber 流动性租赁）lock', en: 'Opticrum (Fiber liquidity rental) lock' }, needsInputHeaders: true,
    match: [{ code_hash: CODE, hash_type: 'type', net: 'testnet', src: 'Opticrum deployment/testnet/opticrum.json (type_id, v0.1.1 → v0.3.2 migrations)' }],
    parse(g, ctx) {
      const t = ctx.tx, ii = g.inputs[0], inp = ctx.inputs[ii], p = { fields: [], layouts: [] };
      p.old = branch(g.script.args, inp.data); p.oldX = xudtOf(inp.output, inp.data); p.oldU = unocc(inp.output, inp.data); p.inp = inp;
      const oi = t.outputs.findIndex(o => o.lock.code_hash === g.script.code_hash && o.lock.hash_type === 'type'); p.oi = oi;
      if (oi >= 0) { const o = t.outputs[oi], d = t.outputs_data[oi]; p.neu = branch(o.lock.args, d); p.newX = xudtOf(o, d); p.newU = unocc(o, d); }
      const o = p.old, n = p.neu;
      p.route = o.kind === 'order' ? (!n ? 'order_cancel' : n.kind === 'match' && n.orderArgs === X(o.a) && xEq(p.oldX, p.newX) ? 'order_match' : 'unknown')
        : o.kind === 'match' ? (!n ? 'match_destroy' : n.kind === 'match' && X(n.a) === X(o.a) && xEq(p.oldX, p.newX) ? 'match_update' : 'unknown') : 'unknown';
      p.fields.push([{ zh: '分支', en: 'branch' }, o.kind], [{ zh: '路由', en: 'route' }, p.route]);
      if (o.kind === 'order') { p.layouts.push({ label: 'Order lock.args (65B)', layout: [{ name: 'fiber_pubkey', size: '33B', color: 0, flex: 2 }, { name: 'buyer_lock_hash', size: '32B', color: 1, flex: 2 }], hex: [['fiber_pubkey', o.pub], ['buyer_lock_hash', o.buyer]] });
        if (o.ok) p.fields.push(['xudt_amount', String(o.xudt)], ['channel_capacity', String(o.cap)], ['shannons_per_block', String(o.rate)]); }
      const m = o.kind === 'match' ? o : n && n.kind === 'match' ? n : null;
      if (m) { p.layouts.push({ label: 'Match lock.args (133B)', layout: [{ name: 'fiber_pubkey', size: '33B', color: 0, flex: 2 }, { name: 'buyer_lock_hash', size: '32B', color: 1, flex: 2 }, { name: 'channel_outpoint', size: '36B', color: 2, flex: 2 }, { name: 'seller_lock_hash', size: '32B', color: 3, flex: 2 }],
        hex: [['channel_outpoint', m.chan.tx_hash + ':' + m.chan.index], ['seller_lock_hash', m.seller]] });
        if (m.ok) p.fields.push(['match.xudt_amount', String(m.xudt)], ['match.shannons_per_block', String(m.rate)], ['match.last_extraction_block', String(m.leb)]); }
      p.tip = t.header_deps.length ? num(ctx.headers[t.header_deps[0]]) : null;
      p.inBlock = inp.blockHash ? num(ctx.headers[inp.blockHash]) : null;
      p.inLocks = new Set(ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock)));
      return p;
    },
    check(g, ctx, p) {
      const c = [], o = p.old, n = p.neu, t = ctx.tx, has = h => p.inLocks.has(h);
      c.push(R.check(o.kind !== 'unknown', `args 长度 ${o.a.length} ∈ {65 Order, 133 Match}`, `args length ${o.a.length} ∈ {65 Order, 133 Match}`, 35));
      if (o.kind === 'unknown') return c;
      c.push(R.check(o.ok, o.kind === 'order' ? '输入 Order data = 32B' : '输入 Match data ≥ 32B', o.kind === 'order' ? 'input Order data = 32B' : 'input Match data ≥ 32B', o.kind === 'order' ? 25 : 28));
      if (n) c.push(R.check(n.kind !== 'unknown' && n.ok, '输出 Opticrum cell 的 args / data 可解析', 'output Opticrum cell args / data parse', n.kind === 'unknown' ? 35 : n.kind === 'order' ? 25 : 28));
      c.push(R.check(p.route !== 'unknown', `状态路由 = ${p.route}`, `state route = ${p.route}`, 40));
      if (p.route === 'unknown' || !o.ok) return c;
      if (p.route === 'order_cancel') { c.push(R.check(has(o.buyer), 'buyer_lock_hash 出现在某个输入的 lock hash 中', 'buyer_lock_hash appears among input lock hashes', 36)); return c; }
      if (p.route === 'order_match') {
        const dep = t.cell_deps.some(d => d.out_point.tx_hash === n.chan.tx_hash && d.out_point.index === n.chan.index);
        c.push(R.check(dep, 'channel_outpoint 在 cell_deps 中', 'channel_outpoint is in cell_deps', 22));
        c.push(R.NOT_CHECKED(`channel cell lock = Fiber funding（type_id ${FUNDING.map(x => x.slice(0, 8)).join(' / ')}…），且 capacity ≥ channel_capacity 或 xUDT ≥ xudt_amount（cell_dep 内容未加载）`, `channel cell lock = Fiber funding (type_id ${FUNDING.map(x => x.slice(0, 8)).join(' / ')}…) and capacity ≥ channel_capacity or xUDT ≥ xudt_amount (cell_dep content not loaded)`, 22));
        c.push(R.check(has(n.seller), 'seller_lock_hash 出现在输入中', 'seller_lock_hash appears among inputs', 37));
        c.push(R.check(n.rate === o.rate && n.leb === 0n, `Match.shannons_per_block = ${o.rate}，last_extraction_block = 0`, `Match.shannons_per_block = ${o.rate}, last_extraction_block = 0`, 28));
        c.push(R.check(p.newU === p.oldU, `未占用 capacity 不变（${p.oldU} → ${p.newU}）`, `unoccupied capacity unchanged (${p.oldU} → ${p.newU})`, 23));
        c.push(R.check(n.xudt === o.xudt, 'xudt_amount 不变', 'xudt_amount unchanged', 26));
        c.push(R.NOT_CHECKED('channel cell 区块号 > Order cell 区块号（需 header_deps）', 'channel cell block > Order cell block (needs header_deps)', 24));
        return c;
      }
      const rent = () => { if (p.tip == null) return null; const base = o.leb === 0n ? p.inBlock : o.leb; if (base == null) return null; return o.rate * (p.tip > base ? p.tip - base : 0n); };
      const exhausted = r => r == null ? null : (p.oldX ? p.oldX.amt <= r : p.oldU <= r);
      if (p.route === 'match_destroy') {
        c.push(R.check(has(o.seller), 'seller_lock_hash 出现在输入中', 'seller_lock_hash appears among inputs', 37));
        const r = rent(), ex = exhausted(r);
        c.push(ex == null ? R.NOT_CHECKED('已耗尽：累计租金 ≥ 剩余价值（缺少 header）', 'exhausted: accrued rent ≥ remaining value (header missing)', 32) : R.check(ex, `已耗尽：累计租金 ${r} ≥ 剩余价值`, `exhausted: accrued rent ${r} ≥ remaining value`, 32));
        return c;
      }
      // match_update
      c.push(R.check(n.rate === o.rate, 'shannons_per_block 不变', 'shannons_per_block unchanged', 33));
      const s = has(o.seller), b = has(o.buyer);
      c.push(R.check(s !== b, `授权：seller ${s ? '✓' : '✗'} / buyer ${b ? '✓' : '✗'}（恰好一方）`, `authorization: seller ${s ? '✓' : '✗'} / buyer ${b ? '✓' : '✗'} (exactly one)`, 38));
      if (s === b) return c;
      if (s) {
        c.push(R.check(t.cell_deps.some(d => d.out_point.tx_hash === o.chan.tx_hash && d.out_point.index === o.chan.index), 'channel_outpoint 仍在 cell_deps 中', 'channel_outpoint still in cell_deps', 22));
        const r = rent();
        if (r == null) { c.push(R.NOT_CHECKED('租金计算需要 header_deps[0]（tip）与输入区块头', 'rent needs header_deps[0] (tip) and the input block header', '27 / 29')); return c; }
        c.push(R.check(!exhausted(r), '提取前未耗尽', 'not exhausted before extraction', 32));
        const ext = p.oldX ? (p.oldX.amt > n.xudt ? p.oldX.amt - n.xudt : 0n) : (p.oldU > p.newU ? p.oldU - p.newU : 0n);
        c.push(R.check(ext === r, `提取量 ${ext} = rate × (tip − base) = ${r}`, `extracted ${ext} = rate × (tip − base) = ${r}`, 27));
        c.push(R.check(n.leb === p.tip, `last_extraction_block = tip ${p.tip}`, `last_extraction_block = tip ${p.tip}`, 30));
        if (o.leb === 0n) c.push(R.check(p.inBlock != null && p.tip - p.inBlock > HESITATION, `首次提取：tip − cell 区块 > ${HESITATION}`, `first extraction: tip − cell block > ${HESITATION}`, 42));
        return c;
      }
      c.push(R.check(n.leb === o.leb, 'buyer 不改 last_extraction_block', 'buyer keeps last_extraction_block', 30));
      const dec = n.xudt < o.xudt || p.newU < p.oldU, inc = n.xudt > o.xudt || p.newU > p.oldU;
      const win = (dec || inc) && o.leb === 0n && p.tip != null && p.inBlock != null ? p.tip - p.inBlock <= HESITATION : false;
      if (dec) { c.push(R.check(n.xudt === 0n && p.newU === 0n, '取回必须全部取出（xudt = 0 且未占用 capacity = 0）', 'withdrawal must dump everything (xudt = 0 and unoccupied capacity = 0)', 43));
        c.push(R.check(win, `取回须在犹豫期内（≤ ${HESITATION} 块，且卖方未提取）`, `withdrawal only inside the hesitation window (≤ ${HESITATION} blocks, seller never extracted)`, 41)); }
      else if (inc) c.push(R.check(!win, '注资不得在犹豫期内', 'no injection inside the hesitation window', 44));
      else c.push(R.check(false, '买方空操作更新被拒绝', 'no-op buyer update is rejected', 31));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

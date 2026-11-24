// iCKB limit_order — ickb/contracts scripts/contracts/limit_order/src/{entry,error}.rs
// @requires ickb_logic
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const le = (b, o, n) => R.leToBig(b.subarray(o, o + n));
  function order(c) {
    const d = H(c.data || '0x'); if (d.length !== 89) return { err: 4 };
    const udt = le(d, 0, 16), action = Number(le(d, 16, 4)); if (action > 1) return { err: 7 };
    const r = { udt, action: action === 0 ? 'mint' : 'match' };
    if (action === 0) { if (d.subarray(20, 52).some(x => x)) return { err: 8 }; const dist = new DataView(d.slice(52, 56).buffer).getInt32(0, true); r.key = (c.tx || '') + ':' + (c.idx + dist); r.dist = dist; }
    else { r.key = X(d.subarray(20, 52)) + ':' + Number(le(d, 52, 4)); }
    const ratio = o => { const ck = le(d, o, 8), ud = le(d, o + 8, 8); if (!ck !== !ud) return 'bad'; return ck ? { ck, ud } : null; };
    const c2u = ratio(56), u2c = ratio(72); if (c2u === 'bad' || u2c === 'bad') return { err: 9 };
    const lg = d[88]; if (lg > 64) return { err: 10 };
    if (c2u && u2c && c2u.ck * u2c.ud < c2u.ud * u2c.ck) return { err: 11 };
    if (!c2u && !u2c) return { err: 12 };
    if (!c.type) return { err: 13 };
    Object.assign(r, { c2u, u2c, minMatch: 1n << BigInt(lg), info: X(d.subarray(56, 89)) + c.typeHash, ckb: BigInt(c.capacity), unocc: BigInt(c.capacity) - R.occupied(c, c.data) });
    return r;
  }
  function parse(g, ctx) {
    const { ins, outs } = R.ickb.cells(ctx), p = { errs: [], map: new Map() };
    for (const [k, list] of [[0, ins], [1, outs]]) for (const c of list) { const L = c.lockHash === g.hash, T = c.typeHash === g.hash, tag = `${c.src}[${c.index}]`;
      if (L && T) { p.errs.push([15, tag]); continue; }
      if (!L && !T) continue;
      const key = T ? (c.tx || '') + ':' + c.idx : null;
      if (T) { const e = p.map.get(key) || [{}, {}]; if (e[k].master) p.errs.push([6, tag]); e[k].master = tag; p.map.set(key, e); }
      else { const o = order(c); if (o.err) { p.errs.push([o.err, tag]); continue; } o.tag = tag; const e = p.map.get(o.key) || [{}, {}]; if (e[k].order) p.errs.push([14, tag]); e[k].order = o; p.map.set(o.key, e); } }
    p.fields = [...p.map.entries()].map(([key, [i, o]]) => [{ zh: '订单 ' + key.slice(0, 12) + '…', en: 'order ' + key.slice(0, 12) + '…' },
      `in: ${i.order ? i.order.tag + ' ' + i.order.action + ' udt=' + i.order.udt : '—'}${i.master ? ' master ' + i.master : ''} → out: ${o.order ? o.order.tag + ' ' + o.order.action + ' udt=' + o.order.udt : '—'}${o.master ? ' master ' + o.master : ''}`]);
    p.layouts = [{ label: 'order cell data (89B)', layout: [{ name: 'udt_amount u128', size: '16B', color: 1, flex: 2 }, { name: 'action u32 (0 mint / 1 match)', size: '4B', color: 0 }, { name: 'padding 32B ‖ master_distance i32 / master OutPoint', size: '36B', color: 3, flex: 3 },
      { name: 'ckb_to_udt (ckb_mul u64, udt_mul u64)', size: '16B', color: 4, flex: 2 }, { name: 'udt_to_ckb', size: '16B', color: 5, flex: 2 }, { name: 'ckb_min_match_log', size: '1B', color: 2 }], hex: [] }];
    return p;
  }
  const errText = { 4: ['order data 恰为 89 字节', 'order data is exactly 89 bytes'], 6: ['同一订单最多一个 master', 'at most one master per order'], 7: ['action ∈ {0,1}', 'action ∈ {0,1}'], 8: ['mint 订单的 padding 全 0', 'mint padding is all zero'], 9: ['ratio 两个乘数同为 0 或同不为 0', 'each ratio has both multipliers zero or both non-zero'],
    10: ['ckb_min_match_log ≤ 64', 'ckb_min_match_log ≤ 64'], 11: ['双向 ratio 不亏损（非凹）', 'two-way ratios are not concave'], 12: ['至少一个方向的 ratio', 'at least one ratio'], 13: ['订单 cell 有 UDT type', 'order cell has a UDT type'], 14: ['同一 master 在同侧最多一个订单', 'one order per master per side'], 15: ['没有 cell 同时以本脚本为 lock 和 type', 'no cell uses this script as both lock and type'] };
  function validate(i, o) {
    if (i.info !== o.info) return 16;
    let dir; if (i.c2u && i.ckb > o.ckb && !(i.udt > o.udt)) dir = ['c2u', i.c2u]; else if (!(i.ckb > o.ckb) && i.u2c && i.udt > o.udt) dir = ['u2c', i.u2c]; else return 17;
    const { ck, ud } = dir[1]; if (i.ckb * ck + i.udt * ud > o.ckb * ck + o.udt * ud) return 18;
    if (dir[0] === 'c2u') { if (i.unocc === 0n) return 19; if (o.unocc !== 0n && i.ckb < o.ckb + i.minMatch) return 20; }
    else { if (i.udt === 0n) return 19; if (o.udt !== 0n && i.udt * ud < o.udt * ud + i.minMatch * ck) return 20; }
    return 0;
  }
  function check(g, ctx, p) {
    const c = [R.check(R.ickb.emptyArgs(g, ctx), 'args 为空（输出中同 code 的 lock 也无 args）', 'args empty (same-code output locks too)', 5)];
    for (const code of Object.keys(errText).map(Number)) { const bad = p.errs.filter(e => e[0] === code).map(e => e[1]); if (bad.length) c.push(R.check(false, errText[code][0] + '：' + bad.join(','), errText[code][1] + ': ' + bad.join(','), code)); }
    for (const [key, [i, o]] of p.map) {
      const s = `${!!i.order}${!!i.master}${!!o.order}${!!o.master}`, k = key.slice(0, 14) + '…';
      if (s === 'falsefalsetruetrue') c.push(R.check(true, `订单 ${k}：创建（输出 order + master）`, `order ${k}: mint (output order + master)`, 21));
      else if (s === 'truetruefalsefalse') c.push(R.check(true, `订单 ${k}：撤销（输入 order + master）`, `order ${k}: melt (input order + master)`, 21));
      else if (s === 'truefalsetruefalse') { const e = validate(i.order, o.order); const t = { 16: ['订单信息不变', 'order info unchanged'], 17: ['方向有效（CKB→UDT 或 UDT→CKB）', 'valid direction (CKB→UDT or UDT→CKB)'], 18: ['按 ratio 计价不减少', 'value at the ratio does not decrease'], 19: ['已完成的订单不能再改', 'a fulfilled order cannot change'], 20: ['部分成交 ≥ 最小成交量', 'partial match ≥ minimum'] }[e];
        c.push(R.check(e === 0, `订单 ${k}：撮合 ` + (t ? t[0] : '信息不变、方向有效、价值不减、满足最小成交'), `order ${k}: match ` + (t ? t[1] : 'info unchanged, valid direction, value kept, minimum met'), e || '16–20')); }
      else c.push(R.check(false, `订单 ${k}：合法组合只有 mint / melt / match`, `order ${k}: only mint / melt / match are valid`, 21));
    }
    return c;
  }
  R.register({ id: 'limit_order', kind: 'lock', name: 'iCKB limit order', match: [{ code_hash: '0x49dfb6afee5cc8ac4225aeea8cb8928b150caf3cd92fea33750683c74b13254a', hash_type: 'data1', net: 'mainnet', src: 'blake2b of ickb/contracts release binary, confirmed on mainnet' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

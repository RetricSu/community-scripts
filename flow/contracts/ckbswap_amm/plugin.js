// CKBSwap constant-product AMM — ckbswap/contracts contracts/swap/src/main.rs + crates/protocol/src/lib.rs @ b7cd8458a798b4386c1b401ce7dd10333a728443
// No deployment published (README: "does not include ... deployment configuration"). match is empty: static page only.
// One binary, three roles by args[0]: 0 = state type (this plugin), 1 = state lock, 2 = xUDT reserve lock.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, le = R.leToBig;
  const ZERO = '0x' + '00'.repeat(32), CKB = 100000000n, STATE_CAP = 500n * CKB, VAULT_CAP = 200n * CKB, MIN_LIQ = 1000n, MAX = (1n << 112n) - 1n;
  const XUDT = '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95';
  const OPS = ['ADD', 'REMOVE', 'SWAP_IN', 'SWAP_OUT'];
  class E extends Error { constructor(c) { super(String(c)); this.code = c; } }
  const fail = c => { throw new E(c); };
  function decodeState(hex) {
    const b = H(hex || '0x');
    if (b.length !== 125 || X(b.subarray(0, 5)) !== '0x4353575001') return null;
    return { nonce: le(b.subarray(5, 13)), asset0: X(b.subarray(13, 45)), asset1: X(b.subarray(45, 77)), reserve0: le(b.subarray(77, 93)), reserve1: le(b.subarray(93, 109)), total_lp: le(b.subarray(109, 125)) };
  }
  function validate(s) {
    if (!(s.asset0 < s.asset1) || s.reserve0 > MAX || s.reserve1 > MAX || s.total_lp > MAX) fail(9);
    if (s.total_lp === 0n) { if (s.reserve0 !== 0n || s.reserve1 !== 0n) fail(9); }
    else if (s.total_lp < MIN_LIQ || s.reserve0 === 0n || s.reserve1 === 0n) fail(9);
    capacity(s);
  }
  function capacity(s) { const c = STATE_CAP + (s.asset0 === ZERO ? s.reserve0 : 0n); if (c >= 1n << 64n) fail(12); return c; }
  function decodeAction(hex) {
    const b = H(hex || '0x'); if (b.length !== 114) return null; const n = at => le(b.subarray(at, at + 16));
    return { op: b[0], side: b[1], actor: X(b.subarray(2, 34)), amount0: n(34), amount1: n(50), min0: n(66), min1: n(82), min_lp: n(98) };
  }
  const mulDiv = (a, b, c) => { if (c === 0n) fail(6); const r = a * b / c; if (r >= 1n << 128n) fail(6); return r; };
  function sqrt(n) { if (n === 0n) return 0n; let x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  function amountOut(i, rin, rout) { if (i === 0n || i > MAX || rin === 0n || rout === 0n) fail(7); const f = i * 997n, n = f * rout / (rin * 1000n + f); if (n >= 1n << 128n) fail(6); if (n === 0n || n >= rout) fail(7); return n; }
  function amountIn(o, rin, rout) { if (o === 0n || o >= rout || rin === 0n) fail(7); const n = rin * o * 1000n / ((rout - o) * 997n); if (n >= 1n << 128n) fail(6); if (n + 1n > MAX) fail(7); return n + 1n; }
  function apply(s, a) {
    validate(s); if (a.side > 1) fail(5);
    const t = { next: { ...s, nonce: s.nonce + 1n }, in0: 0n, in1: 0n, out0: 0n, out1: 0n, lp_mint: 0n, lp_burn: 0n };
    if (a.op === 0) {
      if (a.side !== 0 || a.amount0 === 0n || a.amount1 === 0n || a.amount0 > MAX || a.amount1 > MAX) fail(7);
      if (s.total_lp === 0n) { t.in0 = a.amount0; t.in1 = a.amount1; const r = sqrt(t.in0 * t.in1); if (r <= MIN_LIQ) fail(7); t.lp_mint = r - MIN_LIQ; t.next.total_lp = r; }
      else { const o1 = mulDiv(a.amount0, s.reserve1, s.reserve0); if (o1 <= a.amount1) { t.in0 = a.amount0; t.in1 = o1; } else { t.in0 = mulDiv(a.amount1, s.reserve0, s.reserve1); t.in1 = a.amount1; }
        if (t.in0 === 0n || t.in1 === 0n) fail(7); const m0 = mulDiv(t.in0, s.total_lp, s.reserve0), m1 = mulDiv(t.in1, s.total_lp, s.reserve1); t.lp_mint = m0 < m1 ? m0 : m1; t.next.total_lp = s.total_lp + t.lp_mint; }
      if (t.lp_mint === 0n) fail(7); if (t.in0 < a.min0 || t.in1 < a.min1 || t.lp_mint < a.min_lp) fail(8);
      t.next.reserve0 = s.reserve0 + t.in0; t.next.reserve1 = s.reserve1 + t.in1;
    } else if (a.op === 1) {
      if (a.side !== 0 || a.amount1 !== 0n || a.min_lp !== 0n || a.amount0 === 0n || s.total_lp === 0n || a.amount0 > s.total_lp - MIN_LIQ) fail(7);
      t.lp_burn = a.amount0; t.out0 = mulDiv(a.amount0, s.reserve0, s.total_lp); t.out1 = mulDiv(a.amount0, s.reserve1, s.total_lp);
      if (t.out0 === 0n || t.out1 === 0n) fail(7); if (t.out0 < a.min0 || t.out1 < a.min1) fail(8);
      t.next.reserve0 -= t.out0; t.next.reserve1 -= t.out1; t.next.total_lp -= a.amount0;
    } else if (a.op === 2 || a.op === 3) {
      if (a.min_lp !== 0n || a.min1 !== 0n) fail(5);
      const [rin, rout] = a.side === 0 ? [s.reserve0, s.reserve1] : [s.reserve1, s.reserve0]; let inp, out;
      if (a.op === 2) { if (a.amount1 !== 0n) fail(5); out = amountOut(a.amount0, rin, rout); if (out < a.min0) fail(8); inp = a.amount0; }
      else { if (a.min0 !== 0n) fail(5); inp = amountIn(a.amount0, rin, rout); if (inp > a.amount1) fail(8); out = a.amount0; }
      if (a.side === 0) { t.in0 = inp; t.out1 = out; t.next.reserve0 = s.reserve0 + inp; t.next.reserve1 -= out; }
      else { t.in1 = inp; t.out0 = out; t.next.reserve1 = s.reserve1 + inp; t.next.reserve0 -= out; }
      const b0 = t.next.reserve0 * 1000n - t.in0 * 3n, b1 = t.next.reserve1 * 1000n - t.in1 * 3n;
      if (b0 * b1 < s.reserve0 * s.reserve1 * 1000000n) fail(9);
    } else fail(5);
    validate(t.next); return t;
  }
  const sEq = (a, b) => ['nonce', 'asset0', 'asset1', 'reserve0', 'reserve1', 'total_lp'].every(k => a[k] === b[k]);
  const role = (s, r, id, asset) => ({ code_hash: s.code_hash, hash_type: s.hash_type, args: '0x' + r.toString(16).padStart(2, '0') + id.slice(2) + (asset ? asset.slice(2) : '') });
  const sameScript = (x, y) => !!x && !!y && x.code_hash === y.code_hash && x.hash_type === y.hash_type && x.args === y.args;
  R.register({
    id: 'ckbswap_amm', kind: 'type', name: { zh: 'CKBSwap 恒定乘积 AMM（state type）', en: 'CKBSwap constant-product AMM (state type)' }, match: [],
    parse(g, ctx) {
      const a = H(g.script.args || '0x'), p = { fields: [], layouts: [] };
      p.role = a[0]; p.id = a.length >= 33 ? X(a.subarray(1, 33)) : null;
      p.after = ctx.tx.outputs_data[0] !== undefined ? decodeState(ctx.tx.outputs_data[0]) : null;
      p.si = g.inputs[0]; p.before = p.si !== undefined ? decodeState(ctx.inputs[p.si].data) : null;
      const w = p.si !== undefined ? ctx.witnesses[p.si] : null; p.actionHex = w && w.args && w.args.input_type; p.action = p.actionHex ? decodeAction(p.actionHex) : null;
      p.fields.push(['role', String(p.role)], ['pool_id', p.id || '—']);
      if (p.after) p.fields.push(['asset0 / asset1', p.after.asset0 + ' / ' + p.after.asset1], ['reserve0 / reserve1 / total_lp', `${p.after.reserve0} / ${p.after.reserve1} / ${p.after.total_lp}`], ['nonce', String(p.after.nonce)]);
      if (p.action) p.fields.push(['action', `${OPS[p.action.op] || p.action.op} side=${p.action.side} amount0=${p.action.amount0} amount1=${p.action.amount1}`], ['actor', p.action.actor]);
      return p;
    },
    check(g, ctx, p) {
      const c = [], t = ctx.tx, s = g.script;
      c.push(R.check(p.role === 0 && H(s.args).length === 33, 'type args = role 0 ‖ pool_id（33B）', 'type args = role 0 ‖ pool_id (33B)', 5));
      if (p.role !== 0) return c;
      c.push(R.check(g.outputs.length === 1 && g.outputs[0] === 0 && g.inputs.length <= 1, '恰好一个 state 输出且位于 output 0；state 输入 ≤ 1', 'exactly one state output, at output 0; ≤ 1 state input', 11));
      c.push(R.check(!!p.after, 'output 0 data = 125B，以 "CSWP\\x01" 开头', 'output 0 data = 125B starting with "CSWP\\x01"', 5));
      if (!p.after || g.outputs[0] !== 0) return c;
      try { validate(p.after); c.push(R.check(true, '新 state 合法（asset0 < asset1、≤ 2^112−1、LP 不变式）', 'new state valid (asset0 < asset1, ≤ 2^112−1, LP invariants)', 9)); }
      catch (e) { c.push(R.check(false, '新 state 合法', 'new state valid', e.code)); return c; }
      c.push(R.check(sameScript(t.outputs[0].lock, role(s, 1, p.id)) && BigInt(t.outputs[0].capacity) === capacity(p.after), `state lock = role 1，capacity = ${capacity(p.after)}`, `state lock = role 1, capacity = ${capacity(p.after)}`, 12));
      c.push(R.NOT_CHECKED('全交易 state 计数、reserve cell 布局（output 1..，200 CKB，规范 xUDT，16B data = reserve）与 LP 余额', 'tx-wide state count, reserve cell layout (outputs 1.., 200 CKB, canonical xUDT, 16B data = reserve) and LP balances', '11 / 13'));
      if (!g.inputs.length) {
        const seed = R.ckbHash(R.hexToBytes(serializeInput(t.inputs[0]) + '0000000000000000'));
        c.push(R.check(seed === p.id && p.after.nonce === 0n && p.after.reserve0 === 0n && p.after.reserve1 === 0n && p.after.total_lp === 0n, 'genesis：pool_id = ckb_hash(inputs[0] ‖ u64 0)，state 全零', 'genesis: pool_id = ckb_hash(inputs[0] ‖ u64 0), zeroed state', 14));
        return c;
      }
      c.push(R.check(!!p.before, '输入 state data 可解码', 'input state data decodes', 5));
      c.push(R.check(!!p.action, 'witness[state 输入].input_type = 114B Action', 'witness[state input].input_type = 114B Action', 5));
      if (!p.before || !p.action) return c;
      const locks = new Set(ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock)));
      c.push(R.check(locks.has(p.action.actor), 'actor lock hash 出现在输入中', 'actor lock hash appears among inputs', 10));
      try { const tr = apply(p.before, p.action); c.push(R.check(sEq(tr.next, p.after), `新 state = apply(旧 state, ${OPS[p.action.op]})`, `new state = apply(old state, ${OPS[p.action.op]})`, 9)); }
      catch (e) { c.push(R.check(false, `apply(${OPS[p.action.op] || p.action.op}) 失败`, `apply(${OPS[p.action.op] || p.action.op}) fails`, e.code)); }
      c.push(R.NOT_CHECKED('actor 的 CKB / xUDT / LP 余额变化与 transition 一致（含手续费）', 'actor CKB / xUDT / LP balance changes match the transition (fee included)', '12 / 13'));
      return c;
    },
  });
  function serializeInput(i) { // CellInput: since u64 LE ‖ OutPoint(tx_hash 32 ‖ index u32 LE)
    const u = (v, n) => { let b = BigInt(v), s = ''; for (let k = 0; k < n; k++) { s += (b & 0xffn).toString(16).padStart(2, '0'); b >>= 8n; } return s; };
    return '0x' + u(i.since, 8) + i.previous_output.tx_hash.slice(2) + u(i.previous_output.index, 4);
  }
  if (typeof module !== 'undefined') module.exports = { apply, decodeState, decodeAction, sqrt, serializeInput };
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

// cells account-cell-type — LusoCryptoLabs/cells-contracts contracts/account-cell-type/src/main.rs + crates/cells-core/src/lib.rs @6d29dab
// code_hash: cellula-sdk@0.2.1 dist/deployments.js (official SDK) + docs/TRUST.md (mainnet). Also exposes R.cells (AccountData helpers).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const asc = b => { let s = ''; for (const c of b) s += String.fromCharCode(c); return s; };
  const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const ZERO20 = new Uint8Array(20);
  // AccountData v3: version(1)=0x03 ‖ witness_hash(32) ‖ next(20) ‖ expires(5 LE) ‖ owner(20) ‖ manager(20) ‖ label
  function acct(hex) {
    const d = H(hex || '0x'); if (d.length < 98 || d[0] !== 3) return null;
    const label = d.subarray(98); let exp = 0n; for (let i = 4; i >= 0; i--) exp = exp * 256n + BigInt(d[53 + i]);
    return { raw: d, wh: d.subarray(1, 33), next: d.subarray(33, 53), exp, owner: d.subarray(58, 78), manager: d.subarray(78, 98), label,
      id: label.length ? H(R.ckbHash(label)).subarray(0, 20) : ZERO20 };
  }
  // cells-core validate_label: InvalidLength 31, InvalidCharset 30, TooDeep 45
  function labelErr(l) {
    if (l.length === 0 || l.length > 40) return 31;
    const parts = asc(l).split('.');
    for (const p of parts) { if (!p.length || !/^[a-z0-9-]+$/.test(p) || p[0] === '-' || p[p.length - 1] === '-') return 30; }
    return parts.length > 2 ? 45 : 0;
  }
  const lt = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };
  const between = (lo, hi, id) => lt(lo, hi) ? lt(lo, id) && lt(id, hi) : lt(lo, id) || lt(id, hi);
  const covers = (lo, hi, id) => lt(lo, hi) ? lt(lo, id) && !lt(hi, id) : lt(lo, id) || !lt(hi, id);
  R.cells = { acct, labelErr };
  const wa = (ctx, i) => (ctx.witnesses[i] && ctx.witnesses[i].args) || null;
  const lockHash = s => s ? R.scriptHash(s) : null;
  function parse(g, ctx) {
    const w0 = wa(ctx, 0), action = w0 && w0.input_type ? asc(H(w0.input_type)) : null;
    const ins = g.inputs.map(i => ({ i, a: acct(ctx.inputs[i].data), lock: lockHash(ctx.inputs[i].output.lock), cap: BigInt(ctx.inputs[i].output.capacity), since: ctx.inputs[i].input.since }));
    const outs = g.outputs.map(i => ({ i, a: acct(ctx.tx.outputs_data[i]), lock: lockHash(ctx.tx.outputs[i].lock), cap: BigInt(ctx.tx.outputs[i].capacity) }));
    const p = { action: g.inputs.length === 0 ? 'genesis' : action, ins, outs };
    const show = (c, tag) => c.a ? [[tag + ' label', c.a.label.length ? asc(c.a.label) + '.cell' : { zh: '（根哨兵，空 label）', en: '(root sentinel, empty label)' }],
      [tag + ' id', X(c.a.id)], [tag + ' next', X(c.a.next)], [tag + ' expires', c.a.exp ? new Date(Number(c.a.exp) * 1000).toISOString() : '0'],
      [tag + ' owner', X(c.a.owner)], [tag + ' manager', X(c.a.manager)]] : [[tag, { zh: 'data 无法解析为 AccountData v3', en: 'data does not parse as AccountData v3' }]];
    p.fields = [['namespace (args[0..20])', X(H(g.script.args).subarray(0, 20))], [{ zh: '动作 witnesses[0].input_type', en: 'action witnesses[0].input_type' }, p.action || '—']];
    ins.forEach((c, k) => p.fields.push(...show(c, `in[${k}]`))); outs.forEach((c, k) => p.fields.push(...show(c, `out[${k}]`)));
    const c0 = outs[0] || ins[0];
    if (c0 && c0.a) { const r = c0.a.raw; p.layouts = [{ label: 'AccountData v3', layout: [
      { name: 'version', size: '1', color: 1, flex: 1 }, { name: 'witness_hash', size: '32', color: 2, flex: 3 }, { name: 'next', size: '20', color: 3, flex: 2 },
      { name: 'expires', size: '5 LE', color: 4, flex: 1 }, { name: 'owner', size: '20', color: 5, flex: 2 }, { name: 'manager', size: '20', color: 6, flex: 2 }, { name: 'label', size: 'n', color: 1, flex: 2 }],
      hex: [['version', X(r.subarray(0, 1))], ['witness_hash', X(r.subarray(1, 33))], ['next', X(r.subarray(33, 53))], ['expires', X(r.subarray(53, 58))], ['owner', X(r.subarray(58, 78))], ['manager', X(r.subarray(78, 98))], ['label', X(r.subarray(98))]] }]; }
    return p;
  }
  // an input whose lock hash starts with these 20 bytes (cells require_owner / require_owner_or_manager prefix match)
  const hasInputUnder = (ctx, ...ids) => ctx.inputs.some(x => { const h = H(R.scriptHash(x.output.lock)).subarray(0, 20); return ids.some(id => eq(h, id)); });
  const consentNote = R.NOT_CHECKED('consents()：ACP / anyone-can-pay Omnilock / PW-Lock 输入不算同意；input-type-proxy-lock 与 sale-lock 有特殊规则（未细查）', 'consents(): ACP / anyone-can-pay Omnilock / PW-Lock inputs give no consent; input-type-proxy-lock and sale-lock have special rules (not fully checked)', 29);
  function check(g, ctx, p) {
    const c = [], C = (ok, zh, en, code) => c.push(R.check(ok, zh, en, code));
    for (const o of p.outs) {
      C(!!o.a, `out#${o.i} data 为 AccountData v3（≥98 字节且 version=0x03）`, `out#${o.i} data is AccountData v3 (≥98 bytes, version=0x03)`, 20);
      if (!o.a) return c;
      if (o.a.label.length) { const e = labelErr(o.a.label); C(e === 0, `out#${o.i} label 合法（1–40 字节，a-z0-9-，首尾非 -，最多一个点）`, `out#${o.i} label valid (1–40 bytes, a-z0-9-, no edge hyphen, at most one dot)`, e || '30 / 31 / 45'); }
      const w = wa(ctx, o.i), pl = w && w.output_type ? H(w.output_type) : null;
      C(!!pl && eq(H(R.ckbHash(pl)), o.a.wh), `witnesses[${o.i}].output_type 的 blake2b = witness_hash`, `blake2b(witnesses[${o.i}].output_type) = witness_hash`, 21);
    }
    for (const x of p.ins) C(!!x.a, `in#${x.i} data 为 AccountData v3`, `in#${x.i} data is AccountData v3`, 20);
    if (p.ins.some(x => !x.a)) return c;
    const I = p.ins, O = p.outs;
    if (p.action === 'genesis') {
      const ns = H(g.script.args).subarray(0, 20);
      C(ctx.inputs.some(x => x.output.type && eq(H(R.scriptHash(x.output.type)).subarray(0, 20), ns)), '消耗 genesis token（输入 type hash 前 20 字节 = args）', 'consumes the genesis token (an input whose type hash[0..20] = args)', 34);
      C(O.length === 1 && eq(O[0].a.id, ZERO20) && eq(O[0].a.next, ZERO20), '恰好 1 个输出，id = next = 0', 'exactly 1 output, id = next = 0', 25);
      if (O.length === 1) C(O[0].a.raw.length === 98 && eq(O[0].a.owner, ZERO20) && eq(O[0].a.manager, ZERO20), '根：空 label，owner = manager = 0', 'root: empty label, owner = manager = 0', 20);
      return c;
    }
    C(O.every(o => o.lock === I[0].lock), '所有输出 AccountCell 的 lock = 输入 AccountCell 的 lock（account-lock）', 'every output AccountCell lock = the input AccountCell lock (account-lock)', 48);
    const core = (a, b) => eq(a.id, b.id) && eq(a.next, b.next) && eq(a.label, b.label);
    const keep = (k, a, b) => (Array.isArray(k) ? k : [k]).every(f => f === 'exp' ? a.exp === b.exp : eq(a[f], b[f]));
    const one = () => { C(I.length === 1 && O.length === 1, '1 个 AccountCell 进，1 个出', '1 AccountCell in, 1 out', 27); return I.length === 1 && O.length === 1; };
    switch (p.action) {
      case 'register': {
        C(I.length === 1 && O.length === 2, '1 进（前驱 p），2 出（p′, x）', '1 in (predecessor p), 2 out (p′, x)', 25);
        if (I.length !== 1 || O.length !== 2) return c;
        const P = I[0].a, Pn = O[0].a, Xn = O[1].a;
        C(!eq(Xn.id, ZERO20), 'x.id ≠ 0', 'x.id ≠ 0', 46);
        C(!eq(Xn.owner, ZERO20), 'x.owner 非全 0', 'x.owner is not all-zero', 38);
        const al = H(O[1].lock).subarray(0, 20); C(!eq(Xn.owner, al) && !eq(Xn.manager, al), 'owner / manager ≠ account-lock 前 20 字节', 'owner / manager ≠ account-lock hash[0..20]', 44);
        C(eq(Xn.manager, Xn.owner), '新名字 manager = owner', 'new name manager = owner', 27);
        C(between(P.id, P.next, Xn.id), 'x.id 严格位于 (p.id, p.next)', 'x.id strictly inside (p.id, p.next)', 24);
        C(eq(Pn.id, P.id) && eq(Pn.next, Xn.id) && eq(Xn.next, P.next), '重链：p′.next = x.id，x.next = p.next', 'relink: p′.next = x.id, x.next = p.next', 25);
        C(keep(['wh', 'exp', 'owner', 'manager', 'label'], P, Pn) && I[0].lock === O[0].lock && O[0].cap >= I[0].cap, 'p′ 除 next 外逐字节不变，lock 不变，capacity 不减', 'p′ unchanged except next; same lock; capacity not reduced', 27);
        C(O[1].cap >= 24000000000n, `x capacity ${O[1].cap} ≥ 240 CKB`, `x capacity ${O[1].cap} ≥ 240 CKB`, 35);
        // commit-reveal
        const w = wa(ctx, O[1].i), sec = w && w.input_type ? H(w.input_type) : null;
        C(!!sec && sec.length === 32, `witnesses[${O[1].i}].input_type = 32 字节 secret`, `witnesses[${O[1].i}].input_type = 32-byte secret`, 36);
        if (sec && sec.length === 32) {
          const ns = H(g.script.args).subarray(0, 20), buf = new Uint8Array(20 + Xn.label.length + 52); buf.set(ns); buf.set(Xn.label, 20); buf.set(Xn.owner, 20 + Xn.label.length); buf.set(sec, 40 + Xn.label.length);
          const want = R.ckbHash(buf), ci = ctx.inputs.findIndex(x => x.data === want);
          C(ci >= 0, '有输入 data = blake2b(namespace‖label‖owner‖secret)（CommitCell）', 'an input has data = blake2b(namespace‖label‖owner‖secret) (CommitCell)', 36);
          if (ci >= 0) {
            C(eq(H(R.scriptHash(ctx.inputs[ci].output.lock)).subarray(0, 20), Xn.owner), 'CommitCell 的 lock hash 前 20 字节 = x.owner', 'CommitCell lock hash[0..20] = x.owner', 47);
            const s = BigInt(ctx.inputs[ci].input.since); C((s >> 56n) === 0xC0n && (s & 0xFFFFFFFFFFFFFFn) >= 60n, `CommitCell since = 相对时间戳 ≥ 60 s（${ctx.inputs[ci].input.since}）`, `CommitCell since = relative timestamp ≥ 60 s (${ctx.inputs[ci].input.since})`, 37);
          }
        }
        if (Xn.label.includes(46)) c.push(R.NOT_CHECKED('子名：父名作为 cell dep、父 owner 输入、到期不晚于父', 'sub-name: parent as cell dep, parent owner input, not outliving parent', '40 / 41 / 29'));
        c.push(R.NOT_CHECKED('期限 1–10 年（按 CommitCell 区块时间）与 treasury 费用（价格 cell 折扣、推荐人分成）', 'term 1–10 years (from the CommitCell block time) and the treasury fee (price-cell discount, referral cut)', '39 / 43 / 42'));
        break;
      }
      case 'edit_records': if (!one()) break; {
        const a = I[0].a, b = O[0].a; C(core(a, b) && keep(['exp', 'owner', 'manager'], a, b) && I[0].lock === O[0].lock && O[0].cap >= I[0].cap, '只允许 witness_hash 变化；capacity 不减', 'only witness_hash may change; capacity not reduced', 27);
        C(hasInputUnder(ctx, a.owner, a.manager), '有输入 lock hash 前 20 字节 = owner 或 manager', 'an input whose lock hash[0..20] = owner or manager', 29); c.push(consentNote); } break;
      case 'edit_manager': if (!one()) break; {
        const a = I[0].a, b = O[0].a; C(core(a, b) && keep(['exp', 'owner', 'wh'], a, b) && I[0].lock === O[0].lock && O[0].cap >= I[0].cap, '只允许 manager 变化；capacity 不减', 'only manager may change; capacity not reduced', 27);
        C(!eq(b.manager, ZERO20), '新 manager 非全 0', 'new manager not all-zero', 38); C(!eq(b.manager, H(O[0].lock).subarray(0, 20)), '新 manager ≠ account-lock', 'new manager ≠ account-lock', 44);
        C(hasInputUnder(ctx, a.owner), '有输入 lock hash 前 20 字节 = owner', 'an input whose lock hash[0..20] = owner', 29); c.push(consentNote); } break;
      case 'transfer': if (!one()) break; {
        const a = I[0].a, b = O[0].a; C(core(a, b) && keep(['exp', 'wh'], a, b) && I[0].lock === O[0].lock && O[0].cap >= I[0].cap, '只允许 owner（与 manager）变化；记录随名字转移；capacity 不减', 'only owner (and manager) may change; records travel; capacity not reduced', 27);
        C(!eq(b.owner, ZERO20), '新 owner 非全 0', 'new owner not all-zero', 38); C(!eq(b.owner, H(O[0].lock).subarray(0, 20)), '新 owner ≠ account-lock', 'new owner ≠ account-lock', 44);
        C(eq(b.manager, b.owner), 'manager 重置为新 owner', 'manager reset to the new owner', 27);
        C(hasInputUnder(ctx, a.owner), '有输入 lock hash 前 20 字节 = 原 owner', 'an input whose lock hash[0..20] = the current owner', 29); c.push(consentNote); } break;
      case 'renew': if (!one()) break; {
        const a = I[0].a, b = O[0].a; C(core(a, b) && keep(['owner', 'manager', 'wh'], a, b) && I[0].lock === O[0].lock && O[0].cap >= I[0].cap && b.exp > a.exp, '只允许 expires 增大；capacity 不减', 'only expires may grow; capacity not reduced', 27);
        const yrs = Number((b.exp - a.exp + 31535999n) / 31536000n); C(yrs <= 10, `延长 ${yrs} 年 ≤ 10`, `extension ${yrs} years ≤ 10`, 43);
        c.push(R.NOT_CHECKED('treasury 费用；子名需父名 cell dep + 父 owner 输入且不晚于父到期', 'treasury fee; a sub-name needs the parent cell dep + parent owner input, not outliving it', '42 / 40 / 41 / 29')); } break;
      case 'recycle': {
        C(I.length === 2 && O.length === 1, '2 进（p, x），1 出（p′）', '2 in (p, x), 1 out (p′)', 25); if (I.length !== 2 || O.length !== 1) break;
        const Pn = O[0].a, k = eq(I[0].a.id, Pn.id) ? 0 : eq(I[1].a.id, Pn.id) ? 1 : -1; C(k >= 0, '某个输入 id = p′.id', 'one input id = p′.id', 25); if (k < 0) break;
        const P = I[k].a, Xc = I[1 - k], Xa = Xc.a;
        C(eq(Pn.next, Xa.next), 'p′.next = x.next', 'p′.next = x.next', 25);
        C(keep(['label', 'exp', 'owner', 'manager', 'wh'], P, Pn) && I[k].lock === O[0].lock && O[0].cap >= I[k].cap, 'p′ 其余字段、lock 不变，capacity 不减', 'p′ other fields and lock unchanged; capacity not reduced', 27);
        C(eq(Xa.id, P.next) && covers(P.id, P.next, Xa.id), 'x 是 p 的直接后继', 'x is p’s immediate successor', 25);
        C(!eq(Xa.id, ZERO20), 'x 不是根', 'x is not the root', 46);
        const s = BigInt(Xc.since); C((s >> 56n) === 0x40n && (s & 0xFFFFFFFFFFFFFFn) >= Xa.exp + 2592000n, 'x 的 since = 绝对时间戳 ≥ expires + 30 天', 'x since = absolute timestamp ≥ expires + 30 days', 28);
      } break;
      default: C(false, `未知动作 "${p.action}"`, `unknown action "${p.action}"`, 23);
    }
    return c;
  }
  R.register({ id: 'cells_account_type', kind: 'type', name: { zh: 'Cells 名字（account-cell-type）', en: 'Cells name (account-cell-type)' }, match: [
    { code_hash: '0xd96cee56727a2bb9a21408c154d278df5095fb4b4dcfd50516156424479bfe54', hash_type: 'type', net: 'mainnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.account; cells-contracts docs/TRUST.md' },
    { code_hash: '0xe0706b176678181d982290d93dfcd82098e60cceaa4a87f10f32dcbcc91df1d9', hash_type: 'type', net: 'testnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.account' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

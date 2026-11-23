// standard-udt sudt-meta — xcshuan/ckb-standard-udt-contracts contracts/sudt-meta/src + lib/{types,script-utils} @ d6e6da0109e082551af9873c64cda0d1f514c9e3
// No deployment published (SUDT_CODE_HASH is a build-time constant). match is empty: static page only.
// @requires type_id
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const AS_LOCK = '0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1';
  const LIM = { name: 1024, symbol: 128, uri: 2048, extra_data: 16384 };
  const AUTH = ['InputLock', 'InputType', 'OutputType', 'DynamicLinking', 'Spawn'];
  function auth(b) { // AuthorityOpt: empty = None; Authority { authority_type: byte, script_hash: Byte32, script: ScriptOpt }
    if (!b.length) return null; const f = R.parseTable(b, 3); if (f.length !== 3 || f[0].length !== 1 || f[1].length !== 32) throw new Error('Authority');
    const t = f[0][0]; if (t > 4) throw new Error('authority_type'); const hasScript = f[2].length > 0;
    if (t <= 2 && hasScript) throw new Error('script must be None'); if (t >= 3 && !hasScript) throw new Error('script required');
    return { type: AUTH[t], t, script_hash: X(f[1]), script: hasScript ? X(f[2]) : null };
  }
  function parseSudtMeta(hex) { // SudtMeta table, 9 fields; throws on Molecule / limit / config errors
    const b = H(hex || '0x'), f = R.parseTable(b, 9); if (f.length !== 9) throw new Error('SudtMeta must have 9 fields');
    if (f[0].length !== 1 || f[1].length !== 16 || f[2].length !== 1) throw new Error('fixed field size');
    const m = { config_flags: f[0][0], current_supply: R.leToBig(f[1]), decimals: f[2][0] };
    ['name', 'symbol', 'uri', 'extra_data'].forEach((k, i) => { const v = R.parseBytes(f[3 + i]); if (v.length > LIM[k]) throw new Error(k + ' too large'); m[k] = v; });
    m.mint_authority = auth(f[7]); m.metadata_authority = auth(f[8]);
    if (m.config_flags & ~1) throw Object.assign(new Error('config_flags'), { flags: true });
    if (!(m.config_flags & 1) && m.current_supply !== 0n) throw Object.assign(new Error('untracked supply ≠ 0'), { supply: true });
    return m;
  }
  R.stdUdt = Object.assign(R.stdUdt || {}, { parseSudtMeta, AS_LOCK });
  const txt = u => { try { return new TextDecoder('utf-8', { fatal: true }).decode(u); } catch (e) { return X(u); } };
  const authStr = a => a ? `${a.type} ${a.script_hash.slice(0, 10)}…` : 'None';
  R.register({
    id: 'std_sudt_meta', kind: 'type', name: { zh: 'standard-udt sUDT 元数据 type', en: 'standard-udt sUDT metadata type' }, match: [],
    parse(g, ctx) {
      const p = { fields: [] }, rd = (h) => { try { return { m: parseSudtMeta(h) }; } catch (e) { return { err: e }; } };
      p.in = g.inputs.length ? rd(ctx.inputs[g.inputs[0]].data) : null; p.out = g.outputs.length ? rd(ctx.tx.outputs_data[g.outputs[0]]) : null;
      const m = (p.out && p.out.m) || (p.in && p.in.m);
      if (m) p.fields.push(['name / symbol', `${txt(m.name)} / ${txt(m.symbol)}`], ['decimals', String(m.decimals)], ['config_flags', '0x' + m.config_flags.toString(16).padStart(2, '0') + (m.config_flags & 1 ? ' (SUPPLY_TRACKED)' : '')],
        ['current_supply', String(m.current_supply)], ['mint_authority', authStr(m.mint_authority)], ['metadata_authority', authStr(m.metadata_authority)]);
      p.route = !g.inputs.length && g.outputs.length ? 'create' : g.inputs.length && g.outputs.length ? 'update' : g.inputs.length ? 'destroy' : '—';
      p.fields.push([{ zh: '路由', en: 'route' }, p.route]);
      return p;
    },
    check(g, ctx, p) {
      const c = [], t = ctx.tx;
      c.push(R.check(H(g.script.args).length === 32, 'args = 32B（type id）', 'args = 32B (type id)', 20));
      c.push(R.check(g.inputs.length <= 1 && g.outputs.length <= 1, '同组输入、输出各 ≤ 1 个元数据 cell', '≤ 1 metadata cell per side in the group', 21));
      const bad = s => s && s.err ? (s.err.supply ? 31 : 30) : null;
      for (const [s, zh, en] of [[p.in, '输入', 'input'], [p.out, '输出', 'output']]) if (s) c.push(R.check(!s.err, `${zh} SudtMeta 可解析（Molecule、长度上限、config_flags ⊆ 0x01、未跟踪时 supply = 0）`, `${en} SudtMeta parses (Molecule, size limits, config_flags ⊆ 0x01, untracked ⇒ supply = 0)`, bad(s) || 30));
      for (const o of g.outputs) { const l = t.outputs[o].lock; c.push(R.check(l.hash_type === 'data2' && l.code_hash === AS_LOCK, `输出 lock = always-success（data2 ${AS_LOCK.slice(0, 10)}…）`, `output lock = always-success (data2 ${AS_LOCK.slice(0, 10)}…)`, 20)); }
      if ((p.in && p.in.err) || (p.out && p.out.err)) return c;
      if (p.route === 'create') {
        c.push(R.check(g.script.args === R.typeId(ctx, g.outputs[0]), 'type id = blake2b(inputs[0] ‖ 输出序号 u64 LE)', 'type id = blake2b(inputs[0] ‖ output index u64 LE)', 10));
        c.push(p.out.m.config_flags & 1 ? R.NOT_CHECKED('tracked：current_supply = 输出中绑定 sUDT（SUDT_CODE_HASH 构建期常量）总量', 'tracked: current_supply = total bound sUDT in outputs (SUDT_CODE_HASH is a build-time constant)', 31) : R.check(p.out.m.current_supply === 0n, 'untracked：current_supply = 0', 'untracked: current_supply = 0', 31));
        return c;
      }
      const i = p.in.m;
      if (p.route === 'update') { const o = p.out.m;
        c.push(R.check((i.config_flags & 1) === (o.config_flags & 1), 'supply 跟踪模式不可变', 'supply-tracking mode is immutable', 32));
        if (o.config_flags & 1) c.push(R.NOT_CHECKED('tracked：新 supply = 旧 supply ± 交易中绑定 sUDT 的净变化', 'tracked: new supply = old supply ± net change of bound sUDT in the tx', 31));
        c.push(R.NOT_CHECKED('metadata_authority（失败回退 mint_authority）授权', 'metadata_authority (fallback mint_authority) authorizes', '50 / 51'));
        if (i.current_supply !== o.current_supply || JSON.stringify(i.mint_authority) !== JSON.stringify(o.mint_authority)) c.push(R.NOT_CHECKED('supply 或 mint_authority 变化：还需 mint_authority 授权', 'supply or mint_authority changed: mint_authority must also authorize', '50 / 51'));
        return c; }
      c.push(R.check((i.config_flags & 1) === 1 && i.current_supply === 0n, '销毁：tracked 且 current_supply = 0', 'destroy: tracked and current_supply = 0', 31));
      c.push(R.NOT_CHECKED('销毁：无绑定 sUDT 输出；mint_authority 授权', 'destroy: no bound sUDT outputs; mint_authority authorizes', '31 / 50 / 51'));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

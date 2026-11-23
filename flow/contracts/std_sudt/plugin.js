// standard-udt sudt — xcshuan/ckb-standard-udt-contracts contracts/sudt/src + lib/script-utils @ d6e6da0109e082551af9873c64cda0d1f514c9e3
// No deployment published. match is empty: static page only.
(function (R) {
  const H = R.hexToBytes;
  const amt = h => { const b = H(h || '0x'); return b.length >= 16 ? R.leToBig(b.subarray(0, 16)) : null; };
  R.register({
    id: 'std_sudt', kind: 'type', name: { zh: 'standard-udt sUDT type', en: 'standard-udt sUDT type' }, match: [],
    parse(g, ctx) {
      const ins = g.inputs.map(i => amt(ctx.inputs[i].data)), outs = g.outputs.map(o => amt(ctx.tx.outputs_data[o]));
      const p = { ins, outs, bad: [...ins, ...outs].some(x => x == null) };
      p.sumIn = ins.reduce((a, x) => a + (x || 0n), 0n); p.sumOut = outs.reduce((a, x) => a + (x || 0n), 0n);
      p.metaHash = g.script.args;
      p.metaIn = ctx.inputs.findIndex(x => x.output && x.output.type && R.scriptHash(x.output.type) === p.metaHash);
      p.metaOut = ctx.tx.outputs.findIndex(o => o.type && R.scriptHash(o.type) === p.metaHash);
      p.route = p.sumOut > p.sumIn ? 'mint' : p.sumOut < p.sumIn ? (p.metaIn >= 0 ? 'protocol burn' : 'user destruction') : 'transfer';
      p.fields = [['meta_type_hash (args)', g.script.args], ['Σ in / Σ out', `${p.sumIn} / ${p.sumOut}`], [{ zh: '分类', en: 'class' }, p.route]];
      return p;
    },
    check(g, ctx, p) {
      const c = [R.check(H(g.script.args).length === 32, 'args = 元数据 cell 的 type hash（32B）', 'args = metadata cell type hash (32B)', 20),
        R.check(!p.bad, '每个组内 cell 的 data ≥ 16B（u128 LE 数量）', 'every group cell has data ≥ 16B (u128 LE amount)', 30)];
      if (p.bad || p.route !== 'mint') { if (!p.bad) c.push(R.check(true, 'Σ 输出 ≤ Σ 输入：sudt 不再检查（销毁 / 协议销毁由 sudt-meta 负责记账）', 'Σ out ≤ Σ in: sudt checks nothing more (burn accounting is sudt-meta’s job)', '—')); return c; }
      c.push(R.NOT_CHECKED('铸造：cell_deps 优先、其次输入中找唯一元数据 cell（type hash = args）；都没有则输出中须有一个（首次铸造）', 'mint: find the unique metadata cell (type hash = args) in cell_deps first, then inputs; if none, one must be in outputs (initial mint)', '41 / 42 / 40'));
      c.push(R.NOT_CHECKED('tracked：元数据必须来自输入（cell_dep → 43）；untracked：mint_authority 授权且 current_supply = 0', 'tracked: metadata must come from an input (cell_dep → 43); untracked: mint_authority authorizes and current_supply = 0', '43 / 45 / 50 / 51 / 52'));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

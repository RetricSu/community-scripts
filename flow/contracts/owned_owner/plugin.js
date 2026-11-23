// iCKB owned_owner — ickb/contracts scripts/contracts/owned_owner/src/{entry,error}.rs
// @requires ickb_logic
(function (R) {
  const H = R.hexToBytes;
  function parse(g, ctx) {
    const { ins, outs } = R.ickb.cells(ctx), p = { misuse: [], notWr: [], groups: [] };
    for (const list of [ins, outs]) { const m = new Map();
      for (const c of list) { const L = c.lockHash === g.hash, T = c.typeHash === g.hash, tag = `${c.src}[${c.index}]`;
        if (L && T) { p.misuse.push(tag); continue; }
        if (T) { const d = H(c.data || '0x'); if (d.length < 4) { p.short = (p.short || []).concat(tag); continue; } const b = d.slice(0, 4); const dist = new DataView(b.buffer).getInt32(0, true);
          const key = (c.tx || '') + ':' + (c.idx + dist); const a = m.get(key) || { owned: [], owner: [] }; a.owner.push(tag + ` (distance ${dist})`); m.set(key, a); }
        else if (L) { if (c.typeHash !== R.ickb.DAO_HASH || !R.ickb.isWithdrawData(c.data)) p.notWr.push(tag);
          const key = (c.tx || '') + ':' + c.idx; const a = m.get(key) || { owned: [], owner: [] }; a.owned.push(tag); m.set(key, a); } }
      p.groups.push(...m.values()); }
    p.fields = p.groups.map(a => [{ zh: '配对', en: 'pair' }, `owned ${a.owned.join(',') || '—'} ⇄ owner ${a.owner.join(',') || '—'}`]);
    p.layouts = [{ label: 'owner cell data (OwnedOwnerData struct 4B)', layout: [{ name: 'owned_distance i32', size: '4B', color: 2 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    return [R.check(R.ickb.emptyArgs(g, ctx), 'args 为空（输出中同 code 的 lock 也无 args）', 'args empty (same-code output locks too)', 5),
      R.check(p.notWr.length === 0, 'owned cell（lock = 本脚本）都是 DAO 取款请求' + (p.notWr.length ? '：' + p.notWr.join(',') : ''), 'owned cells (lock = this script) are DAO withdrawal requests' + (p.notWr.length ? ': ' + p.notWr.join(',') : ''), 6),
      R.check(!p.short, 'owner cell data ≥ 4 字节' + (p.short ? '：' + p.short.join(',') : ''), 'owner cell data ≥ 4 bytes' + (p.short ? ': ' + p.short.join(',') : ''), 4),
      R.check(p.misuse.length === 0, '没有 cell 同时以本脚本为 lock 和 type', 'no cell uses this script as both lock and type', 7),
      R.check(p.groups.every(a => a.owned.length === 1 && a.owner.length === 1), '输入、输出中每个 owned 恰好对应一个 owner（按 OutPoint/序号 + distance 配对）', 'in inputs and outputs each owned pairs with exactly one owner (by OutPoint/index + distance)', 8)];
  }
  R.register({ id: 'owned_owner', kind: 'lock', name: 'iCKB owned owner', match: [{ code_hash: '0xacc79e07d107831feef4c70c9e683dac5644d5993b9cb106dca6e74baa381bd0', hash_type: 'data1', net: 'mainnet', src: 'blake2b of ickb/contracts release binary, confirmed on mainnet' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

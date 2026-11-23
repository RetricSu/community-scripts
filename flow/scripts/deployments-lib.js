// Shared helpers for resolving on-chain deployments of a script (code cell, cell_dep, type_id, data hash).
'use strict';
const C = require('../lib/ckb.js');
const RPC = { mainnet: 'https://mainnet.ckb.dev/rpc', testnet: 'https://testnet.ckb.dev/rpc' };
const call = (net, m, p) => C.rpc(process.env['CKB_RPC_' + net.toUpperCase()] || RPC[net], m, p);
const dataHash = hex => C.bytesToHex(C.blake2b(C.hexToBytes(hex)));
async function cellAt(net, op) {
  const r = await call(net, 'get_live_cell', [op, true]);
  if (r.status === 'live') return { output: r.cell.output, data: r.cell.data.content, live: true };
  const t = await call(net, 'get_transaction', [op.tx_hash]); if (!t || !t.transaction) return null;
  const i = parseInt(op.index, 16); return { output: t.transaction.outputs[i], data: t.transaction.outputs_data[i], live: false };
}
async function sampleTxs(net, m, kind, tests) {
  const hs = (tests || []).filter(t => (t.net || 'mainnet') === net).map(t => t.tx);
  if (m.code_hash && /^0x0+545950455f4944$/.test(m.code_hash)) return hs;
  try { const r = await call(net, 'get_transactions', [{ script: { code_hash: m.code_hash, hash_type: m.hash_type, args: '0x' }, script_type: kind, script_search_mode: 'prefix' }, 'desc', '0x5']);
    for (const o of r.objects) if (!hs.includes(o.tx_hash)) hs.push(o.tx_hash); } catch (e) { /* indexer unavailable */ }
  return hs;
}
// Find the code cell for (code_hash, hash_type) among a tx's cell_deps (dep_groups expanded).
async function findInTx(net, m, txHash) {
  const t = await call(net, 'get_transaction', [txHash]); if (!t || !t.transaction) return null;
  for (const d of t.transaction.cell_deps) {
    const cands = [{ op: d.out_point, via: null }];
    if (d.dep_type === 'dep_group') { const g = await cellAt(net, d.out_point); if (!g) continue;
      const b = C.hexToBytes(g.data), n = b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24;
      cands.length = 0; for (let i = 0; i < n; i++) { const o = 4 + i * 36; cands.push({ op: { tx_hash: C.bytesToHex(b.subarray(o, o + 32)), index: '0x' + (b[o + 32] | b[o + 33] << 8).toString(16) }, via: d }); } }
    for (const c of cands) { const cell = await cellAt(net, c.op); if (!cell) continue;
      const ok = m.hash_type === 'type' ? cell.output.type && C.scriptHash(cell.output.type) === m.code_hash : dataHash(cell.data) === m.code_hash;
      if (ok) return { cell_dep: { out_point: (c.via || d).out_point, dep_type: (c.via || d).dep_type }, code_cell: c.op, type_script: cell.output.type || null, data_hash: dataHash(cell.data), seen_in_tx: txHash, live: cell.live }; }
  }
  return null;
}
async function resolve(net, m, kind, tests) {
  if (/^0x0+545950455f4944$/.test(m.code_hash)) return { builtin: true, note: 'built into CKB (no code cell)' };
  for (const h of (await sampleTxs(net, m, kind, tests)).slice(0, 6)) {
    const r = await findInTx(net, m, h); if (!r) continue;
    if (m.hash_type === 'type' && r.type_script) { // current live cell carrying this type script (after upgrades)
      try { const lc = await call(net, 'get_cells', [{ script: r.type_script, script_type: 'type' }, 'asc', '0x5']);
        const live = lc.objects[0]; if (live) { const cell = await cellAt(net, live.out_point); r.code_cell = live.out_point; r.data_hash = dataHash(cell.data); r.live = true;
          if (r.cell_dep.dep_type === 'code') r.cell_dep = { out_point: live.out_point, dep_type: 'code' }; } } catch (e) { }
    }
    const tx = await call(net, 'get_transaction', [r.code_cell.tx_hash]); r.deploy_tx = r.code_cell.tx_hash;
    if (tx && tx.tx_status.block_hash) { const hd = await call(net, 'get_header', [tx.tx_status.block_hash]); r.deploy_block = parseInt(hd.number, 16); }
    return r;
  }
  const hint = m.deps && m.deps[net]; // documented cell dep, for scripts with no on-chain usage yet
  if (hint) { const cell = await cellAt(net, hint); if (cell && (m.hash_type === 'type' ? cell.output.type && C.scriptHash(cell.output.type) === m.code_hash : dataHash(cell.data) === m.code_hash)) {
    const tx = await call(net, 'get_transaction', [hint.tx_hash]); let blk = null; if (tx && tx.tx_status.block_hash) blk = parseInt((await call(net, 'get_header', [tx.tx_status.block_hash])).number, 16);
    return { cell_dep: { out_point: hint, dep_type: 'code' }, code_cell: hint, type_script: cell.output.type || null, data_hash: dataHash(cell.data), deploy_tx: hint.tx_hash, deploy_block: blk, live: cell.live, via: 'documented cell dep' }; } }
  return null;
}
module.exports = { RPC, call, dataHash, resolve, findInTx, cellAt };

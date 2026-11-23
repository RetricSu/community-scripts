// Decode a CKB transaction for AI agents: every cell, grouped by lock / type script, with the contract behind each script
// (and a link to its <id>.md doc), the fields its plugin parses and its signature-free checks. Markdown, or JSON with --json.
//   node scripts/decode-tx.js 0x<tx hash> [--testnet | --rpc <url>] [--json]     (Node.js ≥ 18; RPC= / TESTNET_RPC= as in test-tx.js)
// gen.js --all bundles it with lib/ckb.js and every plugin into out/decode-tx.js: one file, nothing to install.
'use strict';
const BUNDLED = !!globalThis.CKB_DEPS; // set by the out/decode-tx.js header
const C = BUNDLED ? globalThis.CKB : require('../lib/contracts.js').loadAll(), AG = BUNDLED ? null : require('../lib/agent.js');
const SITE = BUNDLED ? globalThis.CKB_SITE : AG.SITE, DEPS = BUNDLED ? globalThis.CKB_DEPS : AG.depIndex();
const argv = process.argv.slice(2), has = f => argv.includes(f), val = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const RPCS = { mainnet: process.env.RPC || 'https://mainnet.ckb.dev/rpc', testnet: process.env.TESTNET_RPC || 'https://testnet.ckb.dev/rpc' };
const hash = argv.find(a => /^0x[0-9a-f]{64}$/i.test(a)), net = has('--testnet') ? 'testnet' : val('--rpc') ? 'custom RPC' : 'mainnet';
const rpcUrl = val('--rpc') || RPCS[net];

const en = x => x == null ? '' : typeof x === 'object' ? String(x.en != null ? x.en : x.zh) : String(x);
const hx = (h, max = 64) => !h || h === '0x' ? '0x (empty)' : (h.length - 2) / 2 > max ? `${h.slice(0, 2 + 2 * max)}… (${(h.length - 2) / 2} bytes)` : `${h} (${(h.length - 2) / 2} bytes)`;
const ckb = v => { v = BigInt(v); const i = v / 100000000n, f = (v % 100000000n).toString().padStart(8, '0').replace(/0+$/, ''); return i.toLocaleString('en-US') + (f ? '.' + f : '') + ' CKB'; };
const op = o => `${o.tx_hash}:${parseInt(o.index, 16)}`;
const mark = c => c.ok === null ? '○' : c.ok ? '✓' : '✗';
const chk = c => `${mark(c)} ${c.en || c.zh}${c.code ? ` [${c.code}]` : ''}`;
const brief = s => { if (!s) return 'none'; const p = C.identify(s); return `${p ? '`' + p.id + '`' : `unknown ${s.code_hash} (${s.hash_type})`} args ${hx(s.args, 128)}`; };
const wit = w => !w ? 'missing' : w.empty ? 'empty' : w.error ? `not WitnessArgs (${w.error}): ${hx(w.raw)}`
  : `WitnessArgs { lock: ${w.args.lock ? hx(w.args.lock) : 'none'}, input_type: ${w.args.input_type ? hx(w.args.input_type) : 'none'}, output_type: ${w.args.output_type ? hx(w.args.output_type) : 'none'} }`;
const since = h => { const s = C.parseSince(h); return s.none ? '' : ` · since ${h} (${s.epoch ? 'epoch ' + C.fmtEpoch(s.epoch) : s.metric + ' ' + s.value} ${s.relative ? 'relative' : 'absolute'})`; };
const cell = (i, o, data) => `- [${i}] ${ckb(o.capacity)} · lock ${brief(o.lock)} · type ${brief(o.type)} · data ${hx(data)}`;
function rng(a) { const r = []; for (const x of a) { const l = r[r.length - 1]; if (l && x === l[1] + 1) l[1] = x; else r.push([x, x]); } return r.map(([x, y]) => x === y ? String(x) : `${x}–${y}`).join(', ') || 'none'; }

function group(g, k, a) {
  const p = g.plugin, L = [`### ${k + 1}. ${g.kind} · ${p ? `${en(p.name)} \`${p.id}\`` : 'unknown script'} · inputs [${rng(g.inputs)}] → outputs [${rng(g.outputs)}]`, ''];
  L.push(p ? `- doc: ${SITE}${p.id}.md` : `- not in the registry (${SITE}llms.txt): no parsing, no checks`);
  L.push(`- script: code_hash ${g.script.code_hash} · hash_type ${g.script.hash_type} · args ${hx(g.script.args, 128)}`, `- script hash: ${g.hash}`);
  if (g.kind === 'lock') L.push(`- unlocked by witness[${g.witnessIndex}]: ${wit(a.witnesses[g.witnessIndex])}`);
  for (const [k2, v] of g.parsed.fields || []) L.push(`- ${en(k2)}: ${en(v)}`);
  for (const l of g.parsed.layouts || []) L.push(`- ${en(l.label)}${(l.layout || []).length ? ': ' + l.layout.map(f => `${en(f.name)} (${en(f.size)})`).join(' | ') : ''}`, ...(l.hex || []).map(([hk, hv]) => `  - ${en(hk)}: ${en(hv)}`));
  if (g.checks.length) L.push('- checks:', ...g.checks.map(c => '  - ' + chk(c)));
  return L.join('\n');
}
function markdown(b, a) {
  const { tx, status: st } = b;
  return [`# CKB transaction ${b.txHash}`, '',
    `- network: ${net} · rpc ${rpcUrl}`,
    `- status: ${st.status}${st.block_number ? ` · block ${BigInt(st.block_number)}` : ''}${st.status === 'committed' ? ' · accepted by the chain, so every script rule passed on chain, ○ included (a ✗ would mean the plugin disagrees with the chain)' : ''}`,
    `- ${tx.inputs.length} inputs · ${tx.outputs.length} outputs · ${tx.cell_deps.length} cell_deps · ${tx.header_deps.length} header_deps · ${tx.witnesses.length} witnesses`,
    `- fee: ${a.fee} shannons (${ckb(a.fee)})`,
    `- contract docs: ${SITE}llms.txt · checks: ✓ pass, ✗ fail, ○ not checked (signatures are never verified); [code] = the script's error code`, '',
    '## Transaction checks', '', ...a.checks.map(c => '- ' + chk(c)), '',
    '## Cell deps', '', ...tx.cell_deps.map((d, i) => `- [${i}] ${op(d.out_point)} ${d.dep_type}${DEPS[op(d.out_point)] ? ' — ' + DEPS[op(d.out_point)].map(x => '`' + x + '`').join(', ') : ''}`),
    ...(tx.header_deps.length ? ['', '## Header deps', '', ...tx.header_deps.map((h, i) => `- [${i}] ${h}`)] : []), '',
    '## Inputs', '', ...b.inputs.map((x, i) => x.cellbase ? `- [${i}] cellbase` : cell(i, x.output, x.data) + since(x.input.since) + ` · out_point ${op(x.input.previous_output)}`), '',
    '## Outputs', '', ...tx.outputs.map((o, j) => cell(j, o, tx.outputs_data[j])), '',
    '## Witnesses', '', ...a.witnesses.map((w, i) => `- [${i}] ${wit(w)}`), '',
    '## Script groups', '', a.groups.map((g, k) => group(g, k, a)).join('\n\n'), ''].join('\n');
}
function json(b, a) {
  const { tx } = b, id = s => { const p = s && C.identify(s); return p ? p.id : null; }, ck = c => ({ ok: c.ok, text: c.en || c.zh, code: c.code });
  const cl = (o, data) => ({ capacity: o.capacity, lock: { ...o.lock, contract: id(o.lock) }, type: o.type ? { ...o.type, contract: id(o.type) } : null, data });
  return { tx_hash: b.txHash, network: net, rpc: rpcUrl, status: b.status.status, block_number: b.status.block_number ? String(BigInt(b.status.block_number)) : null,
    fee_shannons: String(a.fee), docs: SITE + 'llms.txt', checks: a.checks.map(ck),
    cell_deps: tx.cell_deps.map(d => ({ ...d, contracts: DEPS[op(d.out_point)] || [] })), header_deps: tx.header_deps,
    inputs: b.inputs.map((x, i) => x.cellbase ? { index: i, cellbase: true } : { index: i, previous_output: x.input.previous_output, since: x.input.since, ...cl(x.output, x.data) }),
    outputs: tx.outputs.map((o, j) => ({ index: j, ...cl(o, tx.outputs_data[j]) })),
    witnesses: a.witnesses.map(w => w.args ? { raw: w.raw, witness_args: w.args } : w),
    groups: a.groups.map(g => ({ kind: g.kind, contract: g.plugin ? { id: g.plugin.id, name: en(g.plugin.name), doc: SITE + g.plugin.id + '.md' } : null,
      script: g.script, script_hash: g.hash, inputs: g.inputs, outputs: g.outputs, witness_index: g.witnessIndex == null ? null : g.witnessIndex,
      fields: (g.parsed.fields || []).map(([k, v]) => [en(k), en(v)]),
      layouts: (g.parsed.layouts || []).map(l => ({ label: en(l.label), fields: (l.layout || []).map(f => ({ name: en(f.name), size: en(f.size) })), hex: (l.hex || []).map(([k, v]) => [en(k), en(v)]) })),
      checks: g.checks.map(ck) })) };
}

if (!hash) { console.error('Usage: node decode-tx.js 0x<tx hash> [--testnet | --rpc <url>] [--json]\n  Markdown by default, --json for JSON. Mainnet RPC unless --testnet / --rpc (or RPC= / TESTNET_RPC=).'); process.exit(has('-h') || has('--help') ? 0 : 1); }
(async () => {
  if (typeof fetch === 'undefined') throw new Error('Node.js ≥ 18 is required (global fetch)');
  const b = await C.fetchTxBundle(rpcUrl, hash), a = C.analyze(b);
  process.stdout.write(has('--json') ? JSON.stringify(json(b, a), (k, v) => typeof v === 'bigint' ? v.toString() : v, 1) + '\n' : markdown(b, a));
})().catch(e => {
  const hint = /not found/.test(e.message) ? ` on ${net} — wrong network? try ${net === 'testnet' ? 'without --testnet' : '--testnet'}` : e.code === 'CORS' ? ` (cannot reach ${rpcUrl})` : '';
  console.error(`decode-tx: ${e.message}${hint}`); process.exit(1);
});

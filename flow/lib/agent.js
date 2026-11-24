// Agent-readable outputs, written by gen.js --all next to the HTML: llms.txt (entry point), <id>.md per contract,
// contracts.json, and decode-tx.js (lib/ckb.js + plugins + scripts/decode-tx.js in one file). English only, no HTML.
'use strict';
const fs = require('fs'), path = require('path');
const META = require('./meta.js'), C = require('./contracts.js');
const REPO = 'https://github.com/gpBlockchain/ckb-contract-flow-html';
// absolute links (agents get the files out of context); CI passes the Pages URL, forks get their own
const SITE = (process.env.SITE_URL || 'https://gpblockchain.github.io/ckb-contract-flow-html/').replace(/\/*$/, '/');
const EXP = { mainnet: 'https://explorer.nervos.org', testnet: 'https://testnet.explorer.nervos.org' };
const STATUS = { verified: 'verified (deployed binary matches the source)', unverified: 'unverified (deployed binary not matched to the source)', mismatch: 'MISMATCH (deployed binary differs from the source)', 'no-source': 'no public source', builtin: 'built into CKB' };
const en = x => x == null ? '' : typeof x === 'object' ? String(x.en != null ? x.en : x.zh) : String(x);
const td = x => en(x).replace(/\|/g, '\\|').replace(/\n/g, ' '); // markdown table cell
const code = x => '```\n' + en(x) + '\n```';
const url = f => SITE + f;
const commit = () => { if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try { return require('child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };

// one record per contracts/<id>/ (also those without spec.json: deployments + decoder only)
function records(specs) {
  const CK = C.loadAll();
  return C.list().map(c => {
    const meta = META.load(c.id) || {}, plugin = CK.PLUGINS.find(p => p.id === c.id) || null, spec = specs[c.id] || null, tags = META.tagsOf(meta, plugin);
    return { id: c.id, spec, meta, plugin, tags, kind: plugin ? plugin.kind : tags.find(t => t === 'lock' || t === 'type'),
      name: en(plugin && plugin.name) || en(spec && spec.title) || c.id, title: en(spec && spec.title) || en(plugin && plugin.name) || c.id,
      nets: tags.filter(t => t === 'mainnet' || t === 'testnet'), tests: c.tests ? JSON.parse(fs.readFileSync(c.tests, 'utf8')) : [] };
  });
}
// how a script is recognized per network: resolved deployments, else the plugin's match entries (e.g. zero_lock)
const idRows = r => (r.meta.deployments || []).length ? r.meta.deployments.map(d => ({ net: d.network, code_hash: d.code_hash, hash_type: d.hash_type }))
  : (r.plugin ? r.plugin.match : []).flatMap(m => (m.net ? [m.net] : ['mainnet', 'testnet']).map(net => ({ net, code_hash: m.code_hash, hash_type: m.hash_type })));
const cats = r => r.tags.filter(t => META.TAX.tags[t] && ['category', 'project'].includes(META.TAX.tags[t].group)).map(t => META.TAX.tags[t].group === 'project' ? META.TAX.tags[t].en : t).join(', ');
const ops = r => (r.spec && r.spec.transitions || []).map(t => `\`${en(t.tag)}\` ${en(t.title)}`).join('; ');
// cell_dep out_point "<tx_hash>:<index>" → contract ids (decode-tx.js names the cell deps of a tx)
function depIndex() {
  const idx = {};
  for (const c of C.list()) for (const d of (META.load(c.id) || {}).deployments || []) if (d.cell_dep) {
    const o = d.cell_dep.out_point, k = `${o.tx_hash}:${parseInt(o.index, 16)}`; (idx[k] = idx[k] || []).includes(c.id) || idx[k].push(c.id); }
  return idx;
}

function llms(recs, sha) {
  const link = r => `[${td(r.name)}](${url(r.id + '.md')})`;
  const on = net => new Set(recs.filter(r => idRows(r).some(d => d.net === net)).map(r => r.id));
  const table = net => { const rows = recs.flatMap(r => idRows(r).filter(d => d.net === net).map(d => ({ r, d }))), ids = on(net), other = net === 'mainnet' ? 'testnet' : 'mainnet', away = on(other);
    return [`## ${net === 'mainnet' ? 'Mainnet' : 'Testnet'}: ${ids.size} contracts, ${rows.length} deployments`, '',
      `Only on ${net}, not on ${other}: ${[...ids].filter(id => !away.has(id)).map(id => '`' + id + '`').join(', ') || 'none'}. One row per deployment (a contract can have several code_hashes).`, '',
      '| id | name | kind | code_hash | hash_type | category |', '| --- | --- | --- | --- | --- | --- |',
      ...rows.map(({ r, d }) => `| \`${r.id}\` | ${td(r.name)} | ${r.kind} | \`${d.code_hash}\` | ${d.hash_type} | ${cats(r)} |`)].join('\n'); };
  const none = recs.filter(r => !idRows(r).length);
  return [`# CKB Contract Flow`, '',
    `> Knowledge base of ${recs.length} CKB (Nervos) on-chain scripts for AI agents: where each one is deployed on mainnet and testnet (code_hash, hash_type, cell_dep), how to use it (args / cell data / witness byte layouts, the cell transitions it allows, every check it enforces with its error code), and a decoder that explains any transaction in terms of these scripts.`, '',
    `Built from ${REPO}${sha ? ` at commit ${sha}` : ''}. Everything linked below is plain Markdown or JSON; the bilingual (zh/en) HTML pages for people start at ${url('index.html')}.`, '',
    '## Decode a transaction', '',
    'Needs Node.js ≥ 18 and access to a CKB RPC; zero dependencies; it only reads from the RPC.', '',
    '```sh', `curl -fsSL ${url('decode-tx.js')} -o decode-tx.js`,
    'node decode-tx.js 0x<tx hash>               # mainnet, https://mainnet.ckb.dev/rpc',
    'node decode-tx.js 0x<tx hash> --testnet     # testnet, https://testnet.ckb.dev/rpc',
    'node decode-tx.js 0x<tx hash> --rpc <url>   # any CKB node',
    'node decode-tx.js 0x<tx hash> --json        # JSON instead of Markdown', '```', '',
    `It lists every cell, groups them by lock / type script, names the contract behind each script with a link to its doc, prints the fields its plugin parses (amounts, args, DAO phase, …) and runs the signature-free checks: ✓ pass, ✗ fail, ○ not checked (signatures and other VM-only rules), \`[code]\` = the script's error code. Same code as the browser decoder ${url('tx.html')} (source: scripts/decode-tx.js, lib/ckb.js, contracts/*/plugin.js).`, '',
    `Without Node: call the RPC \`get_transaction\`, look up each lock / type script's \`code_hash\` + \`hash_type\` in the tables below (or in ${url('contracts.json')}), then read that contract's doc.`, '',
    '## Contract docs', '',
    `\`${url('<id>.md')}\`, one per contract (\`id\` as in the tables; all linked in the last section): deployments with copy-ready \`script\` + \`cell_dep\` JSON, byte layouts, transitions (inputs → outputs), constraints with error codes, notes, example transactions and source. ${url('contracts.json')} has every contract and deployment as JSON.`, '',
    table('mainnet'), '', table('testnet'), '',
    `## No deployment recorded: ${none.length} contracts`, '', ...none.map(r => `- ${link(r)} — ${r.kind}${cats(r) ? ' · ' + cats(r) : ''}`), '',
    '## What each contract does', '',
    ...recs.map(r => `- ${link(r)} \`${r.id}\` — ${r.kind}${cats(r) ? ' · ' + cats(r) : ''} · ${r.nets.join(', ') || 'not deployed'}: ${ops(r) || 'no cell-flow spec yet (deployments and decoder only)'}`), '',
    '## Optional', '',
    `- [Source repository](${REPO}): specs (contracts/<id>/spec.json), plugins, tests, generator`,
    `- [Adding a contract](${REPO}/blob/main/docs/ADD_CONTRACT.md) · [agent skill](${REPO}/blob/main/skills/ckb-contract-flow/SKILL.md)`, ''].join('\n');
}

const box = (b, what) => b.layout ? layout(b, what) : `${what ? `**${what}** · ` : ''}${en(b.label)}\n\n${code(b.body)}`;
const layout = (b, what) => { // byte order = row order; meaning / constraint / error columns only when some field has them
  const cols = [['name', 'field'], ['size', 'size'], ['role', 'meaning'], ['cons', 'constraint'], ['err', 'error']].filter(([k], i) => i < 2 || b.layout.some(f => en(f[k])));
  return [`${what ? `**${what}** · ` : ''}byte layout: ${en(b.label)}`, '', `| # | ${cols.map(c => c[1]).join(' | ')} |`, `| --- |${' --- |'.repeat(cols.length)}`,
    ...b.layout.map((f, i) => `| ${i} | ${cols.map(([k]) => td(f[k])).join(' | ')} |`),
    ...(b.hex ? ['', 'Example:', '', ...b.hex.map(h => `- ${en(h[0])}: \`${en(h[1])}\``)] : []), ...(b.note ? ['', `Note: ${en(b.note)}`] : [])].join('\n'); };
function transition(t, i) {
  const out = [`### ${i + 1}. \`${en(t.tag)}\` ${en(t.title)}`];
  for (const [list, what] of [[t.inputs, 'Input'], [t.outputs, 'Output']]) if (list && list.length) list.forEach(b => out.push(box(b, what))); else out.push(`**${what}s**: none`);
  for (const sc of t.sections || []) out.push(`#### ${en(sc.title)}`, ...(sc.boxes || []).map(b => box(b)));
  for (const b of t.layouts || []) out.push(layout(b));
  if ((t.extras || []).length) out.push('**Also**\n\n' + t.extras.map(x => /\n/.test(en(x)) ? code(x) : `- ${en(x)}`).join('\n'));
  if ((t.limits || []).length) out.push(['**Constraints**', '', '| field | condition | error |', '| --- | --- | --- |',
    ...t.limits.map(l => `| ${td(l.field)} | ${td(l.cond)}${l.note ? ` (note: ${td(l.note)})` : ''} | ${td(l.err)} |`)].join('\n'));
  if (t.note) out.push(`Note: ${en(t.note)}`);
  return out.join('\n\n');
}
function deployment(d) {
  const L = [`### ${d.network}${d.constant_source ? ' — ' + d.constant_source : ''}`, '', `- code_hash: \`${d.code_hash}\` · hash_type: \`${d.hash_type}\``];
  if (d.builtin) L.push(`- ${d.note || 'built into CKB'}: no cell_dep needed`);
  else if (d.error) L.push(`- not resolved on chain: ${d.error}`);
  else L.push(`- deployed in tx [\`${d.deploy_tx}\`](${EXP[d.network]}/transaction/${d.deploy_tx})${d.deploy_block != null ? ` (block ${d.deploy_block})` : ''} · data_hash \`${d.data_hash}\`${d.type_script ? ` · type_id args \`${d.type_script.args}\`` : ''}${d.via ? ` · cell_dep from: ${d.via}` : ''}`);
  const j = JSON.stringify, o = d.cell_dep && d.cell_dep.out_point; // copy-ready, one object per line
  L.push('', '```json', `{\n  "script": { "code_hash": ${j(d.code_hash)}, "hash_type": ${j(d.hash_type)}, "args": "<args>" }${o ? `,\n  "cell_dep": { "out_point": { "tx_hash": ${j(o.tx_hash)}, "index": ${j(o.index)} }, "dep_type": ${j(d.cell_dep.dep_type)} }` : ''}\n}`, '```');
  return L.join('\n');
}
function contractMd(r) {
  const s = r.spec || {}, m = r.meta, src = m.source || {}, b = src.binary || {}, st = b.status || src.status || 'unverified', rev = src.commit || src.tag || '';
  const source = src.repo ? `[${src.repo.replace('https://github.com/', '')}@${rev.slice(0, 8)}](${src.repo}/tree/${rev})` + (src.paths || []).map(p => ` · [${p}](${src.repo}/blob/${rev}/${p})`).join('')
    : src.local ? `local source @${src.commit}` + (src.paths || []).map(p => ` · ${p}`).join('') : 'no public source';
  const notes = s.notes == null ? [] : Array.isArray(s.notes) ? s.notes : [s.notes], deps = m.deployments || [];
  const out = [`# ${r.title}`, ...(s.subtitle ? ['', `> ${en(s.subtitle)}`] : []), '',
    [`- id: \`${r.id}\` · ${r.kind} script · ${r.nets.length ? 'networks: ' + r.nets.join(', ') : 'no on-chain deployment'} · tags: ${r.tags.filter(t => !['lock', 'type', 'mainnet', 'testnet'].includes(t)).join(', ')}`,
      `- links: ${r.spec ? `page ${url(r.id + '.html')} · ` : ''}all contracts + tx decoder ${url('llms.txt')} · JSON ${url('contracts.json')}`,
      `- source: ${source}${src.commit_note ? ` (${src.commit_note})` : ''}`,
      `- binary vs source: ${STATUS[st] || st}${b.note || src.note ? ` — ${b.note || src.note}` : ''}`,
      ...(m.checked_at ? [`- on-chain data checked: ${m.checked_at}`] : []),
      ...((m.contributors || []).length ? [`- contributors: ${m.contributors.map(u => `[@${u}](https://github.com/${u})`).join(', ')}`] : [])].join('\n'), '',
    '## Deployments', '', deps.length ? deps.map(deployment).join('\n\n')
      : ['No on-chain deployment recorded.', ...idRows(r).map(d => `- recognized on ${d.net} by code_hash \`${d.code_hash}\` · hash_type \`${d.hash_type}\``)].join('\n')];
  if ((s.transitions || []).length) out.push('', '## Transitions', '', 'In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.', '', s.transitions.map(transition).join('\n\n'));
  else out.push('', 'No cell-flow spec yet: this contract only has deployments and a decoder plugin.');
  if (notes.length) out.push('', '## Notes', '', notes.map(n => `- ${en(n)}`).join('\n'));
  if (r.tests.length) out.push('', '## Example transactions', '', r.tests.map(t => { const net = t.net || 'mainnet';
    return `- ${net} · ${t.name || r.id} · [${t.tx}](${EXP[net]}/transaction/${t.tx}) · \`node decode-tx.js ${t.tx}${net === 'testnet' ? ' --testnet' : ''}\``; }).join('\n'));
  return out.join('\n') + '\n';
}
const registry = (recs, sha) => ({ generator: REPO, commit: sha, site: SITE, llms: url('llms.txt'), decoder: url('decode-tx.js'),
  contracts: recs.map(r => ({ id: r.id, name: r.name, title: r.title, kind: r.kind, networks: r.nets, tags: r.tags, doc: url(r.id + '.md'), page: r.spec ? url(r.id + '.html') : null,
    transitions: (r.spec && r.spec.transitions || []).map(t => ({ tag: en(t.tag), title: en(t.title) })),
    match: r.plugin ? r.plugin.match.map(m => ({ code_hash: m.code_hash, hash_type: m.hash_type, network: m.net || null, src: m.src })) : [],
    deployments: r.meta.deployments || [], source: r.meta.source || null, checked_at: r.meta.checked_at || null, contributors: r.meta.contributors || [],
    examples: r.tests.map(t => ({ tx: t.tx, network: t.net || 'mainnet', name: t.name || r.id })) })) });
const bundle = () => { const rd = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  return `#!/usr/bin/env node
// CKB transaction decoder for AI agents, generated by gen.js from ${REPO}
// (lib/ckb.js + contracts/*/plugin.js + scripts/decode-tx.js). Zero dependencies, Node.js >= 18.
//   node decode-tx.js 0x<tx hash> [--testnet | --rpc <url>] [--json]
globalThis.CKB_SITE = ${JSON.stringify(SITE)};
globalThis.CKB_DEPS = ${JSON.stringify(depIndex())};
${rd('lib/ckb.js')}
${C.ordered().map(c => `// ---- contracts/${c.id}/plugin.js ----\n` + fs.readFileSync(c.plugin, 'utf8')).join('\n')}
// ---- scripts/decode-tx.js ----
${rd('scripts/decode-tx.js')}`; };

function write(od, specs) {
  const recs = records(specs), sha = commit();
  for (const r of recs) fs.writeFileSync(path.join(od, r.id + '.md'), contractMd(r));
  fs.writeFileSync(path.join(od, 'llms.txt'), llms(recs, sha));
  fs.writeFileSync(path.join(od, 'contracts.json'), JSON.stringify(registry(recs, sha), null, 1) + '\n');
  fs.writeFileSync(path.join(od, 'decode-tx.js'), bundle());
  console.log(`(agents) -> ${path.join(od, 'llms.txt')}, ${recs.length} × <id>.md, contracts.json, decode-tx.js`);
}
module.exports = { SITE, REPO, depIndex, write };

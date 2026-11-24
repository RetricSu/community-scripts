// contracts/<id>/meta.json (tags, contributors, source, deployments) + contracts/tags.json taxonomy: loading, validation, HTML.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'contracts');
const TAX = JSON.parse(fs.readFileSync(path.join(ROOT, 'tags.json'), 'utf8'));
const USER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const BINARY = ['verified', 'unverified', 'mismatch', 'no-source', 'builtin'];
function load(id) { const p = path.join(ROOT, id, 'meta.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }
// full tag list: explicit tags + kind (from plugin) + networks (from resolved deployments, else plugin match entries)
function tagsOf(meta, plugin) {
  const t = new Set(meta.tags || []); if (plugin) t.add(plugin.kind);
  const nets = (meta.deployments || []).map(d => d.network); if (!nets.length && plugin) plugin.match.forEach(m => m.net ? nets.push(m.net) : nets.push('mainnet', 'testnet'));
  nets.forEach(n => t.add(n));
  const order = Object.keys(TAX.tags); return [...t].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
function validate(id, meta, plugin) {
  const e = [];
  if (!meta) return [`${id}: missing contracts/${id}/meta.json`];
  const tags = meta.tags || [], by = g => tags.filter(t => TAX.tags[t] && TAX.tags[t].group === g);
  for (const t of tags) if (!TAX.tags[t]) e.push(`${id}: unknown tag "${t}" (see contracts/tags.json)`);
  if (!by('category').length) e.push(`${id}: needs ≥ 1 category tag`);
  if (by('source').length !== 1) e.push(`${id}: needs exactly 1 source tag (open-source | no-source)`);
  if (by('maintainer').length !== 1) e.push(`${id}: needs exactly 1 maintainer tag`);
  if (by('project').length > 1) e.push(`${id}: at most 1 project tag`);
  if (by('kind').some(k => plugin && k !== plugin.kind)) e.push(`${id}: kind tag disagrees with plugin kind ${plugin.kind}`);
  if (meta.contributors != null) { if (!Array.isArray(meta.contributors)) e.push(`${id}: contributors must be an array`);
    else for (const u of meta.contributors) if (typeof u !== 'string' || !USER_RE.test(u)) e.push(`${id}: invalid GitHub username "${u}"`); }
  const s = meta.source; if (!s) e.push(`${id}: missing source`);
  else if (tags.includes('no-source')) { if (s.status !== 'no-source') e.push(`${id}: no-source contracts need source.status = "no-source"`); }
  else if (s.local) { // read from a local path (not published): commit = 40-hex sha of the local git repo, or "uncommitted"
    if (!/^[0-9a-f]{40}$/.test(s.commit || '') && s.commit !== 'uncommitted') e.push(`${id}: local source.commit must be a full 40-hex sha or "uncommitted"`);
    if (!Array.isArray(s.paths) || !s.paths.length) e.push(`${id}: source.paths must list ≥ 1 path`); }
  else { if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(s.repo || '')) e.push(`${id}: source.repo must be https://github.com/<owner>/<repo> (or set source.local: true)`);
    if (!/^[0-9a-f]{40}$/.test(s.commit || '') && !s.tag) e.push(`${id}: source.commit must be a full 40-hex sha (or set source.tag)`);
    if (!Array.isArray(s.paths) || !s.paths.length) e.push(`${id}: source.paths must list ≥ 1 path`); }
  if (s) require('../scripts/source-drift-lib.js').validateReview(s).forEach(x => e.push(`${id}: ${x}`));
  if (s && s.binary && !BINARY.includes(s.binary.status)) e.push(`${id}: source.binary.status must be one of ${BINARY.join('/')}`);
  if (!s || !s.binary) e.push(`${id}: missing source.binary (run node scripts/check-deployments.js --write --only ${id})`);
  if (!Array.isArray(meta.deployments)) e.push(`${id}: missing deployments (run node scripts/check-deployments.js --write --only ${id})`);
  else for (const d of meta.deployments) {
    if (!['mainnet', 'testnet'].includes(d.network)) e.push(`${id}: deployment.network must be mainnet|testnet`);
    if (!/^0x[0-9a-f]{64}$/.test(d.code_hash || '') || !['type', 'data', 'data1', 'data2'].includes(d.hash_type)) e.push(`${id}: deployment needs code_hash + hash_type`);
    if (!d.builtin && !d.error && (!d.cell_dep || !d.cell_dep.out_point || !d.data_hash || !d.deploy_tx)) e.push(`${id}: ${d.network} deployment needs cell_dep, data_hash, deploy_tx`);
  }
  return e;
}
module.exports = { TAX, USER_RE, load, tagsOf, validate };

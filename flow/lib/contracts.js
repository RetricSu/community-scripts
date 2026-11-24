// Node-side discovery of contracts/<id>/ (plugin.js, spec.json, tests.json). The browser gets them inlined by gen.js.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'contracts');
function list() {
  return fs.readdirSync(ROOT).filter(d => !d.startsWith('_') && fs.statSync(path.join(ROOT, d)).isDirectory()).sort().map(id => {
    const dir = path.join(ROOT, id), f = n => { const p = path.join(dir, n); return fs.existsSync(p) ? p : null; };
    return { id, dir, plugin: f('plugin.js'), spec: f('spec.json') || f('spec.yaml'), tests: f('tests.json') };
  });
}
// order plugins so that "// @requires a, b" dependencies load first
function ordered() {
  const all = list().filter(c => c.plugin), byId = Object.fromEntries(all.map(c => [c.id, c])), out = [], seen = new Set();
  const visit = (c, stack = []) => { if (seen.has(c.id)) return; if (stack.includes(c.id)) throw new Error('plugin cycle: ' + stack.concat(c.id).join(' -> '));
    const m = fs.readFileSync(c.plugin, 'utf8').match(/^\/\/ @requires (.+)$/m);
    for (const d of m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : []) { if (!byId[d]) throw new Error(`${c.id} requires missing plugin ${d}`); visit(byId[d], stack.concat(c.id)); }
    seen.add(c.id); out.push(c); };
  all.forEach(c => visit(c)); return out;
}
function loadAll() { const CKB = require('./ckb.js'); for (const c of ordered()) require(c.plugin); return CKB; }
module.exports = { ROOT, list, ordered, loadAll };

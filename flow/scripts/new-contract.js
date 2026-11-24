#!/usr/bin/env node
// Scaffold contracts/<id>/ with plugin.js, spec.json, tests.json (all with TODOs).
//   node scripts/new-contract.js <id> [--kind lock|type]
const fs = require('fs'), path = require('path');
const [id, ...rest] = process.argv.slice(2);
if (!id || !/^[a-z0-9_]+$/.test(id)) { console.error('Usage: node scripts/new-contract.js <id: [a-z0-9_]+> [--kind lock|type]'); process.exit(1); }
const kind = rest.includes('--kind') ? rest[rest.indexOf('--kind') + 1] : 'type';
if (!['lock', 'type'].includes(kind)) { console.error('--kind must be lock or type'); process.exit(1); }
const dir = path.join(__dirname, '..', 'contracts', id);
if (fs.existsSync(dir)) { console.error(`contracts/${id} already exists`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'plugin.js'), `// ${id} — TODO: source URL (repo/path@commit) and RFC / deployment reference for code_hash
// If this plugin reuses helpers from another plugin, declare it:  // @requires <other_id>
(function (R) {
  R.register({
    id: '${id}',
    kind: '${kind}',                      // 'lock' (runs for inputs only) | 'type' (inputs + outputs)
    name: { zh: 'TODO 中文名', en: 'TODO name' },
    // needsInputHeaders: true,         // set if check() needs headers of input cells' blocks
    match: [
      // TODO: only verified constants (official RFC / deployment docs). One entry per network if they differ.
      { code_hash: '0xTODO', hash_type: 'type', net: 'mainnet', src: 'TODO source' },
    ],
    // Parse the group into display data. Return bilingual-ready values (string or {zh,en}).
    parse(g, ctx) {
      // g: { kind, script, hash, inputs:[input idx], outputs:[output idx], witnessIndex (lock only) }
      // ctx: { tx, inputs:[{input, output, data, blockHash}], headers:{hash: header}, witnesses:[{args:{lock,input_type,output_type}}|{empty}|{error}], groups, lib }
      return {
        fields: [['args', g.script.args]],          // [[label, value]] rows
        layouts: [],                                // [{ label, layout:[{name,size,color,flex}], hex:[[k,v]] }]
        // bonus: 0n,                                // extra input capacity this script allows (e.g. DAO compensation)
      };
    },
    // Return one entry per constraint that exists in the SOURCE; ok:null = cannot be checked without signatures/VM.
    check(g, ctx, p) {
      return [
        R.check(true, 'TODO 条件', 'TODO condition', 'TODO error code'),
        R.NOT_CHECKED('TODO 未检查项', 'TODO not-checked item', null),
      ];
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));
`);
fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify({
  title: { zh: `TODO ${id} 合约约束`, en: `TODO ${id} Contract Constraints` },
  subtitle: { zh: '来源：TODO 仓库/文件@commit · code_hash TODO', en: 'Source: TODO repo/file@commit · code_hash TODO' },
  transitions: [{
    tag: kind === 'lock' ? '1 → N' : '0 → 1', title: { zh: 'TODO 动作', en: 'TODO action' },
    inputs: [{ label: 'input', body: 'Cell{\n  capacity: …\n}' }],
    outputs: [{ label: 'output', body: { zh: 'Cell{\n  data: {{TODO 被检查字段}}\n}', en: 'Cell{\n  data: {{TODO checked field}}\n}' } }],
    limits: [{ field: 'data', cond: { zh: 'TODO 条件', en: 'TODO condition' }, err: 'TODO' }],
  }],
  notes: [{ zh: 'TODO：只写源码中真实存在的检查', en: 'TODO: list only checks that exist in the source' }],
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({
  _doc: 'tags: ids from contracts/tags.json (≥1 category, 1 source, 1 maintainer; kind + network are derived). contributors: optional GitHub usernames (add yours!). source: repo + full commit sha you read + paths. deployments + source.binary: fill with `node scripts/check-deployments.js --write --only ' + id + '`.',
  tags: ['TODO_category', 'open-source', 'community'],
  contributors: [],
  source: { repo: 'https://github.com/TODO/TODO', commit: 'TODO_40_hex_commit_sha', paths: ['TODO/path/to/main.rs'], commit_note: 'commit read when writing this spec' },
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'tests.json'), JSON.stringify([{ tx: '0xTODO_real_tx_hash_using_this_script', net: 'mainnet', name: `${id} example`, expect: [id] }], null, 2) + '\n');
console.log(`created contracts/${id}/{plugin.js,spec.json,tests.json,meta.json}
next: fill TODOs → node scripts/check-deployments.js --write --only ${id} && node gen.js --all out && node scripts/check.js && node scripts/test-tx.js ${id}`);

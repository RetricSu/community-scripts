// Test the built out/tx.html against real chain data.
//   node scripts/test-tx.js              → run contracts/*/tests.json
//   node scripts/test-tx.js <id>         → only that contract's tests
//   node scripts/test-tx.js 0x<txhash>…  → ad-hoc txs (mainnet unless RPC=…)
// Each test: { "tx": "0x…", "net": "mainnet"|"testnet", "name": "…", "expect": ["<plugin id>", …] (default: the contract id), "allowFail": false }
// Pass = every expected plugin is recognized in some group AND no check returns ok === false AND rendered HTML is bilingual.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const h = fs.readFileSync(path.join(ROOT, 'out/tx.html'), 'utf8');
global.window = globalThis; global.document = { querySelector: () => null, querySelectorAll: () => [], documentElement: { setAttribute() {}, getAttribute() { return 'zh' } } };
global.localStorage = { getItem: () => null, setItem() {} }; global.navigator = { language: 'zh-CN' }; global.addEventListener = () => {};
for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) (0, eval)(m[1]);
const C = window.CKB, render = window.__txRender, contracts = require(path.join(ROOT, 'lib/contracts.js')).list();
const RPCS = { mainnet: process.env.RPC || 'https://mainnet.ckb.dev/rpc', testnet: process.env.TESTNET_RPC || 'https://testnet.ckb.dev/rpc' };
const args = process.argv.slice(2);
let cases;
if (args.length && args.every(a => /^0x[0-9a-f]{64}$/i.test(a))) cases = args.map(tx => ({ tx, net: 'mainnet', name: 'ad-hoc', expect: [], contract: '-' }));
else cases = contracts.filter(c => c.tests && (!args.length || args.includes(c.id)))
  .flatMap(c => JSON.parse(fs.readFileSync(c.tests, 'utf8')).map(t => ({ ...t, net: t.net || 'mainnet', expect: t.expect || [c.id], contract: c.id })));
(async () => {
  if (C.ckbHash(new Uint8Array()) !== '0x44f4c69744d5f8c55d642062949dcae49bc4e7ef43d388c5a12f42b5633d163e') throw new Error('blake2b vector');
  const g = await C.rpc(RPCS.mainnet, 'get_transaction', ['0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c']);
  if (C.scriptHash(g.transaction.outputs[1].type) !== '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8' || C.scriptHash(g.transaction.outputs[2].type) !== '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e') throw new Error('script hash vector');
  console.log(`vectors ok · plugins: ${C.PLUGINS.map(p => p.id).join(', ')}`);
  let fail = 0;
  for (const t of cases) {
    try {
      const b = await C.fetchTxBundle(RPCS[t.net], t.tx), a = C.analyze(b), html = render(b, a);
      const ids = a.groups.map(g => g.plugin ? g.plugin.id : 'unknown');
      const all = [...a.checks, ...a.groups.flatMap(g => g.checks)], bad = all.filter(c => c.ok === false), unk = all.filter(c => c.ok === null).length;
      const missing = t.expect.filter(e => !ids.includes(e));
      const noZh = html.replace(/<span data-l="zh">[\s\S]*?<\/span><span data-l="en">/g, '').replace(/<span data-l="en">/g, '');
      const bilingual = !/[\u4e00-\u9fff]/.test(noZh);
      const ok = !missing.length && (!bad.length || t.allowFail) && bilingual;
      console.log(`${ok ? 'PASS' : 'FAIL'} [${t.contract}] ${t.name} ${t.tx} (${t.net}) groups=[${[...new Set(ids)].join(',')}] checks=${all.length} failed=${bad.length} unchecked=${unk}${missing.length ? ' missing=' + missing : ''}${bilingual ? '' : ' NOT-BILINGUAL'}`);
      bad.forEach(c => console.log('     ✗', c.en, c.code || ''));
      if (!ok) fail++;
    } catch (e) { console.log(`FAIL [${t.contract}] ${t.name} ${t.tx}: ${e.message}`); fail++; }
  }
  console.log(`${cases.length - fail}/${cases.length} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

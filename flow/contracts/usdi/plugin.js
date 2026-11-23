// @requires xudt
// USDI Asset — mainnet code cell (type_id 0xbfa3…6bfc) holds the xUDT binary: its data hash equals the xUDT data1 hash
// 0x50bd8d66…1b95 (RFC 0052; pinned in ckb-production-scripts build.rs). So mainnet USDI runs exactly the xUDT rules (c/xudt_rce.c),
// and this plugin reuses the xudt plugin's parse/check for it. The testnet USDI code cell (0xcc9d…7037) holds a DIFFERENT, unidentified
// binary (data hash 0x28a734e1…94d8), so testnet groups are identified only.
// Constants: CKB Explorer registry (mainnet API /api/v2/scripts; testnet fill_contracts_info.rake), confirmed on chain 2026-11-06.
(function (R) {
  if (!R.PLUGINS.find(p => p.id === 'xudt') && typeof require !== 'undefined') require('../xudt/plugin.js');
  const X = R.PLUGINS.find(p => p.id === 'xudt'); if (!X) throw new Error('usdi requires xudt plugin');
  const MAIN = '0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc';
  R.register({ id: 'usdi', kind: 'type', name: { zh: 'USDI Asset（xUDT 二进制）', en: 'USDI Asset (xUDT binary)' }, match: [
    { code_hash: MAIN, hash_type: 'type', net: 'mainnet', src: 'CKB Explorer registry API /api/v2/scripts "USDI Asset" (mainnet); code cell data hash = xUDT 0x50bd…1b95' },
    { code_hash: '0xcc9dc33ef234e14bc788c43a4848556a5fb16401a04662fc55db9bb201987037', hash_type: 'type', net: 'testnet', src: 'nervosnetwork/ckb-explorer fill_contracts_info.rake "USDI Asset" (testnet); code cell data hash 0x28a7…94d8 (not xUDT)' }],
    parse(g, ctx) { return g.script.code_hash === MAIN ? X.parse(g, ctx) : { fields: [['args', g.script.args]] }; },
    check(g, ctx, p) {
      if (g.script.code_hash === MAIN) return [R.check(true, '主网 USDI 的 code cell 即 xUDT 二进制（data hash 0x50bd…1b95），按 xUDT 规则检查', 'mainnet USDI code cell is the xUDT binary (data hash 0x50bd…1b95); checked with xUDT rules', null), ...X.check(g, ctx, p)];
      return [R.NOT_CHECKED('测试网 USDI 的二进制（0x28a7…94d8）未找到对应源码：只识别，不检查', 'testnet USDI binary (0x28a7…94d8) has no located source: identified only, not checked', null)];
    } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

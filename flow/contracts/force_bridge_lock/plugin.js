// Force Bridge bridge lockscript — nervosnetwork/force-bridge@f3d7df7 ckb-contracts/lib/bridge-lockscript-lib/src/{lib.rs,adapter.rs}
// (entry: contracts/bridge-lockscript/src/main.rs; every failure is a panic → exit -1 via contracts-helper/src/entry.rs).
// Constants: force-bridge devops/mainnet-verifier.config.example (bridgeLock) and devops/verifier-testnet-docker/force-bridge/force_bridge.json.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const CHAIN = { 0: 'BTC', 1: 'ETH', 2: 'EOS', 3: 'TRON', 4: 'POLKADOT' }; // offchain ChainType enum (not checked by the lock)
  function parseArgs(hex) {
    try { const f = R.parseTable(H(hex), 3); if (f.length !== 3 || f[0].length !== 32 || f[1].length !== 1) return { error: 'field sizes' };
      const asset = R.parseBytes(f[2]); let txt = ''; try { txt = new TextDecoder().decode(asset); } catch (e) { }
      return { owner: X(f[0]), chain: f[1][0], asset: X(asset), assetText: /^[\x20-\x7e]*$/.test(txt) ? txt : '' };
    } catch (e) { return { error: e.message }; }
  }
  function parse(g, ctx) {
    const a = parseArgs(g.script.args), fields = [['args', g.script.args]];
    if (!a.error) fields.push(['owner_cell_type_hash', a.owner], ['chain', a.chain + ' (' + (CHAIN[a.chain] || '?') + ')'], ['asset', a.assetText ? a.assetText : a.asset]);
    const locks = [...new Set(ctx.inputs.filter(x => x.output).map(x => R.scriptHash(x.output.lock)))];
    fields.push([{ zh: '输入中的 lock hash', en: 'input lock hashes' }, locks.map(h => h.slice(0, 12) + '…').join(', ')]);
    return { a, fields, layouts: a.error ? [] : [{ label: { zh: 'args（molecule table ForceBridgeLockscriptArgs）', en: 'args (molecule table ForceBridgeLockscriptArgs)' }, layout: [
      { name: 'header', size: '16B', color: 0 }, { name: 'owner_cell_type_hash', size: '32B', color: 1, flex: 3 }, { name: 'chain', size: '1B', color: 2 }, { name: 'asset (Bytes)', size: '4+nB', color: 3, flex: 2 }], hex: [] }] };
  }
  function check(g, ctx, p) {
    return [R.check(!p.a.error, 'args 是合法的 ForceBridgeLockscriptArgs（molecule 严格校验）', 'args is a valid ForceBridgeLockscriptArgs (strict molecule verify)', -1),
      R.NOT_CHECKED('cell_deps 中有 type hash = owner_cell_type_hash 的 owner cell（解码器不拉取 cell_dep 内容）', 'a cell_dep whose type hash = owner_cell_type_hash exists (decoder does not fetch cell_dep contents)', -1),
      R.NOT_CHECKED('某个 input 的 lock hash = owner cell 的 lock hash（需 owner cell）', 'some input lock hash = the owner cell lock hash (needs the owner cell)', -1)];
  }
  R.register({ id: 'force_bridge_lock', kind: 'lock', name: { zh: 'Force Bridge 跨链锁（bridge lockscript）', en: 'Force Bridge bridge lockscript' }, match: [
    { code_hash: '0x93bc7a915d3d8f8b9678bc6c7a1751738c99ce6e66bba4dfab56672f6d691789', hash_type: 'type', net: 'mainnet', src: 'nervosnetwork/force-bridge devops/mainnet-verifier.config.example (ckb.deps.bridgeLock)' },
    { code_hash: '0x2170ffdb67574651c7bc51455d98f29394f2ee134a306c84533732f52e0eb50e', hash_type: 'type', net: 'testnet', src: 'nervosnetwork/force-bridge devops/verifier-testnet-docker/force-bridge/force_bridge.json (ckb.deps.bridgeLock)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

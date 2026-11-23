// Zero Lock — not a contract: a lock whose code_hash is 32 zero bytes with hash_type data. CKB resolves data-hash scripts by
// looking up a cell dep whose blake2b(data) equals code_hash (nervosnetwork/ckb script/src/types.rs TxData::extract_script);
// no data hashes to all zeros, so spending such a cell fails with ScriptError::ScriptNotFound. Cells under it are effectively burned.
// Constant: CKB Explorer registry API /api/v2/scripts ("Zero Lock", is_zero_lock) on mainnet and testnet.
(function (R) {
  const Z = '0x0000000000000000000000000000000000000000000000000000000000000000';
  R.register({ id: 'zero_lock', kind: 'lock', name: { zh: 'Zero Lock（全零 code hash）', en: 'Zero Lock (all-zero code hash)' }, match: [
    { code_hash: Z, hash_type: 'data', src: 'CKB Explorer registry API /api/v2/scripts "Zero Lock" (mainnet + testnet)' }],
    parse(g) { return { fields: [['code_hash', g.script.code_hash], ['hash_type', g.script.hash_type], ['args', g.script.args]] }; },
    check() { return [R.check(false, 'CKB 找不到 data hash 为全零的 cell dep → ScriptNotFound，这样的 input 无法被花费', 'CKB finds no cell dep whose data hash is all zeros → ScriptNotFound; such an input cannot be spent', 'ScriptNotFound')]; } });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

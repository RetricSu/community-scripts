// BTC time lock — utxostack/rgbpp contracts/btc-time-lock/src/main.rs + crates/core
// @requires rgbpp_lock
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const eqScript = (a, b) => !!a && !!b && a.code_hash === b.code_hash && a.hash_type === b.hash_type && a.args === b.args;
  function parse(g, ctx) {
    const t = R.rgbpp.parseBtcTimeLock(g.script.args), w = ctx.witnesses[g.witnessIndex], p = { t };
    p.unlockOk = false; if (w && w.args && w.args.lock) { try { const f = R.parseTable(H(w.args.lock), 1); p.proofLen = R.parseBytes(f[0]).length; p.unlockOk = true; } catch (e) { p.unlockBad = true; } } else p.unlockMissing = true;
    p.fields = [['args', g.script.args]];
    if (t) p.fields.push([{ zh: '到期后转给 lock_script', en: 'releases to lock_script' }, `${t.lock.code_hash} (${t.lock.hash_type}) ${t.lock.args}`], ['after (BTC confirmations)', String(t.after)], ['btc_txid', R.rgbpp.displayTxid(t.btcTxid)]);
    if (p.unlockOk) p.fields.push(['BTCTimeUnlock.btc_tx_proof', p.proofLen + ' B']);
    p.layouts = [{ label: 'args (BTCTimeLock table)', layout: [{ name: 'lock_script', size: 'Script', color: 1, flex: 4 }, { name: 'after u32', size: '4B', color: 2 }, { name: 'btc_txid', size: '32B', color: 3, flex: 3 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(!!p.t, 'args 是合法 BTCTimeLock', 'args is a valid BTCTimeLock', 'panic')];
    if (!p.t) return c;
    for (const i of g.inputs) { const ii = ctx.inputs[i].output, o = ctx.tx.outputs[i], d = ctx.tx.outputs_data[i];
      const ok = !!o && eqScript(o.lock, p.t.lock) && o.capacity === ii.capacity && (o.type ? !!ii.type && eqScript(o.type, ii.type) : !ii.type) && d === ctx.inputs[i].data;
      c.push(R.check(ok, `out[${i}] 与 in[${i}] 同位置：lock = lock_script，capacity / type / data 不变`, `out[${i}] at the same index as in[${i}]: lock = lock_script, capacity / type / data unchanged`, 0x40)); }
    c.push(R.check(!p.unlockMissing, 'group 第一个 witness.lock 存在', 'group first witness.lock exists', 0x02));
    if (!p.unlockMissing) c.push(R.check(p.unlockOk, 'witness.lock 是合法 BTCTimeUnlock', 'witness.lock is a valid BTCTimeUnlock', 0x35));
    c.push(R.NOT_CHECKED(`btc_txid 已在轻客户端中确认 ≥ after(${p.t.after}) 块（SPV 证明，未检查）`, `btc_txid has ≥ after (${p.t.after}) confirmations in the light client (SPV proof, not checked)`, '0x20–0x23'));
    return c;
  }
  R.register({ id: 'btc_time_lock', kind: 'lock', name: 'BTC time lock', match: [
    { code_hash: '0x70d64497a075bd651e98ac030455ea200637ee325a12ad08aff03f1a117e5a62', hash_type: 'type', net: 'mainnet', src: 'rgbpp-sdk packages/ckb/src/constants' },
    { code_hash: '0x00cdf8fab0f8ac638758ebf5ea5e4052b1d71e8a77b9f43139718621f6849326', hash_type: 'type', net: 'testnet', src: 'rgbpp-sdk (BTC testnet3)' },
    { code_hash: '0x80a09eca26d77cea1f5a69471c59481be7404febf40ee90f886c36a948385b55', hash_type: 'type', net: 'testnet', src: 'rgbpp-sdk (BTC signet)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

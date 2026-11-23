// Cheque lock — RFC 0039, nervosnetwork/ckb-cheque-script contracts/ckb-cheque-script/src/{entry,claim,withdraw,helper,error}.rs
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex, h20 = s => X(H(R.scriptHash(s)).subarray(0, 20));
  const WITHDRAW_SINCE = 0xA000000000000006n;
  function parse(g, ctx) {
    const a = H(g.script.args), w = ctx.witnesses[g.witnessIndex];
    const p = { argsLen: a.length, receiver: X(a.subarray(0, 20)), sender: X(a.subarray(20, 40)), witnessNone: !(w && w.args && w.args.lock) };
    p.inLock20 = ctx.inputs.map(x => x.output ? h20(x.output.lock) : null);
    p.receiverIn = p.inLock20.indexOf(p.receiver); p.senderIn = p.inLock20.indexOf(p.sender);
    p.sinces = g.inputs.map(i => BigInt(ctx.inputs[i].input.since));
    if (p.witnessNone) p.mode = p.receiverIn >= 0 ? 'claim' : p.senderIn >= 0 ? 'withdraw' : null;
    else p.mode = p.sinces.every(s => s === WITHDRAW_SINCE) ? 'withdraw' : 'claim'; // inferred: real choice depends on who signed
    p.fields = [['receiver_lock_hash[0..20]', p.receiver], ['sender_lock_hash[0..20]', p.sender],
      [{ zh: '解锁方式', en: 'unlock path' }, (p.witnessNone ? { zh: '无签名，依赖同 tx 中的 receiver/sender 输入', en: 'no signature, relies on a receiver/sender input in the tx' } : { zh: 'cheque 自带签名', en: 'signature on the cheque' })],
      [{ zh: '模式', en: 'mode' }, p.mode === 'claim' ? { zh: '接收方领取 (claim)', en: 'receiver claim' } : p.mode === 'withdraw' ? { zh: '发送方取回 (withdraw)', en: 'sender withdraw' } : '—'],
      ...g.inputs.map((i, k) => [`in[${i}].since`, '0x' + p.sinces[k].toString(16)])];
    p.layouts = [{ label: 'args', layout: [{ name: 'receiver_lock_hash[0..20]', size: '20B', color: 1, flex: 3 }, { name: 'sender_lock_hash[0..20]', size: '20B', color: 3, flex: 3 }], hex: [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 40, 'args 恰为 40 字节', 'args is exactly 40 bytes', 5)];
    if (p.argsLen !== 40) return c;
    if (p.witnessNone) c.push(R.check(p.mode != null, '存在 lock hash[0..20] = receiver 或 sender 的输入', 'an input whose lock hash[0..20] = receiver or sender', 6));
    else c.push(R.NOT_CHECKED('签名恢复出的 secp256k1 lock hash[0..20] = receiver 或 sender（未检查；模式由 since 推断）', 'recovered secp256k1 lock hash[0..20] = receiver or sender (not checked; mode inferred from since)', 13));
    if (p.mode === 'claim') {
      c.push(R.check(p.sinces.every(s => s === 0n), '领取：所有 cheque 输入 since = 0', 'claim: every cheque input since = 0', 10));
      const sum = (arr, h) => arr.filter(([l]) => l === h).reduce((s, [, v]) => s + v, 0n);
      const ins = ctx.inputs.filter(x => x.output).map(x => [h20(x.output.lock), BigInt(x.output.capacity)]), outs = ctx.tx.outputs.map(o => [h20(o.lock), BigInt(o.capacity)]);
      const me = X(H(g.hash).subarray(0, 20)), sIn = sum(ins, p.sender), sOut = sum(outs, p.sender), cIn = sum(ins, me);
      c.push(R.check(sIn + cIn === sOut, `领取：Σ sender 输入 ${sIn} + Σ cheque 输入 ${cIn} = Σ sender 输出 ${sOut}（押金退回发送方）`, `claim: Σ sender inputs ${sIn} + Σ cheque inputs ${cIn} = Σ sender outputs ${sOut} (capacity returned to sender)`, 8));
      if (p.witnessNone) c.push(R.check(!!(ctx.witnesses[p.receiverIn] && ctx.witnesses[p.receiverIn].args && ctx.witnesses[p.receiverIn].args.lock), `receiver 输入 in[${p.receiverIn}] 的 witness.lock 非空`, `receiver input in[${p.receiverIn}] witness.lock is non-empty`, 7));
    } else if (p.mode === 'withdraw') {
      c.push(R.check(p.sinces.every(s => s === WITHDRAW_SINCE), '取回：所有 cheque 输入 since = 0xA000000000000006（相对 6 epoch）', 'withdraw: every cheque input since = 0xA000000000000006 (relative 6 epochs)', 11));
      if (p.witnessNone) c.push(R.check(!!(ctx.witnesses[p.senderIn] && ctx.witnesses[p.senderIn].args && ctx.witnesses[p.senderIn].args.lock), `sender 输入 in[${p.senderIn}] 的 witness.lock 非空`, `sender input in[${p.senderIn}] witness.lock is non-empty`, 7));
    }
    return c;
  }
  R.register({ id: 'cheque', kind: 'lock', name: { zh: 'Cheque 支票', en: 'Cheque' }, match: [
    { code_hash: '0xe4d4ecc6e5f9a059bf2f7a82cca292083aebc0c421566a52484fe2ec51a9fb0c', hash_type: 'type', net: 'mainnet', src: 'RFC 0039' },
    { code_hash: '0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b', hash_type: 'type', net: 'testnet', src: 'RFC 0039' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

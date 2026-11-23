// cells sale-lock — LusoCryptoLabs/cells-contracts contracts/sale-lock/src/main.rs + cells-core sale_fee / lets_anyone_spend @6d29dab
// code_hash: cellula-sdk@0.2.1 dist/deployments.js (official SDK) + docs/TRUST.md (mainnet). Treasury lock hash: README mainnet build values / SDK.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const TREASURY = { mainnet: '0x57d926a44d83fc13b21ce037b1e31f4223e3c867cfa3f60e1324d5bfd5cd742d', testnet: '0xd9d177037d0888e09330bf0dd18e98c534ea3479b4376911d0a5279ead21e0f8' };
  const MIN = 6300000000n, saleFee = p => { const o = p / 100n; return o >= MIN ? o : p >= MIN * 10n ? MIN : 0n; };
  const le64 = b => { let v = 0n; for (let i = 7; i >= 0; i--) v = v * 256n + BigInt(b[i]); return v; };
  const ckb = v => (Number(v) / 1e8).toLocaleString('en-US') + ' CKB';
  function parse(g, ctx) {
    const a = H(g.script.args || '0x'), p = { ok: a.length === 40 };
    if (p.ok) { p.seller = X(a.subarray(0, 32)); p.price = le64(a.subarray(32, 40)); p.fee = saleFee(p.price); }
    p.fields = p.ok ? [['seller_lock_hash', p.seller], ['price', ckb(p.price) + ' (' + p.price + ' shannons)'], [{ zh: '协议分成 sale_fee', en: 'protocol share sale_fee' }, ckb(p.fee)]] : [['args', g.script.args]];
    p.layouts = [{ label: 'args (40 B)', layout: [{ name: 'seller_lock_hash', size: '32', color: 1, flex: 4 }, { name: 'price', size: '8 LE u64', color: 2, flex: 1 }], hex: p.ok ? [['seller_lock_hash', p.seller], ['price', X(a.subarray(32))]] : [] }];
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.ok, 'args = 40 字节', 'args = 40 bytes', 2)]; if (!p.ok) return c;
    const net = ctx.net || (g.script.code_hash === '0x498ab6b49b6b25b3c47fcea74bd8a4447bc4efda6417809152a846e058ad0ae4' ? 'testnet' : 'mainnet');
    const sellerHere = ctx.inputs.some(x => R.scriptHash(x.output.lock) === p.seller);
    if (sellerHere) { c.push(R.check(true, '卖家本人有输入在 seller_lock_hash 下 → 卖家路径（撤单 / 改价）', 'an input under seller_lock_hash → seller path (cancel / relist)', 0),
      R.NOT_CHECKED('该输入的 lock 不能是 anyone-can-pay（lets_anyone_spend）', 'that input lock must not be anyone-can-pay (lets_anyone_spend)', 3)); return c; }
    c.push(R.check(p.price > 0n, '购买路径：price > 0', 'purchase path: price > 0', 2), R.check(g.script.hash_type === 'type', 'hash_type = type（按 type id 引用）', 'hash_type = type (named by type id)', 5));
    let owedS = 0n, owedT = 0n;
    for (const x of ctx.inputs) { const l = x.output.lock; if (l.code_hash !== g.script.code_hash || l.hash_type !== g.script.hash_type) continue; const a = H(l.args); if (a.length !== 40) continue;
      const s = X(a.subarray(0, 32)), pr = le64(a.subarray(32)), f = saleFee(pr), here = ctx.inputs.some(y => R.scriptHash(y.output.lock) === s);
      if (s === p.seller) owedS += pr - f + BigInt(x.output.capacity); if (!here) owedT += f; }
    const emptyData = d => !d || d === '0x';
    const paid = h => ctx.tx.outputs.reduce((t, o, i) => t + (!o.type && emptyData(ctx.tx.outputs_data[i]) && R.scriptHash(o.lock) === h ? BigInt(o.capacity) : 0n), 0n);
    const ps = paid(p.seller), pt = paid(TREASURY[net]);
    c.push(R.check(ps >= owedS, `卖家纯输出 ${ckb(ps)} ≥ 应得 ${ckb(owedS)}（price − fee + 挂单押金，汇总该卖家所有挂单）`, `pure outputs to seller ${ckb(ps)} ≥ owed ${ckb(owedS)} (price − fee + listing deposit, summed over the seller's offers)`, 3));
    c.push(pt >= owedT || p.seller === TREASURY[net] ? R.check(true, `treasury 纯输出 ${ckb(pt)} ≥ ${ckb(owedT)}`, `pure outputs to treasury ${ckb(pt)} ≥ ${ckb(owedT)}`, 4) : R.check(false, `treasury 纯输出 ${ckb(pt)} < ${ckb(owedT)}`, `pure outputs to treasury ${ckb(pt)} < ${ckb(owedT)}`, 4));
    return c;
  }
  R.register({ id: 'cells_sale_lock', kind: 'lock', name: { zh: 'Cells 挂单（sale-lock）', en: 'Cells listing (sale-lock)' }, match: [
    { code_hash: '0x086c8f4e9d4272e3dfbaca399792f730e6604591e87931ee6d67047a3c900879', hash_type: 'type', net: 'mainnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.sale; cells-contracts README / docs/TRUST.md' },
    { code_hash: '0x498ab6b49b6b25b3c47fcea74bd8a4447bc4efda6417809152a846e058ad0ae4', hash_type: 'type', net: 'testnet', src: 'cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.sale' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

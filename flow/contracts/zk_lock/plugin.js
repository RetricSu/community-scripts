// zk-Lock (generic + transaction-bound) — CECILIA-MULANDI/zk-Lock crates/zk-lock-core/src/{lib,error}.rs, contracts/zk-lock, contracts/zk-lock-bound @ 699c63a7ef424345180d24dfc1764ff7947c728b
// Deployment: README.md "Pudge testnet" + web/src/lib/config.ts (testnet only). Groth16 pairing / VK cell_dep lookup are NOT_CHECKED.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const GENERIC = '0x24172f2dc2ebd6634fe925a6f0beda7cfd4cdb9aab1214f2e1cbd3127ea1fa7b';
  const BOUND = '0xfbb4acb5c3f8fc8b24216dc8dc8d6bb8f8d3ea9aab4b29a210571959a1f9028e';
  const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const short = h => h.length > 26 ? h.slice(0, 14) + '…' + h.slice(-8) : h;
  R.register({
    id: 'zk_lock', kind: 'lock', name: { zh: 'zk-Lock（Groth16 证明解锁）', en: 'zk-Lock (Groth16 proof lock)' },
    match: [
      { code_hash: GENERIC, hash_type: 'type', net: 'testnet', src: 'zk-Lock README.md "Pudge testnet" (generic zk-lock, cell 0x7d80c7a2…06fb:0) + web/src/lib/config.ts' },
      { code_hash: BOUND, hash_type: 'type', net: 'testnet', src: 'zk-Lock README.md "Pudge testnet" (transaction-binding zk-lock-bound, cell 0x5f21b4d1…4011:0)' },
    ],
    parse(g, ctx) {
      const p = { fields: [], layouts: [] }, a = H(g.script.args || '0x');
      p.bound = g.script.code_hash === BOUND; p.args = a;
      p.fields.push([{ zh: '模式', en: 'mode' }, p.bound ? { zh: '交易绑定（Binding::Transaction）', en: 'transaction-bound (Binding::Transaction)' } : { zh: '通用（Binding::None）', en: 'generic (Binding::None)' }]);
      if (a.length === 64) {
        p.fields.push(['vk_hash', X(a.subarray(0, 32))], ['pi_commitment', X(a.subarray(32))]);
        p.layouts.push({ label: 'lock.args', layout: [{ name: 'vk_hash', size: '32B', color: 0, flex: 1 }, { name: 'pi_commitment', size: '32B', color: 1, flex: 1 }], hex: [['vk_hash', X(a.subarray(0, 32))], ['pi_commitment', X(a.subarray(32))]] });
      }
      const w = ctx.witnesses[g.witnessIndex]; p.w = w;
      const lock = w && w.args && w.args.lock; p.lockHex = lock;
      if (lock) {
        const l = H(lock); p.wl = l;
        if (l.length >= 132) {
          p.piCount = u32(l, 128); p.pi = l.subarray(132);
          const hx = [['proof', short(X(l.subarray(0, 128)))], ['pi_count', String(p.piCount)]];
          for (let i = 0; i < Math.min(p.piCount, 4) && (i + 1) * 32 <= p.pi.length; i++) hx.push(['pi[' + i + ']', X(p.pi.subarray(i * 32, i * 32 + 32))]);
          p.layouts.push({ label: 'witness.lock', layout: [{ name: 'proof', size: '128B', color: 2, flex: 3 }, { name: 'pi_count', size: '4B', color: 5, flex: 1 }, { name: 'pi × n', size: (l.length - 132) + 'B', color: 6, flex: 3 }], hex: hx });
          p.fields.push([{ zh: '公开输入个数', en: 'public inputs' }, String(p.piCount)]);
        }
      }
      return p;
    },
    check(g, ctx, p) {
      const c = [], a = p.args;
      c.push(R.check(a.length === 64, 'args 长度 = 64（vk_hash ‖ pi_commitment）', 'args length = 64 (vk_hash ‖ pi_commitment)', 10));
      if (a.length !== 64) return c;
      c.push(R.NOT_CHECKED('cell_deps 中 data hash = vk_hash 的 cell 恰好 1 个（解码器不加载 cell_dep 数据）', 'exactly one cell_dep with data hash = vk_hash (decoder does not load cell_dep data)', '14 / 21'));
      if (!p.w || p.w.empty || p.w.error) { c.push(R.check(false, 'group 第一个输入的 witness 是合法 WitnessArgs', 'witness at the group\'s first input is valid WitnessArgs', p.w && p.w.error ? 4 : 1)); return c; }
      c.push(R.check(!!p.lockHex, 'WitnessArgs.lock 存在', 'WitnessArgs.lock present', 11)); if (!p.lockHex) return c;
      c.push(R.check(p.wl.length >= 132, `witness.lock 长度 ${p.wl.length} ≥ 132`, `witness.lock length ${p.wl.length} ≥ 132`, 12)); if (p.wl.length < 132) return c;
      const lenOk = p.pi.length === p.piCount * 32;
      c.push(R.check(lenOk, `witness.lock 长度 = 132 + 32 × ${p.piCount}`, `witness.lock length = 132 + 32 × ${p.piCount}`, 13)); if (!lenOk) return c;
      let body = p.pi;
      if (p.bound) {
        c.push(R.check(p.piCount >= 1, 'pi_count ≥ 1（保留 pi[0] 作为交易上下文）', 'pi_count ≥ 1 (pi[0] reserved for tx context)', 23)); if (p.piCount < 1) return c;
        body = p.pi.subarray(32);
      }
      const com = R.blake2b(body);
      c.push(R.check(eq(com, a.subarray(32)), `blake2b(${p.bound ? 'pi[1..n]' : '全部公开输入'}) = ${short(X(com))} = args[32..64]`, `blake2b(${p.bound ? 'pi[1..n]' : 'all public inputs'}) = ${short(X(com))} = args[32..64]`, 15));
      if (p.bound) {
        const th = H(ctx.tx.hash || ctx.txHash), exp = new Uint8Array(32); exp.set(th.subarray(0, 31));
        c.push(R.check(eq(p.pi.subarray(0, 32), exp), 'pi[0] = tx_hash[0..31] ‖ 0x00', 'pi[0] = tx_hash[0..31] ‖ 0x00', 22));
      }
      c.push(R.NOT_CHECKED('VK 解析、proof 解析、pi_count + 1 = ic_len、BN254 Groth16 配对检查', 'VK parsing, proof parsing, pi_count + 1 = ic_len, BN254 Groth16 pairing check', '16–20'));
      return c;
    },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));

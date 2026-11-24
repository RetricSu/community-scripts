// NervosDAO type script — ckb-system-scripts/c/dao.c
(function (R) {
  const be = h => h && h.length === 18 ? R.le(h) : null;
  function parse(g, ctx) {
    const { tx, inputs, headers } = ctx; const entries = [], key = R.scriptHash; let bonus = 0n;
    for (const i of g.inputs) {
      const it = inputs[i]; const bn = be(it.data) || 0n;
      if (bn === 0n) { const dh = headers[it.blockHash]; entries.push({ input: i, phase: 1, depositBlock: dh ? BigInt(dh.number) : null }); continue; }
      const w = ctx.witnesses[i]; let k = null; if (w && w.args && w.args.input_type && R.hexToBytes(w.args.input_type).length === 8) k = Number(R.le(w.args.input_type));
      const D = k != null && tx.header_deps[k] ? headers[tx.header_deps[k]] : null, W = headers[it.blockHash];
      const e = { input: i, phase: 2, depositBlock: bn, k, D: null, W: null };
      if (D && W) { const de = R.parseEpoch(D.epoch), we = R.parseEpoch(W.epoch);
        let dep = we.number - de.number; if (we.index * de.length > de.index * we.length) dep++;
        const lock = (dep + 179n) / 180n * 180n; e.minSince = { number: de.number + lock, index: de.index, length: de.length }; e.lockEpochs = lock;
        const arD = R.leToBig(R.hexToBytes(D.dao).subarray(8, 16)), arW = R.leToBig(R.hexToBytes(W.dao).subarray(8, 16));
        e.D = { number: BigInt(D.number), epoch: de, ar: arD }; e.W = { number: BigInt(W.number), epoch: we, ar: arW };
        e.capacity = BigInt(it.output.capacity); e.occupied = R.occupied(it.output, it.data); e.maxWithdraw = e.occupied + (e.capacity - e.occupied) * arW / arD; bonus += e.maxWithdraw - e.capacity; }
      entries.push(e);
    }
    const daoIn = new Set(g.inputs);
    for (const j of g.outputs) { const p1 = daoIn.has(j) && inputs[j] && be(inputs[j].data) === 0n; if (!p1) entries.push({ output: j, phase: 0 }); }
    const ck = v => (Number(v / 1000000n) / 100).toLocaleString('en-US') + ' CKB';
    const layouts = entries.map(e => e.phase === 0 ? { label: { zh: `output[${e.output}]：新存款`, en: `output[${e.output}]: new deposit` }, hex: [['data', tx.outputs_data[e.output]]] }
      : e.phase === 1 ? { label: { zh: `input[${e.input}]：提取第一阶段`, en: `input[${e.input}]: withdraw phase 1` }, hex: [[{ zh: '存款区块', en: 'deposit block' }, String(e.depositBlock)], [`output[${e.input}].data`, tx.outputs_data[e.input] || '—']] }
      : { label: { zh: `input[${e.input}]：提取第二阶段`, en: `input[${e.input}]: withdraw phase 2` }, hex: e.D ? [
          ['D', `block ${e.D.number} · epoch ${R.fmtEpoch(e.D.epoch)} · AR ${e.D.ar}`], ['W', `block ${e.W.number} · epoch ${R.fmtEpoch(e.W.epoch)} · AR ${e.W.ar}`],
          ['lock', `${e.lockEpochs} epochs · min since ${R.fmtEpoch(e.minSince)}`], ['occupied', ck(e.occupied)],
          ['max withdraw', { zh: `${ck(e.maxWithdraw)}（补贴 ${ck(e.maxWithdraw - e.capacity)}）`, en: `${ck(e.maxWithdraw)} (compensation ${ck(e.maxWithdraw - e.capacity)})` }]] : [['k', String(e.k)]] });
    return { entries, bonus, layouts };
  }
  function check(g, ctx, p) {
    const { tx, inputs, headers } = ctx; const c = [R.check(g.script.args === '0x', 'type.args 为空', 'type.args is empty', -2)];
    for (const e of p.entries) {
      if (e.phase === 0) { c.push(R.check(tx.outputs_data[e.output] === '0x0000000000000000', `新存款 output[${e.output}].data = 8 字节 0`, `new deposit output[${e.output}].data = 8 zero bytes`, -19)); continue; }
      const i = e.input, it = inputs[i];
      if (e.phase === 1) { const o = tx.outputs[i], od = tx.outputs_data[i];
        c.push(R.check(!!o && !!o.type && R.scriptHash(o.type) === g.hash, `output[${i}] 为同一 DAO type`, `output[${i}] has the same DAO type`, -20),
          R.check(!!o && o.capacity === it.output.capacity, `output[${i}].capacity = input[${i}].capacity`, `output[${i}].capacity = input[${i}].capacity`, -20),
          R.check(e.depositBlock != null && be(od) === e.depositBlock, `output[${i}].data = 存款区块号 ${e.depositBlock}`, `output[${i}].data = deposit block number ${e.depositBlock}`, -20),
          R.check(tx.header_deps.includes(it.blockHash), `header_deps 含存款区块 ${it.blockHash.slice(0, 10)}…`, `header_deps includes deposit block ${it.blockHash.slice(0, 10)}…`, 'syscall'));
        continue; }
      c.push(R.check(e.k != null, `witness[${i}].input_type 为 8 字节 (k=${e.k})`, `witness[${i}].input_type is 8 bytes (k=${e.k})`, -11),
        R.check(!!e.D && e.D.number === e.depositBlock, `header_deps[k].number = data (${e.depositBlock})`, `header_deps[k].number = data (${e.depositBlock})`, -14),
        R.check(tx.header_deps.includes(it.blockHash), 'header_deps 含 withdraw 区块 W', 'header_deps includes withdraw block W', 'syscall'));
      if (e.D) { const s = R.parseSince(it.input.since);
        c.push(R.check(R.epochCmp(e.W.epoch, e.D.epoch) > 0, `W epoch ${R.fmtEpoch(e.W.epoch)} 晚于 D ${R.fmtEpoch(e.D.epoch)}`, `W epoch ${R.fmtEpoch(e.W.epoch)} later than D ${R.fmtEpoch(e.D.epoch)}`, -14),
          R.check(s.flags === 0x20, 'since 为绝对 epoch (0x20)', 'since is absolute epoch (0x20)', -17),
          R.check(s.flags === 0x20 && R.epochCmp(s.epoch.length === 0n ? { number: s.epoch.number, index: 0n, length: 1n } : s.epoch, e.minSince) >= 0, `since ≥ ${R.fmtEpoch(e.minSince)}（lock ${e.lockEpochs} epochs）`, `since ≥ ${R.fmtEpoch(e.minSince)} (lock ${e.lockEpochs} epochs)`, -17)); }
    }
    return c;
  }
  R.register({ id: 'nervos_dao', kind: 'type', name: 'NervosDAO', needsInputHeaders: true,
    match: [{ code_hash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e', hash_type: 'type', src: 'RFC 0024 (Lina & Aggron)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

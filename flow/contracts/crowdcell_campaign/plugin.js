// CROWDCELL_CAMPAIGN — alesfer001/CrowdCell contracts/campaign/src/main.rs @acbb40e (testnet, community)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const CKB = 100000000n, MIN = 100n * CKB, FEE = CKB, GRACE = 1944000n, MAX64 = (1n << 64n) - 1n;
  const ZERO32 = '0x' + '00'.repeat(32);
  const ST = ['Active', 'Success', 'Failed'];

  // ckb-std Since: bit 63 = relative flag, bits 56-60 must be 0, bits 61-62 = metric (0 = block number)
  function since(s) {
    const v = BigInt(s || '0x0'), metric = v & 0x6000000000000000n;
    return { v, abs: (v >> 63n) === 0n, valid: (v & 0x1f00000000000000n) === 0n && metric !== 0x6000000000000000n,
      blk: metric === 0n, block: v & 0x00ffffffffffffffn };
  }

  // CampaignData::from_bytes (errors 1, 2)
  function dec(hex) {
    const d = H(hex || '0x');
    if (d.length < 65) return { err: 1 };
    if (d[56] > 2) return { err: 2 };
    return { creator: X(d.subarray(0, 32)), goal: R.leToBig(d.subarray(32, 40)), deadline: R.leToBig(d.subarray(40, 48)),
      total: R.leToBig(d.subarray(48, 56)), status: d[56], tail: X(d.subarray(57)), len: d.length };
  }

  // sum_campaign_pledges: pledge-lock cells whose lock args[0..32] = this campaign's type hash.
  // Errors: 26 deadline mismatch / short args, 16 data < 72B, 23 below minimum (created only),
  // 22 capacity < amount + occupied, 19 overflow.
  function sumPledges(cells, plc, me, deadline, enforceMin) {
    let t = 0n;
    for (const c of cells) {
      if (c.out.lock.code_hash !== plc) continue;
      const a = H(c.out.lock.args);
      if (a.length < 32 || X(a.subarray(0, 32)) !== me) continue;
      if (a.length < 72 || R.leToBig(a.subarray(32, 40)) !== deadline) return { err: 26 };
      const d = H(c.data);
      if (d.length < 72) return { err: 16 };
      const amt = R.leToBig(d.subarray(64, 72));
      if (enforceMin && amt < MIN) return { err: 23 };
      const need = amt + BigInt(R.occupied(c.out, c.data));
      if (need > MAX64) return { err: 19 };
      if (BigInt(c.out.capacity) < need) return { err: 22 };
      t += amt;
      if (t > MAX64) return { err: 19 };
    }
    return { t };
  }

  function parse(g, ctx) {
    const a = H(g.script.args);
    const p = { argsOk: a.length >= 64 && X(a.subarray(32, 64)) !== ZERO32, me: g.hash };
    p.plc = a.length >= 64 ? X(a.subarray(32, 64)) : null;
    p.inp = g.inputs.map(i => ({ out: ctx.inputs[i].output, data: ctx.inputs[i].data, since: ctx.inputs[i].input.since }));
    p.outp = g.outputs.map(j => ({ out: ctx.tx.outputs[j], data: ctx.tx.outputs_data[j] }));
    p.old = p.inp.length ? dec(p.inp[0].data) : null;
    p.nw = p.outp.length ? dec(p.outp[0].data) : null;
    p.path = p.inp.length && p.outp.length ? (p.nw.err ? 'bad' : p.nw.status === 0 ? 'pledge' : 'finalize')
      : p.outp.length ? 'create' : p.inp.length ? 'destroy' : 'none';
    const c = p.nw && !p.nw.err ? p.nw : p.old && !p.old.err ? p.old : null;
    p.fields = [[{ zh: '路径', en: 'path' }, p.path], ['pledge_lock_code_hash', p.plc || '(args < 64B)']];
    if (c) p.fields.push(['creator_lock_hash', c.creator], [{ zh: '目标', en: 'funding_goal' }, (Number(c.goal) / 1e8) + ' CKB'],
      ['deadline_block', c.deadline.toString()], ['total_pledged', (Number(c.total) / 1e8) + ' CKB'], ['status', ST[c.status]]);
    if (a.length >= 64) p.layouts = [{ label: { zh: 'type args', en: 'type args' },
      layout: [{ name: 'type_id', size: '32B', color: 1, flex: 4 }, { name: 'pledge_lock_code_hash', size: '32B', color: 2, flex: 4 }],
      hex: [['type_id', X(a.subarray(0, 32))], ['pledge_lock_code_hash', p.plc]] }];
    return p;
  }

  function check(g, ctx, p) {
    const r = [R.NOT_CHECKED('TypeID（check_type_id）未离线校验', 'TypeID (check_type_id) not checked offline', 12),
      R.check(p.argsOk, 'args ≥ 64 字节且 pledge_lock_code_hash ≠ 0', 'args ≥ 64 bytes and pledge_lock_code_hash ≠ 0', 15),
      R.check(p.inp.length <= 1 && p.outp.length <= 1, 'group 内输入、输出各至多 1 个', 'at most 1 group input and 1 group output', 21)];
    if (!p.argsOk) return r;
    const dataErr = e => R.check(false, e === 1 ? 'data ≥ 65 字节' : 'status ∈ {0,1,2}', e === 1 ? 'data ≥ 65 bytes' : 'status ∈ {0,1,2}', e);
    const immut = (o, n) => o.creator === n.creator && o.goal === n.goal && o.deadline === n.deadline && o.len === n.len && o.tail === n.tail;

    if (p.path === 'create') { const n = p.nw;
      if (n.err) return r.concat([dataErr(n.err)]);
      return r.concat([R.check(n.goal > 0n, 'funding_goal > 0', 'funding_goal > 0', 3),
        R.check(n.deadline > 0n, 'deadline_block > 0', 'deadline_block > 0', 4),
        R.check(n.total === 0n, 'total_pledged = 0', 'total_pledged = 0', 5),
        R.check(n.status === 0, 'status = Active', 'status = Active', 6)]); }

    if (p.path === 'pledge' || p.path === 'finalize' || p.path === 'bad') {
      const o = p.old, n = p.nw;
      if (o.err || n.err) return r.concat([dataErr(o.err || n.err)]);
      r.push(R.check(BigInt(p.outp[0].out.capacity) >= BigInt(p.inp[0].out.capacity), '输出 campaign capacity ≥ 输入', 'output campaign capacity ≥ input', 17));
      r.push(R.check(R.scriptHash(p.outp[0].out.lock) === R.scriptHash(p.inp[0].out.lock), 'campaign lock 与输入相同', 'campaign lock same as input', 28));

      if (p.path === 'pledge') {
        const ins = ctx.inputs.filter(x => x.output).map(x => ({ out: x.output, data: x.data }));
        const outs = ctx.tx.outputs.map((out, j) => ({ out, data: ctx.tx.outputs_data[j] }));
        const cr = sumPledges(outs, p.plc, p.me, o.deadline, true), cs = sumPledges(ins, p.plc, p.me, o.deadline, false);
        r.push(R.check(o.status === 0, '旧状态为 Active', 'old status is Active', 16),
          R.check(immut(o, n), '不可变字段与 [57..] 未改变', 'immutable fields and [57..] unchanged', 16));
        const bad = cr.err || cs.err;
        if (bad) return r.concat([R.check(false, '本 campaign 的 pledge cell 合法（lock args ≥ 72B 且 deadline 相符；data ≥ 72B；新建 amount ≥ 100 CKB；capacity ≥ amount + occupied）',
          "this campaign's pledge cells are valid (lock args ≥ 72B with matching deadline; data ≥ 72B; new amount ≥ 100 CKB; capacity ≥ amount + occupied)", bad)]);
        const delta = cr.t > cs.t ? cr.t - cs.t : 0n;
        r.push(R.check(cr.t > cs.t, `净流入 > 0：Σ新建 ${cr.t} > Σ消耗 ${cs.t}`, `net inflow > 0: Σcreated ${cr.t} > Σconsumed ${cs.t}`, 16));
        if (cr.t > cs.t) r.push(R.check(o.total + delta <= MAX64, '累加不溢出 u64', 'accumulator does not overflow u64', 19));
        r.push(R.check(cr.t > cs.t && n.total === o.total + delta, `新 total ${n.total} = 旧 ${o.total} + 差值 ${delta}`, `new total ${n.total} = old ${o.total} + delta ${delta}`, 16));
        return r;
      }

      const s = since(p.inp[0].since), dl = o.deadline;
      r.push(R.check(s.v !== 0n && s.abs && s.valid && s.blk, 'since 非 0、绝对、标志合法、按区块号', 'since is non-zero, absolute, valid flags, block number', 10),
        R.check(s.v !== 0n && s.abs && s.valid && s.blk && s.block >= dl, `since 区块号 ${s.block} ≥ deadline ${dl}`, `since block ${s.block} ≥ deadline ${dl}`, 10),
        R.check(o.status === 0, '旧状态为 Active', 'old status is Active', 10),
        R.check(immut(o, n) && o.total === n.total, '不可变字段与 total_pledged 未改变', 'immutable fields and total_pledged unchanged', 10),
        R.check(n.status === 1 ? o.total >= o.goal : o.total < o.goal, `${ST[n.status]} 与 total ${o.total} / goal ${o.goal} 相符`, `${ST[n.status]} matches total ${o.total} / goal ${o.goal}`, 18));
      return r;
    }

    if (p.path === 'destroy') { const o = p.old;
      if (o.err) return r.concat([dataErr(o.err)]);
      if (o.status === 0) return r.concat([R.check(false, 'Active 不可销毁', 'Active cannot be destroyed', 13)]);
      const plIn = ctx.inputs.some(x => x.output && x.output.lock.code_hash === p.plc);
      const otherTyped = ctx.inputs.some(x => x.output && x.output.type && R.scriptHash(x.output.type) !== p.me);
      const paid = ctx.tx.outputs.reduce((sum, x) => sum + (R.scriptHash(x.lock) === o.creator ? BigInt(x.capacity) : 0n), 0n);
      const cap = BigInt(p.inp[0].out.capacity), s = since(p.inp[0].since);
      return r.concat([
        R.check(!plIn, '同一交易未花费 pledge-lock cell', 'no pledge-lock cell spent in the same tx', 25),
        R.check(!otherTyped, '同一交易未花费其他 type script 的 cell', 'no input with another type script in the same tx', 27),
        R.check(paid >= (cap > FEE ? cap - FEE : 0n), `付给创建者 ${paid} ≥ ${cap} − 1 CKB`, `paid to creator ${paid} ≥ ${cap} − 1 CKB`, 24),
        R.check(s.v !== 0n && s.abs && s.valid && s.blk && s.block >= o.deadline + GRACE, 'since 非 0、绝对、按区块号且 ≥ deadline + 1,944,000', 'since non-zero, absolute, block number, ≥ deadline + 1,944,000', 13)]); }

    return r;
  }

  R.register({ id: 'crowdcell_campaign', kind: 'type', name: { zh: 'CrowdCell 众筹 campaign', en: 'CrowdCell campaign' },
    match: [{ code_hash: '0xd50ca43249515bb0ebe8534f4d7f74520e4fb7c1163d488c288672ffd7e7a8f5', hash_type: 'data2', net: 'testnet',
      src: 'alesfer001/CrowdCell contracts/campaign/src/main.rs@acbb40e; code cell per deployment/deployed-contracts-testnet.json (campaign, hash_type data2)',
      deps: { testnet: { tx_hash: '0x8ffc8f88be667072ca06e89127444be41029baabae30306d8247c11dd6f1c799', index: '0x0' } } }],
    parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

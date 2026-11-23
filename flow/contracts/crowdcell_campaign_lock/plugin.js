// CROWDCELL_CAMPAIGN_LOCK — alesfer001/CrowdCell contracts/campaign-lock/src/main.rs @acbb40e (testnet, community)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const ARGS_MIN = 8, DATA_MIN = 65, STATUS_OFF = 56;

  // ckb-std Since: bit 63 = relative flag, bits 56-60 must be 0, bits 61-62 = metric (0 = block number)
  function since(s) {
    const v = BigInt(s || '0x0'), metric = v & 0x6000000000000000n;
    return { v, abs: (v >> 63n) === 0n, valid: (v & 0x1f00000000000000n) === 0n && metric !== 0x6000000000000000n,
      blk: metric === 0n, block: v & 0x00ffffffffffffffn };
  }

  // is_active_campaign_carried_forward for one group input i:
  // true = carried forward; false = not (the deadline gate applies); {err: 15} = capacity decreased.
  // Only the first output carrying this input's campaign type script is looked at.
  function carry(i, ctx) {
    const inp = ctx.inputs[i].output, inCap = BigInt(inp.capacity);
    if (!inp.type) return false;
    const typeHash = R.scriptHash(inp.type), lockHash = R.scriptHash(inp.lock);
    for (let j = 0; j < ctx.tx.outputs.length; j++) {
      const o = ctx.tx.outputs[j];
      if (!o.type || R.scriptHash(o.type) !== typeHash) continue;
      if (R.scriptHash(o.lock) !== lockHash) return false;
      const d = H(ctx.tx.outputs_data[j]);
      if (d.length < DATA_MIN || d[STATUS_OFF] !== 0) return false;
      if (BigInt(o.capacity) < inCap) return { err: 15 };
      return true;
    }
    return false;
  }

  // all_group_inputs_carried_forward: every group input must qualify, else the deadline gate applies
  function carryAll(g, ctx) {
    for (const i of g.inputs) {
      const c = carry(i, ctx);
      if (c && c.err) return c;
      if (c === false) return 'deadline';
    }
    return 'carry';
  }

  function parse(g, ctx) {
    const a = H(g.script.args), p = { ok: a.length >= ARGS_MIN };
    if (p.ok) p.deadline = R.leToBig(a.subarray(0, 8));
    p.since = since(ctx.inputs[g.inputs[0]].input.since);
    p.carry = p.ok ? carryAll(g, ctx) : null;
    const label = p.carry && p.carry.err ? { zh: '延续时 capacity 减少', en: 'carry-forward capacity decreased' }
      : p.carry === 'carry' ? { zh: 'Active 延续（截止前认捐）', en: 'Active carried forward (pre-deadline pledge)' }
      : { zh: '截止后花费', en: 'spend after deadline' };
    p.fields = p.ok ? [['deadline_block', p.deadline.toString()], [{ zh: '路径', en: 'path' }, label],
      ['since', '0x' + p.since.v.toString(16)]] : [['args', '(< 8B)']];
    return p;
  }

  function check(g, ctx, p) {
    if (!p.ok) return [R.check(false, 'args ≥ 8 字节', 'args ≥ 8 bytes', 10)];
    const r = [R.check(true, 'args ≥ 8 字节', 'args ≥ 8 bytes', 10)];
    if (p.carry && p.carry.err) return r.concat([R.check(false, '延续的 Active campaign capacity ≥ 输入', 'carried Active campaign capacity ≥ input', 15)]);
    if (p.carry === 'carry') return r.concat([R.check(true, '全部输入延续为 Active campaign（同 lock 的同 type 输出，capacity ≥ 输入）；截止规则不适用',
      'all inputs carried forward as Active campaign (same-lock output of the same type, capacity ≥ input); deadline gate not applied', 15)]);
    const s = p.since;
    return r.concat([
      R.check(s.abs && s.valid && s.blk, 'since 为绝对区块号且标志合法', 'since is an absolute block number with valid flags', 12),
      R.check(s.abs && s.valid && s.blk && s.block >= p.deadline, `since 区块号 ${s.block} ≥ deadline ${p.deadline}`, `since block ${s.block} ≥ deadline ${p.deadline}`, 13)]);
  }

  R.register({ id: 'crowdcell_campaign_lock', kind: 'lock', name: { zh: 'CrowdCell campaign lock', en: 'CrowdCell campaign lock' },
    match: [{ code_hash: '0xd975780a890b817303a5414167ce235c041a9e63bb5e85f764acc71209fd02a3', hash_type: 'data2', net: 'testnet',
      src: 'alesfer001/CrowdCell contracts/campaign-lock/src/main.rs@acbb40e; code cell per deployment/deployed-contracts-testnet.json (campaignLock, hash_type data2)',
      deps: { testnet: { tx_hash: '0x1ea89700f68f672f950cd43bb764bf7148039d7c8151dad04922437d33d21504', index: '0x0' } } }],
    parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

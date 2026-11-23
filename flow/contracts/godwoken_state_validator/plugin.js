// Godwoken state-validator (rollup cell type) — godwokenrises/godwoken gwos/contracts/state-validator @c2b1f85; errors gw-utils/src/error.rs
// code_hash: godwokenrises/godwoken-info mainnet_v1 / testnet_v1_1 scripts-deploy-result.json @8ce6390. Exposes R.gw helpers for the other Godwoken plugins.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const u64 = (b, o) => { let v = 0n; for (let i = 7; i >= 0; i--) v = v * 256n + BigInt(b[o + i]); return v; };
  const u32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
  const HT = ['data', 'type', 'data1', '?', 'data2'];
  function script(b) { const f = R.parseTable(b, 3); return { code_hash: X(f[0]), hash_type: HT[f[1][0]] || '?', args: X(R.parseBytes(f[2])) }; }
  const tp = v => (v >> 63n) ? { ts: v & ((1n << 63n) - 1n), s: 'timestamp ' + new Date(Number(v & ((1n << 63n) - 1n))).toISOString() } : { bn: v, s: 'L2 block #' + v };
  // DepositLockArgs table { owner_lock_hash: Byte32, layer2_lock: Script, cancel_timeout: Uint64, registry_id: Uint32 }
  function depositArgs(b) { const f = R.parseTable(b, 4); return { owner: X(f[0]), l2lock: script(f[1]), cancel: X(f[2]), cancelV: u64(f[2], 0), registry: u32(f[3], 0) }; }
  // GlobalState struct (190 B): config_hash 32 | account{root 32, count u32} | block{root 32, count u64} | reverted_root 32 | tip_hash 32 | tip_ts u64 | last_finalized u64 | status u8 | version u8
  // GlobalStateV0 struct (181 B): same without tip_block_timestamp and version
  function globalState(hex) { const b = H(hex || '0x');
    if (b.length === 181) return { len: 181, config: X(b.subarray(0, 32)), accRoot: X(b.subarray(32, 64)), accCount: u32(b, 64), blkRoot: X(b.subarray(68, 100)), blkCount: u64(b, 100), reverted: X(b.subarray(108, 140)), tip: X(b.subarray(140, 172)), tipTs: 0n, fin: u64(b, 172), status: b[180], version: 0 };
    if (b.length !== 190) return null;
    return { len: 190, config: X(b.subarray(0, 32)), accRoot: X(b.subarray(32, 64)), accCount: u32(b, 64), blkRoot: X(b.subarray(68, 100)), blkCount: u64(b, 100), reverted: X(b.subarray(108, 140)), tip: X(b.subarray(140, 172)), tipTs: u64(b, 172), fin: u64(b, 180), status: b[188], version: b[189] }; }
  const findType = (cells, h) => cells.findIndex(c => c && c.type && R.scriptHash(c.type) === h);
  const rollupIn = (ctx, h) => findType(ctx.inputs.map(x => x.output), h), rollupOut = (ctx, h) => findType(ctx.tx.outputs, h);
  // RollupAction union: item id u32 LE ‖ body. 0 SubmitBlock, 1 EnterChallenge, 2 CancelChallenge, 3 Revert. Read from witnesses[rollup output index].output_type
  const ACTIONS = ['RollupSubmitBlock', 'RollupEnterChallenge', 'RollupCancelChallenge', 'RollupRevert'];
  function action(ctx, outIdx) { const w = ctx.witnesses[outIdx]; if (!w || !w.args || !w.args.output_type) return null; const b = H(w.args.output_type); return b.length >= 4 ? { id: u32(b, 0), name: ACTIONS[u32(b, 0)] || '?', body: b.subarray(4) } : null; }
  R.gw = { script, depositArgs, globalState, tp, u64, u32, rollupIn, rollupOut, action };
  function parse(g, ctx) {
    const p = { pre: g.inputs.length ? globalState(ctx.inputs[g.inputs[0]].data) : null, post: g.outputs.length ? globalState(ctx.tx.outputs_data[g.outputs[0]]) : null };
    p.act = g.outputs.length ? action(ctx, g.outputs[0]) : null;
    p.fields = [['args (type_id)', g.script.args], [{ zh: '动作', en: 'action' }, g.inputs.length ? (p.act ? p.act.name : '—') : { zh: '初始化（无输入 rollup cell）', en: 'initialization (no input rollup cell)' }]];
    const s = p.post || p.pre; if (s) p.fields.push(['rollup_config_hash', s.config], ['account.count', String(s.accCount)], ['block.count', String(s.blkCount)], ['tip_block_hash', s.tip], ['last_finalized_timepoint', tp(s.fin).s], ['status', s.status ? 'halting (1)' : 'running (0)'], ['version', String(s.version)]);
    if (p.pre && p.post) p.fields.push([{ zh: 'block.count 变化', en: 'block.count change' }, `${p.pre.blkCount} → ${p.post.blkCount}`]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(H(g.script.args).length >= 32, 'args ≥ 32 字节（type_id）', 'args ≥ 32 bytes (type_id)', 39), R.NOT_CHECKED('type_id 规则（最多 1 进 1 出；创建时 args = type_id(inputs[0], i)）', 'type_id rule (≤1 in, ≤1 out; at creation args = type_id(inputs[0], i))', 39)];
    if (!g.inputs.length) { c.push(R.check(!!p.post, '输出 data 为 GlobalState', 'output data is a GlobalState', 4), R.NOT_CHECKED('cell_deps 中有 data hash = rollup_config_hash 的 RollupConfig cell', 'a RollupConfig cell whose data hash = rollup_config_hash is in cell_deps', 10)); return c; }
    c.push(R.check(!!p.pre && !!p.post, '输入 / 输出 data 为 GlobalState', 'input / output data are GlobalState', 4));
    if (!p.pre || !p.post) return c;
    const li = R.scriptHash(ctx.inputs[g.inputs[0]].output.lock), lo = R.scriptHash(ctx.tx.outputs[g.outputs[0]].lock);
    c.push(R.check(li === lo, 'rollup cell 的 lock 不变', 'rollup cell lock unchanged', 7), R.check(p.post.version <= 2 && p.post.version >= p.pre.version, `version ${p.pre.version} → ${p.post.version}（≤ 2，不降级）`, `version ${p.pre.version} → ${p.post.version} (≤ 2, no downgrade)`, 23));
    c.push(R.check(!!p.act && p.act.id <= 3, 'witnesses[rollup 输出].output_type 为 RollupAction', 'witnesses[rollup output].output_type is a RollupAction', 4));
    if (!p.act) return c;
    if (p.act.id === 0) {
      c.push(R.check(p.pre.status === 0, 'submit：前状态 running', 'submit: previous status running', 21), R.check(p.post.blkCount === p.pre.blkCount + 1n, `block.count +1（${p.pre.blkCount} → ${p.post.blkCount}）`, `block.count +1 (${p.pre.blkCount} → ${p.post.blkCount})`, 23),
        R.check(p.post.config === p.pre.config && p.post.reverted === p.pre.reverted && p.post.status === p.pre.status, 'rollup_config_hash / reverted_block_root / status 不变', 'rollup_config_hash / reverted_block_root / status unchanged', 23),
        R.NOT_CHECKED('L2 区块、SMT 证明、stake / deposit / custodian / withdrawal cell 资产守恒（离线不复算）', 'L2 block, SMT proofs, stake / deposit / custodian / withdrawal asset accounting (not recomputed offline)', '13 / 15–20 / 25–28 / 33'));
    } else c.push(R.NOT_CHECKED(`${p.act.name}：挑战 / 回滚规则未离线复算`, `${p.act.name}: challenge / revert rules not recomputed offline`, '21 / 24 / 29 / 30 / 32'));
    return c;
  }
  R.register({ id: 'godwoken_state_validator', kind: 'type', name: { zh: 'Godwoken rollup cell（state-validator）', en: 'Godwoken rollup cell (state-validator)' }, match: [
    { code_hash: '0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718', hash_type: 'type', net: 'mainnet', src: 'godwoken-info mainnet_v1/scripts-deploy-result.json state_validator' },
    { code_hash: '0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854', hash_type: 'type', net: 'testnet', src: 'godwoken-info testnet_v1_1/scripts-deploy-result.json state_validator' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

// Omnilock V1 — nervosnetwork/ckb-production-scripts@ddaeae8 c/omni_lock.c (+ ckb_identity.h). Mainnet V1 binary 0xf18e…dee5 is pinned in build.rs at that commit.
// Differences from V2 (contracts/omnilock): ckb_verify_identity handles only auth flags 0, 1, 6, 0xFC, 0xFD, 0xFE; anything else → CKB_INVALID_DATA (4); 65-byte signature check only for 0/1.
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const AUTH = { 0: 'CKB secp256k1', 1: 'Ethereum', 6: 'CKB multisig', 0xfc: 'Owner lock', 0xfd: 'Exec', 0xfe: 'Dynamic linking' };
  function parseArgs(hex) {
    const a = H(hex), r = { len: a.length };
    if (a.length < 22) { r.error = true; return r; }
    r.authFlag = a[0]; r.authId = X(a.subarray(1, 21)); r.flags = a[21];
    r.root = !!(r.flags & 1); r.acp = !!(r.flags & 2); r.since = !!(r.flags & 4); r.supply = !!(r.flags & 8);
    let need = 22 + (r.root ? 32 : 0) + (r.acp ? 2 : 0) + (r.since ? 8 : 0) + (r.supply ? 32 : 0), o = 22;
    r.expected = need; if (a.length !== need) { r.error = true; return r; }
    if (r.root) { r.omniRoot = X(a.subarray(o, o + 32)); o += 32; }
    if (r.acp) { r.ckbMin = a[o]; r.udtMin = a[o + 1]; o += 2; }
    if (r.since) { r.sinceVal = '0x' + R.leToBig(a.subarray(o, o + 8)).toString(16).padStart(16, '0'); o += 8; }
    if (r.supply) { r.infoCell = X(a.subarray(o, o + 32)); }
    return r;
  }
  // OmniLockWitnessLock { signature: BytesOpt, omni_identity: IdentityOpt, preimage: BytesOpt }
  function parseWL(hex) {
    try { const f = R.parseTable(H(hex), 3); const r = {};
      if (f[0].length) { r.sig = X(R.parseBytes(f[0])); }
      if (f[1].length) { const id = R.parseTable(f[1], 2); r.identity = X(id[0]); r.proofs = X(id[1]); }
      if (f[2].length) { r.preimage = X(R.parseBytes(f[2])); }
      return r; } catch (e) { return { error: e.message }; }
  }
  function parse(g, ctx) {
    const a = parseArgs(g.script.args), w = ctx.witnesses[g.witnessIndex];
    const wl = w && w.args && w.args.lock ? parseWL(w.args.lock) : null;
    const fields = [['args', g.script.args]];
    if (!a.error) {
      fields.push([{ zh: '认证方式 auth flag', en: 'auth flag' }, '0x' + a.authFlag.toString(16).padStart(2, '0') + ' ' + (AUTH[a.authFlag] || '?')],
        ['auth content', a.authId], ['omnilock flags', '0b' + a.flags.toString(2).padStart(8, '0') + [a.root && ' admin', a.acp && ' acp', a.since && ' time-lock', a.supply && ' supply'].filter(Boolean).join('')]);
      if (a.root) fields.push(['omni_root (RC cell type_id)', a.omniRoot]);
      if (a.acp) fields.push(['acp minimum (ckb, udt)', a.ckbMin + ', ' + a.udtMin]);
      if (a.since) fields.push(['since', a.sinceVal]);
      if (a.supply) fields.push(['info_cell type hash', a.infoCell]);
    }
    if (wl) fields.push([{ zh: 'witness.lock 签名', en: 'witness.lock signature' }, wl.sig ? wl.sig.slice(0, 26) + '… (' + (wl.sig.length - 2) / 2 + 'B)' : 'None'], ['omni_identity', wl.identity || 'None'], ['preimage', wl.preimage || 'None']);
    const lay = [{ name: 'auth flag', size: '1B', color: 0 }, { name: 'auth content', size: '20B', color: 1, flex: 3 }, { name: 'omnilock flags', size: '1B', color: 2 }];
    if (a.root) lay.push({ name: 'omni_root', size: '32B', color: 3, flex: 3 });
    if (a.acp) lay.push({ name: 'acp min', size: '2B', color: 4 });
    if (a.since) lay.push({ name: 'since', size: '8B', color: 5 });
    if (a.supply) lay.push({ name: 'info_cell', size: '32B', color: 6, flex: 3 });
    return { a, wl, fields, layouts: a.error ? [] : [{ label: 'args', layout: lay, hex: [] }] };
  }
  function check(g, ctx, p) {
    const a = p.a, wl = p.wl, c = [];
    c.push(R.check(!a.error, `args 长度 ${a.len} = 22 + 可选字段 = ${a.expected || '?'}`, `args length ${a.len} = 22 + optional fields = ${a.expected || '?'}`, 87));
    if (a.error) return c;
    if (wl && wl.error) c.push(R.check(false, 'witness.lock 是合法 OmniLockWitnessLock', 'witness.lock is a valid OmniLockWitnessLock', 47));
    const admin = !!(wl && wl.identity);
    if (admin) {
      c.push(R.check(a.root, '使用管理员 identity 时 args 必须带 omni_root', 'admin identity requires omni_root in args', 47), R.check(!!wl.proofs, 'omni_identity 带 SMT proofs', 'omni_identity carries SMT proofs', 47),
        R.NOT_CHECKED('RC cell 白名单 SMT 证明（未检查）', 'RC-cell whitelist SMT proof (not checked)', '81/82/83/59'));
    } else {
      if (a.since) { const want = R.parseSince(a.sinceVal);
        for (const i of g.inputs) { const s = R.parseSince(ctx.inputs[i].input.since);
          c.push(R.check(s.flags === want.flags, `input[${i}].since flags = args since flags`, `input[${i}].since flags = args since flags`, -23));
          if (s.flags === want.flags) c.push(R.check(want.metric === 'epoch' ? R.epochCmp(s.epoch, want.epoch) >= 0 : s.value >= want.value, `input[${i}].since ≥ args since`, `input[${i}].since ≥ args since`, -24)); } }
      if (a.supply) c.push(R.NOT_CHECKED('info cell 供应量规则（未检查）', 'info cell supply rules (not checked)', '90–93'));
      if (a.acp && !(wl && wl.sig)) { c.push(R.NOT_CHECKED('无签名 → ACP 模式：每个输入都有同 lock 输出且金额增加（未检查）', 'no signature → ACP mode: paired outputs with increased amounts (not checked)', '-42/-44')); return c; }
    }
    const f = admin ? H(wl.identity)[0] : a.authFlag;
    if (f <= 1) c.push(R.check(!!(wl && wl.sig) && H(wl.sig).length === 65, '签名为 65 字节', 'signature is 65 bytes', 71));
    if (f === 0xfc) { const id = admin ? X(H(wl.identity).subarray(1)) : a.authId;
      const ok = ctx.inputs.some(x => x.output && R.bytesToHex(R.hexToBytes(R.scriptHash(x.output.lock)).subarray(0, 20)) === id);
      c.push(R.check(ok, '某个 input 的 lock script hash 前 20 字节 = auth content', 'some input lock hash[0..20] = auth content', 70)); }
    else if (!(f in AUTH)) c.push(R.check(false, 'V1 支持该 auth flag（0/1/6/0xFC/0xFD/0xFE）', 'auth flag supported by V1 (0/1/6/0xFC/0xFD/0xFE)', 4));
    else c.push(R.NOT_CHECKED('签名 / 鉴权验证（未检查）', 'signature / auth verification (not checked)', f === 6 ? '-51/-52' : '-31'));
    return c;
  }
  R.register({ id: 'omnilock_v1', kind: 'lock', name: { zh: 'Omnilock V1', en: 'Omnilock V1' }, match: [
    { code_hash: '0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d', hash_type: 'type', net: 'mainnet', src: 'CKB Explorer registry "OMNI Lock V1" (API /api/v2/scripts + fill_contracts_info.rake); binary 0xf18e…dee5 pinned in ckb-production-scripts build.rs @ddaeae8' },
    { code_hash: '0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e', hash_type: 'type', net: 'testnet', src: 'CKB Explorer registry "OMNI Lock V1" (testnet); binary 0x1bf1…67d1 NOT matched to a source commit' },
    { code_hash: '0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f', hash_type: 'type', net: 'mainnet', src: 'CKB Explorer registry "Force Bridge" = pre-release Omnilock (Magickbase/ckb-explorer-public-issues#532); binary 0x1bf1…67d1 NOT matched to a source commit' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

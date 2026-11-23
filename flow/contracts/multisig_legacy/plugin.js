// secp256k1_blake160_multisig_all (legacy, genesis) — ckb-system-scripts/c/secp256k1_blake160_multisig_all.c (+ common.h)
// Also exposes R.multisig for multisig_v2 (same lock layout).
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  function parseLock(lockHex) {
    const b = H(lockHex); if (b.length < 4) return { error: 'lock < 4 bytes' };
    const [S, Rr, M, N] = b; const scriptLen = 4 + 20 * N;
    const r = { S, R: Rr, M, N, pubkeyHashes: [], signatures: [], length: b.length, expectedLength: scriptLen + 65 * M };
    for (let i = 0; i < N && 24 + 20 * i <= b.length; i++) r.pubkeyHashes.push(X(b.subarray(4 + 20 * i, 24 + 20 * i)));
    for (let i = 0; i < M && scriptLen + 65 * (i + 1) <= b.length; i++) r.signatures.push(X(b.subarray(scriptLen + 65 * i, scriptLen + 65 * (i + 1))));
    if (b.length >= scriptLen) { r.multisigScript = X(b.subarray(0, scriptLen)); r.scriptBlake160 = R.blake160(b.subarray(0, scriptLen)); }
    return r;
  }
  const argsSince = g => { const a = H(g.script.args); return a.length === 28 ? R.parseSince('0x' + R.leToBig(a.subarray(20)).toString(16).padStart(16, '0')) : null; };
  function parse(g, ctx) {
    const w = ctx.witnesses[g.witnessIndex]; const p = { witnessOk: !!(w && w.args && w.args.lock), since: argsSince(g) };
    if (p.witnessOk) p.ms = parseLock(w.args.lock);
    const m = p.ms; p.fields = [['args', g.script.args]];
    if (p.since) p.fields.push([{ zh: 'args 中的 since', en: 'since in args' }, p.since.raw]);
    if (m && !m.error) p.layouts = [{ label: 'multisig_script', layout: [
      { name: 'S=' + m.S, size: '1B', color: 0 }, { name: 'R=' + m.R, size: '1B', color: 1 }, { name: 'M=' + m.M, size: '1B', color: 2 }, { name: 'N=' + m.N, size: '1B', color: 3 },
      { name: 'pubkey_hash × ' + m.pubkeyHashes.length, size: '20B', color: 4, flex: 4 }, { name: 'signature × ' + m.signatures.length, size: '65B', color: 5, flex: 4 }],
      hex: [...m.pubkeyHashes.map((h, i) => ['pubkey_hash[' + i + ']', i < m.R ? { zh: h + '（必须签名）', en: h + ' (must sign)' } : h]),
        ...m.signatures.map((s, i) => ['signature[' + i + ']', s]), ['blake160(script)', m.scriptBlake160 || '—'], [{ zh: 'lock 长度', en: 'lock length' }, m.length + ' / ' + m.expectedLength + 'B']] }];
    return p;
  }
  function check(g, ctx, p) {
    const a = H(g.script.args), c = [R.check(a.length === 20 || a.length === 28, 'args 长度为 20 或 28', 'args length is 20 or 28', -1)];
    if (p.since) for (const i of g.inputs) { const s = R.parseSince(ctx.inputs[i].input.since);
      c.push(R.check(s.flags === p.since.flags, `input[${i}].since flags 与 args 相同`, `input[${i}].since flags equal args`, -23));
      if (s.flags === p.since.flags) c.push(R.check(p.since.metric === 'epoch' ? R.epochCmp(s.epoch, p.since.epoch) >= 0 : s.value >= p.since.value, `input[${i}].since ≥ args since`, `input[${i}].since ≥ args since`, -24)); }
    c.push(R.check(p.witnessOk, 'witness 为合法 WitnessArgs 且 lock 非空', 'witness is a valid WitnessArgs with non-empty lock', -2));
    const m = p.ms;
    if (m && m.error) c.push(R.check(false, 'lock ≥ 4 字节', 'lock ≥ 4 bytes', -22));
    else if (m) c.push(R.check(m.S === 0, 'S = 0', 'S = 0', -41), R.check(m.N > 0, 'N > 0', 'N > 0', -42), R.check(m.M > 0 && m.M <= m.N, '0 < M ≤ N', '0 < M ≤ N', -43), R.check(m.R <= m.M, 'R ≤ M', 'R ≤ M', -44),
      R.check(m.length === m.expectedLength, `lock 长度 ${m.length} = 4+20·N+65·M = ${m.expectedLength}`, `lock length ${m.length} = 4+20·N+65·M = ${m.expectedLength}`, -22),
      R.check(!!m.scriptBlake160 && m.scriptBlake160 === X(a.subarray(0, 20)), 'blake160(multisig_script) = args[0..20]', 'blake160(multisig_script) = args[0..20]', -51));
    c.push(R.NOT_CHECKED('签名校验（未检查）', 'signature verification (not checked)', -52));
    return c;
  }
  R.multisig = { parseLock, parse, check };
  R.register({ id: 'multisig_legacy', kind: 'lock', name: { zh: 'Multisig（旧版）', en: 'Multisig (legacy)' },
    match: [{ code_hash: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8', hash_type: 'type', src: 'RFC 0024 (Lina & Aggron)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

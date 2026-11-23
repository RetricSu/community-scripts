// SPHINCS_LOCK — cryptape/quantum-resistant-lock-script contracts/c-sphincs-all-in-one-lock/ckb-sphincsplus-root-lock.c
// (deployed build per deployment/mainnet/deployment.toml; constants from README.md "Deployment"; layout from docs/advanced.md)
(function (R) {
  const H = R.hexToBytes, X = R.bytesToHex;
  const NAMES = ['sha2-128f', 'sha2-128s', 'sha2-192f', 'sha2-192s', 'sha2-256f', 'sha2-256s', 'shake-128f', 'shake-128s', 'shake-192f', 'shake-192s', 'shake-256f', 'shake-256s'];
  // FIPS 205 Table 2: pk 32/48/64 bytes for n = 16/24/32; signature sizes per (n, s|f)
  const PK = [32, 32, 48, 48, 64, 64], SIG = [17088, 7856, 35664, 16224, 49856, 29792];
  const param = id => { const i = id - 48; return i >= 0 && i < 12 ? { name: 'SLH-DSA-' + NAMES[i].slice(0, -1).toUpperCase() + NAMES[i].slice(-1), pk: PK[i % 6], sig: SIG[i % 6] } : null; };
  function parse(g, ctx) {
    const p = { argsLen: H(g.script.args).length, fields: [['multisig config hash (args)', g.script.args]] };
    const w = ctx.witnesses[g.inputs[0]]; p.lock = w && w.args ? w.args.lock : null; if (!p.lock) return p;
    const b = H(p.lock); p.wlen = b.length; if (b.length < 4) { p.err = 106; return p; }
    const [S, Rq, M, N] = b; Object.assign(p, { S, Rq, M, N }); p.fields.push(['S R M N', `0x${S.toString(16)} ${Rq} ${M} ${N}`]);
    if (S !== 0x80 || N === 0 || M > N || M === 0 || Rq > M) { p.err = 103; return p; }
    const cfg = [b.subarray(0, 4)]; let o = 4, left = M; p.keys = [];
    for (let i = 0; i < N; i++) { if (o >= b.length) { p.err = 106; return p; }
      const f = b[o++], pr = param(f >> 1); if (!pr) { p.err = 106; p.badId = f >> 1; return p; }
      if (o + pr.pk > b.length) { p.err = 106; return p; } const pk = b.subarray(o, o + pr.pk); o += pr.pk;
      cfg.push(Uint8Array.of(f & 0xfe), pk); const signed = (f & 1) === 1;
      if (signed) { if (left === 0) { p.err = 106; return p; } left--; o += pr.sig; } else if (i < Rq) { p.err = 106; p.missingRequired = i; return p; }
      p.keys.push({ pr, signed }); p.fields.push([`pubkey[${i}]`, `${pr.name} (${pr.pk} B pk${signed ? `, ${pr.sig} B signature` : ', no signature'})`]); }
    if (left !== 0 || o !== b.length) { p.err = 106; p.trailing = b.length - o; return p; }
    const all = new Uint8Array(cfg.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of cfg) { all.set(x, k); k += x.length; }
    p.hash = X(R.blake2b(all, 32, 'ckb-sphincs+-sct')); p.fields.push([{ zh: '由 witness 重算的 config hash', en: 'config hash recomputed from witness' }, p.hash]);
    return p;
  }
  function check(g, ctx, p) {
    const c = [R.check(p.argsLen === 32, 'args 恰为 32 字节', 'args is exactly 32 bytes', 104),
      R.check(!!p.lock, '第一个 group witness 是 WitnessArgs 且 lock 非空', 'first group witness is WitnessArgs with a non-empty lock', 106)];
    if (!p.lock) return c;
    c.push(R.check(p.err !== 103, 'S = 0x80，N > 0，0 < M ≤ N，R ≤ M', 'S = 0x80, N > 0, 0 < M ≤ N, R ≤ M', 103),
      R.check(p.err !== 106, '每个 PWOS 的 param ID ∈ 48–59、长度正确；前 R 个都带签名；恰 M 个签名；无多余字节', 'each PWOS has param ID 48–59 and correct length; first R are signed; exactly M signatures; no trailing bytes', 106));
    if (p.err) return c;
    c.push(R.check(p.hash === g.script.args, 'blake2b("ckb-sphincs+-sct", S‖R‖M‖N‖(flag & 0xFE ‖ pubkey)×N) = args', 'blake2b("ckb-sphincs+-sct", S‖R‖M‖N‖(flag & 0xFE ‖ pubkey)×N) = args', 105),
      R.NOT_CHECKED(`${p.M} 个 SPHINCS+ 签名覆盖 CKB_TX_MESSAGE_ALL（personal "ckb-sphincs+-msg"），由 leaf lock 验证`, `${p.M} SPHINCS+ signature(s) over CKB_TX_MESSAGE_ALL (personal "ckb-sphincs+-msg"), verified by the leaf lock`, '107 / 111'));
    return c;
  }
  R.register({ id: 'sphincs_lock', kind: 'lock', name: 'Quantum-resistant SPHINCS+ Lock', match: [
    { code_hash: '0x302d35982f865ebcbedb9a9360e40530ed32adb8e10b42fbbe70d8312ff7cedf', hash_type: 'type', net: 'mainnet', src: 'cryptape/quantum-resistant-lock-script README.md (mainnet, dep 0x4598d00d…500a:0)' },
    { code_hash: '0x147ecbb5c5127d982ee1362d2c2bb4267803da2eb006d150e88af6caaa0a7eaf', hash_type: 'data1', net: 'testnet', src: 'cryptape/quantum-resistant-lock-script README.md (testnet, dep 0x631d9a60…b106:0)' }], parse, check });
})((typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js")));

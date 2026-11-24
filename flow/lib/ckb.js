// Zero-dependency CKB helpers: blake2b (ckb-default-hash), molecule parsing, script hash, RPC, tx analysis.
// Works in browser (window.CKB) and Node (module.exports).
(function (root) {
'use strict';
// ---------- hex ----------
const hexToBytes = h => { h = h.replace(/^0x/, ''); if (h.length % 2) throw new Error('odd hex'); const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; };
const bytesToHex = b => '0x' + Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const concat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const u32le = n => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const readU32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const leToBig = b => { let x = 0n; for (let i = b.length - 1; i >= 0; i--) x = (x << 8n) | BigInt(b[i]); return x; };

// ---------- blake2b (RFC 7693, BigInt) ----------
const M64 = (1n << 64n) - 1n;
const IV = ['6a09e667f3bcc908', 'bb67ae8584caa73b', '3c6ef372fe94f82b', 'a54ff53a5f1d36f1', '510e527fade682d1', '9b05688c2b3e6c1f', '1f83d9abfb41bd6b', '5be0cd19137e2179'].map(h => BigInt('0x' + h));
const SIGMA = [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],[14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],[11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],[7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],[9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],[2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],[12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],[13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],[6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],[10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0]];
const rotr = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & M64;
function compress(h, block, t, last) {
  const m = []; for (let i = 0; i < 16; i++) m.push(leToBig(block.subarray(i * 8, i * 8 + 8)));
  const v = h.concat(IV); v[12] ^= t & M64; v[13] ^= t >> 64n; if (last) v[14] ^= M64;
  const G = (a, b, c, d, x, y) => { v[a] = (v[a] + v[b] + x) & M64; v[d] = rotr(v[d] ^ v[a], 32); v[c] = (v[c] + v[d]) & M64; v[b] = rotr(v[b] ^ v[c], 24); v[a] = (v[a] + v[b] + y) & M64; v[d] = rotr(v[d] ^ v[a], 16); v[c] = (v[c] + v[d]) & M64; v[b] = rotr(v[b] ^ v[c], 63); };
  for (let r = 0; r < 12; r++) { const s = SIGMA[r % 10]; G(0,4,8,12,m[s[0]],m[s[1]]); G(1,5,9,13,m[s[2]],m[s[3]]); G(2,6,10,14,m[s[4]],m[s[5]]); G(3,7,11,15,m[s[6]],m[s[7]]); G(0,5,10,15,m[s[8]],m[s[9]]); G(1,6,11,12,m[s[10]],m[s[11]]); G(2,7,8,13,m[s[12]],m[s[13]]); G(3,4,9,14,m[s[14]],m[s[15]]); }
  for (let i = 0; i < 8; i++) h[i] ^= v[i] ^ v[i + 8];
}
function blake2b(data, outLen = 32, personal = 'ckb-default-hash') {
  const p = new Uint8Array(64); p[0] = outLen; p[1] = 0; p[2] = 1; p[3] = 1;
  if (personal) { const pb = typeof personal === 'string' ? new TextEncoder().encode(personal) : personal; p.set(pb.subarray(0, 16), 48); }
  const h = IV.map((x, i) => x ^ leToBig(p.subarray(i * 8, i * 8 + 8)));
  let t = 0n; const n = data.length; let off = 0;
  while (n - off > 128) { t += 128n; compress(h, data.subarray(off, off + 128), t, false); off += 128; }
  const last = new Uint8Array(128); last.set(data.subarray(off)); t += BigInt(n - off); compress(h, last, t, true);
  const out = new Uint8Array(64); h.forEach((x, i) => { for (let j = 0; j < 8; j++) out[i * 8 + j] = Number((x >> BigInt(8 * j)) & 255n); });
  return out.subarray(0, outLen);
}
const ckbHash = b => bytesToHex(blake2b(b));
const blake160 = b => bytesToHex(blake2b(b).subarray(0, 20));

// ---------- molecule ----------
function parseTable(b, nFields) { // returns array of field slices
  if (b.length < 4) throw new Error('table too short');
  const total = readU32(b, 0); if (total !== b.length) throw new Error(`table size ${total} ≠ ${b.length}`);
  if (total === 4) return [];
  const first = readU32(b, 4); const cnt = first / 4 - 1;
  if (first % 4 || first < 8 || first > total) throw new Error('bad header');
  const offs = []; for (let i = 0; i < cnt; i++) offs.push(readU32(b, 4 + i * 4)); offs.push(total);
  for (let i = 0; i < cnt; i++) if (offs[i] > offs[i + 1]) throw new Error('bad offsets');
  if (nFields != null && cnt < nFields) throw new Error(`fields ${cnt} < ${nFields}`);
  return offs.slice(0, cnt).map((o, i) => b.subarray(o, offs[i + 1]));
}
function parseBytes(b) { if (b.length < 4) throw new Error('bytes too short'); const n = readU32(b, 0); if (n + 4 !== b.length) throw new Error('bytes len mismatch'); return b.subarray(4); }
// WitnessArgs { lock: BytesOpt, input_type: BytesOpt, output_type: BytesOpt }
function parseWitnessArgs(hex) {
  const b = hexToBytes(hex); const f = parseTable(b, 3); if (f.length !== 3) throw new Error('WitnessArgs must have 3 fields');
  const opt = x => x.length === 0 ? null : bytesToHex(parseBytes(x));
  return { lock: opt(f[0]), input_type: opt(f[1]), output_type: opt(f[2]) };
}
const HASH_TYPE = { data: 0, type: 1, data1: 2, data2: 4 };
function serializeScript(s) {
  const code = hexToBytes(s.code_hash), ht = new Uint8Array([HASH_TYPE[s.hash_type]]), a = hexToBytes(s.args);
  if (ht[0] === undefined) throw new Error('unknown hash_type ' + s.hash_type);
  const args = concat(u32le(a.length), a); const h = 16, o0 = h, o1 = o0 + 32, o2 = o1 + 1, tot = o2 + args.length;
  return concat(u32le(tot), u32le(o0), u32le(o1), u32le(o2), code, ht, args);
}
const scriptHash = s => ckbHash(serializeScript(s));

// ---------- RPC ----------
async function rpc(url, method, params, fetchImpl) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  let res;
  try { res = await f(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }) }); }
  catch (e) { const err = new Error('NETWORK_OR_CORS: ' + e.message); err.code = 'CORS'; throw err; }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json(); if (j.error) throw new Error(`RPC ${method}: ${j.error.message || JSON.stringify(j.error)}`);
  return j.result;
}

// ---------- epoch / since ----------
const parseEpoch = v => { v = BigInt(v); return { number: v & 0xffffffn, index: (v >> 24n) & 0xffffn, length: (v >> 40n) & 0xffffn }; };
const fmtEpoch = e => `${e.number}+${e.index}/${e.length}`;
function parseSince(hex) {
  const v = BigInt(hex); if (v === 0n) return { raw: hex, none: true };
  const flags = Number(v >> 56n), rel = (flags & 0x80) !== 0, metric = ['block', 'epoch', 'timestamp', 'invalid'][(flags >> 5) & 3], val = v & ((1n << 56n) - 1n);
  return { raw: hex, flags, relative: rel, metric, value: val, epoch: metric === 'epoch' ? parseEpoch(val) : null };
}
const epochCmp = (a, b) => { if (a.number !== b.number) return a.number < b.number ? -1 : 1; const x = a.index * b.length, y = b.index * a.length; return x === y ? 0 : x < y ? -1 : 1; };

// ---------- plugin registry ----------
const PLUGINS = [];
function register(p) {
  if (!p || !p.id || !Array.isArray(p.match)) throw new Error('plugin needs id + match[]');
  const i = PLUGINS.findIndex(x => x.id === p.id); if (i >= 0) PLUGINS.splice(i, 1);
  PLUGINS.push(p); return p;
}
const identify = s => s ? (PLUGINS.find(p => p.match.some(m => m.code_hash === s.code_hash && m.hash_type === s.hash_type)) || null) : null;

// ---------- small helpers for plugins ----------
const le = h => leToBig(hexToBytes(h));                        // LE hex → BigInt
const u128 = h => { const b = hexToBytes(h); return b.length >= 16 ? leToBig(b.subarray(0, 16)) : null; };
const u64 = h => { const b = hexToBytes(h); return b.length === 8 ? leToBig(b) : null; };
const check = (ok, zh, en, code) => ({ ok, zh, en, code: code == null ? null : String(code) });
const NOT_CHECKED = (zh, en, code) => check(null, zh, en, code);
function occupied(out, data) { // bytes: capacity(8) + data + lock(32+1+args) + type → shannons
  const sz = s => s ? 33 + hexToBytes(s.args).length : 0;
  return BigInt(8 + hexToBytes(data).length + sz(out.lock) + sz(out.type)) * 100000000n;
}

// ---------- fetching ----------
async function fetchTxBundle(url, txHash, fetchImpl) {
  const call = (m, p) => rpc(url, m, p, fetchImpl);
  const tv = await call('get_transaction', [txHash]); if (!tv || !tv.transaction) throw new Error('transaction not found');
  const tx = tv.transaction; const prevCache = {}, headers = {};
  const getTx = async h => prevCache[h] || (prevCache[h] = await call('get_transaction', [h]));
  const inputs = [];
  for (const inp of tx.inputs) {
    const op = inp.previous_output;
    if (/^0x0+$/.test(op.tx_hash)) { inputs.push({ input: inp, cellbase: true }); continue; }
    const p = await getTx(op.tx_hash); const idx = parseInt(op.index, 16);
    inputs.push({ input: inp, output: p.transaction.outputs[idx], data: p.transaction.outputs_data[idx], blockHash: p.tx_status.block_hash });
  }
  // headers: header_deps, own block, and input blocks of scripts whose plugin sets needsInputHeaders
  const want = new Set(tx.header_deps); if (tv.tx_status.block_hash) want.add(tv.tx_status.block_hash);
  for (const i of inputs) if (i.output && i.blockHash) for (const s of [i.output.lock, i.output.type]) { const p = identify(s); if (p && p.needsInputHeaders) want.add(i.blockHash); }
  for (const h of want) headers[h] = await call('get_header', [h]);
  return { txHash, tx, status: tv.tx_status, inputs, headers };
}

// ---------- grouping ----------
function groupTx(bundle) {
  const { tx, inputs } = bundle; const lockG = new Map(), typeG = new Map();
  const add = (m, kind, s, h) => { if (!m.has(h)) m.set(h, { kind, script: s, hash: h, inputs: [], outputs: [] }); return m.get(h); };
  inputs.forEach((x, i) => { if (!x.output) return;
    add(lockG, 'lock', x.output.lock, scriptHash(x.output.lock)).inputs.push(i);
    if (x.output.type) add(typeG, 'type', x.output.type, scriptHash(x.output.type)).inputs.push(i); });
  tx.outputs.forEach((o, j) => { if (o.type) add(typeG, 'type', o.type, scriptHash(o.type)).outputs.push(j);
    const lk = scriptHash(o.lock); if (lockG.has(lk)) lockG.get(lk).outputs.push(j); });
  for (const g of lockG.values()) g.witnessIndex = g.inputs[0];
  return [...lockG.values(), ...typeG.values()];
}
function parseWitnesses(tx) {
  return tx.witnesses.map(w => { if (!w || w === '0x') return { raw: w, empty: true }; try { return { raw: w, args: parseWitnessArgs(w) }; } catch (e) { return { raw: w, error: e.message }; } });
}

// ---------- analysis (runs plugins) ----------
// plugin.parse(group, ctx) -> { fields?: [[label, value]], layouts?: [{label, layout:[{name,size,color,flex}], hex:[[k,v]]}], bonus?: BigInt, ... }
// plugin.check(group, ctx, parsed) -> [{ ok: true|false|null, code, zh, en }]
function analyze(bundle) {
  const { tx, inputs } = bundle; const witnesses = parseWitnesses(tx); const groups = groupTx(bundle);
  const ctx = { ...bundle, witnesses, groups, lib: api };
  let bonus = 0n;
  for (const g of groups) {
    g.plugin = identify(g.script); g.parsed = {}; g.checks = [];
    if (!g.plugin) continue;
    try { g.parsed = (g.plugin.parse ? g.plugin.parse(g, ctx) : {}) || {}; g.checks = (g.plugin.check ? g.plugin.check(g, ctx, g.parsed) : []) || []; }
    catch (e) { g.checks = [check(false, '插件异常：' + e.message, 'plugin error: ' + e.message, null)]; }
    if (typeof g.parsed.bonus === 'bigint') bonus += g.parsed.bonus;
  }
  const inCap = inputs.reduce((s, x) => s + (x.output ? BigInt(x.output.capacity) : 0n), 0n), outCap = tx.outputs.reduce((s, o) => s + BigInt(o.capacity), 0n);
  const checks = [
    check(outCap <= inCap + bonus, `Σ输出 capacity ${outCap} ≤ Σ输入 ${inCap} + 补贴 ${bonus}`, `Σ output capacity ${outCap} ≤ Σ input ${inCap} + compensation ${bonus}`, 'consensus'),
    check(tx.outputs.length === tx.outputs_data.length, 'outputs_data 数量 = outputs 数量', 'outputs_data count = outputs count', 'consensus'),
  ];
  return { groups, witnesses, checks, fee: inCap + bonus - outCap };
}

var api; api = { register, PLUGINS, le, u128, u64, check, NOT_CHECKED, groupTx, parseWitnesses, leToBig, hexToBytes, bytesToHex, blake2b, ckbHash, blake160, parseTable, parseBytes, parseWitnessArgs, serializeScript, scriptHash, identify, rpc, parseEpoch, fmtEpoch, parseSince, epochCmp, fetchTxBundle, analyze, occupied };
root.CKB = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

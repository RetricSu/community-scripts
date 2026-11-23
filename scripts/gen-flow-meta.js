#!/usr/bin/env node
// Project the canonical deployment baseline (src/deployments/*.json) into the
// flow knowledge base (flow/contracts/<id>/meta.json).
//
// Field policy (three kinds, three strategies — never fabricate):
//   mechanical  (code_hash/cell_dep/code_cell/type_script/data_hash/deploy_tx)
//               -> always derived from the baseline, overwritten on regen
//   rpc-fillable (hash_type when ambiguous / deploy_block / missing data_hash
//               / missing type_script) -> filled when --rpc is given
//   knowledge   (tags/contributors/source.commit/binary/constant_source)
//               -> seeded once, NEVER overwritten once a human filled them
//
// Modes per target meta.json:
//   missing            -> create full projection, stamp `generated_from`
//   has generated_from -> regen mechanical, preserve knowledge
//   upstream (no mark) -> default: report drift only; --check exits 1 on drift;
//                         --sync rewrites mechanical facts, keeps knowledge
//
// Usage: node scripts/gen-flow-meta.js [--all] [name ...] [--rpc URL] [--sync] [--check]
'use strict';
const fs = require('fs'), path = require('path');
const CKB = require('../flow/lib/ckb.js');
const L = require('./flow-lib.js');

const DEPLOYMENTS_DIR = process.env.DEPLOYMENTS_DIR || path.join(L.ROOT, 'src', 'deployments');
const TODAY = new Date().toISOString().slice(0, 10);

function listBaselineNames() {
  return fs.readdirSync(DEPLOYMENTS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
}
function loadBaseline(name) {
  const file = path.join(DEPLOYMENTS_DIR, `${name}.json`);
  return { name, file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

const GEN_NOTE = 'generated from community-scripts baseline; provenance not yet verified';
const DATA1_NOTE = 'hash_type inferred as data1 (baseline records no hashType); correct manually if wrong';

// ---- RPC enrichment ------------------------------------------------------

// molecule OutPointVec: u32le count, then count × (32-byte tx hash + u32le index)
function parseGroupMembers(dataHex) {
  const b = Buffer.from(dataHex.slice(2), 'hex');
  const n = b.readUInt32LE(0);
  const out = [];
  for (let i = 0; i < n && 4 + 36 * (i + 1) <= b.length; i++) {
    out.push({ tx_hash: '0x' + b.subarray(4 + 36 * i, 36 + 36 * i).toString('hex'), index: '0x' + b.readUInt32LE(36 + 36 * i).toString(16) });
  }
  return out;
}

async function rpcEnrich(rpcUrl, network, info, dep, warnings) {
  const op = info.cellDeps && info.cellDeps[0] && info.cellDeps[0].outPoint;
  if (!op) return;
  const outPoint = { tx_hash: op.txHash, index: op.index };
  let cell = null;
  try {
    const r = await CKB.rpc(rpcUrl, 'get_live_cell', [outPoint, true]);
    cell = r && r.status === 'live' && r.cell ? r.cell : null;
    if (!cell) warnings.push(`${network}: cell ${op.txHash}:${op.index} is ${r ? r.status : 'unknown'} on chain`);
  } catch (e) {
    warnings.push(`${network}: get_live_cell failed: ${e.message}`);
  }
  if (cell) {
    const dataHex = cell.data && cell.data.content;
    if (!L.isSet(dep.data_hash) && dataHex) {
      try { dep.data_hash = '0x' + Buffer.from(CKB.blake2b(Buffer.from(dataHex.slice(2), 'hex'))).toString('hex'); }
      catch (e) { warnings.push(`${network}: data hash compute failed: ${e.message}`); }
    }
    if (!dep.type_script && cell.output && cell.output.type) {
      dep.type_script = { code_hash: cell.output.type.code_hash, hash_type: cell.output.type.hash_type, args: cell.output.type.args };
    }
  }
  // dep groups: cell_dep points at the group cell; code_cell must be resolved
  // to the real code cell via the group's OutPointVec members. Never fabricate.
  const isGroup = info.cellDeps && info.cellDeps[0] && info.cellDeps[0].depType === 'dep_group';
  if (isGroup && cell && cell.data && cell.data.content) {
    const members = parseGroupMembers(cell.data.content);
    if (members.length) {
      dep.code_cell = { index: members[0].index, tx_hash: members[0].tx_hash };
      dep.deploy_tx = members[0].tx_hash;
    }
  }
  if (dep.deploy_block == null) {
    try {
      const t = await CKB.rpc(rpcUrl, 'get_transaction', [op.txHash]);
      const n = t && t.tx_status && t.tx_status.block_number;
      if (n != null) dep.deploy_block = parseInt(n, 16);
    } catch (e) { warnings.push(`${network}: deploy_block lookup failed: ${e.message}`); }
  }
}

// ---- projection ----------------------------------------------------------

function projectDeployment(network, info, existing, warnings) {
  const op = info.cellDeps && info.cellDeps[0];
  const isGroup = op && op.depType === 'dep_group';
  const prev = (existing.deployments || []).find((d) => d.network === network) || {};
  const typeHashSet = L.isSet(info.typeHash);
  const hashType = typeHashSet ? 'type' : (info.hashType || (L.isSet(info.dataHash) ? 'data1' : prev.hash_type || null));
  if (!typeHashSet && L.isSet(info.dataHash) && !info.hashType && !prev.constant_source) {
    warnings.push(`${network}: ${DATA1_NOTE}`);
  }
  const directTx = op && !isGroup ? op.outPoint.txHash : null;
  const dep = {
    network,
    code_hash: typeHashSet ? info.typeHash : (L.isSet(info.dataHash) ? info.dataHash : prev.code_hash),
    hash_type: hashType,
    constant_source: prev.constant_source, // knowledge: never overwritten
    cell_dep: op ? { out_point: { index: op.outPoint.index, tx_hash: op.outPoint.txHash }, dep_type: op.depType } : prev.cell_dep,
    // dep groups: the code cell is NOT the group cell — resolve via RPC, else
    // omit. Never inherit prev values here: a stale group-cell address must not
    // persist pretending to be the code cell.
    code_cell: directTx ? { index: op.outPoint.index, tx_hash: directTx } : undefined,
    type_script: info.typeId
      ? { args: info.typeId.args, code_hash: info.typeId.codeHash, hash_type: info.typeId.hashType }
      : prev.type_script,
    data_hash: L.isSet(info.dataHash) ? info.dataHash : prev.data_hash,
    deploy_tx: directTx || undefined,
    deploy_block: prev.deploy_block, // rpc-fillable below / preserved
  };
  for (const k of Object.keys(dep)) if (dep[k] === undefined) delete dep[k];
  return dep;
}

function buildProjection(baseline, existing, warnings) {
  const { data } = baseline;
  const prev = existing || {};
  const prevSource = prev.source || {};
  const deployments = [];
  for (const network of ['mainnet', 'testnet']) {
    const info = data[network];
    if (!info) continue;
    deployments.push(projectDeployment(network, info, prev, warnings));
  }
  return {
    tags: prev.tags && prev.tags.length ? prev.tags : [data.scriptType].filter(Boolean),
    contributors: prev.contributors || [],
    source: {
      repo: prevSource.repo || (data.sourceUrl && data.sourceUrl.includes('github.com')
        ? data.sourceUrl.split('#')[0].replace(/\/blob\/.*$/, '').replace(/\/$/, '') : undefined),
      commit: prevSource.commit || null,
      paths: prevSource.paths || [],
      ...(prevSource.commit_note ? { commit_note: prevSource.commit_note } : {}),
      binary: prevSource.binary || { status: 'unverified', per: [], note: GEN_NOTE },
    },
    deployments,
    checked_at: TODAY,
  };
}

// keep human knowledge: never replace a non-empty old value with an empty new one
function mergePreserve(oldDoc, doc) {
  const out = { ...oldDoc, ...doc };
  for (const k of Object.keys(oldDoc)) {
    const o = oldDoc[k], n = doc[k];
    const empty = n == null || n === '' || (Array.isArray(n) && !n.length) ||
      (typeof n === 'object' && !Array.isArray(n) && !Object.keys(n).length);
    if (empty && (Array.isArray(o) ? o.length : typeof o === 'object' && o ? Object.keys(o).length : o)) out[k] = o;
  }
  const oldDep = (oldDoc.deployments || []);
  out.deployments = doc.deployments.map((d) => {
    const p = oldDep.find((x) => x.network === d.network) || {};
    const merged = { ...p, ...d };
    for (const k of Object.keys(p)) {
      if ((merged[k] == null || merged[k] === '') && p[k] != null && p[k] !== '') merged[k] = p[k];
    }
    // dep-group entries: when the projection cannot confirm the real code cell
    // (no RPC), omission must win over preservation — a stale group-cell
    // address is worse than an absent field
    if (merged.cell_dep && merged.cell_dep.dep_type === 'dep_group') {
      if (d.code_cell == null) delete merged.code_cell;
      if (d.deploy_tx == null) delete merged.deploy_tx;
    }
    return merged;
  });
  if (oldDoc.source) {
    out.source = { ...oldDoc.source, ...doc.source };
    for (const k of Object.keys(oldDoc.source)) {
      if ((out.source[k] == null || out.source[k] === '' || (Array.isArray(out.source[k]) && !out.source[k].length)) &&
          oldDoc.source[k] != null && oldDoc.source[k] !== '') out.source[k] = oldDoc.source[k];
    }
    if (oldDoc.source.binary && (!doc.source.binary || doc.source.binary.status === 'unverified')) {
      out.source.binary = oldDoc.source.binary;
    }
  }
  return out;
}

// ---- per-contract handling ------------------------------------------------

async function processOne(name, { rpcUrl, rpcNet, sync, check }) {
  const baseline = loadBaseline(name);
  const res = L.resolveFlowId(name, baseline.data);
  const id = res ? res.id : name;
  if (!L.SAFE_ID.test(id)) {
    // never let a crafted flowId become a path (e.g. '../../src/deployments')
    console.error(`REJECT ${name}: unsafe flow id "${id}" (whitelist: ${L.SAFE_ID})`);
    return { name, id, status: 'rejected', problems: [`unsafe flow id: ${id}`] };
  }
  const dir = path.join(L.FLOW_DIR, id);
  const metaFile = path.join(dir, 'meta.json');
  const existing = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : null;
  const warnings = [];
  const label = `${name} -> ${id}${res ? ` (${res.via})` : ' (new)'}`;

  if (check) {
    // read-only drift evaluation for BOTH upstream-owned and generated metas;
    // --check must never write anything (CI gate)
    const problems = [];
    if (existing) {
      for (const network of ['mainnet', 'testnet']) {
        const info = baseline.data[network];
        if (!info) continue;
        const dep = (existing.deployments || []).find((d) => d.network === network);
        if (dep) problems.push(...L.drift(info, dep));
        else problems.push(`${network}: missing in flow meta`);
      }
    } else {
      problems.push('flow meta missing (would be created outside --check)');
    }
    console.log(`${problems.length ? 'DRIFT ' : 'OK    '}${label}`);
    for (const p of problems) console.log(`       - ${p}`);
    return { name, id, status: problems.length ? 'drift' : 'ok', problems };
  }

  if (existing && !existing.generated_from && !sync) {
    // upstream-owned meta: report drift only, never write without --sync
    const problems = [];
    for (const network of ['mainnet', 'testnet']) {
      const info = baseline.data[network];
      if (!info) continue;
      const dep = (existing.deployments || []).find((d) => d.network === network);
      if (dep) problems.push(...L.drift(info, dep));
      else problems.push(`${network}: missing in upstream meta`);
    }
    console.log(`${problems.length ? 'DRIFT ' : 'OK    '}${label}`);
    for (const p of problems) console.log(`       - ${p}`);
    return { name, id, status: problems.length ? 'drift' : 'ok', problems };
  }

  const doc = buildProjection(baseline, existing, warnings);
  for (const dep of doc.deployments) {
    const info = baseline.data[dep.network];
    const url = (rpcNet && rpcNet[dep.network]) || rpcUrl;
    if (info && url) await rpcEnrich(url, dep.network, info, dep, warnings);
  }
  const final = existing ? mergePreserve(existing, doc) : doc;
  if (!existing) final.generated_from = `src/deployments/${name}.json`;
  if (existing && sync) {
    // syncing mechanical facts into an upstream-owned file must not claim ownership
    delete final.generated_from;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(metaFile, `${JSON.stringify(final, null, 2)}\n`);
  console.log(`${existing ? (sync ? 'SYNC  ' : 'REGEN ') : 'CREATE '}${label}${existing && !sync && existing.generated_from ? '' : ''}`);
  for (const w of warnings) console.log(`       ! ${w}`);
  return { name, id, status: existing ? 'updated' : 'created', warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const opts = { rpcUrl: null, rpcNet: {}, sync: false, check: false, names: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rpc') { opts.rpcUrl = args[++i]; opts.rpcNet = {}; }
    else if (args[i] === '--rpc-mainnet') opts.rpcNet.mainnet = args[++i];
    else if (args[i] === '--rpc-testnet') opts.rpcNet.testnet = args[++i];
    else if (args[i] === '--sync') opts.sync = true;
    else if (args[i] === '--check') opts.check = true;
    else if (args[i] === '--all') opts.names = listBaselineNames();
    else opts.names.push(args[i]);
  }
  if (!opts.names.length) {
    console.error('Usage: node scripts/gen-flow-meta.js [--all] [name ...] [--rpc URL | --rpc-mainnet URL --rpc-testnet URL] [--sync] [--check]');
    process.exit(1);
  }
  if (opts.sync && opts.check) { console.error('--sync and --check are mutually exclusive'); process.exit(1); }
  const results = [];
  for (const name of opts.names) {
    if (!fs.existsSync(path.join(DEPLOYMENTS_DIR, `${name}.json`))) {
      console.error(`unknown baseline: ${name}`); process.exit(1);
    }
    const r = await processOne(name, opts);
    results.push(r);
    if (r.status === 'rejected') process.exitCode = 1;
  }
  const drifted = results.filter((r) => r.status === 'drift').length;
  if (opts.check && drifted) process.exit(1);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { buildProjection, mergePreserve, projectDeployment, processOne, baselineHashes: L.baselineHashes };

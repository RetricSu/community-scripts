// Shared join/resolution layer between the canonical deployment baseline
// (src/deployments/*.json, security SSOT) and the vendored flow knowledge base
// (flow/contracts/<id>/, upstream ckb-contract-flow-html).
//
// Data ownership (see flow/NOTICE.md and README):
//   - baseline JSON  = minimal monitored facts, never enriched by adapters
//   - flow/contracts = knowledge base (spec/plugin/meta), upstream format kept
//   - merging happens only in build artifacts (portal), never in source data
'use strict';
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const FLOW_DIR = process.env.FLOW_DIR || path.join(ROOT, 'flow', 'contracts');

// Candidate aliases: our baseline name -> upstream flow id. Each alias is only
// trusted after a code_hash match against the upstream meta (see resolveFlowId);
// a failed verification falls back to creating a brand-new flow directory.
const ALIASES = {
  anyone_can_pay: 'acp',
  spore_cluster: 'cluster',
  secp256k1_blake160_multisig_all: 'multisig_legacy',
};

// flow ids become directory names and hrefs: strict whitelist everywhere
const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/;

const isSet = (h) => typeof h === 'string' && h.length > 2 && h !== '0x0';

/** code hash candidates declared by a baseline entry, per network. */
function baselineHashes(info) {
  const out = [];
  if (isSet(info.typeHash)) out.push({ hash: info.typeHash, hashType: 'type' });
  if (isSet(info.dataHash)) out.push({ hash: info.dataHash, hashType: info.hashType || null });
  return out;
}

function flowIds() {
  if (!fs.existsSync(FLOW_DIR)) return [];
  return fs.readdirSync(FLOW_DIR)
    .filter((d) => !d.startsWith('_') && SAFE_ID.test(d) && fs.statSync(path.join(FLOW_DIR, d)).isDirectory())
    .sort();
}

function loadMeta(id) {
  const p = path.join(FLOW_DIR, id, 'meta.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function loadSpec(id) {
  for (const n of ['spec.json', 'spec.yaml']) {
    const p = path.join(FLOW_DIR, id, n);
    if (!fs.existsSync(p)) continue;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
  }
  return null;
}

/** all code hashes declared by an upstream meta, regardless of network. */
function metaHashes(meta) {
  return (meta.deployments || [])
    .map((d) => d.code_hash)
    .filter(isSet);
}

/**
 * Resolve which flow directory a baseline entry belongs to.
 * Priority: explicit `flowId` field > verified alias > exact name > hash match.
 * Returns { id, via } or null when the contract is unknown to the flow KB.
 */
function resolveFlowId(name, deployment) {
  if (deployment.flowId) {
    // validated at the library boundary so no caller can forget the check
    return SAFE_ID.test(deployment.flowId) ? { id: deployment.flowId, via: 'flowId' } : null;
  }
  const candidates = [];
  if (ALIASES[name]) candidates.push({ id: ALIASES[name], via: 'alias' });
  if (flowIds().includes(name)) candidates.push({ id: name, via: 'name' });
  for (const c of candidates) {
    const meta = loadMeta(c.id);
    // no verifiable meta (missing/corrupt): the alias is NOT trusted — a name
    // collision without hash evidence must fall through to a fresh directory
    if (!meta) continue;
    const declared = new Set(metaHashes(meta));
    const ours = [deployment.mainnet, deployment.testnet]
      .filter(Boolean)
      .flatMap(baselineHashes)
      .map((h) => h.hash);
    if (ours.some((h) => declared.has(h))) return { id: c.id, via: c.via };
  }
  // last resort: hash match against every known flow contract
  const declared = new Set();
  for (const id of flowIds()) for (const h of metaHashes(loadMeta(id) || {})) declared.add(h);
  const ours = [deployment.mainnet, deployment.testnet]
    .filter(Boolean)
    .flatMap(baselineHashes)
    .map((h) => h.hash);
  const hit = ours.find((h) => declared.has(h));
  if (hit) {
    for (const id of flowIds()) {
      if (metaHashes(loadMeta(id) || {}).includes(hit)) return { id, via: 'code_hash' };
    }
  }
  return null;
}

/** mechanical drift between a baseline network info and a meta deployment. */
function drift(info, dep) {
  const problems = [];
  const ours = baselineHashes(info).map((h) => h.hash);
  if (isSet(dep.code_hash) && ours.length && !ours.includes(dep.code_hash)) {
    problems.push(`code_hash ${dep.code_hash} not in baseline (typeHash/dataHash)`);
  }
  const depOp = info.cellDeps && info.cellDeps[0] && info.cellDeps[0].outPoint;
  if (depOp && dep.cell_dep) {
    const same = dep.cell_dep.out_point.tx_hash === depOp.txHash &&
      String(parseInt(dep.cell_dep.out_point.index, 16)) === String(parseInt(depOp.index, 16));
    if (!same) problems.push(`cell_dep ${dep.cell_dep.out_point.tx_hash}:${dep.cell_dep.out_point.index} != baseline ${depOp.txHash}:${depOp.index}`);
  }
  return problems;
}

module.exports = {
  ALIASES, SAFE_ID, FLOW_DIR, ROOT, isSet, baselineHashes,
  flowIds, loadMeta, loadSpec, resolveFlowId, drift,
};

import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// The portal data layer is plain zero-dep CJS (like the vendored flow tool);
// require it after pointing FLOW_DIR / DEPLOYMENTS_DIR at temp fixtures.
function freshModules(flowDir: string, deploymentsDir: string) {
  process.env.FLOW_DIR = flowDir;
  process.env.DEPLOYMENTS_DIR = deploymentsDir;
  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}scripts${path.sep}`)) delete require.cache[key];
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lib = require('../scripts/flow-lib.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gen = require('../scripts/gen-flow-meta.js');
  return { lib, gen };
}

const HASH_A = `0x${'a'.repeat(64)}`;
const HASH_B = `0x${'b'.repeat(64)}`;
const TX_A = `0x${'c'.repeat(64)}`;
const TX_B = `0x${'d'.repeat(64)}`;

function tmpdirs() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'flow-test-'));
  const flow = path.join(base, 'contracts');
  const dep = path.join(base, 'deployments');
  fs.mkdirSync(flow, { recursive: true });
  fs.mkdirSync(dep, { recursive: true });
  return { base, flow, dep };
}

function writeMeta(flow: string, id: string, meta: unknown) {
  fs.mkdirSync(path.join(flow, id), { recursive: true });
  fs.writeFileSync(
    path.join(flow, id, 'meta.json'),
    JSON.stringify(meta, null, 2)
  );
}

function writeBaseline(dep: string, name: string, data: unknown) {
  fs.writeFileSync(
    path.join(dep, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
}

test('resolveFlowId: explicit flowId wins over everything', () => {
  const { flow, dep } = tmpdirs();
  writeBaseline(dep, 'sudt', { name: 'sudt', flowId: 'custom_id' });
  const { lib } = freshModules(flow, dep);
  assert.deepEqual(lib.resolveFlowId('sudt', { flowId: 'custom_id' }), {
    id: 'custom_id',
    via: 'flowId',
  });
});

test('resolveFlowId: alias is trusted only after code_hash match', () => {
  const { flow, dep } = tmpdirs();
  writeMeta(flow, 'acp', {
    deployments: [{ network: 'mainnet', code_hash: HASH_A }],
  });
  writeBaseline(dep, 'anyone_can_pay', {
    name: 'anyone_can_pay',
    mainnet: { dataHash: HASH_A, typeHash: '0x', cellDeps: [] },
  });
  const { lib } = freshModules(flow, dep);
  assert.deepEqual(lib.resolveFlowId('anyone_can_pay', {
    mainnet: { dataHash: HASH_A, typeHash: '0x', cellDeps: [] },
  }), { id: 'acp', via: 'alias' });

  // alias candidate fails hash verification -> falls through to null (new dir)
  const mismatch = {
    mainnet: { dataHash: HASH_B, typeHash: '0x', cellDeps: [] },
  };
  assert.equal(
    lib.resolveFlowId('anyone_can_pay', mismatch),
    null
  );
});

test('resolveFlowId: hash match finds the flow dir by code_hash alone', () => {
  const { flow, dep } = tmpdirs();
  writeMeta(flow, 'secp256k1_blake160', {
    deployments: [{ network: 'mainnet', code_hash: HASH_A }],
  });
  const baseline = {
    mainnet: { dataHash: '0x', typeHash: HASH_A, cellDeps: [] },
  };
  writeBaseline(dep, 'secp256k1_blake160_sighash_all', {
    name: 'secp256k1_blake160_sighash_all',
    ...baseline,
  });
  const { lib } = freshModules(flow, dep);
  assert.deepEqual(
    lib.resolveFlowId('secp256k1_blake160_sighash_all', baseline),
    { id: 'secp256k1_blake160', via: 'code_hash' }
  );
});

test('buildProjection maps baseline facts to meta deployment shape', () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'sudt',
    description: 'Simple UDT',
    sourceUrl: 'https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/README.md',
    scriptType: 'type',
    mainnet: {
      dataHash: HASH_A,
      typeHash: HASH_B,
      cellDeps: [{ depType: 'code', outPoint: { txHash: TX_A, index: '0x0' } }],
      typeId: {
        codeHash: HASH_B,
        hashType: 'type',
        args: `0x${'e'.repeat(64)}`,
      },
    },
  };
  writeBaseline(dep, 'sudt', baseline);
  const { gen } = freshModules(flow, dep);
  const doc = gen.buildProjection({ name: 'sudt', data: baseline }, null, []);
  const [m] = doc.deployments;
  assert.equal(m.network, 'mainnet');
  assert.equal(m.code_hash, HASH_B); // typeHash wins when set
  assert.equal(m.hash_type, 'type');
  assert.equal(m.data_hash, HASH_A);
  assert.equal(m.cell_dep.out_point.tx_hash, TX_A);
  assert.equal(m.code_cell.tx_hash, TX_A);
  assert.equal(m.type_script.code_hash, HASH_B);
  assert.equal(doc.source.repo, 'https://github.com/nervosnetwork/rfcs');
  assert.equal(doc.source.binary.status, 'unverified');
});

test('buildProjection: dataHash-only baseline still yields a code_hash', () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'dob_0',
    scriptType: 'type',
    mainnet: {
      dataHash: HASH_A,
      typeHash: '0x',
      cellDeps: [{ depType: 'code', outPoint: { txHash: TX_B, index: '0x1' } }],
    },
  };
  writeBaseline(dep, 'dob_0', baseline);
  const { gen } = freshModules(flow, dep);
  const doc = gen.buildProjection({ name: 'dob_0', data: baseline }, null, []);
  const [m] = doc.deployments;
  assert.equal(m.code_hash, HASH_A);
  assert.equal(m.hash_type, 'data1'); // inferred, documented as overridable
  assert.equal(m.cell_dep.out_point.index, '0x1');
});

test('mergePreserve: knowledge survives regen, mechanical facts update, never blanked', () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'sudt',
    scriptType: 'type',
    sourceUrl: 'https://github.com/nervosnetwork/rfcs',
    mainnet: {
      dataHash: HASH_A,
      typeHash: HASH_B,
      cellDeps: [{ depType: 'code', outPoint: { txHash: TX_A, index: '0x0' } }],
    },
  };
  writeBaseline(dep, 'sudt', baseline);
  const existing = {
    tags: ['token', 'nervos'],
    contributors: ['jjyr'],
    source: {
      repo: 'https://github.com/nervosnetwork/ckb-production-scripts',
      commit: 'e570c11aff3eca12a47237c21598429088c610d5',
      paths: ['c/simple_udt.c'],
      binary: {
        status: 'verified',
        per: [{ data_hash: HASH_A, evidence: ['reproducible build'], matches_commit: true }],
        note: 'verified by CI',
      },
    },
    deployments: [
      {
        network: 'mainnet',
        code_hash: HASH_B,
        hash_type: 'type',
        constant_source: 'RFC 0025',
        cell_dep: { out_point: { index: '0x0', tx_hash: TX_B }, dep_type: 'code' },
        code_cell: { index: '0x0', tx_hash: TX_B },
        type_script: { args: `0x${'e'.repeat(64)}`, code_hash: HASH_B, hash_type: 'type' },
        data_hash: HASH_A,
        deploy_tx: TX_B,
        deploy_block: 123456,
      },
    ],
    checked_at: '2026-01-01',
  };
  const { gen } = freshModules(flow, dep);
  const doc = gen.buildProjection({ name: 'sudt', data: baseline }, existing, []);
  const merged = gen.mergePreserve(existing, doc);
  // knowledge preserved
  assert.deepEqual(merged.tags, ['token', 'nervos']);
  assert.deepEqual(merged.contributors, ['jjyr']);
  assert.equal(merged.source.commit, 'e570c11aff3eca12a47237c21598429088c610d5');
  assert.equal(merged.source.binary.status, 'verified');
  // mechanical updated from baseline
  const [m] = merged.deployments;
  assert.equal(m.cell_dep.out_point.tx_hash, TX_A);
  assert.equal(m.deploy_tx, TX_A);
  // non-empty values never blanked
  assert.equal(m.constant_source, 'RFC 0025');
  assert.equal(m.deploy_block, 123456);
  assert.equal(m.type_script.args, `0x${'e'.repeat(64)}`);
});

test('buildProjection: dep_group entries never fabricate code_cell offline', () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'anyone_can_pay',
    scriptType: 'lock',
    mainnet: {
      dataHash: '0x',
      typeHash: HASH_B,
      cellDeps: [{ depType: 'dep_group', outPoint: { txHash: TX_A, index: '0x0' } }],
    },
  };
  writeBaseline(dep, 'anyone_can_pay', baseline);
  const { gen } = freshModules(flow, dep);
  const warnings: string[] = [];
  const doc = gen.buildProjection({ name: 'anyone_can_pay', data: baseline }, null, warnings);
  const [m] = doc.deployments;
  assert.equal(m.cell_dep.dep_type, 'dep_group');
  assert.equal(m.cell_dep.out_point.tx_hash, TX_A);
  assert.ok(!('code_cell' in m), 'code_cell must be omitted without RPC');
  assert.ok(!('deploy_tx' in m), 'deploy_tx must be omitted without RPC');
});

test('resolveFlowId: alias without verifiable meta is not trusted', () => {
  const { flow, dep } = tmpdirs();
  // dir exists but meta.json missing -> alias must fall through to null
  fs.mkdirSync(path.join(flow, 'acp'), { recursive: true });
  writeBaseline(dep, 'anyone_can_pay', {
    name: 'anyone_can_pay',
    mainnet: { dataHash: HASH_A, typeHash: '0x', cellDeps: [] },
  });
  const { lib } = freshModules(flow, dep);
  assert.equal(
    lib.resolveFlowId('anyone_can_pay', { mainnet: { dataHash: HASH_A, typeHash: '0x', cellDeps: [] } }),
    null
  );
});

test('resolveFlowId: explicit flowId is validated at the library boundary', () => {
  const { flow, dep } = tmpdirs();
  const { lib } = freshModules(flow, dep);
  assert.deepEqual(lib.resolveFlowId('x', { flowId: 'sudt' }), { id: 'sudt', via: 'flowId' });
  // path-escape attempt: rejected here, not just at the writer boundary
  assert.equal(lib.resolveFlowId('x', { flowId: '../../src/deployments' }), null);
  assert.equal(lib.resolveFlowId('x', { flowId: 'a b' }), null);
});

test('mergePreserve: dep-group stale code_cell never survives offline regen', () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'anyone_can_pay',
    scriptType: 'lock',
    mainnet: {
      dataHash: '0x',
      typeHash: HASH_B,
      cellDeps: [{ depType: 'dep_group', outPoint: { txHash: TX_A, index: '0x0' } }],
    },
  };
  writeBaseline(dep, 'anyone_can_pay', baseline);
  const stale = {
    deployments: [{
      network: 'mainnet', code_hash: HASH_B, hash_type: 'type',
      cell_dep: { out_point: { index: '0x0', tx_hash: TX_A }, dep_type: 'dep_group' },
      // stale fabrication: the GROUP cell pretending to be the code cell
      code_cell: { index: '0x0', tx_hash: TX_A },
      deploy_tx: TX_A,
    }],
    checked_at: '2026-01-01',
  };
  const { gen } = freshModules(flow, dep);
  const doc = gen.buildProjection({ name: 'anyone_can_pay', data: baseline }, stale, []);
  const merged = gen.mergePreserve(stale, doc);
  const [m] = merged.deployments;
  assert.ok(!('code_cell' in m), 'stale group-cell code_cell must be dropped');
  assert.ok(!('deploy_tx' in m), 'stale group-cell deploy_tx must be dropped');
  assert.equal(m.cell_dep.out_point.tx_hash, TX_A);
});

test('processOne --check is strictly read-only (generated and upstream metas)', async () => {
  const { flow, dep } = tmpdirs();
  const baseline = {
    name: 'sudt',
    scriptType: 'type',
    mainnet: {
      dataHash: HASH_A,
      typeHash: HASH_B,
      cellDeps: [{ depType: 'code', outPoint: { txHash: TX_A, index: '0x0' } }],
    },
  };
  writeBaseline(dep, 'sudt', baseline);
  const upstream = {
    deployments: [{
      network: 'mainnet', code_hash: HASH_B, hash_type: 'type',
      cell_dep: { out_point: { index: '0x0', tx_hash: TX_A }, dep_type: 'code' },
    }],
  };
  writeMeta(flow, 'sudt', upstream);
  const before = fs.readFileSync(path.join(flow, 'sudt', 'meta.json'), 'utf8');
  const { gen } = freshModules(flow, dep);
  await gen.processOne('sudt', { rpcUrl: null, sync: false, check: true });
  assert.equal(fs.readFileSync(path.join(flow, 'sudt', 'meta.json'), 'utf8'), before);

  // a generated meta (generated_from marker) must also stay untouched in --check:
  // create it first (no existing file), then verify --check does not rewrite it
  fs.rmSync(path.join(flow, 'sudt', 'meta.json'));
  const { gen: gen2 } = freshModules(flow, dep);
  await gen2.processOne('sudt', { rpcUrl: null, sync: false, check: false });
  const generated = fs.readFileSync(path.join(flow, 'sudt', 'meta.json'), 'utf8');
  assert.match(generated, /generated_from/);
  const { gen: gen3 } = freshModules(flow, dep);
  await gen3.processOne('sudt', { rpcUrl: null, sync: false, check: true });
  assert.equal(fs.readFileSync(path.join(flow, 'sudt', 'meta.json'), 'utf8'), generated);
});

test('drift: detects cell_dep mismatch between baseline and upstream meta', () => {
  const { flow, dep } = tmpdirs();
  const info = {
    dataHash: HASH_A,
    typeHash: HASH_B,
    cellDeps: [{ depType: 'code', outPoint: { txHash: TX_A, index: '0x0' } }],
  };
  const ok = {
    network: 'mainnet',
    code_hash: HASH_B,
    hash_type: 'type',
    cell_dep: { out_point: { index: '0x0', tx_hash: TX_A }, dep_type: 'code' },
  };
  const stale = {
    ...ok,
    cell_dep: { out_point: { index: '0x0', tx_hash: TX_B }, dep_type: 'code' },
  };
  const { lib } = freshModules(flow, dep);
  assert.deepEqual(lib.drift(info, ok), []);
  const problems = lib.drift(info, stale);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cell_dep/);
});

// contract: the optional `flowId` extension field must survive the upgrade
// writer's JSON round-trip (applyAuthorizedUpgrades rewrites baseline files)
test('flowId extension field survives applyAuthorizedUpgrades round-trip', async () => {
  const { dep } = tmpdirs();
  const entry = {
    name: 'sudt',
    description: 'Simple UDT',
    scriptType: 'type',
    flowId: 'sudt',
    mainnet: {
      dataHash: `0x${'a'.repeat(64)}`,
      typeHash: `0x${'b'.repeat(64)}`,
      cellDeps: [
        { depType: 'code', outPoint: { txHash: `0x${'c'.repeat(64)}`, index: '0x0' } },
      ],
    },
  };
  writeBaseline(dep, 'sudt', entry);
  const { Baseline } = await import('../src/engine/baseline');
  const { applyAuthorizedUpgrades } = await import('../src/engine/baseline-writer');
  const baseline = new Baseline(dep);
  const applied = applyAuthorizedUpgrades(
    baseline,
    [
      {
        scriptName: 'sudt',
        network: 'mainnet',
        oldOutPoint: { txHash: `0x${'c'.repeat(64)}`, index: '0x0' },
        status: 'upgraded',
        hops: [],
        authorized: true,
        latestOutPoint: { txHash: `0x${'d'.repeat(64)}`, index: '0x1' },
        latestDataHash: `0x${'e'.repeat(64)}`,
        latestTypeHash: `0x${'b'.repeat(64)}`,
      },
    ],
  );
  assert.equal(applied.length, 1);
  const after = JSON.parse(
    fs.readFileSync(path.join(dep, 'sudt.json'), 'utf8'),
  ) as typeof entry;
  assert.equal(after.flowId, 'sudt');
  assert.equal(after.mainnet.cellDeps[0].outPoint.txHash, `0x${'d'.repeat(64)}`);
  assert.equal(after.mainnet.dataHash, `0x${'e'.repeat(64)}`);
});

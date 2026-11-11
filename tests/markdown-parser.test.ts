import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectNetwork,
  parseDeploymentTables,
  parseFrontMatterId,
  tableToScriptInfo,
} from '../src/adapters/docs/markdown-table-parser';
import {
  parseDocsPage,
  resolveDocAlias,
} from '../src/adapters/docs/ckb-docs-adapter';
import { parseRfcDocument } from '../src/adapters/docs/rfcs-adapter';

const DOC = `---
id: omnilock
---
# Omnilock Script
## Script Deployed Info
### Mainnet
| parameter | value |
| --- | --- |
| code_hash | 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
| hash_type | type |
| tx_hash | 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb |
| index | 0x0 |
| dep_type | code |
### Testnet
| parameter | value |
| --- | --- |
| \`code_hash\` | \`0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\` |
| \`hash_type\` | \`type\` |
| \`tx_hash\` | \`0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd\` |
| \`index\` | \`0x1\` |
| \`dep_type\` | \`code\` |
`;

test('parses docs deployment tables and preserves underscored keys', () => {
  const tables = parseDeploymentTables(DOC);
  assert.equal(tables.length, 2);
  assert.deepEqual(
    tables.map((t) => t.network),
    ['mainnet', 'testnet']
  );
  assert.equal(tables[0].fields.code_hash, `0x${'a'.repeat(64)}`);
  assert.equal(tables[1].fields.dep_type, 'code');
  assert.equal(parseFrontMatterId(DOC), 'omnilock');
  const infos = parseDocsPage(DOC, '12-omnilock.mdx', 'https://example');
  assert.equal(infos.length, 2);
  assert.equal(infos[0].canonicalName, 'omnilock');
  assert.equal(infos[1].cellDeps?.[0].outPoint.index, '0x1');
});

test('handles RFC network aliases and section mappings', () => {
  const rfc = `## Locks\n### SECP256K1/blake160\n- Lina\n| parameter | value |\n| --- | --- |\n| code_hash | 0x${'a'.repeat(64)} |\n| hash_type | type |\n| tx_hash | 0x${'b'.repeat(64)} |\n| index | 0x0 |\n| dep_type | dep_group |\n- Aggron\n| parameter | value |\n| --- | --- |\n| code_hash | 0x${'c'.repeat(64)} |\n| hash_type | type |\n| tx_hash | 0x${'d'.repeat(64)} |\n| index | 0x1 |\n| dep_type | dep_group |\n`;
  const infos = parseRfcDocument(
    rfc,
    {
      path: 'fixture',
      sections: { 'SECP256K1/blake160': 'secp256k1_blake160_sighash_all' },
    },
    'https://rfc'
  );
  assert.equal(infos.length, 2);
  assert.deepEqual(
    infos.map((i) => i.network),
    ['mainnet', 'testnet']
  );
  assert.equal(infos[0].canonicalName, 'secp256k1_blake160_sighash_all');
});

test('maps multi-script docs sections and rejects ambiguous network labels', () => {
  assert.equal(resolveDocAlias('spore-protocol', 'Spore'), 'spore');
  assert.equal(resolveDocAlias('spore-protocol', 'Cluster'), 'spore_cluster');
  assert.equal(resolveDocAlias('nostr-lock', ''), 'nostr_lock');
  assert.equal(detectNetwork('Lina & Aggron'), undefined);
  assert.equal(detectNetwork('Pudge(testnet)'), 'testnet');
});

test('malformed deployment rows become missing fields instead of throwing', () => {
  const table = parseDeploymentTables(
    "- Mainnet\n| parameter | value |\n| --- | --- |\n| code_hash | nope |\n| tx_hash | 0x${'e'.repeat(64)} |\n| index | not-a-number |\n"
  )[0];
  assert.ok(table);
  const info = tableToScriptInfo(table, 'x', 'x', 'x');
  assert.ok(info);
  assert.equal(info.cellDeps, undefined);
});

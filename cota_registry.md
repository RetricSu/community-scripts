# CoTA Registry (deprecated) (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x90ca…9ac7 (type) · testnet 0x9302…8075 (type)

- id: `cota_registry` · type script · networks: mainnet, testnet · tags: nft, no-source, community
- links: page https://retricsu.github.io/community-scripts/cota_registry.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x90ca618be6c15f5857d3cbd09f9f24ca6770af047ba9ee70989ec3b229419ac7` · hash_type: `type`
- deployed in tx [`0x668921df2836e5ce4b3c41c626aab1ee3ef9bccfa4b527abcf28a61b166837ab`](https://explorer.nervos.org/transaction/0x668921df2836e5ce4b3c41c626aab1ee3ef9bccfa4b527abcf28a61b166837ab) (block 9455255) · data_hash `0x63d7d30b877bbe94692825e0ba587a44ac3a404655b5191110ac0cdee598aa7e` · type_id args `0x8b8c859723698f5fd38372b6eadb8f1b4aaa823169baec7c203ed9b269953f0b`

```json
{
  "script": { "code_hash": "0x90ca618be6c15f5857d3cbd09f9f24ca6770af047ba9ee70989ec3b229419ac7", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xabaa25237554f0d6c586dc010e7e85e6870bcfd9fb8773257ecacfbe1fd738a0", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075` · hash_type: `type`
- deployed in tx [`0x03ce5eabf7631c974efd4ec6a92e47024f266512eed91046f25f25bd4c91b3d7`](https://testnet.explorer.nervos.org/transaction/0x03ce5eabf7631c974efd4ec6a92e47024f266512eed91046f25f25bd4c91b3d7) (block 7572768) · data_hash `0x07f7a67b58ab7ffef08fd0d33fd6f0a1286081486963ac6181f21802949f0b4f` · type_id args `0x9abd4d12620abeef1bac3bcf8e328cdb8d1d7fb8320bb2ee01d62250868794b0`

```json
{
  "script": { "code_hash": "0x9302db6cc1344b81a5efee06962abcb40427ecfcbe69d471b01b2658ed948075", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x636a786001f87cb615acfcf408be0f9a1f077001f0bbc75ca54eadfe7e221713", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · cell carrying this type

```
Cell{
  type: { codeHash: {{0x90ca…9ac7}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- CKB Explorer registry description: "A Compact Token Aggregator Standard for Extremely Low Cost NFTs and FTs." Website https://www.cotadev.io; shares its dep_group with the CoTA type (already added as cota).
- nervina-labs/cota-smt is only the SMT library, not this type script's source.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · CoTA Registry (match only) · [0xde4fa3cda4a736c0fa2f1d5f9293607f21782c921340a55a2093f6c2a0cde5be](https://explorer.nervos.org/transaction/0xde4fa3cda4a736c0fa2f1d5f9293607f21782c921340a55a2093f6c2a0cde5be) · `node decode-tx.js 0xde4fa3cda4a736c0fa2f1d5f9293607f21782c921340a55a2093f6c2a0cde5be`

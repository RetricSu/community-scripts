# Stable++ Pool (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x2662…0055 (type)

- id: `stablepp_pool` · type script · networks: mainnet · tags: defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/stablepp_pool.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x26622198b66240e437e323e0fecf1c26ba3c8c28a45f03ed3ebb9f7f2bdc0055` · hash_type: `type`
- deployed in tx [`0xb22fd5c56a642f2e8447f7fb2bbd4faa85ce09ec9393113b9bdeec2b17cd4f95`](https://explorer.nervos.org/transaction/0xb22fd5c56a642f2e8447f7fb2bbd4faa85ce09ec9393113b9bdeec2b17cd4f95) (block 14230481) · data_hash `0x9cf12a6d0977e9e4aeec138ce2eb5b5ffa4ba0a659f119d773690a66d7d3665e` · type_id args `0xbf7d081d694251ac5075505957d85d3fee4ddb1e99faa50a24ac575350f23fa4`

```json
{
  "script": { "code_hash": "0x26622198b66240e437e323e0fecf1c26ba3c8c28a45f03ed3ebb9f7f2bdc0055", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb22fd5c56a642f2e8447f7fb2bbd4faa85ce09ec9393113b9bdeec2b17cd4f95", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · cell carrying this type

```
Cell{
  type: { codeHash: {{0x2662…0055}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- CKB Explorer registry: deploy tx 0xb22fd5c5…4f95 (index 0); no description. Mainnet only.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · Stable++ Pool (match only) · [0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258](https://explorer.nervos.org/transaction/0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258) · `node decode-tx.js 0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258`

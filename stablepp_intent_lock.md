# Stable++ Intent Lock (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x56fb…9733 (type)

- id: `stablepp_intent_lock` · lock script · networks: mainnet · tags: defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/stablepp_intent_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x56fb632a13abdad7308d2e034baae1cb049e8e8ff23cc7c0b69449f617549733` · hash_type: `type`
- deployed in tx [`0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977`](https://explorer.nervos.org/transaction/0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977) (block 14230368) · data_hash `0x73ece3c1a910e35d06459c934f5d3f2d4e80ed248c6cc2a8ef581ddf714a0332` · type_id args `0x4fdb6e35c4e72e60aa2a68c4e63195967983af2fae8636a5b56f2ef28a712fa5`

```json
{
  "script": { "code_hash": "0x56fb632a13abdad7308d2e034baae1cb049e8e8ff23cc7c0b69449f617549733", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0x56fb…9733}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- CKB Explorer registry description: "Stable++ Lock hosting pledge". Deployed in the same tx as Stable++ Asset, 0x8ec1081b…8977 (index 1). Mainnet only.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · Stable++ Intent Lock (match only) · [0x8e1984dc4bb9a43e52d2600a6e6240b70c79091b73894afd7d947fe02677cfb1](https://explorer.nervos.org/transaction/0x8e1984dc4bb9a43e52d2600a6e6240b70c79091b73894afd7d947fe02677cfb1) · `node decode-tx.js 0x8e1984dc4bb9a43e52d2600a6e6240b70c79091b73894afd7d947fe02677cfb1`

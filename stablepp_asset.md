# Stable++ Asset (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x26a3…032b (type)

- id: `stablepp_asset` · type script · networks: mainnet · tags: token, defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/stablepp_asset.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x26a33e0815888a4a0614a0b7d09fa951e0993ff21e55905510104a0b1312032b` · hash_type: `type`
- deployed in tx [`0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977`](https://explorer.nervos.org/transaction/0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977) (block 14230368) · data_hash `0xec32ad0c478ab011f9d089a900f3d06c91338a1954e45d9d8152c74859f99945` · type_id args `0x953400cc4c55f1b0623faca8d90c5257eaa449a7d22179b5178d67fbf7f51bc2`

```json
{
  "script": { "code_hash": "0x26a33e0815888a4a0614a0b7d09fa951e0993ff21e55905510104a0b1312032b", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · cell carrying this type

```
Cell{
  type: { codeHash: {{0x26a3…032b}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- CKB Explorer registry: website https://www.stablepp.xyz/stablecoin; deploy tx 0x8ec1081b…8977 (index 0). Mainnet only.
- Its binary data hash differs from xUDT, so xUDT rules cannot be assumed.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · Stable++ Asset (match only) · [0xf981edbf077a6782bbd18a98da76d38d70a4514cc79b5e838caaa5806bb8b90f](https://explorer.nervos.org/transaction/0xf981edbf077a6782bbd18a98da76d38d70a4514cc79b5e838caaa5806bb8b90f) · `node decode-tx.js 0xf981edbf077a6782bbd18a98da76d38d70a4514cc79b5e838caaa5806bb8b90f`

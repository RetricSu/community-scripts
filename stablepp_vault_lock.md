# Stable++ Vault Lock (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0xff35…2e67 (type) · mainnet 0x4ed6…8675 (type)

- id: `stablepp_vault_lock` · lock script · networks: mainnet · tags: defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/stablepp_vault_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06) (named "Stable++ Vault Lock")

- code_hash: `0xff352022029a6ecf03e8a838b979a46e1231f05f9a3df9b4198f7eeb4afc2e67` · hash_type: `type`
- deployed in tx [`0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5`](https://explorer.nervos.org/transaction/0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5) (block 14230376) · data_hash `0x3e947c0a671772f4a711e11641905405ed8876264776a75c5498733e22d7b6d8` · type_id args `0xc602c66b23779d27ff18164b51e6923f2e53d8ebeff98fa79d87612f923e26f4`

```json
{
  "script": { "code_hash": "0xff352022029a6ecf03e8a838b979a46e1231f05f9a3df9b4198f7eeb4afc2e67", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5", "index": "0x0" }, "dep_type": "code" }
}
```

### mainnet — nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74 (named "Stable++ Vault Lock")

- code_hash: `0x4ed68fcb7eaa4ff78d46a2fad88a32ce9caffd4b96a0a4bba96ff4871f018675` · hash_type: `type`
- deployed in tx [`0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5`](https://explorer.nervos.org/transaction/0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5) (block 14230376) · data_hash `0xa862f491d2ebe8a13c0a3cd677c18223090fa534e3799e63698bda8815864da4` · type_id args `0x6f02a48850de189f7384229098620585f3af7bb1447fdf05370c535ae94cdcfa`

```json
{
  "script": { "code_hash": "0x4ed68fcb7eaa4ff78d46a2fad88a32ce9caffd4b96a0a4bba96ff4871f018675", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8dae0c83d77b7349f390d967b254e8329177b5c8c0e6da97c4a51efcca958ef5", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0xff35…2e67}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- Official sources disagree: the Explorer API names 0xff35…2e67 Vault Lock, while the Explorer frontend constants and backend migration name 0x4ed6…8675 Vault Lock. Both come from deploy tx 0x8dae0c83…8ef5 (index 0 / 1) and are different binaries. This plugin matches both; which is which is unconfirmed with the maintainer.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · Stable++ Vault Lock 0xff35 (match only) · [0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258](https://explorer.nervos.org/transaction/0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258) · `node decode-tx.js 0xbca59dcdbfb11390fce0eac7da054d2e74f923b294a5bf7cc18a62899a3af258`
- mainnet · Stable++ Vault Lock 0x4ed6 (match only) · [0xb3fb078460a56a15f578084449b7462e317543bbfdc1266c5f600c91a1530f3c](https://explorer.nervos.org/transaction/0xb3fb078460a56a15f578084449b7462e317543bbfdc1266c5f600c91a1530f3c) · `node decode-tx.js 0xb3fb078460a56a15f578084449b7462e317543bbfdc1266c5f600c91a1530f3c`

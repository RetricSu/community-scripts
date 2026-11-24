# UTXOSwap Intent Lock (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x3547…060e (type) · testnet 0x4e9c…e101 (type)

- id: `utxoswap_intent_lock` · lock script · networks: mainnet, testnet · tags: defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/utxoswap_intent_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, mainnet)

- code_hash: `0x3547c9aa563804e47ba3ebd37e6012e447c91a238f7aa71b1a75319f11df060e` · hash_type: `type`
- deployed in tx [`0x5292c77c62f108e3a33e54ed3bdcc4457a9d7d88be0c6ef3c1811f473394e2f7`](https://explorer.nervos.org/transaction/0x5292c77c62f108e3a33e54ed3bdcc4457a9d7d88be0c6ef3c1811f473394e2f7) (block 13363511) · data_hash `0x6fb9173d1dae0d686030ec24889c754d15f18c7e87c7d92c4a1431621054e7b9` · type_id args `0xec95c7af1ec752c01282df5a94c756b617070be0d72a685ad8faa7e58650fbe5`

```json
{
  "script": { "code_hash": "0x3547c9aa563804e47ba3ebd37e6012e447c91a238f7aa71b1a75319f11df060e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5292c77c62f108e3a33e54ed3bdcc4457a9d7d88be0c6ef3c1811f473394e2f7", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — on chain: lock of the user intent cell consumed together with the Pool Cell (UTXOSwap docs tx layout, testnet)

- code_hash: `0x4e9c30c8d6ce275740fbe69eae49c3d8c213578c5bd066f4938fe3c7dec6e101` · hash_type: `type`
- deployed in tx [`0xad80b3b20c1ce63f2b0863c1ef697a98184dfee1158e623de6a132d271f01e76`](https://testnet.explorer.nervos.org/transaction/0xad80b3b20c1ce63f2b0863c1ef697a98184dfee1158e623de6a132d271f01e76) (block 13407059) · data_hash `0x04a2dd40c570d9cbfb8ed71550830d92e2b39b713c1ad2e30d5ad4d1e2f8a72b` · type_id args `0x490d25dc5e63d7bde3702b3d82ed867ba6d8bf418fd2a6e2e17ebff8e8e75540`

```json
{
  "script": { "code_hash": "0x4e9c30c8d6ce275740fbe69eae49c3d8c213578c5bd066f4938fe3c7dec6e101", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xad80b3b20c1ce63f2b0863c1ef697a98184dfee1158e623de6a132d271f01e76", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0x3547…060e}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- Official UTXOSwap docs: user assets first go into a cell under the intent lock; the sequencer spends it together with the Pool Cell and returns the result to the user lock. This code_hash is the lock of the user intent cell spent in the same tx as the Pool Cell on chain; the role is inferred from that layout and unconfirmed with the maintainer.
- The list says "Intent Lock (deprecated)", yet this code_hash is still used in recent pool txs. Whether an older, deprecated intent lock exists could not be confirmed from an official source.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · UTXOSwap intent (match only) · [0x97b80479a482f6669b619295d49dcb21b8eba1bfc860219c6b70e5ebd677dce0](https://explorer.nervos.org/transaction/0x97b80479a482f6669b619295d49dcb21b8eba1bfc860219c6b70e5ebd677dce0) · `node decode-tx.js 0x97b80479a482f6669b619295d49dcb21b8eba1bfc860219c6b70e5ebd677dce0`
- testnet · UTXOSwap intent testnet (match only) · [0x49e3c87566c497d4d2e5fe455e007ba7222976fb04aa1f340a98ee23368caaa6](https://testnet.explorer.nervos.org/transaction/0x49e3c87566c497d4d2e5fe455e007ba7222976fb04aa1f340a98ee23368caaa6) · `node decode-tx.js 0x49e3c87566c497d4d2e5fe455e007ba7222976fb04aa1f340a98ee23368caaa6 --testnet`

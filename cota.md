# CoTA

- id: `cota` · type script · networks: mainnet, testnet · tags: nft, no-source, community
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source
- on-chain data checked: 2026-10-20

## Deployments

### mainnet — ccc KnownScript.COTA

- code_hash: `0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df` · hash_type: `type`
- deployed in tx [`0x668921df2836e5ce4b3c41c626aab1ee3ef9bccfa4b527abcf28a61b166837ab`](https://explorer.nervos.org/transaction/0x668921df2836e5ce4b3c41c626aab1ee3ef9bccfa4b527abcf28a61b166837ab) (block 9455255) · data_hash `0xeafc5d23a45ce68e5fd9e50cfb85664c5832519292577caf9a51bdde6c5729b3` · type_id args `0x23423612c4306f729dbe688c0621ca311ffc381047b2875691bfea766166475f`

```json
{
  "script": { "code_hash": "0x1122a4fb54697cf2e6e3a96c9d80fd398a936559b90954c6e88eb7ba0cf652df", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x875db3381ebe7a730676c110e1c0d78ae1bdd0c11beacb7db4db08e368c2cd95", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — ccc KnownScript.COTA

- code_hash: `0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8` · hash_type: `type`
- deployed in tx [`0x03ce5eabf7631c974efd4ec6a92e47024f266512eed91046f25f25bd4c91b3d7`](https://testnet.explorer.nervos.org/transaction/0x03ce5eabf7631c974efd4ec6a92e47024f266512eed91046f25f25bd4c91b3d7) (block 7572768) · data_hash `0xc62a0a74809b40a7be31a62143efb556c78ffeacf4b7ce734dd317b04359101d` · type_id args `0xcf5e302f8cc35989d0372de33a763039e0ef2a8436fccd8f26b2ce4801a8cd9f`

```json
{
  "script": { "code_hash": "0x89cd8003a0eaf8e65e0c31525b7d1d5c1becefd2ea75bb4cff87810ae37764d8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xec82a5668238bea872bd9beb865fdf33568478b4a12057776bf1cb392a47ecb2", "index": "0x0" }, "dep_type": "dep_group" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

## Example transactions

- mainnet · CoTA (match only) · [0xc009694a9edc5ba4eed280cab25a4d14ead4eafce323af0f4a67b7aef66b4fef](https://explorer.nervos.org/transaction/0xc009694a9edc5ba4eed280cab25a4d14ead4eafce323af0f4a67b7aef66b4fef) · `node decode-tx.js 0xc009694a9edc5ba4eed280cab25a4d14ead4eafce323af0f4a67b7aef66b4fef`

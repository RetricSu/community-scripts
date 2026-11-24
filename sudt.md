# sUDT (Simple UDT) Contract Constraints

> Source: RFC 0025 Simple UDT · implementation ckb-production-scripts/c/simple_udt.c@e570c11 · Lina code_hash 0x5e7a…cfd5, hash_type type

- id: `sudt` · type script · networks: mainnet, testnet · tags: token, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/sudt.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-production-scripts@e570c11a](https://github.com/nervosnetwork/ckb-production-scripts/tree/e570c11aff3eca12a47237c21598429088c610d5) · [c/simple_udt.c](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/simple_udt.c) (pinned in the plugin header)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — RFC 0025

- code_hash: `0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5` · hash_type: `type`
- deployed in tx [`0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5`](https://explorer.nervos.org/transaction/0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5) (block 2624950) · data_hash `0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419` · type_id args `0xcf37df53ec0eb890937879ad5587521f737dc3d95eb1c22194b958ecbcf39a8b`

```json
{
  "script": { "code_hash": "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — RFC 0025

- code_hash: `0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4` · hash_type: `type`
- deployed in tx [`0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769`](https://testnet.explorer.nervos.org/transaction/0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769) (block 586297) · data_hash `0xe1e354d6d643ad42724d40967e334984534e0367405c5ae42a9d7d63d77df419` · type_id args `0x4db75e03349f4f2ec792476035dd1b7376c683130f7e2e74024be2d9ee064511`

```json
{
  "script": { "code_hash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → N` Issue / Mint (owner mode)

**Input** · some input: owner cell

```
Cell{
  lock: {{hash(lock) == sUDT.args}},
  type: any
}
```

**Output** · output: sUDT cell

```
Cell{
  lock: any,
  type: { codeHash: sUDT, args: {{owner lock hash (32B)}} },
  data: {{amount: u128 LE (first 16 bytes)}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type.args | exactly 32 bytes (owner lock script hash) | -1 |
| owner mode | if any input's lock hash == args, the script succeeds immediately without checking amounts |  |

### 2. `N → M` Transfer / Burn

**Input** · inputs: sUDT cells (same type)

```
Cell{
  lock: user lock,
  type: { codeHash: sUDT, args: owner hash },
  data: {{amount_in (u128 LE)}}
}
```

**Output** · outputs: sUDT cells (same type)

```
Cell{
  lock: any,
  type: { codeHash: sUDT, args: owner hash },
  data: {{amount_out (u128 LE)}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | length ≥ 16 bytes; first 16 bytes are the u128 LE amount | -2 |
| Σ amount | summation must not overflow u128 | -51 |
| Σ amount_in | ≥ Σ amount_out (the difference is burned) | -52 |
| lock | not restricted by sUDT; user-defined |  |

## Notes

- Other error codes: -3 ERROR_SYSCALL, -21 ERROR_SCRIPT_TOO_LONG (from simple_udt.c)

## Example transactions

- mainnet · sUDT · [0xf7e4ead2242e204ff2e4797e6f3170dc289445593127896099867bacc0c01ecb](https://explorer.nervos.org/transaction/0xf7e4ead2242e204ff2e4797e6f3170dc289445593127896099867bacc0c01ecb) · `node decode-tx.js 0xf7e4ead2242e204ff2e4797e6f3170dc289445593127896099867bacc0c01ecb`

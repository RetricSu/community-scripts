# Cells price cell (price-cell-type) Constraints

> Source: LusoCryptoLabs/cells-contracts @34dad3c / contracts/price-cell-type/src/main.rs + cells-core　·　mainnet 0x97bf…d4f9 / testnet 0xe105…4294 (type, cellula-sdk)

- id: `cells_price_type` · type script · networks: mainnet, testnet · tags: identity, open-source, community, p-cells
- links: page https://retricsu.github.io/community-scripts/cells_price_type.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [LusoCryptoLabs/cells-contracts@6d29dab2](https://github.com/LusoCryptoLabs/cells-contracts/tree/6d29dab2770fa0980e13b9cbeefff0c844ef4101) · [contracts/price-cell-type/src/main.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/contracts/price-cell-type/src/main.rs) · [crates/cells-core/src/lib.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/crates/cells-core/src/lib.rs) (commit read after #5 plain-payment fix (2026-11-06 mainnet upgrade); docs/TRUST.md hashes)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-09
- contributors: [@LusoCryptoLabs](https://github.com/LusoCryptoLabs)

## Deployments

### mainnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.price; cells-contracts docs/TRUST.md

- code_hash: `0x97bf5f760cf72f918f13704d7184933b79d4ddc1fd85075762373e531152d4f9` · hash_type: `type`
- deployed in tx [`0xb3d2428eb96ff9ebbb77e9b3d73ce97118e847bbb2b8f9f86ec1cc7e8f3432b1`](https://explorer.nervos.org/transaction/0xb3d2428eb96ff9ebbb77e9b3d73ce97118e847bbb2b8f9f86ec1cc7e8f3432b1) (block 20515925) · data_hash `0x238e74e1d2d5bf8f06f9f4b0bb352c2addd531351a45cfeddf3ff5f6f5662342` · type_id args `0x0ed09c9930e2eda76674e930007057f4ec66309b3cb7de2a263f4b38fcb6f8b4`

```json
{
  "script": { "code_hash": "0x97bf5f760cf72f918f13704d7184933b79d4ddc1fd85075762373e531152d4f9", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb3d2428eb96ff9ebbb77e9b3d73ce97118e847bbb2b8f9f86ec1cc7e8f3432b1", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.price

- code_hash: `0xe1057caf161b3c720fcdb80190e89c6efc36b6b4256b3c99635fda63a9dd4294` · hash_type: `type`
- deployed in tx [`0xec7c0690466942c6a75c6de0eec3e544505e3b77bf131847f233f01c26565c77`](https://testnet.explorer.nervos.org/transaction/0xec7c0690466942c6a75c6de0eec3e544505e3b77bf131847f233f01c26565c77) (block 22395053) · data_hash `0x238e74e1d2d5bf8f06f9f4b0bb352c2addd531351a45cfeddf3ff5f6f5662342` · type_id args `0x6c1931c4dfcb37f1051f57d8c51009faa4fc34318737f50b4748671a41d2eba7`

```json
{
  "script": { "code_hash": "0xe1057caf161b3c720fcdb80190e89c6efc36b6b4256b3c99635fda63a9dd4294", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xec7c0690466942c6a75c6de0eec3e544505e3b77bf131847f233f01c26565c77", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create

**Input** · tx.inputs[0]

```
any cell (for the type id)
```

**Output** · price cell

```
Cell{
  type: { codeHash: PRICE_TYPE, hashType: type,
          args: {{blake2b(inputs[0] ‖ index u64 LE) 32B}} },
  data: {{0x01 ‖ bps u32 LE}}
}
```

byte layout: data (5 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | data version | = 0x01 | 6 |
| 1 | factor | 4B LE u32 | discount factor in basis points, multiplies the whole fee schedule | 126 ≤ bps ≤ 10000 | 6 |

Example:

- data: `0x{{01}}{{10270000}}  ← 0x2710 = 10000 bps (full price)`
- data: `0x{{01}}{{a00f0000}}  ← 4000 bps = 40%`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| outputs | exactly 1 price cell output | 3 |
| data | 5 bytes, version 1, 126–10000 | 6 |
| args | = 32-byte type id | 2 |

### 2. `1 → 1` Update

**Input** · price cell

```
Cell{ type: PRICE_TYPE(id), data: old, since: {{relative ts ≥ 21600 s}} }
```

**Output** · price cell′

```
Cell{ lock: {{same}}, capacity: {{≥ old}}, type: same, data: {{new}} }
```

byte layout: data (5 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | data version | = 0x01 | 6 |
| 1 | factor | 4B LE u32 | discount factor in basis points, multiplies the whole fee schedule | 126 ≤ bps ≤ 10000 | 6 |

Example:

- data: `0x{{01}}{{10270000}}  ← 0x2710 = 10000 bps (full price)`
- data: `0x{{01}}{{a00f0000}}  ← 4000 bps = 40%`

byte layout: since

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | flags | 1B | 0xC0 = relative + timestamp | = 0xC0 | 8 |
| 1 | seconds | 7B | seconds since last update | ≥ 21600 | 8 |

Example:

- since: `0x{{c0}}00000000005460  ← 0x5460 = 21600 s`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | exactly 1 in 1 out (never destroyed / duplicated) | 3 |
| lock | unchanged | 4 |
| capacity | not reduced | 5 |
| data | old and new valid | 6 |
| factor | new×16 ∈ [old×15, old×17] (≤ 1/16 per step) | 7 |
| since | relative timestamp (0xC0) ≥ 21,600 s (6 h) | 8 |

## Notes

- Error codes: 1 Encoding, 2 BadArgs, 3 Arity, 4 LockChanged, 5 CapacityShrunk, 6 BadData, 7 Step, 8 Cooldown (enum comments say “a quarter / a day”; the actual constants are 1/16 and 6 h)
- account-cell-type finds this cell in cell deps by a compiled-in type hash (mainnet 0x3f1c…7586); missing or malformed means full price.

## Example transactions

- mainnet · price cell creation · [0xd77bbbc904afa4dfbeb826138c09baee3902ccf84937d8bce4d8e30ba0e7b251](https://explorer.nervos.org/transaction/0xd77bbbc904afa4dfbeb826138c09baee3902ccf84937d8bce4d8e30ba0e7b251) · `node decode-tx.js 0xd77bbbc904afa4dfbeb826138c09baee3902ccf84937d8bce4d8e30ba0e7b251`
- mainnet · price cell update · [0x9b9e31c549433b71cda56bc7b55d1f1c43148726037258f1d85cc12c95a3aff0](https://explorer.nervos.org/transaction/0x9b9e31c549433b71cda56bc7b55d1f1c43148726037258f1d85cc12c95a3aff0) · `node decode-tx.js 0x9b9e31c549433b71cda56bc7b55d1f1c43148726037258f1d85cc12c95a3aff0`

# NervosDAO Contract Constraints

> Source: ckb-system-scripts / c/dao.c　·　DAO = type script (code_hash 0x82d7…3f2e, hash_type type)

- id: `nervos_dao` · type script · networks: mainnet, testnet · tags: system, defi, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/nervos_dao.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-system-scripts@72eb92fc](https://github.com/nervosnetwork/ckb-system-scripts/tree/72eb92fca090700dcb398cd8cad8fbd8bad40355) · [c/dao.c](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/dao.c) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@xxuejie](https://github.com/xxuejie)

## Deployments

### mainnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e` · hash_type: `type`
- deployed in tx [`0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c`](https://explorer.nervos.org/transaction/0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c) (block 0) · data_hash `0x32064a14ce10d95d4b7343054cc19d73b25b16ae61a6c681011ca781a60c7923` · type_id args `0xb2a8500929d6a1294bf9bf1bf565f549fa4a5f1316a3306ad3d4783e64bcf626`

```json
{
  "script": { "code_hash": "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c", "index": "0x2" }, "dep_type": "code" }
}
```

### testnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e` · hash_type: `type`
- deployed in tx [`0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f`](https://testnet.explorer.nervos.org/transaction/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f) (block 0) · data_hash `0x32064a14ce10d95d4b7343054cc19d73b25b16ae61a6c681011ca781a60c7923` · type_id args `0xb2a8500929d6a1294bf9bf1bf565f549fa4a5f1316a3306ad3d4783e64bcf626`

```json
{
  "script": { "code_hash": "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f", "index": "0x2" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Deposit

**Input** · input (any normal cell)

```
Cell{
  capacity: …,
  type: null
}
```

**Output** · output[j]: deposit cell

```
Cell{
  capacity: X,
  lock: any,
  type: { codeHash: DAO, args: {{0x}} },
  data: {{0x0000000000000000}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type.args | must be empty | -2 |
| data | exactly 8 bytes, all zero | -19 |
| Σ output capacity | ≤ Σ input capacity | -15 |

### 2. `1 → 1` Withdraw Phase 1

**Input** · input[i]: deposit cell (in block D)

```
Cell{
  capacity: X,
  type: { codeHash: DAO, args: 0x },
  data: 0x0000000000000000
}
```

**Output** · output[{{i}}]: withdrawing cell

```
Cell{
  capacity: {{X}},
  lock: any,
  type: {{{ codeHash: DAO, args: 0x }}},
  data: {{D.number (u64 LE)}}
}
```

**Also**

- header_deps: [ {{D}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| index | the output must be at the same index i as the deposit input |  |
| type | same DAO script as the input | -20 |
| capacity | exactly equal to the input | -20 |
| data | 8-byte u64 LE equal to block number of D | -20 |
| header_deps | must include the hash of block D |  |
| lock | not checked by dao.c (note: the CKB node may require the same lock size; unverified) |  |

### 3. `1 → 0` Withdraw Phase 2

**Input** · input[i]: withdrawing cell (in block W)

```
Cell{
  capacity: X,
  type: { codeHash: DAO, args: 0x },
  data: D.number,
  since: {{≥ lock period (absolute epoch)}}
}
```

**Input** · witness[i]

```
WitnessArgs{
  lock: signature,
  input_type: {{k (u64 LE, 8 bytes)}}
}
```

**Output** · outputs: any cells

```
Cell{
  capacity: {{Σ ≤ limit}},
  lock: any,
  type: any
}
```

**Also**

- header_deps: [ {{W}}, …, {{D (at index k)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness.input_type | 8 bytes; value is k, the index of D in header_deps | -11 |
| header_deps | contains D and W; D's block number must equal data, and W's epoch must be later than D's | -14 |
| since | absolute epoch, and ≥ D.epoch + ⌈deposited epochs / 180⌉ × 180 | -17 |
| Σ output capacity | ≤ normal inputs + Σ max withdraw | -15 |
| max withdraw | = occupied + (X − occupied) × AR_W / AR_D (note: AR is read from the header's dao field) |  |

## Example transactions

- mainnet · DAO phase 2 · [0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb](https://explorer.nervos.org/transaction/0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb) · `node decode-tx.js 0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb`
- mainnet · DAO phase 1 · [0x44d70abd4ed8c73c9ec7a6039aa1e35a22ef1455758c45b70bfef5a5fce93838](https://explorer.nervos.org/transaction/0x44d70abd4ed8c73c9ec7a6039aa1e35a22ef1455758c45b70bfef5a5fce93838) · `node decode-tx.js 0x44d70abd4ed8c73c9ec7a6039aa1e35a22ef1455758c45b70bfef5a5fce93838`

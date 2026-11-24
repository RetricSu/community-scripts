# xUDT (Extensible UDT) Contract Constraints

> Source: RFC 0052 · ckb-production-scripts/c/xudt_rce.c (master) + c/rce.h error codes　·　Mirana code_hash 0x50bd…1b95, hash_type data1

- id: `xudt` · type script · networks: mainnet, testnet · tags: token, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/xudt.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-production-scripts@26b0b4f1](https://github.com/nervosnetwork/ckb-production-scripts/tree/26b0b4f15bb6eeb268b70d7ae006e244b7c06649) · [c/xudt_rce.c](https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/c/xudt_rce.c) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — RFC 0052 (Mirana & Pudge)

- code_hash: `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95` · hash_type: `data1`
- deployed in tx [`0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7`](https://explorer.nervos.org/transaction/0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7) (block 11922670) · data_hash `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95`

```json
{
  "script": { "code_hash": "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — RFC 0052 (Mirana & Pudge)

- code_hash: `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95` · hash_type: `data1`
- deployed in tx [`0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f`](https://testnet.explorer.nervos.org/transaction/0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f) (block 8497330) · data_hash `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95` · type_id args `0x44ec8b96663e06cc94c8c468a4d46d7d9af69eaf418f6390c9f11bb763dda0ae`

```json
{
  "script": { "code_hash": "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ccc clientPublicTestnet.advanced.ts (type_id deployment of xUDT)

- code_hash: `0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb` · hash_type: `type`
- deployed in tx [`0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f`](https://testnet.explorer.nervos.org/transaction/0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f) (block 8497330) · data_hash `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95` · type_id args `0x44ec8b96663e06cc94c8c468a4d46d7d9af69eaf418f6390c9f11bb763dda0ae`

```json
{
  "script": { "code_hash": "0x25c29dc317811a6f6f3985a7a9ebc4838bd388d19d0feeecf0bcd60f6c0975bb", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xbf6fb538763efec2a70a6a3dcb7242787087e1030c4e7d86585bc63a9d337f5f", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → N` Issue / Mint (owner mode)

**Input** · some input: owner

```
Cell{
  lock: {{hash(lock) == args[0..32]}}   // default
  // flags 0x80000000: input type hash also accepted
  // flags 0x40000000: output type hash also accepted
  // flags 0x20000000: disables the input-lock method
}
```

**Output** · output: xUDT cell

```
Cell{
  type: { codeHash: xUDT,
          args: {{owner lock hash 32B}} {{[flags u32 LE] [extension data]}} },
  data: {{amount u128 LE (16B)}} [extension data]
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type.args | ≥ 32 bytes | -1 |
| owner mode | when any enabled owner condition holds, the amount check is skipped (extension scripts still run) |  |

### 2. `N → M` Transfer / Burn

**Input** · inputs: xUDT cells (same type)

```
Cell{
  type: { codeHash: xUDT, args: … },
  data: {{amount_in u128 LE}}
}
```

**Output** · outputs: xUDT cells (same type)

```
Cell{
  type: { codeHash: xUDT, args: … },
  data: {{amount_out u128 LE}}
}
```

byte layout: type.args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owner lock hash | 32B | hash used for owner checks | ≥ 32B | -1 |
| 1 | flags | 4B u32 LE (optional) | low bits: 0 no extension / 1 extensions in args / 2 extensions in witness; top 3 bits: owner-mode switches | ∈ {0,1,2} after masking owner bits | 44 |
| 2 | extension data | variable | flags=1: ScriptVec; flags=2: 20-byte blake160 of the ScriptVec in the witness | flags=1 length must match the ScriptVec; flags=2 must be 20 bytes and the hash must match | 45 / 44 / 49 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | length ≥ 16 bytes; first 16 bytes are u128 LE | -2 |
| Σ amount | summation must not overflow | -51 |
| Σ amount_in | ≥ Σ amount_out (non-owner mode) | -52 |
| extension scripts | each extension script's validate must return 0 (note: error codes depend on the extension) |  |

## Notes

- Numeric error codes come from the c/rce.h enum (ERROR_INVALID_FLAG=44, ERROR_INVALID_ARGS_FORMAT=45, ERROR_HASH_MISMATCHED=49); based on master, the deployed build may differ slightly

## Example transactions

- mainnet · xUDT · [0xdcc1d1f0289a0df2ce56094bc0fe873baa03bf5d361545aa908c49778fe11429](https://explorer.nervos.org/transaction/0xdcc1d1f0289a0df2ce56094bc0fe873baa03bf5d361545aa908c49778fe11429) · `node decode-tx.js 0xdcc1d1f0289a0df2ce56094bc0fe873baa03bf5d361545aa908c49778fe11429`
- testnet · xUDT (testnet type_id deployment) · [0x0af1403063b56401e830e4ed42b44c2d0b127b6fdab153d32a3c01025475a4b7](https://testnet.explorer.nervos.org/transaction/0x0af1403063b56401e830e4ed42b44c2d0b127b6fdab153d32a3c01025475a4b7) · `node decode-tx.js 0x0af1403063b56401e830e4ed42b44c2d0b127b6fdab153d32a3c01025475a4b7 --testnet`

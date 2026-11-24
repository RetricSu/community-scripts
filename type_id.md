# Type ID (built-in type) Constraints

> Source: nervosnetwork/ckb / script/src/type_id.rs (built into the node, not a RISC-V binary)　·　code_hash 0x0000…545950455f4944 ("TYPE_ID"), hash_type type, same on both networks

- id: `type_id` · type script · networks: mainnet, testnet · tags: system, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/type_id.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb@426736a4](https://github.com/nervosnetwork/ckb/tree/426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9) · [script/src/type_id.rs](https://github.com/nervosnetwork/ckb/blob/426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9/script/src/type_id.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: built into CKB — no code cell (built into CKB)
- on-chain data checked: 2026-10-20
- contributors: [@TheWaWaR](https://github.com/TheWaWaR)

## Deployments

### mainnet — ckb script/src/type_id.rs (built-in, both networks)

- code_hash: `0x00000000000000000000000000000000000000000000000000545950455f4944` · hash_type: `type`
- built into CKB (no code cell): no cell_dep needed

```json
{
  "script": { "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944", "hash_type": "type", "args": "<args>" }
}
```

### testnet — ckb script/src/type_id.rs (built-in, both networks)

- code_hash: `0x00000000000000000000000000000000000000000000000000545950455f4944` · hash_type: `type`
- built into CKB (no code cell): no cell_dep needed

```json
{
  "script": { "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944", "hash_type": "type", "args": "<args>" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create

**Input** · tx.inputs[0]

```
CellInput{ since, previous_output }
// any cell
```

**Output** · new cell (output index i)

```
Cell{
  type: { codeHash: TYPE_ID, hashType: type,
          args: {{blake2b(inputs[0] ‖ u64le(i))}} }
}
```

byte layout: args derivation

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | CellInput | 44B | since u64 ‖ tx_hash 32B ‖ index u32 | the tx's first input | -3 |
| 1 | output index | 8B | index of the group's first output (u64 LE) | — | -3 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 32 bytes | -1 |
| args | = blake2b(first CellInput ‖ output index) | -3 |

### 2. `1 → 1` Update

**Input** · input

```
Cell{ type: TYPE_ID({{id}}) }
```

**Output** · output

```
Cell{ type: TYPE_ID({{id}}), data: new data }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | at most 1 input and 1 output share the same type_id | -2 |

### 3. `1 → 0` Destroy

**Input** · input

```
Cell{ type: TYPE_ID({{id}}) }
```

**Output** · outputs

```
no cell with this type_id
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | at most 1 input | -2 |

## Notes

- Error codes: -1 ERROR_ARGS · -2 ERROR_TOO_MANY_CELLS · -3 ERROR_INVALID_INPUT_HASH; costs a fixed 1,000,000 cycles
- Deployments use type_id so the code_hash (hash_type=type) stays stable across upgrades

## Example transactions

- mainnet · Type ID update · [0x9e802be4dce1d1d980e5f7c07bd9054893ce1d5897393c2ffaf8b53e8bc818b7](https://explorer.nervos.org/transaction/0x9e802be4dce1d1d980e5f7c07bd9054893ce1d5897393c2ffaf8b53e8bc818b7) · `node decode-tx.js 0x9e802be4dce1d1d980e5f7c07bd9054893ce1d5897393c2ffaf8b53e8bc818b7`
- mainnet · Type ID create · [0xb96bd471cce506167d686575ffbe9a876ff45792365a9f3c1f5548cbc97fe0e1](https://explorer.nervos.org/transaction/0xb96bd471cce506167d686575ffbe9a876ff45792365a9f3c1f5548cbc97fe0e1) · `node decode-tx.js 0xb96bd471cce506167d686575ffbe9a876ff45792365a9f3c1f5548cbc97fe0e1`

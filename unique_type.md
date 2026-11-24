# Unique Cell Constraints

> Source: utxostack/unique-cell / contracts/unique-type/src/entry.rs　·　mainnet 0x2c8c…c628 (data1) / testnet 0x8e34…df8b (type)

- id: `unique_type` · type script · networks: mainnet, testnet · tags: token, btc, open-source, community
- links: page https://retricsu.github.io/community-scripts/unique_type.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [utxostack/unique-cell@beabe978](https://github.com/utxostack/unique-cell/tree/beabe978910be29e89930e2ab75f43bd8daf47de) · [contracts/unique-type/src/entry.rs](https://github.com/utxostack/unique-cell/blob/beabe978910be29e89930e2ab75f43bd8daf47de/contracts/unique-type/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@duanyytop](https://github.com/duanyytop)

## Deployments

### mainnet — utxostack/unique-cell (mainnet)

- code_hash: `0x2c8c11c985da60b0a330c61a85507416d6382c130ba67f0c47ab071e00aec628` · hash_type: `data1`
- deployed in tx [`0x67524c01c0cb5492e499c7c7e406f2f9d823e162d6b0cf432eacde0c9808c2ad`](https://explorer.nervos.org/transaction/0x67524c01c0cb5492e499c7c7e406f2f9d823e162d6b0cf432eacde0c9808c2ad) (block 12620882) · data_hash `0x2c8c11c985da60b0a330c61a85507416d6382c130ba67f0c47ab071e00aec628`

```json
{
  "script": { "code_hash": "0x2c8c11c985da60b0a330c61a85507416d6382c130ba67f0c47ab071e00aec628", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x67524c01c0cb5492e499c7c7e406f2f9d823e162d6b0cf432eacde0c9808c2ad", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — utxostack/unique-cell (testnet)

- code_hash: `0x8e341bcfec6393dcd41e635733ff2dca00a6af546949f70c57a706c0f344df8b` · hash_type: `type`
- deployed in tx [`0xff91b063c78ed06f10a1ed436122bd7d671f9a72ef5f5fa28d05252c17cf4cef`](https://testnet.explorer.nervos.org/transaction/0xff91b063c78ed06f10a1ed436122bd7d671f9a72ef5f5fa28d05252c17cf4cef) (block 12737020) · data_hash `0xcc2518c2c1384f2473c96f63c4e74074984296f358512ee7f54c848d4c135040` · type_id args `0xe04976b67600fd25ac50305f77b33aee2c12e3c18e63ece9119e5b32117884b5`

```json
{
  "script": { "code_hash": "0x8e341bcfec6393dcd41e635733ff2dca00a6af546949f70c57a706c0f344df8b", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xff91b063c78ed06f10a1ed436122bd7d671f9a72ef5f5fa28d05252c17cf4cef", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Create (the only allowed operation)

**Input** · inputs[0]: any

```
CellInput{ since, previous_output }
(must not carry this unique type)
```

**Output** · single output

```
Cell{
  type: { codeHash: UNIQUE_TYPE,
          args: {{unique_id 20B}} },
  data: any (e.g. token info, convention)
}
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | unique_id | 20B | blake2b(inputs[0] ‖ first output index u64 LE)[0..20] | must match exactly | 6 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| outputs | group outputs ≤ 1 | 8 |
| args | = first 20 bytes of blake2b(first CellInput ‖ first matching output index); length must be 20 | 6 |
| inputs | fails if this type is in inputs: no update, no destroy | 7 |
| outputs | only in inputs: no matching output | 4 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 6 UniqueTypeIdInvalid · 7 InputUniqueCellForbidden · 8 OnlyOneUniqueOutputCellAllowed
- Data is not checked by the script; RGB++ stores xUDT token info (decimal ‖ name ‖ symbol) there by convention (unverified)

## Example transactions

- mainnet · Unique cell create · [0x0c930974cfd2ef554d53b0f00f2e9f0de6b01d61a425bbeb21da4a11852aea15](https://explorer.nervos.org/transaction/0x0c930974cfd2ef554d53b0f00f2e9f0de6b01d61a425bbeb21da4a11852aea15) · `node decode-tx.js 0x0c930974cfd2ef554d53b0f00f2e9f0de6b01d61a425bbeb21da4a11852aea15`
- mainnet · Unique cell create (2) · [0xd4ea1b33e49b204b262f715baa689993ca28da7a861ab20b5014db01139ea402](https://explorer.nervos.org/transaction/0xd4ea1b33e49b204b262f715baa689993ca28da7a861ab20b5014db01139ea402) · `node decode-tx.js 0xd4ea1b33e49b204b262f715baa689993ca28da7a861ab20b5014db01139ea402`

# CKBFS V2 Constraints (witness file storage)

> Source: code-monad/ckbfs @db973a8 contracts/ckbfs/src/entry.rs + contracts/ckb-adler32 (mode 1)　·　data1 0x31e6…8d3a (mainnet + testnet)

- id: `ckbfs_v2` · type script · networks: mainnet, testnet · tags: proxy, open-source, community
- links: page https://retricsu.github.io/community-scripts/ckbfs_v2.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [code-monad/ckbfs@db973a8e](https://github.com/code-monad/ckbfs/tree/db973a8e80322b2bc50b0096c97b0ce7531cfb01) · [contracts/ckbfs/src/entry.rs](https://github.com/code-monad/ckbfs/blob/db973a8e80322b2bc50b0096c97b0ce7531cfb01/contracts/ckbfs/src/entry.rs) · [contracts/ckbfs/src/error.rs](https://github.com/code-monad/ckbfs/blob/db973a8e80322b2bc50b0096c97b0ce7531cfb01/contracts/ckbfs/src/error.rs) · [contracts/ckbfs/src/hash.rs](https://github.com/code-monad/ckbfs/blob/db973a8e80322b2bc50b0096c97b0ce7531cfb01/contracts/ckbfs/src/hash.rs) · [contracts/ckb-adler32/src/process.rs](https://github.com/code-monad/ckbfs/blob/db973a8e80322b2bc50b0096c97b0ce7531cfb01/contracts/ckb-adler32/src/process.rs) · [contracts/ckb-adler32/src/utils.rs](https://github.com/code-monad/ckbfs/blob/db973a8e80322b2bc50b0096c97b0ce7531cfb01/contracts/ckb-adler32/src/utils.rs) (README "Version 20241025.db973a8e8032" names this commit for data hash 0x31e6…8d3a; its hash.rs pins ckb-adler32 0x2138…536f = the adler32 cell deployed alongside. Data schema: crates.io ckbfs-types 0.2.1)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@code-tsao](https://github.com/code-tsao)

## Deployments

### mainnet — code-monad/ckbfs README "Version 20241025.db973a8e8032" (mainnet + testnet, data1)

- code_hash: `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · hash_type: `data1`
- deployed in tx [`0xc9b6698f44c3b80e7e1c48823b2714e432b93f0206ffaf9df885d23267ed2ebc`](https://explorer.nervos.org/transaction/0xc9b6698f44c3b80e7e1c48823b2714e432b93f0206ffaf9df885d23267ed2ebc) (block 14392854) · data_hash `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · type_id args `0xb8c16cf1dc255118176787b580c5c5cd8c327d5667cf3421b34bff05ffe77e7d`

```json
{
  "script": { "code_hash": "0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xfab07962ed7178ed88d450774e2a6ecd50bae856bdb9b692980be8c5147d1bfa", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — code-monad/ckbfs README "Version 20241025.db973a8e8032" (mainnet + testnet, data1)

- code_hash: `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · hash_type: `data1`
- deployed in tx [`0x2c8c9ad3134743368b5a79977648f96c5bd0aba187021a72fb624301064d3616`](https://testnet.explorer.nervos.org/transaction/0x2c8c9ad3134743368b5a79977648f96c5bd0aba187021a72fb624301064d3616) (block 15011570) · data_hash `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · type_id args `0x01d5f1721e607a96b5926ac6bfc7e073ef73b01c599b8643c7795ae1e9576a86`

```json
{
  "script": { "code_hash": "0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x469af0d961dcaaedd872968a9388b546717a6ccfa47b3165b3f9c981e9d66aaa", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### mainnet — code-monad/ckbfs README (mainnet type id)

- code_hash: `0xfd2058c9a0c0183354cf637e25d2707ffa9bb6fa2ba9b29f4ebc6be3e54ad7eb` · hash_type: `type`
- deployed in tx [`0xc9b6698f44c3b80e7e1c48823b2714e432b93f0206ffaf9df885d23267ed2ebc`](https://explorer.nervos.org/transaction/0xc9b6698f44c3b80e7e1c48823b2714e432b93f0206ffaf9df885d23267ed2ebc) (block 14392854) · data_hash `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · type_id args `0xb8c16cf1dc255118176787b580c5c5cd8c327d5667cf3421b34bff05ffe77e7d`

```json
{
  "script": { "code_hash": "0xfd2058c9a0c0183354cf637e25d2707ffa9bb6fa2ba9b29f4ebc6be3e54ad7eb", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xfab07962ed7178ed88d450774e2a6ecd50bae856bdb9b692980be8c5147d1bfa", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — code-monad/ckbfs README (testnet type id)

- code_hash: `0x7c6dcab8268201f064dc8676b5eafa60ca2569e5c6209dcbab0eb64a9cb3aaa3` · hash_type: `type`
- deployed in tx [`0x2c8c9ad3134743368b5a79977648f96c5bd0aba187021a72fb624301064d3616`](https://testnet.explorer.nervos.org/transaction/0x2c8c9ad3134743368b5a79977648f96c5bd0aba187021a72fb624301064d3616) (block 15011570) · data_hash `0x31e6376287d223b8c0410d562fb422f04d1d617b2947596a14c3d2efb7218d3a` · type_id args `0x01d5f1721e607a96b5926ac6bfc7e073ef73b01c599b8643c7795ae1e9576a86`

```json
{
  "script": { "code_hash": "0x7c6dcab8268201f064dc8676b5eafa60ca2569e5c6209dcbab0eb64a9cb3aaa3", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x469af0d961dcaaedd872968a9388b546717a6ccfa47b3165b3f9c981e9d66aaa", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Publish (create)

**Input** · inputs[0]: any

```
CellInput{ since, previous_output }
```

**Output** · CKBFS cell

```
Cell{
  type: { codeHash: {{CKBFS_V2}}, hashType: data1,
          args: {{type_id 32B}} ‖ [hasher_code_hash 32B] },
  data: CKBFSData { indexes, checksum, content_type, filename, backlinks: [] }
}
```

**Output** · witnesses[i], i ∈ indexes

```
"CKBFS"(5B) ‖ 0x00(1B) ‖ {{content part}}
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type_id | 32B | unique id | = blake2b(inputs[0] ‖ output index u64) | 102 |
| 1 | hasher_code_hash | 32B? | optional: hasher data1 code hash | defaults to the built-in ckb-adler32 hash | 106 |

byte layout: data (molecule table CKBFSData)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | indexes | Uint32[] | witness indexes holding the content | non-empty on create | 101 |
| 1 | checksum | 4B LE | Adler-32 | = adler32(witness[6..] of each index, in order) | -101 |
| 2 | content_type | Bytes | MIME | immutable afterwards | 105 |
| 3 | filename | Bytes | file name | immutable afterwards | 105 |
| 4 | backlinks | BackLink[] | earlier parts {indexes, checksum, tx_hash} | must be empty on create (see notes) | 101 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type | ≤ 1 output with this type in the tx | 107 |
| args | ≥ 32 bytes; args[0..32] by the type_id rule | -3 / 102 |
| data | valid molecule; indexes non-empty; backlinks empty | -4 / 101 |
| cell_deps | contains a cell whose data hash = the hasher code hash (not checked by the decoder) | 106 |
| checksum | exec ckb-adler32 mode 1: adler32(witnesses[indexes][6..]) = data.checksum; a missing or < 6-byte witness panics | -101 |

### 2. `1 → 1` Append

**Input** · CKBFS cell

```
Cell{ type: CKBFS_V2, data: { indexes: I, checksum: c0, content_type, filename, backlinks: B } }
```

**Output** · CKBFS cell

```
Cell{ type: same,
  data: { indexes: {{I′ ≠ []}}, checksum: {{c1}}, content_type, filename,
          backlinks: B ‖ {{BackLink{ indexes, checksum, tx_hash }}} } }
```

**Output** · witnesses[i], i ∈ I′

```
"CKBFS" ‖ 0x00 ‖ {{new content part}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| content_type / filename | unchanged | 105 |
| backlinks | if input indexes is non-empty or input backlinks > 1: output has exactly one more backlink; the last one has tx_hash = input out_point.tx_hash or indexes = input indexes | 108 |
| backlinks | input backlinks kept unchanged as the output prefix | 108 |
| checksum | resume Adler-32 from c0 over witnesses[I′][6..]; result = c1 | -101 |

### 3. `1 → 1` Transfer

**Input** · CKBFS cell

```
Cell{ lock: A, type: CKBFS_V2, data: { checksum: c0, backlinks: B, … } }
```

**Output** · CKBFS cell

```
Cell{ lock: {{B′}}, type: same,
  data: { indexes: {{[]}}, checksum: c0, content_type, filename, backlinks: {{…}} } }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| checksum | empty output indexes means transfer; checksum unchanged | 105 |
| backlinks | input has no backlink: output has exactly 1 with tx_hash = input out_point.tx_hash; otherwise backlinks identical | 109 / 105 |

### 4. `1 → 0` Destroy: forbidden

**Input** · CKBFS cell

```
Cell{ type: CKBFS_V2 }
```

**Output** · no CKBFS output

```
—
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type | input without output → fails | 103 |

## Notes

- Version: the README labels 0x31e6…8d3a "Version 20241025.db973a8e8032", i.e. commit db973a8 (tags v2/v2.0 = 88297de only edit the README). That commit's hash.rs pins ckb-adler32 = 0x2138…536f, which matches the adler32 cell in the same on-chain dep_group. No reproducible build was attempted.
- The data layout comes from crates.io ckbfs-types 0.2.1 (schemas/ckbfs.mol), not the repo RFC.md (which still showed V1's index: Uint32Opt at that commit).
- Checksum validation exec_cell-s into ckb-adler32, which replaces the process, so a wrong checksum exits with adler32's -101 (ValidateFailure); 104 only appears when exec itself fails.
- As written: on create with non-empty backlinks, the reference-cell search compares a 32-byte code_hash with the whole serialized Script, which never matches → 101; it would also read the cell_dep at the output index rather than the found position.
- Only the first input with this type is considered; the witness header "CKBFS" ‖ 0x00 is not checked, just skipped (6 bytes).
- Error codes (error.rs): -1 IndexOutOfBound · -2 ItemMissing · -3 LengthNotEnough · -4 Encoding · 101 InvalidInitialData · 102 InvalidTypeId · 103 DeletionForbidden · 104 ChecksumMismatch · 105 InvalidFieldUpdate · 106 NoChecksumHasherFound · 107 DuplicatedOutputs · 108 InvalidAppend · 109 InvalidTransfer; ckb-adler32: -101 ValidateFailure
- 2026-11-19 upstream review (not an on-chain upgrade claim): README still identifies V2 deployments as 20241025.db973a8e8032. HEAD is V3: linked witnesses, previous-position validation, errors 110–112 and another adler32 hash. V3 is already described by ckbfs_v3; retain V2 schema and checksum rules.

## Example transactions

- mainnet · CKBFS V2 publish (3 witnesses) · [0xd824b272df0e6ec2cee6eeb353a418174ff52150f4643aa06642d7236b141d0e](https://explorer.nervos.org/transaction/0xd824b272df0e6ec2cee6eeb353a418174ff52150f4643aa06642d7236b141d0e) · `node decode-tx.js 0xd824b272df0e6ec2cee6eeb353a418174ff52150f4643aa06642d7236b141d0e`
- testnet · CKBFS V2 append · [0x9afc3938efe0e29cb0246ea800b4ecf76e1407bd771f1f36980d1d8069f7c4d7](https://testnet.explorer.nervos.org/transaction/0x9afc3938efe0e29cb0246ea800b4ecf76e1407bd771f1f36980d1d8069f7c4d7) · `node decode-tx.js 0x9afc3938efe0e29cb0246ea800b4ecf76e1407bd771f1f36980d1d8069f7c4d7 --testnet`
- testnet · CKBFS V2 publish (6 indexes) · [0x8b53101cb812e92957304daf09f437cd211efc8e4d7eac7fd92101fb422715de](https://testnet.explorer.nervos.org/transaction/0x8b53101cb812e92957304daf09f437cd211efc8e4d7eac7fd92101fb422715de) · `node decode-tx.js 0x8b53101cb812e92957304daf09f437cd211efc8e4d7eac7fd92101fb422715de --testnet`
- testnet · CKBFS V2 publish (testnet) · [0xbb0e0a9770c1f9315fa93ec76e79e6971057365dccb9fa4b086055b588a60252](https://testnet.explorer.nervos.org/transaction/0xbb0e0a9770c1f9315fa93ec76e79e6971057365dccb9fa4b086055b588a60252) · `node decode-tx.js 0xbb0e0a9770c1f9315fa93ec76e79e6971057365dccb9fa4b086055b588a60252 --testnet`

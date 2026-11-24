# CKBFS V3 Constraints (witness file storage, backlinks moved into witnesses)

> Source: code-monad/ckbfs @4ee6689 (tag v3) contracts/ckbfs/src/entry.rs + contracts/ckb-adler32 (mode 3)　·　data1 0xb5d1…d695 (mainnet + testnet)

- id: `ckbfs_v3` · type script · networks: mainnet, testnet · tags: proxy, open-source, community
- links: page https://retricsu.github.io/community-scripts/ckbfs_v3.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [code-monad/ckbfs@4ee6689b](https://github.com/code-monad/ckbfs/tree/4ee6689bf7ec2515df95311a05a9cdc709f358cb) · [contracts/ckbfs/src/entry.rs](https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/contracts/ckbfs/src/entry.rs) · [contracts/ckbfs/src/error.rs](https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/contracts/ckbfs/src/error.rs) · [contracts/ckbfs/src/hash.rs](https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/contracts/ckbfs/src/hash.rs) · [contracts/ckb-adler32/src/process.rs](https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/contracts/ckb-adler32/src/process.rs) · [contracts/ckb-adler32/src/utils.rs](https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/contracts/ckb-adler32/src/utils.rs) (tag v3 / master HEAD read 2026-11-06. Repo has no record of data hash 0xb5d1…d695; chosen because the deployed dep_group adler32 hash 0xbd94…1db1 equals hash.rs from 3776e2a onward (exact build commit unproven). Data schema: crates.io ckbfs-types 0.3.0)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@code-tsao](https://github.com/code-tsao)

## Deployments

### mainnet — CKB Explorer registry "CKBFS V3" code cell data hash (mainnet 0xd25f2c32…:1, testnet 0x1488b592…:0), data1

- code_hash: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · hash_type: `data1`
- deployed in tx [`0xd25f2c32f56c28c630d4f91955f1b3c9cd53e26fa0745d540d934e8e3d3c2853`](https://explorer.nervos.org/transaction/0xd25f2c32f56c28c630d4f91955f1b3c9cd53e26fa0745d540d934e8e3d3c2853) (block 17071377) · data_hash `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · type_id args `0xf5d1b146e7a8cd668dbfde5d08d788ab6fb1c3487f6b3b16b9c0efbc5421a529`

```json
{
  "script": { "code_hash": "0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x03deba7f8206c81981d6f6a2d61b67dde75b4df91cbcfaf2e2fb041ba50c4719", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — CKB Explorer registry "CKBFS V3" code cell data hash (mainnet 0xd25f2c32…:1, testnet 0x1488b592…:0), data1

- code_hash: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · hash_type: `data1`
- deployed in tx [`0x1488b592b0946589730c906c6d9a46fb82c1181156fc1a4251adce14002a9cfb`](https://testnet.explorer.nervos.org/transaction/0x1488b592b0946589730c906c6d9a46fb82c1181156fc1a4251adce14002a9cfb) (block 18252964) · data_hash `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · type_id args `0x55f1932d3084fbca84c04205eea2e9662e60f7777b9ec4865f360d4e6c4a5249`

```json
{
  "script": { "code_hash": "0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x47cfa8d554cccffe7796f93b58437269de1f98f029d0a52b6b146381f3e95e61", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### mainnet — type hash of the mainnet V3 code cell 0xd25f2c32…:1

- code_hash: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add` · hash_type: `type`
- deployed in tx [`0xd25f2c32f56c28c630d4f91955f1b3c9cd53e26fa0745d540d934e8e3d3c2853`](https://explorer.nervos.org/transaction/0xd25f2c32f56c28c630d4f91955f1b3c9cd53e26fa0745d540d934e8e3d3c2853) (block 17071377) · data_hash `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · type_id args `0xf5d1b146e7a8cd668dbfde5d08d788ab6fb1c3487f6b3b16b9c0efbc5421a529`

```json
{
  "script": { "code_hash": "0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x03deba7f8206c81981d6f6a2d61b67dde75b4df91cbcfaf2e2fb041ba50c4719", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — CKB Explorer registry "CKBFS V3" (testnet type id) = type hash of 0x1488b592…:0

- code_hash: `0xaebf5a7b541da9603c2066a9768d3d18fea2e7f3c1943821611545155fecc671` · hash_type: `type`
- deployed in tx [`0x1488b592b0946589730c906c6d9a46fb82c1181156fc1a4251adce14002a9cfb`](https://testnet.explorer.nervos.org/transaction/0x1488b592b0946589730c906c6d9a46fb82c1181156fc1a4251adce14002a9cfb) (block 18252964) · data_hash `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` · type_id args `0x55f1932d3084fbca84c04205eea2e9662e60f7777b9ec4865f360d4e6c4a5249`

```json
{
  "script": { "code_hash": "0xaebf5a7b541da9603c2066a9768d3d18fea2e7f3c1943821611545155fecc671", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x47cfa8d554cccffe7796f93b58437269de1f98f029d0a52b6b146381f3e95e61", "index": "0x0" }, "dep_type": "dep_group" }
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
  type: { codeHash: {{CKBFS_V3}}, hashType: data1,
          args: {{type_id 32B}} ‖ [hasher_code_hash 32B] },
  data: CKBFSData { index, checksum, content_type, filename }
}
```

**Output** · witnesses[index]（head）

```
"CKBFS" ‖ 0x03 ‖ {{prev tx_hash = 0×32}} ‖ {{prev index = 0}} ‖ prev checksum ‖ next ‖ content
```

**Output** · witnesses[next] …

```
next(4B, 0 = end) ‖ content
```

byte layout: head witness byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | "CKBFS" | 5B | magic | not checked | — |
| 1 | version | 1B | protocol version | = 0x03 | -101 |
| 2 | prev tx_hash | 32B | tx of the previous version | create = 0; update = input out_point.tx_hash | 112 |
| 3 | prev index | 4B | previous head witness index | create = 0; update = input data.index | 112 |
| 4 | prev checksum | 4B | Adler-32 resume point | 0 = start fresh | -101 |
| 5 | next | 4B | next witness index | 0 = end | -101 |
| 6 | content | … | content part | hashed into the checksum | -101 |

byte layout: data (molecule table CKBFSData)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | index | Uint32 | head witness index | head ≥ 50 bytes | -3 |
| 1 | checksum | 4B LE | Adler-32 | = result over the witness chain | -101 |
| 2 | content_type | Bytes | MIME | immutable afterwards | 105 |
| 3 | filename | Bytes | file name | immutable afterwards | 105 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type | ≤ 1 output with this type in the tx | 107 |
| args | ≥ 32 bytes; args[0..32] by the type_id rule | -3 / 102 |
| head witness | exists and ≥ 50 bytes; previous position all zero | -1 / -3 / 112 |
| cell_deps | contains a cell whose data hash = the hasher code hash (not checked by the decoder) | 106 |
| checksum | exec ckb-adler32 mode 3: head[50..] ‖ witness[4..] along the next chain; resume from prev checksum when ≠ 0; result = data.checksum | -101 |

### 2. `1 → 1` Append / transfer

**Input** · CKBFS cell

```
Cell{ type: CKBFS_V3, data: { index: i0, checksum: c0, content_type, filename } }
```

**Output** · CKBFS cell

```
Cell{ type: same, data: { index: {{i1}}, checksum: {{c1}}, content_type, filename } }
```

**Output** · witnesses[i1]（head）

```
"CKBFS" ‖ 0x03 ‖ {{input out_point.tx_hash}} ‖ {{i0}} ‖ prev checksum ‖ next ‖ content
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| content_type / filename / args | unchanged | 105 |
| head witness | previous position = (input out_point.tx_hash, input data.index) | 112 |
| checksum | c1 = c0 takes the "transfer" branch, otherwise "append"; both exec the same mode-3 check (adler32 ignores the passed resume argument and uses the head's prev checksum) | -101 |

### 3. `1 → 0` Destroy: forbidden

**Input** · CKBFS cell

```
Cell{ type: CKBFS_V3 }
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

- Version: the repo has no release record for 0xb5d1…d695 (the README lists only V1/V2). The ckb-adler32 data hash in the on-chain V3 dep_group is 0xbd94…1db1, the value hash.rs pins from 3776e2a on (incl. 931c477 and tag v3 = 4ee6689), so tag v3 is recorded; the exact build commit is unproven and no reproducible build was attempted.
- The data layout comes from crates.io ckbfs-types 0.3.0 (schemas/ckbfs.mol); the witness layout from RFC.v3.md and ckb-adler32 process.rs.
- As written: error.rs defines 110 InvalidWitnessHeader / 111 InvalidVersion but entry.rs never uses them; a version byte ≠ 0x03 is rejected by adler32 with -101, and the "CKBFS" magic is not checked.
- ckbfs does not require the head's prev checksum to equal the input checksum; adler32 resumes from the head value as given.
- Error codes: -1 IndexOutOfBound · -2 ItemMissing · -3 LengthNotEnough · -4 Encoding · 102 InvalidTypeId · 103 DeletionForbidden · 104 ChecksumMismatch (exec failed) · 105 InvalidFieldUpdate · 106 NoChecksumHasherFound · 107 DuplicatedOutputs · 112 InvalidPreviousPosition; ckb-adler32: -101 ValidateFailure

## Example transactions

- mainnet · CKBFS V3 publish · [0x5c42e55ba7a52d5f2c4d1d3ca3d169c6ccd2bc5369dd322ffd955c8586548ebe](https://explorer.nervos.org/transaction/0x5c42e55ba7a52d5f2c4d1d3ca3d169c6ccd2bc5369dd322ffd955c8586548ebe) · `node decode-tx.js 0x5c42e55ba7a52d5f2c4d1d3ca3d169c6ccd2bc5369dd322ffd955c8586548ebe`
- mainnet · CKBFS V3 append · [0xfcf438982dde4df3b95e8c8433aee6347d112f8450a9b0b6fb2c756e4fb47dab](https://explorer.nervos.org/transaction/0xfcf438982dde4df3b95e8c8433aee6347d112f8450a9b0b6fb2c756e4fb47dab) · `node decode-tx.js 0xfcf438982dde4df3b95e8c8433aee6347d112f8450a9b0b6fb2c756e4fb47dab`
- testnet · CKBFS V3 publish (testnet) · [0x074c7080c8d17ac4f3e45028908b8508861b33dd3ab91940c285f7deabbbeb7a](https://testnet.explorer.nervos.org/transaction/0x074c7080c8d17ac4f3e45028908b8508861b33dd3ab91940c285f7deabbbeb7a) · `node decode-tx.js 0x074c7080c8d17ac4f3e45028908b8508861b33dd3ab91940c285f7deabbbeb7a --testnet`
- testnet · CKBFS V3 update (testnet) · [0x18e2d5a1a0cd1606da55c6d06a3cf1ae7dadf7c1b100cb1bffac0e16a60a8cd9](https://testnet.explorer.nervos.org/transaction/0x18e2d5a1a0cd1606da55c6d06a3cf1ae7dadf7c1b100cb1bffac0e16a60a8cd9) · `node decode-tx.js 0x18e2d5a1a0cd1606da55c6d06a3cf1ae7dadf7c1b100cb1bffac0e16a60a8cd9 --testnet`

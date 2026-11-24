# .bit Time Index State Type Constraints

> Source: dotbitHQ/ckb-time-script @37343ab contracts/index-state-type

- id: `dotbit_time_index_state` · type script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/dotbit_time_index_state.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [dotbitHQ/ckb-time-script@37343ab5](https://github.com/dotbitHQ/ckb-time-script/tree/37343ab501e71b9eb8a83f04a66c3cafb48044d3) · [contracts/index-state-type/src/entry.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/contracts/index-state-type/src/entry.rs) · [contracts/index-state-type/src/error.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/contracts/index-state-type/src/error.rs) · [libs/common/src/constants.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/libs/common/src/constants.rs) · [migrations/mainnet/2021-08-24-000000.json](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/migrations/mainnet/2021-08-24-000000.json) (commit 37343ab "chore: deploy script to mainnet" adds migrations/mainnet/2021-08-24-000000.json (hashes used here); contract code last changed at a2fa7d9 (2021-08-09). No reproducible build attempted.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@duanyytop](https://github.com/duanyytop), [@linkdesu](https://github.com/linkdesu)

## Deployments

### mainnet — ckb-time-script migrations/mainnet/2021-08-24-000000.json

- code_hash: `0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43` · hash_type: `type`
- deployed in tx [`0xae3197c306c0d0b36722773cff7dafcc8e312154826f876cec4bd94d24dc61b3`](https://explorer.nervos.org/transaction/0xae3197c306c0d0b36722773cff7dafcc8e312154826f876cec4bd94d24dc61b3) (block 15198603) · data_hash `0xb575f6dd6417d4f7c52fd9e3a96824130302751c78ac10d1d0d35cd4b507bbae` · type_id args `0x0544efd115833306f039fc2b0dca406390b20bd707bce24731c6402ecbbf8f9f`

```json
{
  "script": { "code_hash": "0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xae3197c306c0d0b36722773cff7dafcc8e312154826f876cec4bd94d24dc61b3", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ckb-time-script migrations/testnet/2021-08-09-103746.json

- code_hash: `0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8` · hash_type: `type`
- deployed in tx [`0x654f8a271dde2d99f548ff5b9369a55c0cfbe19a315efb5dacf34f72d7f3ea64`](https://testnet.explorer.nervos.org/transaction/0x654f8a271dde2d99f548ff5b9369a55c0cfbe19a315efb5dacf34f72d7f3ea64) (block 2386188) · data_hash `0xb575f6dd6417d4f7c52fd9e3a96824130302751c78ac10d1d0d35cd4b507bbae` · type_id args `0x8c73c41da8a7cfca4729310f81d4921da421064328a962e7cee7d0388df4ac2b`

```json
{
  "script": { "code_hash": "0x554cff969f3148e3c620749384004e9692e67c429f621554d139b505a281c7b8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x654f8a271dde2d99f548ff5b9369a55c0cfbe19a315efb5dacf34f72d7f3ea64", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create

**Inputs**: none

**Output** · Index State Cell

```
Cell{
  type: { codeHash: {{INDEX_STATE}}, args: {{any}} },
  data: {{index u8}} ‖ {{sum u8 = 12}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | 2 bytes | 7 |
| index | < 12 | 9 |
| sum | = 12 | 8 |

### 2. `1 → 1` Update: index advances one

**Input** · Index State Cell

```
data: {{i}} ‖ 12
```

**Output** · Index State Cell

```
data: {{i+1 (or 0 when i ≥ 11)}} ‖ 12
```

byte layout: data byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | index | 1B | index of the newest Info cell | < 12 | 9 · 10 |
| 1 | sum | 1B | number of Info cells | = 12 | 8 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| output | the group has a first input and output | 6 |
| output data | as in create | 7 · 8 · 9 |
| index | input index ≥ 11 → 0, else +1 (the rest of input data is not checked) | 10 |

### 3. `1 → 0` Recycle

**Input** · Index State Cell

```
Cell{ type: {{INDEX_STATE}} }
```

**Outputs**: none

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | passes when no output has a type with this code hash | — |

## Notes

- The two scripts form the .bit on-chain time / block-number oracle: one Index State cell points to the newest of 12 Info cells; each update rewrites the Index State and one Info cell.
- "Is this script already in the inputs" compares code_hash only, not args: present in inputs but absent from outputs is treated as recycling and always passes; whoever holds the lock can destroy the cell.
- The scripts do not check who may update; authority comes entirely from the lock of the cells.
- Deployment: hashes from the repo migrations (mainnet 2021-08-24, testnet 2021-08-09-103746), checked on chain; no reproducible build of the binary.
- Error codes: 1–4 syscall · 6 IndexStateTypeNotExist · 7 IndexStateDataLenError · 8 InfoAmountError · 9 IndexStateOutOfBound · 10 IndexIncreaseError

## Example transactions

- mainnet · oracle update (index 10 → 11) · [0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a](https://explorer.nervos.org/transaction/0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a) · `node decode-tx.js 0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a`
- mainnet · oracle update (index 9 → 10) · [0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b](https://explorer.nervos.org/transaction/0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b) · `node decode-tx.js 0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b`
- testnet · oracle update (testnet) · [0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913](https://testnet.explorer.nervos.org/transaction/0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913) · `node decode-tx.js 0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913 --testnet`

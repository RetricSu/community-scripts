# .bit Time Info Type Constraints

> Source: dotbitHQ/ckb-time-script @37343ab contracts/info-type

- id: `dotbit_time_info` · type script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/dotbit_time_info.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [dotbitHQ/ckb-time-script@37343ab5](https://github.com/dotbitHQ/ckb-time-script/tree/37343ab501e71b9eb8a83f04a66c3cafb48044d3) · [contracts/info-type/src/entry.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/contracts/info-type/src/entry.rs) · [contracts/info-type/src/error.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/contracts/info-type/src/error.rs) · [libs/common/src/constants.rs](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/libs/common/src/constants.rs) · [migrations/mainnet/2021-08-24-000000.json](https://github.com/dotbitHQ/ckb-time-script/blob/37343ab501e71b9eb8a83f04a66c3cafb48044d3/migrations/mainnet/2021-08-24-000000.json) (commit 37343ab "chore: deploy script to mainnet" adds migrations/mainnet/2021-08-24-000000.json (hashes used here); contract code last changed at a2fa7d9 (2021-08-09). No reproducible build attempted.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@duanyytop](https://github.com/duanyytop), [@linkdesu](https://github.com/linkdesu)

## Deployments

### mainnet — ckb-time-script migrations/mainnet/2021-08-24-000000.json

- code_hash: `0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79` · hash_type: `type`
- deployed in tx [`0x3ba4c4b6cb70fd332d0159fa1c2ce021b361b7ccfe1acf2c44ad4902b1c905a5`](https://explorer.nervos.org/transaction/0x3ba4c4b6cb70fd332d0159fa1c2ce021b361b7ccfe1acf2c44ad4902b1c905a5) (block 15198605) · data_hash `0x1871b6ecbe086e0c0a5298b653de8bd7efb223c1f7927f41ad8b13de848b7209` · type_id args `0x4b673f820a6278ece8515bc358ccf5bf6ef385736d30bc2a990f923fe7f33b95`

```json
{
  "script": { "code_hash": "0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3ba4c4b6cb70fd332d0159fa1c2ce021b361b7ccfe1acf2c44ad4902b1c905a5", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ckb-time-script migrations/testnet/2021-08-09-103746.json

- code_hash: `0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a` · hash_type: `type`
- deployed in tx [`0x9155635997e8d59ccbf5e160a138c299a195837870fd8acf592da73c1b053a73`](https://testnet.explorer.nervos.org/transaction/0x9155635997e8d59ccbf5e160a138c299a195837870fd8acf592da73c1b053a73) (block 2386188) · data_hash `0x1871b6ecbe086e0c0a5298b653de8bd7efb223c1f7927f41ad8b13de848b7209` · type_id args `0xd7d02a61910488efb47917e840a0443bfa01d50cb42f4833d95bc7e7ad6276ba`

```json
{
  "script": { "code_hash": "0x96248cdefb09eed910018a847cfb51ad044c2d7db650112931760e3ef34a7e9a", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9155635997e8d59ccbf5e160a138c299a195837870fd8acf592da73c1b053a73", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create (in the same tx as the Index State)

**Inputs**: none

**Output** · output #0: Index State Cell

```
Cell{ type: { codeHash: {{INDEX_STATE}}, args: {{A}} } }
```

**Output** · Info Cell

```
Cell{
  type: { codeHash: {{INFO}}, args: {{A}} },
  data: {{index u8}} ‖ {{type u8}} ‖ {{value u64 BE}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| output #0 | must have a type | 13 |
| args | = output #0 type args | 5 |
| data | 10 bytes | 6 |

### 2. `1 → 1` Update: write a new time / height

**Input** · Info Cell

```
data: {{i_old}} ‖ {{type}} ‖ {{old}}
since: {{…}}
```

**Output** · output #0: Index State Cell

```
data: {{i}} ‖ 12
```

**Output** · Info Cell

```
data: {{i}} ‖ {{type}} ‖ {{new > old}}
```

byte layout: data byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | index | 1B | matches Index State | = output #0 data[0] | 9 |
| 1 | type | 1B | 0 arbitrary · 1 timestamp · 2 block number | — | — |
| 2 | value | 8B BE | timestamp or block number | strictly increases and equals since | 10 · 11 · 12 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| output #0 data | 2 bytes (output #0 is assumed to be the Index State) | 7 |
| data | input and output both 10 bytes | 6 |
| index | = output #0 data[0] | 9 |
| type = 1 | new > old; the group's first input since = (1<<62) + new timestamp | 10 · 12 |
| type = 2 | new > old; since = new block number | 11 · 12 |
| other type | content not checked | — |

### 3. `1 → 0` Recycle

**Input** · Info Cell

```
Cell{ type: {{INFO}} }
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
- The since field makes CKB consensus guarantee the written value is not ahead of the chain: the tx cannot be committed before that time / height.
- Error codes: 1–4 syscall · 5 InvalidArgument · 6 InfoDataLenError · 7 IndexStateDataLenError · 8 InfoTypeNotExist · 9 InfoIndexNotSame · 10 OutputTimestampNotBigger · 11 OutputBlockNumberNotBigger · 12 InvalidTimeInfoSince · 13 IndexStateTypeNotExist

## Example transactions

- mainnet · oracle update (index 10 → 11) · [0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a](https://explorer.nervos.org/transaction/0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a) · `node decode-tx.js 0xc8a576cc55826dfb3f2d0c4698b700c1ae026a0f659ed332cdfe11299c08b99a`
- mainnet · oracle update (index 9 → 10) · [0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b](https://explorer.nervos.org/transaction/0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b) · `node decode-tx.js 0xe5797542adb9a1c47e426275e65145a414a8e731e5c301434839f06a4224c61b`
- testnet · oracle update (testnet) · [0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913](https://testnet.explorer.nervos.org/transaction/0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913) · `node decode-tx.js 0x77351e1d6b24c0d0698c0fc523156c5087ba1a7a299993b8a4f9ff6a6aa14913 --testnet`

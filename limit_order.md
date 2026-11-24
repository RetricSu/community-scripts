# iCKB limit_order (lock + type) Constraints

> Source: ickb/contracts / scripts/contracts/limit_order/src　·　mainnet code_hash 0x49df…254a (data1)

- id: `limit_order` · lock script · networks: mainnet · tags: defi, open-source, community, p-ickb
- links: page https://retricsu.github.io/community-scripts/limit_order.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ickb/contracts@c951927e](https://github.com/ickb/contracts/tree/c951927e35fb5d4a13e28c5e55687d49cea7ca05) · [scripts/contracts/limit_order/src](https://github.com/ickb/contracts/blob/c951927e35fb5d4a13e28c5e55687d49cea7ca05/scripts/contracts/limit_order/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-10-20
- contributors: [@phroi](https://github.com/phroi)

## Deployments

### mainnet — blake2b of ickb/contracts release binary, confirmed on mainnet

- code_hash: `0x49dfb6afee5cc8ac4225aeea8cb8928b150caf3cd92fea33750683c74b13254a` · hash_type: `data1`
- deployed in tx [`0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44`](https://explorer.nervos.org/transaction/0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44) (block 14010067) · data_hash `0x49dfb6afee5cc8ac4225aeea8cb8928b150caf3cd92fea33750683c74b13254a`

```json
{
  "script": { "code_hash": "0x49dfb6afee5cc8ac4225aeea8cb8928b150caf3cd92fea33750683c74b13254a", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x621a6f38de3b9f453016780edac3b26bfcbfa3e2ecb47c2da275471a5d3ed165", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `Mint` Place: order + master

**Input** · user funds

```
Cell{ lock: user, type: UDT? }
```

**Output** · order (output i)

```
Cell{
  lock: {{LIMIT_ORDER}},
  type: {{UDT}},
  data: udt u128 ‖ action=0 ‖ 0×32 ‖ master_distance i32 ‖ OrderInfo
}
```

**Output** · master (output i + distance)

```
Cell{ lock: user, type: {{LIMIT_ORDER}} }
```

byte layout: order data (89B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | udt_amount | 16B | u128 LE | data exactly 89B | 4 |
| 1 | action | 4B | 0 mint / 1 match | ∈ {0,1} | 7 |
| 2 | tx_hash \| padding | 32B | match: master OutPoint.tx_hash; mint: zeros | zeros on mint | 8 |
| 3 | index \| distance | 4B | match: master index u32; mint: distance i32 | — | 21 |
| 4 | ckb_to_udt | 16B | ckb_mul u64 ‖ udt_mul u64 | both 0 or both non-0 | 9 |
| 5 | udt_to_ckb | 16B | ckb_mul u64 ‖ udt_mul u64 | at least one; not concave | 11 / 12 |
| 6 | ckb_min_match_log | 1B | minimum match = 2^n shannons | ≤ 64 | 10 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type | order cell must have a UDT type | 13 |
| master | per order and side at most 1 master / 1 order | 6 / 14 |
| cell | not both lock and type = this script | 15 |

### 2. `Match` Match: order → order'

**Input** · order

```
Cell{ lock: LIMIT_ORDER, ckb: C, udt: U }
```

**Output** · order'

```
Cell{ lock: LIMIT_ORDER, ckb: {{C'}}, udt: {{U'}},
  data: action=1, master OutPoint, same OrderInfo }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| info | OrderInfo and UDT type unchanged | 16 |
| direction | CKB decreases and UDT doesn't (ckb_to_udt), or UDT decreases and CKB doesn't (udt_to_ckb) | 17 |
| value | C·ckb_mul + U·udt_mul does not decrease | 18 |
| fulfilled | a fulfilled side (unoccupied CKB = 0 or UDT = 0) cannot be matched again | 19 |
| min match | a partial match must be ≥ 2^ckb_min_match_log in value | 20 |

### 3. `Melt` Cancel: spend order + master together

**Input** · order

```
Cell{ lock: LIMIT_ORDER }
```

**Input** · master

```
Cell{ lock: user (signs), type: LIMIT_ORDER }
```

**Output** · outputs

```
any
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| config | each order must be exactly one of mint / melt / match | 21 |

## Notes

- Error codes: 1–4 syscall · 5 NotEmptyArgs · 6 DuplicatedMaster · 7 InvalidAction · 8 NonZeroPadding · 9 InvalidRatio · 10 InvalidCkbMinMatchLog · 11 ConcaveRatio · 12 BothRatioNull · 13 MissingUdtType · 14 SameMaster · 15 ScriptMisuse · 16 DifferentInfo · 17 InvalidMatch · 18 DecreasingValue · 19 AttemptToChangeFulfilled · 20 InsufficientMatch · 21 InvalidConfiguration

## Example transactions

- mainnet · iCKB limit order match · [0xf59d8324046b095a582569c3093da1f486ed9f88a0a953db54b2e59bc3229b2d](https://explorer.nervos.org/transaction/0xf59d8324046b095a582569c3093da1f486ed9f88a0a953db54b2e59bc3229b2d) · `node decode-tx.js 0xf59d8324046b095a582569c3093da1f486ed9f88a0a953db54b2e59bc3229b2d`

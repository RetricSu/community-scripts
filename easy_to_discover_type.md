# Easy-to-discover Type Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/easy-to-discover-type/src/entry.rs　·　0xaba4…37af (data1, same on mainnet and testnet)

- id: `easy_to_discover_type` · type script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/easy_to_discover_type.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/easy-to-discover-type/src/entry.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/easy-to-discover-type/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@Hanssen0](https://github.com/Hanssen0), [@ashuralyk](https://github.com/ashuralyk)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/easy-to-discover-type (mainnet and testnet)

- code_hash: `0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af` · hash_type: `data1`
- deployed in tx [`0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b`](https://explorer.nervos.org/transaction/0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b) (block 14221033) · data_hash `0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/easy-to-discover-type (mainnet and testnet)

- code_hash: `0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af` · hash_type: `data1`
- deployed in tx [`0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792`](https://testnet.explorer.nervos.org/transaction/0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792) (block 14831057) · data_hash `0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0xaba4430cc7110d699007095430a1faa72973edf2322ddbfd4d1d219cacf237af", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` A cell indexed by its data hash

**Input** · inputs: not checked

```
any
```

**Output** · output

```
Cell{ type: { codeHash: EASY, args: {{data_hash 32B}} }, data: D }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | data_hash | 32B | blake2b(data) | every group output must match | 6 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 32 bytes | 5 |
| data | every group output blake2b(data) = args[0..32] | 6 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 InsufficientArgsLength · 6 DataHashNotMatch
- No signature is checked: security comes entirely from the script that args points to

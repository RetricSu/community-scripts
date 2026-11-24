# Output Type Proxy Lock Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/output-type-proxy-lock/src/entry.rs　·　0x2df5…aff2 (data1, same on mainnet and testnet)

- id: `output_type_proxy_lock` · lock script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/output_type_proxy_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/output-type-proxy-lock/src/entry.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/output-type-proxy-lock/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@Hanssen0](https://github.com/Hanssen0), [@xcshuan](https://github.com/xcshuan)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/output-type-proxy-lock (mainnet and testnet)

- code_hash: `0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2` · hash_type: `data1`
- deployed in tx [`0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b`](https://explorer.nervos.org/transaction/0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b) (block 13589704) · data_hash `0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2`

```json
{
  "script": { "code_hash": "0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b", "index": "0x2" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/output-type-proxy-lock (mainnet and testnet)

- code_hash: `0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2` · hash_type: `data1`
- deployed in tx [`0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93`](https://testnet.explorer.nervos.org/transaction/0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93) (block 14025090) · data_hash `0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2`

```json
{
  "script": { "code_hash": "0x2df53b592db3ae3685b7787adcfef0332a611edb83ca3feca435809964c3aff2", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93", "index": "0x2" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock authorised by the owner script

**Input** · input

```
Cell{ lock: { codeHash: PROXY, args: {{owner_hash 32B}} ‖ … } }
```

**Input** · owner cell

```
an output cell's type hash = owner_hash
```

**Output** · outputs: any

```
any
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owner_hash | 32B | owner script hash | an output cell's type hash equals it | 6 |
| 1 | … | * | ignored | — |  |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 32 bytes | 4 |
| owner | an output cell's type hash = args[0..32] | 6 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 Overflow · 6 InvalidUnlock
- No signature is checked: security comes entirely from the script that args points to

## Example transactions

- mainnet · Output type proxy unlock · [0x25d4cda145aabef990878b946117f2b706f71b9fa4cb73d06dd2569b299189c5](https://explorer.nervos.org/transaction/0x25d4cda145aabef990878b946117f2b706f71b9fa4cb73d06dd2569b299189c5) · `node decode-tx.js 0x25d4cda145aabef990878b946117f2b706f71b9fa4cb73d06dd2569b299189c5`

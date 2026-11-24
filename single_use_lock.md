# Single Use Lock Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/single-use-lock/src/entry.rs　·　0x8290…bbaf (data1, same on mainnet and testnet)

- id: `single_use_lock` · lock script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/single_use_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/single-use-lock/src/entry.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/single-use-lock/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@Hanssen0](https://github.com/Hanssen0), [@xcshuan](https://github.com/xcshuan)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/single-use-lock (mainnet and testnet)

- code_hash: `0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf` · hash_type: `data1`
- deployed in tx [`0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b`](https://explorer.nervos.org/transaction/0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b) (block 13589704) · data_hash `0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf`

```json
{
  "script": { "code_hash": "0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b", "index": "0x4" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/single-use-lock (mainnet and testnet)

- code_hash: `0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf` · hash_type: `data1`
- deployed in tx [`0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93`](https://testnet.explorer.nervos.org/transaction/0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93) (block 14025090) · data_hash `0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf`

```json
{
  "script": { "code_hash": "0x8290467a512e5b9a6b816469b0edabba1f4ac474e28ffdd604c2a7c76446bbaf", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93", "index": "0x4" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Spend together with a given OutPoint

**Input** · input

```
Cell{ lock: { codeHash: SINGLE_USE, args: {{OutPoint 36B}} } }
```

**Input** · another input

```
previous_output = the OutPoint in args
```

**Output** · outputs: any

```
any
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | tx_hash | 32B | OutPoint.tx_hash | consumed by an input | 7 |
| 1 | index | 4B | OutPoint.index u32 LE | same | 7 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 36 bytes | 4 |
| inputs | some input's previous_output = the OutPoint in args (it can be spent only once, so the lock is single-use) | 7 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 Overflow · 6 MoleculeVerification · 7 OutpointNotFound
- No signature is checked: security comes entirely from the script that args points to

## Example transactions

- mainnet · Single use unlock · [0x5aedbbd1b19c6d58f962a9c144e889335ec6f8dcbbc6bbee65f10848a95c577a](https://explorer.nervos.org/transaction/0x5aedbbd1b19c6d58f962a9c144e889335ec6f8dcbbc6bbee65f10848a95c577a) · `node decode-tx.js 0x5aedbbd1b19c6d58f962a9c144e889335ec6f8dcbbc6bbee65f10848a95c577a`

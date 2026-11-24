# Always Success Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/always-success/src/entry.rs　·　0x3b52…f7f1 (data1, same on mainnet and testnet)

- id: `always_success` · lock script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/always_success.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/always-success/src/main.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/always-success/src/main.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@xcshuan](https://github.com/xcshuan)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/always-success (mainnet and testnet)

- code_hash: `0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1` · hash_type: `data1`
- deployed in tx [`0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b`](https://explorer.nervos.org/transaction/0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b) (block 13589704) · data_hash `0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/always-success (mainnet and testnet)

- code_hash: `0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1` · hash_type: `data1`
- deployed in tx [`0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93`](https://testnet.explorer.nervos.org/transaction/0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93) (block 14025090) · data_hash `0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1`

```json
{
  "script": { "code_hash": "0x3b521cc4b552f109d092d8cc468a8048acb53c5952dbe769d2b2f9cf6e47f7f1", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock by anyone

**Input** · input

```
Cell{ lock: { codeHash: ALWAYS_SUCCESS, args: any } }
```

**Output** · outputs: any

```
any
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | program_entry always returns 0 | 0 |

## Notes

- Error codes (error.rs): (none)
- No signature is checked: security comes entirely from the script that args points to

## Example transactions

- testnet · Always success spend · [0x0f11e25b988d50fe121f81abe5a8ffc5525001a0c98b7c7419e0bbdfcbc54ec7](https://testnet.explorer.nervos.org/transaction/0x0f11e25b988d50fe121f81abe5a8ffc5525001a0c98b7c7419e0bbdfcbc54ec7) · `node decode-tx.js 0x0f11e25b988d50fe121f81abe5a8ffc5525001a0c98b7c7419e0bbdfcbc54ec7 --testnet`

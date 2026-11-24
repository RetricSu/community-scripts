# Time Lock (proxy-locks) Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/time-lock/src/entry.rs　·　0x6fac…4451 (data1, same on mainnet and testnet)

- id: `time_lock` · lock script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/time_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/time-lock/src/entry.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/time-lock/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@fghdotio](https://github.com/fghdotio)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/time-lock (mainnet and testnet)

- code_hash: `0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451` · hash_type: `data1`
- deployed in tx [`0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b`](https://explorer.nervos.org/transaction/0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b) (block 14221033) · data_hash `0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb0ed754fb27d67fd8388c97fed914fb7998eceaa01f3e6f967e498de1ba0ac9b", "index": "0x1" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/time-lock (mainnet and testnet)

- code_hash: `0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451` · hash_type: `data1`
- deployed in tx [`0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792`](https://testnet.explorer.nervos.org/transaction/0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792) (block 14831057) · data_hash `0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451`

```json
{
  "script": { "code_hash": "0x6fac4b2e89360a1e692efcddcb3a28656d8446549fb83da6d896db8b714f4451", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x1b4ffcad55ecd36ffb2715b6816b83da73851f1a24fe594f263c4f34dad90792", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock by a given lock after a time

**Input** · input

```
Cell{ lock: { codeHash: TIME_LOCK, args: {{lock_hash 32B}} ‖ {{locked_until 8B}} } }, since ≥ locked_until
```

**Input** · authorising cell

```
Cell{ lock: hash = lock_hash }
```

**Output** · outputs: any

```
any
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | lock_hash | 32B | required lock script hash | present in inputs | 7 |
| 1 | locked_until | 8B | since-encoded u64 LE | no group input since below it | 6 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 40 bytes | 5 |
| lock | an input has lock hash = args[0..32] | 7 |
| since | every group input since is not below locked_until; with different flag bytes ckb-std cannot compare and it passes (inferred from source) | 6 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 InvalidArguments · 6 LockTimeNotPassed · 7 RequiredLockScriptNotFound
- No signature is checked: security comes entirely from the script that args points to

## Example transactions

- testnet · Time lock unlock · [0x7d0f3bbb29e768119bf0bcc7c4d6603e448492dd4f0f2bee7762863e2c28df01](https://testnet.explorer.nervos.org/transaction/0x7d0f3bbb29e768119bf0bcc7c4d6603e448492dd4f0f2bee7762863e2c28df01) · `node decode-tx.js 0x7d0f3bbb29e768119bf0bcc7c4d6603e448492dd4f0f2bee7762863e2c28df01 --testnet`

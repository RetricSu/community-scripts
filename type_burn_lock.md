# Type Burn Lock Constraints

> Source: ckb-devrel/ckb-proxy-locks / contracts/type-burn-lock/src/entry.rs　·　0xff78…f53a (data1, same on mainnet and testnet)

- id: `type_burn_lock` · lock script · networks: mainnet, testnet · tags: proxy, open-source, nervos, p-proxy-locks
- links: page https://retricsu.github.io/community-scripts/type_burn_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ckb-proxy-locks@38b7e1df](https://github.com/ckb-devrel/ckb-proxy-locks/tree/38b7e1df19828f2203c01b30340be26691b70d7a) · [contracts/type-burn-lock/src/entry.rs](https://github.com/ckb-devrel/ckb-proxy-locks/blob/38b7e1df19828f2203c01b30340be26691b70d7a/contracts/type-burn-lock/src/entry.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@ashuralyk](https://github.com/ashuralyk)

## Deployments

### mainnet — ckb-devrel/ckb-proxy-locks contracts/type-burn-lock (mainnet and testnet)

- code_hash: `0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a` · hash_type: `data1`
- deployed in tx [`0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b`](https://explorer.nervos.org/transaction/0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b) (block 13589704) · data_hash `0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a`

```json
{
  "script": { "code_hash": "0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x10d63a996157d32c01078058000052674ca58d15f921bec7f1dcdac2160eb66b", "index": "0x5" }, "dep_type": "code" }
}
```

### testnet — ckb-devrel/ckb-proxy-locks contracts/type-burn-lock (mainnet and testnet)

- code_hash: `0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a` · hash_type: `data1`
- deployed in tx [`0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93`](https://testnet.explorer.nervos.org/transaction/0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93) (block 14025090) · data_hash `0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0xff78bae0abf17d7a404c0be0f9ad9c9185b3f88dcc60403453d5ba8e1f22f53a", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb4f171c9c9caf7401f54a8e56225ae21d95032150a87a4678eac3f66a3137b93", "index": "0x5" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock by burning a given type

**Input** · input

```
Cell{ lock: { codeHash: TYPE_BURN, args: {{type_hash 32B}} } }
```

**Input** · burnt cell

```
Cell{ type: hash = type_hash }
```

**Output** · outputs: none with that type

```
any (none with type_hash)
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type_hash | 32B | type script hash to burn | in inputs, not in outputs | 6 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 32 bytes | 4 |
| burn | an input has type hash = args[0..32] and no output has it | 6 |

## Notes

- Error codes (error.rs): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 Overflow · 6 TypeScriptNotBurnt
- No signature is checked: security comes entirely from the script that args points to

## Example transactions

- mainnet · Type burn unlock · [0xeba6ab8fcef34e1256db2e535022ecadf2eeb51d89312a91cb96c59b9817689d](https://explorer.nervos.org/transaction/0xeba6ab8fcef34e1256db2e535022ecadf2eeb51d89312a91cb96c59b9817689d) · `node decode-tx.js 0xeba6ab8fcef34e1256db2e535022ecadf2eeb51d89312a91cb96c59b9817689d`

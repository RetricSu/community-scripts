# BTC time lock Constraints

> Source: utxostack/rgbpp / contracts/btc-time-lock/src/main.rs　·　mainnet 0x70d6…5a62 / testnet3 0x00cd…9326 / signet 0x80a0…5b55, hash_type type (rgbpp-sdk)

- id: `btc_time_lock` · lock script · networks: mainnet, testnet · tags: btc, open-source, community, p-rgbpp
- links: page https://retricsu.github.io/community-scripts/btc_time_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [utxostack/rgbpp@4abd216d](https://github.com/utxostack/rgbpp/tree/4abd216dbd5d25b8f59e843de39643f9b7513f9d) · [contracts/btc-time-lock/src/main.rs](https://github.com/utxostack/rgbpp/blob/4abd216dbd5d25b8f59e843de39643f9b7513f9d/contracts/btc-time-lock/src/main.rs) · [crates/core](https://github.com/utxostack/rgbpp/blob/4abd216dbd5d25b8f59e843de39643f9b7513f9d/crates/core) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — rgbpp-sdk packages/ckb/src/constants

- code_hash: `0x70d64497a075bd651e98ac030455ea200637ee325a12ad08aff03f1a117e5a62` · hash_type: `type`
- deployed in tx [`0x3d1c26b966504b09253ad84173bf3baa7b8135c5ff520c32cf70b631c1d08b9b`](https://explorer.nervos.org/transaction/0x3d1c26b966504b09253ad84173bf3baa7b8135c5ff520c32cf70b631c1d08b9b) (block 17659452) · data_hash `0xfac2c0484baf71419420c6abcbd4a54c4f6061eb34fe703e8f254dbeb0439699` · type_id args `0x44b8253ae18e913a2845b0d548eaf6b3ba1099ed26835888932a754194028a8a`

```json
{
  "script": { "code_hash": "0x70d64497a075bd651e98ac030455ea200637ee325a12ad08aff03f1a117e5a62", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3d1c26b966504b09253ad84173bf3baa7b8135c5ff520c32cf70b631c1d08b9b", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — rgbpp-sdk (BTC testnet3)

- code_hash: `0x00cdf8fab0f8ac638758ebf5ea5e4052b1d71e8a77b9f43139718621f6849326` · hash_type: `type`
- deployed in tx [`0x8fb747ff0416a43e135c583b028f98c7b81d3770551b196eb7ba1062dd9acc94`](https://testnet.explorer.nervos.org/transaction/0x8fb747ff0416a43e135c583b028f98c7b81d3770551b196eb7ba1062dd9acc94) (block 18311895) · data_hash `0xd3db94edf2a2d040fb4f0fc93f21e721ef181719717384598c536fd1cfc3ad58` · type_id args `0xc9828585e6dd2afacb9e6e8ca7deb0975121aabee5c7983178a45509ffaec984`

```json
{
  "script": { "code_hash": "0x00cdf8fab0f8ac638758ebf5ea5e4052b1d71e8a77b9f43139718621f6849326", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8fb747ff0416a43e135c583b028f98c7b81d3770551b196eb7ba1062dd9acc94", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — rgbpp-sdk (BTC signet)

- code_hash: `0x80a09eca26d77cea1f5a69471c59481be7404febf40ee90f886c36a948385b55` · hash_type: `type`
- deployed in tx [`0x5364b3535965e9eac9a35dd7af8e9e45a61d30a16e115923c032f80b28783e21`](https://testnet.explorer.nervos.org/transaction/0x5364b3535965e9eac9a35dd7af8e9e45a61d30a16e115923c032f80b28783e21) (block 13560123) · data_hash `0xd3db94edf2a2d040fb4f0fc93f21e721ef181719717384598c536fd1cfc3ad58` · type_id args `0x32fc8c70a6451a1439fd91e214bba093f9cdd9276bc4ab223430dab5940aff92`

```json
{
  "script": { "code_hash": "0x80a09eca26d77cea1f5a69471c59481be7404febf40ee90f886c36a948385b55", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5364b3535965e9eac9a35dd7af8e9e45a61d30a16e115923c032f80b28783e21", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → 1` Release to a CKB lock after enough BTC confirmations

**Input** · BTC time lock cell (from an RGB++ leap)

```
Cell{
  lock: { codeHash: BTC_TIME_LOCK,
          args: BTCTimeLock{ {{lock_script}}, {{after}}, {{btc_txid}} } },
  capacity: C, type: T, data: D
}
```

**Input** · witness[group 0].lock

```
BTCTimeUnlock{ btc_tx_proof: {{SPV proof}} }
```

**Output** · output at the same index

```
Cell{
  lock: {{lock_script}},
  capacity: {{C}}, type: {{T}}, data: {{D}}
}
```

byte layout: args: BTCTimeLock (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | lock_script | Script | the lock to release to | = lock of the output at the same index | 0x40 (64) |
| 1 | after | 4B | required BTC confirmations u32 | RGB++ lock requires ≥ 6 at creation | 0x41 |
| 2 | btc_txid | 32B | the BTC tx that triggered the leap | ≥ after confirmations in the light client | 0x22 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | valid BTCTimeLock (otherwise the script panics) | panic |
| outputs[i] | for each input i with this lock: outputs[i].lock = lock_script and capacity, type, data are identical | 0x40 |
| witness | group first witness.lock is a BTCTimeUnlock | 0x02 / 0x35 |
| config | BTCTimeLock config cell in cell_deps | 0x10 / 0x11 |
| SPV | btc_txid has ≥ after confirmations | 0x20–0x23 |

## Notes

- Error codes are shared with RGB++ lock (crates/core/src/error.rs)
- No signature: anyone can submit the release once confirmed

## Example transactions

- mainnet · BTC time lock release · [0xcde27ef17f92d80872fbe59a446cb469a1285c7c0fdcdf8d986899903124b5d1](https://explorer.nervos.org/transaction/0xcde27ef17f92d80872fbe59a446cb469a1285c7c0fdcdf8d986899903124b5d1) · `node decode-tx.js 0xcde27ef17f92d80872fbe59a446cb469a1285c7c0fdcdf8d986899903124b5d1`

# NexisDAO dCKB Type Lock Constraints

> Source: NexisDao/NexisDao-core @1447fed contracts/type_lock/src/entry.rs　·　mainnet 0x8baa…74de (data)

- id: `nexisdao_type_lock` · lock script · networks: mainnet · tags: defi, open-source, community
- links: page https://retricsu.github.io/community-scripts/nexisdao_type_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [NexisDao/NexisDao-core@1447fed9](https://github.com/NexisDao/NexisDao-core/tree/1447fed98e74935394e877c9a78a368ae3e6dbd5) · [contracts/type_lock/src/entry.rs](https://github.com/NexisDao/NexisDao-core/blob/1447fed98e74935394e877c9a78a368ae3e6dbd5/contracts/type_lock/src/entry.rs) · [contracts/type_lock/src/error.rs](https://github.com/NexisDao/NexisDao-core/blob/1447fed98e74935394e877c9a78a368ae3e6dbd5/contracts/type_lock/src/error.rs) (default-branch HEAD read 2026-11-06 (the repo has a single commit); code hash from dckb-rescuer/v1-core README)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@NexisDao](https://github.com/NexisDao)

## Deployments

### mainnet — dckb-rescuer/v1-core README ("Type lock … deployed with this code hash"); seen on chain as a data lock of dCKB NervosDAO deposits

- code_hash: `0x8baa01f58baab0cb58fc319136ea4f6866ed59c323fa94bf7d6b72bea21c74de` · hash_type: `data`
- deployed in tx [`0x584ddf4379ae4fc87a435162c77faf9bbd55e5704f7ffbdcfa5052ed81f6770f`](https://explorer.nervos.org/transaction/0x584ddf4379ae4fc87a435162c77faf9bbd55e5704f7ffbdcfa5052ed81f6770f) (block 5664076) · data_hash `0x8baa01f58baab0cb58fc319136ea4f6866ed59c323fa94bf7d6b72bea21c74de`

```json
{
  "script": { "code_hash": "0x8baa01f58baab0cb58fc319136ea4f6866ed59c323fa94bf7d6b72bea21c74de", "hash_type": "data", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x584ddf4379ae4fc87a435162c77faf9bbd55e5704f7ffbdcfa5052ed81f6770f", "index": "0x4" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → *` Unlock: the named type must appear in the tx

**Input** · locked cell (e.g. a dCKB NervosDAO deposit)

```
Cell{
  lock: { codeHash: {{TYPE_LOCK}}, hashType: data,
          args: [{{mode 1B}}] ‖ {{type_hash 32B}} }
}
```

**Input** · another input (mode 1 / 0)

```
Cell{ type: {{hash = type_hash}} }
```

**Output** · or some output (mode 2 / 0)

```
Cell{ type: {{hash = type_hash}} }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | mode | 1B (omitted = 0 when args is 32 bytes) | 1 inputs only · 2 outputs only · other inputs then outputs | — | 5 |
| 1 | type_hash | 32B | type script hash that must appear | found where mode says | 6 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | not empty | 5 |
| type | an input / output (per mode) has type hash = the value in args | 6 |

## Notes

- There is no signature check: including a cell with the named type unlocks it. dCKB deposits use args 0x01 ‖ DAO-info type hash, so the dCKB DAO Info type carries the real rules (per the community dckb-rescuer/v1-core notes).
- Deployment source: the code hash comes from the community repo dckb-rescuer/v1-core README and appears on mainnet dCKB deposit txs (hash_type data). The original NexisDAO repo records no deployment hash; no reproducible build was attempted.
- When args is not 32 bytes, args[1..] is the type hash; if that is not 32 bytes it can never match (6).
- Error codes (error.rs): 1–4 syscall · 5 ErrArgs · 6 ErrNotExist

## Example transactions

- mainnet · dCKB deposit withdraw (type lock unlock) · [0xea27ccf14608f2b3472bac6047718b5c6dd4d2d61a47912bf223ae99ee080b16](https://explorer.nervos.org/transaction/0xea27ccf14608f2b3472bac6047718b5c6dd4d2d61a47912bf223ae99ee080b16) · `node decode-tx.js 0xea27ccf14608f2b3472bac6047718b5c6dd4d2d61a47912bf223ae99ee080b16`
- mainnet · dCKB deposit withdraw (2) · [0x88ed8e7a00894a2932c63d0b4c53c72a23a78d68dfd4d130a5f556798837948d](https://explorer.nervos.org/transaction/0x88ed8e7a00894a2932c63d0b4c53c72a23a78d68dfd4d130a5f556798837948d) · `node decode-tx.js 0x88ed8e7a00894a2932c63d0b4c53c72a23a78d68dfd4d130a5f556798837948d`

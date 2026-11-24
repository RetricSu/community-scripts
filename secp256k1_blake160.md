# secp256k1_blake160_sighash_all (lock) Constraints

> Source: ckb-system-scripts / c/secp256k1_blake160_sighash_all.c + c/common.h　·　code_hash 0x9bd7…cce8, hash_type type (RFC 0024)

- id: `secp256k1_blake160` · lock script · networks: mainnet, testnet · tags: system, identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/secp256k1_blake160.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-system-scripts@72eb92fc](https://github.com/nervosnetwork/ckb-system-scripts/tree/72eb92fca090700dcb398cd8cad8fbd8bad40355) · [c/secp256k1_blake160_sighash_all.c](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/secp256k1_blake160_sighash_all.c) · [c/common.h](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/common.h) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8` · hash_type: `type`
- deployed in tx [`0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c`](https://explorer.nervos.org/transaction/0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c) (block 0) · data_hash `0x709f3fda12f561cfacf92273c57a98fede188a3f1a59b1f888d113f9cce08649` · type_id args `0x8536c9d5d908bd89fc70099e4284870708b6632356aad98734fcf43f6f71c304`

```json
{
  "script": { "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8` · hash_type: `type`
- deployed in tx [`0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f`](https://testnet.explorer.nervos.org/transaction/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f) (block 0) · data_hash `0x709f3fda12f561cfacf92273c57a98fede188a3f1a59b1f888d113f9cce08649` · type_id args `0x8536c9d5d908bd89fc70099e4284870708b6632356aad98734fcf43f6f71c304`

```json
{
  "script": { "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → N` Unlock & spend

**Input** · input (script group of the same lock)

```
Cell{
  lock: { codeHash: SECP256K1_BLAKE160,
          args: {{blake160(pubkey) 20B}} }
}
```

**Input** · witness[at the group's first input index]

```
WitnessArgs{
  lock: {{signature 65B}}
}
// lock is zero-filled (65B) while signing
```

**Output** · outputs: any cells

```
Cell{
  lock: any,
  type: any
}
```

byte layout: witness.lock byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | r‖s | 64B | secp256k1 compact signature | parsable | -14 |
| 1 | recid | 1B | recovery id (lock[64]) | pubkey recoverable / serializable | -11 / -15 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 20 bytes | -1 |
| witness | ≤ 32KB | -22 |
| witness | valid WitnessArgs with non-empty lock | -2 |
| witness.lock | exactly 65 bytes | -1 |
| signature | recovered blake160(compressed pubkey) = args | -31 |

## Notes

- signing message = blake2b(tx_hash ‖ len(w0) ‖ w0 (lock zeroed) ‖ len‖content of the group's other witnesses ‖ len‖content of witnesses beyond the inputs count); len is u64 LE
- Other error codes: -3 ERROR_SYSCALL, -21 ERROR_SCRIPT_TOO_LONG

## Example transactions

- mainnet · secp256k1 (DAO phase 2 tx) · [0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb](https://explorer.nervos.org/transaction/0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb) · `node decode-tx.js 0xbaa72648c975a63097ae1500336475d70aa7ba8f0daf71405f883bd2b6e55dbb`

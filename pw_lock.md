# PW lock Constraints

> Source: lay2dev/pw-lock / c/secp256k1_keccak256_sighash_all_acpl.c (deployed build assumed to be acpl, unverified)　·　mainnet 0xbf43…febc / testnet 0x58c5…5a63, hash_type type (ccc)

- id: `pw_lock` · lock script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/pw_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [lay2dev/pw-lock@9445db0a](https://github.com/lay2dev/pw-lock/tree/9445db0aece263df76255d84c55c3b538b188435) · [c/secp256k1_keccak256_sighash_all_acpl.c](https://github.com/lay2dev/pw-lock/blob/9445db0aece263df76255d84c55c3b538b188435/c/secp256k1_keccak256_sighash_all_acpl.c) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded); mainnet type_id code cell upgraded 2026-11 (data hash 0x48e13371…); lay2dev/pw-lock HEAD still identical to recorded commit — which source/release built the new binary is unknown)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-09
- contributors: [@johnz1019](https://github.com/johnz1019)

## Deployments

### mainnet — ccc KnownScript.PWLock

- code_hash: `0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc` · hash_type: `type`
- deployed in tx [`0x7534a9800b6722342044d4449693470560a13c37f8e560dfc0a82d6639be7f4b`](https://explorer.nervos.org/transaction/0x7534a9800b6722342044d4449693470560a13c37f8e560dfc0a82d6639be7f4b) (block 20961351) · data_hash `0x48e13371dada58b708d49334dc6418d7f371ded0b550e2c9c5e8aa0a45b63d84` · type_id args `0x42ade2f25eb938b5dbfd3d8f07b8b07aa593d848e7ff14bdfbbea5aeb6175261`

```json
{
  "script": { "code_hash": "0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7534a9800b6722342044d4449693470560a13c37f8e560dfc0a82d6639be7f4b", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ccc KnownScript.PWLock

- code_hash: `0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63` · hash_type: `type`
- deployed in tx [`0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38`](https://testnet.explorer.nervos.org/transaction/0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38) (block 412378) · data_hash `0xeffe377419256d150d68368d7cb5731edad39d1805a8c2c73ce8e9615b9f9878` · type_id args `0xf6d90bfe3041d0fd7e01c45770241697f5f837974bd6ae1672a7ec0f9f523268`

```json
{
  "script": { "code_hash": "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Spend with an Ethereum signature

**Input** · input

```
Cell{
  lock: { codeHash: PW_LOCK,
          args: {{eth_address 20B}} ‖ ckb_min? ‖ udt_min? }
}
```

**Input** · witness

```
WitnessArgs{ lock: {{signature 65B}} }
```

**Output** · outputs: any

```
Cell{ lock: any }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | eth_address | 20B | keccak256(uncompressed pubkey)[12..32] | = recovered signer | -31 |
| 1 | ckb_min? | 1B | min CKB payment = 10^x | optional | -1 |
| 2 | udt_min? | 1B | min UDT payment = 10^x | optional | -1 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | 20–22 bytes | -1 |
| witness.lock | non-empty selects the signature path and must be exactly 65 bytes | -1 |
| signature | address recovered from keccak256 sighash_all (lock zeroed) = args[0..20] | -11 / -14 / -15 / -31 |

### 2. `B` Payment without signature (same as anyone_can_pay)

**Input** · PW lock inputs

```
Cell{ lock: PW_LOCK(args), capacity: C, type: T?, data: udt? }
```

**Input** · witness

```
witness missing or lock empty
```

**Output** · same-lock outputs

```
Cell{ lock: same, type: same T,
  capacity ≥ C + 10^ckb_min or = C,
  udt ≥ U + 10^udt_min or = U }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| amount | CKB or UDT grows by ≥ minimum, the other unchanged | -42 |
| pairing | inputs and outputs pair 1:1 by type | -44 / -45 / -46 |
| data | no-type data empty; typed data ≥ 16B | -2 |
| inputs | ≤ 256 | -43 |

## Notes

- Error codes (common.h): -1 ARGUMENTS_LEN · -2 ENCODING · -3 SYSCALL · -11/-12/-13/-14/-15 secp · -18 TOO_MANY_OUTPUT_CELLS · -21 SCRIPT_TOO_LONG · -22 WITNESS_SIZE · -31 PUBKEY_BLAKE160_HASH · -41…-46 ACP

## Example transactions

- mainnet · PW lock (signature) · [0x1f96c885bf2201cd764e7150da87a0cf89e00e31c89e1687033f87808d7de91b](https://explorer.nervos.org/transaction/0x1f96c885bf2201cd764e7150da87a0cf89e00e31c89e1687033f87808d7de91b) · `node decode-tx.js 0x1f96c885bf2201cd764e7150da87a0cf89e00e31c89e1687033f87808d7de91b`
- mainnet · PW lock (payment, no signature) · [0xe27d52f2c3ce265661a665695c59dee3eefc48fa0003e2b589551db07cfb68e7](https://explorer.nervos.org/transaction/0xe27d52f2c3ce265661a665695c59dee3eefc48fa0003e2b589551db07cfb68e7) · `node decode-tx.js 0xe27d52f2c3ce265661a665695c59dee3eefc48fa0003e2b589551db07cfb68e7`

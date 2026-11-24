# secp256k1_blake160_multisig_all (lock) Constraints

> Source: ckb-system-scripts / c/secp256k1_blake160_multisig_all.c + c/common.h　·　This is a lock script: it runs only when the cell is unlocked (consumed)

- id: `multisig_legacy` · lock script · networks: mainnet, testnet · tags: system, identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/multisig_legacy.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-system-scripts@72eb92fc](https://github.com/nervosnetwork/ckb-system-scripts/tree/72eb92fca090700dcb398cd8cad8fbd8bad40355) · [c/secp256k1_blake160_multisig_all.c](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/secp256k1_blake160_multisig_all.c) · [c/common.h](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/common.h) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8` · hash_type: `type`
- deployed in tx [`0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c`](https://explorer.nervos.org/transaction/0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c) (block 0) · data_hash `0x43400de165f0821abf63dcac299bbdf7fd73898675ee4ddb099b0a0d8db63bfb` · type_id args `0xd813c1b15bd79c8321ad7f5819e5d9f659a1042b72e64659a2c092be68ea9758`

```json
{
  "script": { "code_hash": "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c", "index": "0x1" }, "dep_type": "dep_group" }
}
```

### testnet — RFC 0024 (Lina & Aggron)

- code_hash: `0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8` · hash_type: `type`
- deployed in tx [`0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f`](https://testnet.explorer.nervos.org/transaction/0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f) (block 0) · data_hash `0x43400de165f0821abf63dcac299bbdf7fd73898675ee4ddb099b0a0d8db63bfb` · type_id args `0xd813c1b15bd79c8321ad7f5819e5d9f659a1042b72e64659a2c092be68ea9758`

```json
{
  "script": { "code_hash": "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37", "index": "0x1" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → N` Unlock & spend a multisig cell

**Input** · input (script group of the same lock; may be several)

```
Cell{
  capacity: …,
  lock: { codeHash: MULTISIG,
          args: {{blake160(multisig_script) 20B}} {{[+ since u64 LE 8B]}} },
  since: {{satisfies the since in args (if any)}}
}
```

**Input** · witness[at the group's first input index]

```
WitnessArgs{
  lock: {{multisig_script}} ‖ {{signature[0..M-1]}}
}
length must = 4 + 20·N + 65·M
```

**Output** · outputs: any cells

```
Cell{
  capacity: …,
  lock: any,
  type: any
}
```

byte layout: witness.lock byte layout (multisig_script ‖ signatures)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | S | 1B | reserved field (lock[0]) | must be 0 | -41 |
| 1 | R | 1B | require_first_n (lock[1]): pubkey_hash[0..R-1] must all sign | R ≤ M | -44; unmet -52 |
| 2 | M | 1B | threshold (lock[2]): number of required signatures | 0 < M ≤ N | -43 |
| 3 | N | 1B | pubkeys_cnt (lock[3]): total number of pubkeys | N > 0 | -42 |
| 4 | pubkey_hash[0..N-1] | 20B × N | blake160(33-byte compressed pubkey); order matters (R refers to the first R) | each signature's recovered pubkey hash must match a not-yet-used entry | -52 |
| 5 | signature[0..M-1] | 65B × M | recoverable secp256k1 signature: r‖s (64B) + recid (1B); zero-filled when computing the signing message | parsable / pubkey recoverable / serializable | -14 / -11 / -15 |

Note: multisig_script = first 4+20·N bytes (S|R|M|N|pubkey_hashes); lock length ≠ 4+20·N+65·M → (-22); lock < 4 bytes → (-22)

byte layout: Deriving lock.args

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | blake160(multisig_script) | 20B | first 20 bytes of blake2b-256(personal="ckb-default-hash")(multisig_script) | must equal args[0..20] | -51 |
| 1 | since (optional) | 8B u64 LE | time lock: every input in the group must have identical since flags and a value ≥ this | args length must be 20 or 28 | -1; flags -23; value -24 |

byte layout: Example: 2-of-3, R=0 (pubkey hashes are placeholders)

| # | field | size |
| --- | --- | --- |
| 0 | S=00 | 1B |
| 1 | R=00 | 1B |
| 2 | M=02 | 1B |
| 3 | N=03 | 1B |
| 4 | 11…11 / 22…22 / 33…33 | 3 × 20B |

Example:

- multisig_script: `0x{{00}}{{00}}{{02}}{{03}}111111111111111111111111111111111111111122222222222222222222222222222222222222223333333333333333333333333333333333333333  (64B)`
- args (20B): `0xbf96e998f1616a35247a9ab89bfd3f485af397fe`
- args + since (28B): `0xbf96e998f1616a35247a9ab89bfd3f485af397fe6400000000010020  ← since=0x2000010000000064 (absolute epoch 100), LE`
- witness.lock length: `4 + 20×3 + 65×2 = 194 bytes (last 130 bytes zeroed while signing)`

Note: any 2 distinct members can sign; if R=1, pubkey_hash[0] must be one of the signers

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length is 20 or 28 bytes | -1 |
| since in args | every input in this group must have exactly the same since flags | -23 |
| input.since value | ≥ the since value in args (epochs compared as fractions) | -24 |
| witness | valid WitnessArgs with non-empty lock | -2 |
| witness size | ≤ 32KB; lock ≥ 4 bytes; and lock length = 4 + 20·N + 65·M | -22 |
| blake160(multisig_script) | equals the first 20 bytes of args | -51 |
| signatures | the M signatures each recover a distinct one of the N pubkeys; the first R pubkeys must all sign | -52 |
| signature format | cannot parse / cannot recover pubkey / cannot serialize | -14 / -11 / -15 |

## Notes

- signing message = blake2b(tx_hash ‖ len(w0) ‖ w0 (signatures zeroed) ‖ len‖content of the group's other witnesses ‖ len‖content of witnesses beyond the inputs count); len is u64 LE
- blake160 = first 20 bytes of blake2b-256 (CKB personalization); other error codes: -3 ERROR_SYSCALL, -21 ERROR_SCRIPT_TOO_LONG

## Example transactions

- mainnet · multisig legacy 7/12 · [0x80136926c075b54911f6cdf420ab6fb47e1b6f39367c2b0eb1583a23e5bcd71f](https://explorer.nervos.org/transaction/0x80136926c075b54911f6cdf420ab6fb47e1b6f39367c2b0eb1583a23e5bcd71f) · `node decode-tx.js 0x80136926c075b54911f6cdf420ab6fb47e1b6f39367c2b0eb1583a23e5bcd71f`

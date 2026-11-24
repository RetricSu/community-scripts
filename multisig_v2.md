# secp256k1_blake160_multisig_all V2 (lock) Constraints

> code_hash 0x36c9…0d29, hash_type data1 (ckb-sdk MultisigScript::V2 / ckb-devrel ccc)　·　ckb-system-scripts PR #99: improved optional-since handling; witness layout identical to legacy (constraints below follow the legacy source)

- id: `multisig_v2` · lock script · networks: mainnet, testnet · tags: system, identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/multisig_v2.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-system-scripts@72eb92fc](https://github.com/nervosnetwork/ckb-system-scripts/tree/72eb92fca090700dcb398cd8cad8fbd8bad40355) · [c/secp256k1_blake160_multisig_all.c](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/secp256k1_blake160_multisig_all.c) · [c/common.h](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/common.h) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — ckb-sdk MultisigScript::V2; ckb-devrel/ccc (mainnet & testnet)

- code_hash: `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29` · hash_type: `data1`
- deployed in tx [`0x3e27a1a247f2378dd609dbb2f29876350ac2898d22332dac64bfa22d1e5fa282`](https://explorer.nervos.org/transaction/0x3e27a1a247f2378dd609dbb2f29876350ac2898d22332dac64bfa22d1e5fa282) (block 15936922) · data_hash `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29`

```json
{
  "script": { "code_hash": "0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x6888aa39ab30c570c2c30d9d5684d3769bf77265a7973211a3c087fe8efbf738", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — ckb-sdk MultisigScript::V2; ckb-devrel/ccc (mainnet & testnet)

- code_hash: `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29` · hash_type: `data1`
- deployed in tx [`0x732857f7ce93ee4d1ea1c6bd540002d12783bf05525b9ff0370d53f018b68685`](https://testnet.explorer.nervos.org/transaction/0x732857f7ce93ee4d1ea1c6bd540002d12783bf05525b9ff0370d53f018b68685) (block 16668158) · data_hash `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29` · type_id args `0x67666133208c3b5647a9c4cbee32e3fc5388b528a6414adfb04894307c910c2c`

```json
{
  "script": { "code_hash": "0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x2eefdeb21f3a3edf697c28a52601b4419806ed60bb427420455cc29a090b26d5", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### mainnet — ccc KnownScript.Secp256k1MultisigV2Beta (PR #98)

- code_hash: `0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821` · hash_type: `type`
- deployed in tx [`0x0a13d8d9c83c3374196ee43d4f0116dac497b0fec3e71c04f7cb7780abc455d8`](https://explorer.nervos.org/transaction/0x0a13d8d9c83c3374196ee43d4f0116dac497b0fec3e71c04f7cb7780abc455d8) (block 13948668) · data_hash `0x50c8623ef5112510ccdf2d8e480d02d0de7288eb9968f8b019817340c3991145` · type_id args `0x351ab02b4feb1c8ef39e99270ca4799d6d45d1fd8708061791f8fa298df13da4`

```json
{
  "script": { "code_hash": "0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0a13d8d9c83c3374196ee43d4f0116dac497b0fec3e71c04f7cb7780abc455d8", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ccc KnownScript.Secp256k1MultisigV2Beta (PR #98)

- code_hash: `0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09` · hash_type: `type`
- deployed in tx [`0xe6774580c98c8b15799c628f539ed5722f3bc2b17206c2280e15f99be3c1ad71`](https://testnet.explorer.nervos.org/transaction/0xe6774580c98c8b15799c628f539ed5722f3bc2b17206c2280e15f99be3c1ad71) (block 14236278) · data_hash `0x50c8623ef5112510ccdf2d8e480d02d0de7288eb9968f8b019817340c3991145` · type_id args `0xbbde6d0d2ac9d299c1b78ef903e85d7f17c638188ca67d0b6135362b3ed0bc13`

```json
{
  "script": { "code_hash": "0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe6774580c98c8b15799c628f539ed5722f3bc2b17206c2280e15f99be3c1ad71", "index": "0x0" }, "dep_type": "code" }
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

- mainnet · multisig v2 2/3 · [0x1a4d5e3838d72dda8b3aa1119116e7c82bedb22098b15500b57c72f4bf119470](https://explorer.nervos.org/transaction/0x1a4d5e3838d72dda8b3aa1119116e7c82bedb22098b15500b57c72f4bf119470) · `node decode-tx.js 0x1a4d5e3838d72dda8b3aa1119116e7c82bedb22098b15500b57c72f4bf119470`
- mainnet · multisig v2 beta (PR #98) · [0x614c534c2a4012d87e6827c414fb6bd549a6398315aeea9afbf8c63dc6db1cb7](https://explorer.nervos.org/transaction/0x614c534c2a4012d87e6827c414fb6bd549a6398315aeea9afbf8c63dc6db1cb7) · `node decode-tx.js 0x614c534c2a4012d87e6827c414fb6bd549a6398315aeea9afbf8c63dc6db1cb7`

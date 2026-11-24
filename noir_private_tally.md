# Noir Private Tally (v2) Constraints

> Source: wamimi/noir-ckb-verifier @e4ba787 contracts/crates/private-tally/src/main.rs, build.rs, docs/private-tally-v2-spec.md　·　testnet 0x3cc4…37d1 (data1)　·　deployment in evidence/private-tally-testnet.md

- id: `noir_private_tally` · type script · networks: testnet · tags: zk, open-source, community
- links: page https://retricsu.github.io/community-scripts/noir_private_tally.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [wamimi/noir-ckb-verifier@e4ba7876](https://github.com/wamimi/noir-ckb-verifier/tree/e4ba787626031a8bed92beaa567a87fe51a6b5f8) · [contracts/crates/private-tally/src/main.rs](https://github.com/wamimi/noir-ckb-verifier/blob/e4ba787626031a8bed92beaa567a87fe51a6b5f8/contracts/crates/private-tally/src/main.rs) · [contracts/crates/private-tally/build.rs](https://github.com/wamimi/noir-ckb-verifier/blob/e4ba787626031a8bed92beaa567a87fe51a6b5f8/contracts/crates/private-tally/build.rs) · [docs/private-tally-v2-spec.md](https://github.com/wamimi/noir-ckb-verifier/blob/e4ba787626031a8bed92beaa567a87fe51a6b5f8/docs/private-tally-v2-spec.md) (commit read when writing this spec (default-branch HEAD 2026-11-10). Deployment + compiled-in policy values from evidence/private-tally-testnet/deployment.json and evidence/private-tally-testnet.md (deploy tx 0x39ef90b8…b1f9: type :0, VK :1, guard :2). wire-decode / verifier-core pinned at CECILIA-MULANDI/groth16-ckb@d64c769 (read; differs from e969ad1 only by formatting in wire-decode).)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-12
- contributors: [@wamimi](https://github.com/wamimi)

## Deployments

### testnet — noir-ckb-verifier evidence/private-tally-testnet/deployment.json (artifacts.type.data_hash) + evidence/private-tally-testnet.md

- code_hash: `0x3cc448db51cdc14453fff7bdf2c3d39e1dd7a238091b982069d20e169e8337d1` · hash_type: `data1`
- deployed in tx [`0x39ef90b8e6a882af3a658dc5c01cf17476e39907741541358d7155954547b1f9`](https://testnet.explorer.nervos.org/transaction/0x39ef90b8e6a882af3a658dc5c01cf17476e39907741541358d7155954547b1f9) (block 22966804) · data_hash `0x3cc448db51cdc14453fff7bdf2c3d39e1dd7a238091b982069d20e169e8337d1`

```json
{
  "script": { "code_hash": "0x3cc448db51cdc14453fff7bdf2c3d39e1dd7a238091b982069d20e169e8337d1", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x39ef90b8e6a882af3a658dc5c01cf17476e39907741541358d7155954547b1f9", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create a tally (proof of the initial commitment, c_old = 0)

**Input** · any funding cells

```
inputs[0] determines the type_id
```

**Output** · tally cell (exactly one)

```
Cell{
  capacity: C,
  lock: {{GUARD (always-success, data1, empty args)}},
  type: PRIVATE_TALLY{ args: {{0x01 ‖ type_id}} },
  data: {{0x01 ‖ c_new}}
}
```

**Output** · witness[at the group output index]

```
WitnessArgs{
  output_type: {{Groth16Witness v1(proof, public)}}
}
total ≤ 512B
```

byte layout: type.args byte layout (33B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | version | = 0x01; and hash_type = data1 | 41 |
| 1 | type_id | 32B | ckb-std type_id: on creation = blake2b(inputs[0] ‖ group output index) | validate_type_id passes | 44 |

Example:

- ver: `0x01`
- type_id: `0xe56d70c7bc38fbb7ecff7ab2a7ac2c7338b259a9d860ac54c6c593d08cffaced`

Note: Example: output 0 of testnet tx 0xa93b9ed5…4a73

byte layout: cell data byte layout (33B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | state version | = 0x01, total exactly 33 | 43 |
| 1 | commitment | 32B LE | commitment hiding the tally (Fr element, LE) | ≠ 0 and < BN254 scalar modulus | 54 |

Example:

- ver: `0x01`
- commitment: `0xaaa3578eb5b7e27392fd7d4e8765b5eafb2076d1033facbae99e49cdf4c9dd0a`

byte layout: public-input vector (132B, verifier encoding)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | count | 4B u32 LE | fixed 4 | = 4 | 49 |
| 1 | c_old | 32B | old commitment; all zero on creation |  | 49 |
| 2 | c_new | 32B | new commitment = output data[1..33] |  | 49 |
| 3 | ctx_lo | 16B ‖ 16B 0 | context digest[0..16], upper 16 bytes zero |  | 49 |
| 4 | ctx_hi | 16B ‖ 16B 0 | context digest[16..32], upper 16 bytes zero |  | 49 |

Note: Groth16Witness.public_inputs in the witness must equal this vector byte for byte, else 49

byte layout: context digest = blake2b-256(ckb-default-hash, …)

| # | field | size | meaning |
| --- | --- | --- | --- |
| 0 | prefix | 34B | "noir-ckb/private-tally/context/v2\0" |
| 1 | network_domain | 32B | compiled in: testnet genesis hash 0x10639e08…9606 |
| 2 | profile | 32B | blake2b("noir-ckb/private-tally/v2") |
| 3 | script_hash | 32B | this type script hash |
| 4 | type_id | 32B | args[1..33] |
| 5 | op | 1B | 0 = creation, 1 = update |
| 6 | outpoint | 36B | update: group input OutPoint; creation: zeros |
| 7 | c_old ‖ c_new | 64B | old / new commitment |
| 8 | lock_hash | 32B | output lock hash |
| 9 | capacity | 8B LE | output capacity |

**Also**

- cell_deps: [ PRIVATE_TALLY code, GUARD code, {{VK cell (data hash 0x91ad…2e5b, exactly one)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | args 33B, args[0] = 1, hash_type = data1 | 41 |
| inputs / outputs / cell_deps | ≤ 64 each (cell_deps counted after expansion) | 52 |
| same-code type cells | inputs ≤ 1, outputs = 1, group outputs = 1, group inputs = same-code inputs (any args; no batching) | 42 |
| type_id | ckb-std validate_type_id(args[1..33]) | 44 |
| output lock | code_hash = GUARD_DATA_HASH (0xe683…60d7), data1, empty args | 45 |
| output data | exactly 33B and data[0] = 1 | 43 |
| c_new | ≠ 0 and < BN254 modulus | 54 |
| witness | witness at the group output index (≤ 512B), WitnessArgs.output_type present and decodable | 48 |
| public inputs | = rebuilt [c_old, c_new, ctx_lo, ctx_hi] | 49 |
| cell_deps | exactly one cell with data hash = VK_DATA_HASH (0x91ad…2e5b), decodable as Groth16VerifyingKey v1 (≤ 512B) | 50 |
| Groth16 | BN254 proof verifies against the rebuilt public inputs | 51 |
| any load | syscall failure | 40 |

### 2. `1 → 1` Update: add a hidden amount (incl. +0 cover update)

**Input** · old tally cell (group input)

```
Cell{
  capacity: {{C}},
  lock: {{GUARD}},
  type: PRIVATE_TALLY(args),
  data: {{0x01 ‖ c_old}}
}
```

**Input** · witness[at the group input index]

```
WitnessArgs{
  input_type: {{Groth16Witness v1(proof, public)}}
}
total ≤ 512B
```

**Output** · new tally cell (exactly one)

```
Cell{
  capacity: {{= C}},
  lock: {{GUARD}},
  type: PRIVATE_TALLY(args unchanged),
  data: {{0x01 ‖ c_new}}
}
```

byte layout: cell data byte layout (33B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | state version | = 0x01, total exactly 33 | 43 |
| 1 | commitment | 32B LE | commitment hiding the tally (Fr element, LE) | ≠ 0 and < BN254 scalar modulus | 54 |

Example:

- ver: `0x01`
- commitment: `0xaaa3578eb5b7e27392fd7d4e8765b5eafb2076d1033facbae99e49cdf4c9dd0a`

byte layout: public-input vector (132B, verifier encoding)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | count | 4B u32 LE | fixed 4 | = 4 | 49 |
| 1 | c_old | 32B | old commitment; all zero on creation |  | 49 |
| 2 | c_new | 32B | new commitment = output data[1..33] |  | 49 |
| 3 | ctx_lo | 16B ‖ 16B 0 | context digest[0..16], upper 16 bytes zero |  | 49 |
| 4 | ctx_hi | 16B ‖ 16B 0 | context digest[16..32], upper 16 bytes zero |  | 49 |

Note: Groth16Witness.public_inputs in the witness must equal this vector byte for byte, else 49

**Also**

- cell_deps: [ PRIVATE_TALLY code, GUARD code, {{VK cell (exactly one)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | args 33B, args[0] = 1, hash_type = data1 | 41 |
| inputs / outputs / cell_deps | ≤ 64 each (cell_deps counted after expansion) | 52 |
| same-code type cells | inputs ≤ 1, outputs = 1, group outputs = 1, group inputs = same-code inputs (any args; no batching) | 42 |
| type_id | ckb-std validate_type_id(args[1..33]) | 44 |
| output lock | code_hash = GUARD_DATA_HASH (0xe683…60d7), data1, empty args | 45 |
| output data | exactly 33B and data[0] = 1 | 43 |
| c_new | ≠ 0 and < BN254 modulus | 54 |
| input lock | = GUARD | 45 |
| input data | 33B, data[0] = 1; c_old ≠ 0 and < modulus | 43 / 54 |
| capacity | input capacity = output capacity | 47 |
| witness | witness at the group input index (≤ 512B), WitnessArgs.input_type present and decodable | 48 |
| public inputs | = rebuilt [c_old, c_new, ctx_lo, ctx_hi] | 49 |
| cell_deps | exactly one cell with data hash = VK_DATA_HASH (0x91ad…2e5b), decodable as Groth16VerifyingKey v1 (≤ 512B) | 50 |
| Groth16 | BN254 proof verifies against the rebuilt public inputs | 51 |
| any load | syscall failure | 40 |

## Notes

- Error codes are the constants in main.rs: 40 LOAD, 41 ARGS, 42 SHAPE, 43 STATE, 44 ID, 45 GUARD, 47 CAPACITY, 48 WITNESS, 49 PUBLIC, 50 VK, 51 PROOF, 52 LIMIT, 54 COMMITMENT (46 and 53 unused). Check order: 41 → 52 → 42 → 44 → 45 → 43/54 → (update) 45/43/54/47 → 48 → 49 → 50 → 51.
- NETWORK_DOMAIN, GUARD_DATA_HASH and VK_DATA_HASH are compiled in by build.rs from environment variables; this page uses the testnet values recorded in evidence/private-tally-testnet/deployment.json. There is no signature: the proof (bound to the context digest) is the only authority, and the guard lock is always-success.
- The amount and the "new = old + hidden amount" relation are enforced by the Noir circuit, not compared by the script code; on chain only the commitment changes. The decoder recomputes type_id, the context digest and the public inputs; the VK lookup and Groth16 pairing are NOT_CHECKED.

## Example transactions

- testnet · Private tally create at 0 · [0x58d646231e2dfc66f3cf2d07199ad6863e733489342b811c5473e223be6eca67](https://testnet.explorer.nervos.org/transaction/0x58d646231e2dfc66f3cf2d07199ad6863e733489342b811c5473e223be6eca67) · `node decode-tx.js 0x58d646231e2dfc66f3cf2d07199ad6863e733489342b811c5473e223be6eca67 --testnet`
- testnet · Private tally update by a hidden amount · [0xa93b9ed57c45ca3a031b92b1e0bf68851796c2eb3aabdcab61a14383ca1c4a73](https://testnet.explorer.nervos.org/transaction/0xa93b9ed57c45ca3a031b92b1e0bf68851796c2eb3aabdcab61a14383ca1c4a73) · `node decode-tx.js 0xa93b9ed57c45ca3a031b92b1e0bf68851796c2eb3aabdcab61a14383ca1c4a73 --testnet`
- testnet · Private tally cover update (+0) · [0xbc062ecc84515e573a5c723f36b081733b8d95c71fb15ef7e414ee2ad766046c](https://testnet.explorer.nervos.org/transaction/0xbc062ecc84515e573a5c723f36b081733b8d95c71fb15ef7e414ee2ad766046c) · `node decode-tx.js 0xbc062ecc84515e573a5c723f36b081733b8d95c71fb15ef7e414ee2ad766046c --testnet`
- testnet · Private tally update (second account, join path) · [0x5b2d128dab1f3b888f2cc98b2fa844dc67b1e9eec24eeeee354da6bcd029caff](https://testnet.explorer.nervos.org/transaction/0x5b2d128dab1f3b888f2cc98b2fa844dc67b1e9eec24eeeee354da6bcd029caff) · `node decode-tx.js 0x5b2d128dab1f3b888f2cc98b2fa844dc67b1e9eec24eeeee354da6bcd029caff --testnet`

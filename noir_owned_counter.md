# Noir owned counter (type) Constraints

> Source: wamimi/noir-ckb-verifier @ bf09ccf / contracts/crates/owned-counter/src/main.rs　·　testnet 0x79d7…0a88 (data1)　·　research software, testnet only, single-party setup

- id: `noir_owned_counter` · type script · networks: testnet · tags: zk, open-source, community
- links: page https://retricsu.github.io/community-scripts/noir_owned_counter.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [wamimi/noir-ckb-verifier@bf09ccfa](https://github.com/wamimi/noir-ckb-verifier/tree/bf09ccfa8bf2e474b98d47a23440a6ed29a1af07) · [contracts/crates/owned-counter/src/main.rs](https://github.com/wamimi/noir-ckb-verifier/blob/bf09ccfa8bf2e474b98d47a23440a6ed29a1af07/contracts/crates/owned-counter/src/main.rs) · [contracts/crates/owned-counter/build.rs](https://github.com/wamimi/noir-ckb-verifier/blob/bf09ccfa8bf2e474b98d47a23440a6ed29a1af07/contracts/crates/owned-counter/build.rs) · [crates/artifact-adapter/src/wire.rs](https://github.com/wamimi/noir-ckb-verifier/blob/bf09ccfa8bf2e474b98d47a23440a6ed29a1af07/crates/artifact-adapter/src/wire.rs) · [circuits/owned-counter-v1/src/main.nr](https://github.com/wamimi/noir-ckb-verifier/blob/bf09ccfa8bf2e474b98d47a23440a6ed29a1af07/circuits/owned-counter-v1/src/main.nr) (commit read when writing this spec; deployment constants from releases/owned-counter-v1-testnet/manifest.json and evidence/week-15-testnet.md)
- binary vs source: unverified (deployed binary not matched to the source) — the committed release binary at this commit matches the deployed data hash, but building it from source (with the pinned policy env + VK) was not reproduced, so status stays unverified
- on-chain data checked: 2026-10-29
- contributors: [@wamimi](https://github.com/wamimi)

## Deployments

### testnet — noir-ckb-verifier releases/owned-counter-v1-testnet/manifest.json (artifacts.type.data_hash) + evidence/week-15-testnet.md

- code_hash: `0x79d7e7614ff1689cb6c6fbbd376ab2fa959dc92394abea35cbafb1bd2b7d0a88` · hash_type: `data1`
- deployed in tx [`0x0ee39d547101eb348bc72a93f9a08b301353267487f3061f54a0070c44f27ad1`](https://testnet.explorer.nervos.org/transaction/0x0ee39d547101eb348bc72a93f9a08b301353267487f3061f54a0070c44f27ad1) (block 22664421) · data_hash `0x79d7e7614ff1689cb6c6fbbd376ab2fa959dc92394abea35cbafb1bd2b7d0a88`

```json
{
  "script": { "code_hash": "0x79d7e7614ff1689cb6c6fbbd376ab2fa959dc92394abea35cbafb1bd2b7d0a88", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0ee39d547101eb348bc72a93f9a08b301353267487f3061f54a0070c44f27ad1", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create counter (count = 0)

**Input** · inputs[0]: any (usually the owner's funding cell)

```
Cell{
  lock: {{same lock as the output counter}}
}
(no counter type)
```

**Output** · counter cell (exactly one)

```
Cell{
  lock: {{secp256k1_blake160(owner 20B)}},
  type: { codeHash: OWNED_COUNTER (data1),
          args: {{0x01 ‖ type_id 32B}} },
  data: {{0x01 ‖ 0u64 LE}}
}
```

byte layout: type.args byte layout (33B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | version | must be 0x01 | 41 |
| 1 | type_id | 32B | type-id (ckb-std validate_type_id) | on create = blake2b(inputs[0] ‖ output index); unchanged on update | 44 |

Example:

- ver: `0x01`
- type_id: `0x6037891531ed72328710ac5a8e6c8341c05039af411f473eaecd83144b4f4740`

Note: script.hash_type must be data1 (else 41)

byte layout: cell data byte layout (9B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | version | must be 0x01 | 43 |
| 1 | count | 8B | counter u64 LE | must be 0 on create (53); new = old + 1 is enforced by the proof | 43 / 53 |

Example:

- ver: `0x01`
- count: `0x0100000000000000 (=1)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | args length 33, args[0] = 0x01, hash_type = data1 | 41 |
| tx | any of inputs / outputs / cell_deps count ≥ 64 | 52 |
| tx | across the whole tx: inputs with the same code_hash+hash_type ≤ 1, outputs = 1; group outputs = 1, group inputs = that input count (no burn, split or merge) | 42 |
| args | ckb-std validate_type_id(args[1..]) | 44 |
| output.data | exactly 9 bytes and data[0] = 0x01 | 43 |
| output.lock | code_hash = secp256k1_blake160 (0x9bd7…cce8), hash_type = type, args 20B; exactly one cell_dep (after expansion) with type hash 0x9bd7…cce8 and its data hash = 0x709f…8649 | 45 |
| syscall | any syscall load failure | 40 |
| output.data | data[1..9] must be all zero | 53 |
| inputs[0].lock | lock hash of the tx's first input (not a group input) = output counter lock hash | 46 |

Note: No proof and no witness on create; capacity unrestricted

### 2. `1 → 1` Proof-authorized update (count + 1)

**Input** · old counter cell (group input)

```
Cell{
  capacity: C,
  lock: L,
  type: OWNED_COUNTER(args),
  data: {{0x01 ‖ old u64}}
}
```

**Input** · witness[at the group's first input]

```
WitnessArgs{
  lock: owner secp256k1 signature (checked by the lock),
  input_type: {{Groth16Witness(proof, public)}}
}
total ≤ 512B
```

**Output** · new counter cell (exactly one)

```
Cell{
  capacity: {{= C}},
  lock: {{= L (same lock hash)}},
  type: OWNED_COUNTER(args unchanged),
  data: {{0x01 ‖ new u64}}
}
```

byte layout: cell data byte layout (9B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | ver | 1B | version | must be 0x01 | 43 |
| 1 | count | 8B | counter u64 LE | must be 0 on create (53); new = old + 1 is enforced by the proof | 43 / 53 |

Example:

- ver: `0x01`
- count: `0x0100000000000000 (=1)`

byte layout: witness.input_type byte layout (Groth16Witness, 290B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | hdr | 12B | molecule table header: total_size + 2 offsets | must decode | 48 |
| 1 | version | 2B | wire version Uint16 LE | checked by wire-decode | 48 |
| 2 | union id | 4B | WitnessContent union id (0 = Bn254Witness) | checked by wire-decode | 48 |
| 3 | bn hdr | 12B | Bn254Witness table header | must decode | 48 |
| 4 | proof | 128B | A(G1 32B) ‖ B(G2 64B) ‖ C(G1 32B), arkworks compressed | Groth16 verify must pass | 51 |
| 5 | public | 132B | FrVec: count u32 LE(=4) ‖ old ‖ new ‖ ctx_lo ‖ ctx_hi (32B LE each) | must equal the contract-rebuilt expected byte for byte | 49 |

Example:

- header: `0x220100000c0000000e000000`
- version: `0x0100`
- union id: `0x00000000`
- bn hdr: `0x100100000c0000008c000000`
- public[0..4]: `0x04000000`

Note: Whole WitnessArgs ≤ 512B (fixed buffer, else 48); the lock field may carry the owner's secp256k1 signature. Field names from crates/artifact-adapter/src/wire.rs; decoding lives in the external crate groth16-ckb@d64c769 wire-decode (not read line by line)

byte layout: expected public inputs (132B, rebuilt by the contract)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | n | 4B | 4 as u32 LE | = 4 | 49 |
| 1 | old | 32B | old.count u64 LE, zero-padded | = input cell data[1..9] | 49 |
| 2 | new | 32B | new.count u64 LE, zero-padded | = output cell data[1..9] | 49 |
| 3 | ctx_lo | 32B | digest[0..16], zero-padded | digest see below | 49 |
| 4 | ctx_hi | 32B | digest[16..32], zero-padded | digest see below | 49 |

Note: digest = blake2b_ckb("noir-ckb/owned-counter/context/v1\0" ‖ NETWORK_DOMAIN (testnet genesis hash) ‖ blake2b_ckb("noir-ckb/owned-counter/v1") ‖ this type script hash ‖ args[1..33] ‖ 0x01 ‖ consumed cell OutPoint (36B) ‖ old data 9B ‖ new data 9B ‖ output lock hash ‖ output capacity u64 LE)

**Also**

- cell_deps: [ secp256k1 dep_group, OWNED_COUNTER code, {{VK cell (data hash 0x685b…58fe)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | args length 33, args[0] = 0x01, hash_type = data1 | 41 |
| tx | any of inputs / outputs / cell_deps count ≥ 64 | 52 |
| tx | across the whole tx: inputs with the same code_hash+hash_type ≤ 1, outputs = 1; group outputs = 1, group inputs = that input count (no burn, split or merge) | 42 |
| args | ckb-std validate_type_id(args[1..]) | 44 |
| output.data | exactly 9 bytes and data[0] = 0x01 | 43 |
| output.lock | code_hash = secp256k1_blake160 (0x9bd7…cce8), hash_type = type, args 20B; exactly one cell_dep (after expansion) with type hash 0x9bd7…cce8 and its data hash = 0x709f…8649 | 45 |
| syscall | any syscall load failure | 40 |
| input.data | old cell data exactly 9 bytes and data[0] = 0x01 | 43 |
| lock | input and output lock hash equal (non-transferable) | 46 |
| capacity | output capacity = input capacity | 47 |
| witness | witness missing / > 512B / not WitnessArgs / no input_type / wire decode fails | 48 |
| public | proof public inputs ≠ rebuilt expected (132B) | 49 |
| cell_deps | exactly one cell_dep with data hash = VK_DATA_HASH, ≤ 512B and decodable | 50 |
| proof | Groth16 (BN254) verification fails | 51 |

Note: new = old + 1 is not compared in the script code; the Noir circuit (circuits/owned-counter-v1) asserts it and the proof enforces it (not a direct script check)

## Notes

- Error codes (main.rs): 40 LOAD · 41 ARGS · 42 SHAPE · 43 STATE · 44 ID · 45 OWNER · 46 OWNER_CHANGED · 47 CAPACITY · 48 WITNESS · 49 PUBLIC · 50 VK · 51 PROOF · 52 LIMIT · 53 INIT
- NETWORK_DOMAIN / OWNER_CODE_HASH / OWNER_DATA_HASH / VK_DATA_HASH are build-time constants (build.rs reads env vars); testnet values in releases/owned-counter-v1-testnet/manifest.json
- No burn path: every tx must output exactly one counter cell (42)
- capsule-binding (earlier example) and private-tally (v2, designed, not deployed) in the same repo are not included: no official deployment

## Example transactions

- testnet · Owned counter create at 0 · [0x57ee42444304f1c1508c1b6136c4e1c33adb1ff8086eb885bd5abdd5080b269b](https://testnet.explorer.nervos.org/transaction/0x57ee42444304f1c1508c1b6136c4e1c33adb1ff8086eb885bd5abdd5080b269b) · `node decode-tx.js 0x57ee42444304f1c1508c1b6136c4e1c33adb1ff8086eb885bd5abdd5080b269b --testnet`
- testnet · Owned counter proof update 0 -> 1 · [0x24a336fbc09ea5330b83adcbaaf17e6eaafcb21776e13df6ec01d00daa613bb6](https://testnet.explorer.nervos.org/transaction/0x24a336fbc09ea5330b83adcbaaf17e6eaafcb21776e13df6ec01d00daa613bb6) · `node decode-tx.js 0x24a336fbc09ea5330b83adcbaaf17e6eaafcb21776e13df6ec01d00daa613bb6 --testnet`
- testnet · Participant counter create · [0x0b6efcd70f111afd1c885557c84f7b93ef4ee8401dd9fe258b9fb677c888798c](https://testnet.explorer.nervos.org/transaction/0x0b6efcd70f111afd1c885557c84f7b93ef4ee8401dd9fe258b9fb677c888798c) · `node decode-tx.js 0x0b6efcd70f111afd1c885557c84f7b93ef4ee8401dd9fe258b9fb677c888798c --testnet`
- testnet · Participant counter update 0 -> 1 · [0xe6589170381a02a249c37be8ab279e6229e2feb8f177f3d572bc63f30089126f](https://testnet.explorer.nervos.org/transaction/0xe6589170381a02a249c37be8ab279e6229e2feb8f177f3d572bc63f30089126f) · `node decode-tx.js 0xe6589170381a02a249c37be8ab279e6229e2feb8f177f3d572bc63f30089126f --testnet`

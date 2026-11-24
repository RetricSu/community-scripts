# groth16-ckb Verifier Type Script Constraints

> Source: CECILIA-MULANDI/groth16-ckb @e969ad1 script/crates/{ckb-script,verifier-core,wire-decode,groth16-schema}, schemas/groth16.mol　·　testnet 0xc884…2dfb (data1), taken from the e2e tx linked in the README　·　pre-audit, not for mainnet

- id: `groth16_verifier` · type script · networks: testnet · tags: zk, open-source, community
- links: page https://retricsu.github.io/community-scripts/groth16_verifier.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [CECILIA-MULANDI/groth16-ckb@e969ad15](https://github.com/CECILIA-MULANDI/groth16-ckb/tree/e969ad154ea2c00df57f68238ddfbcbc9ceb1419) · [script/crates/ckb-script/src/main.rs](https://github.com/CECILIA-MULANDI/groth16-ckb/blob/e969ad154ea2c00df57f68238ddfbcbc9ceb1419/script/crates/ckb-script/src/main.rs) · [script/crates/verifier-core/src/lib.rs](https://github.com/CECILIA-MULANDI/groth16-ckb/blob/e969ad154ea2c00df57f68238ddfbcbc9ceb1419/script/crates/verifier-core/src/lib.rs) · [script/crates/wire-decode/src/lib.rs](https://github.com/CECILIA-MULANDI/groth16-ckb/blob/e969ad154ea2c00df57f68238ddfbcbc9ceb1419/script/crates/wire-decode/src/lib.rs) · [script/crates/groth16-schema/src](https://github.com/CECILIA-MULANDI/groth16-ckb/blob/e969ad154ea2c00df57f68238ddfbcbc9ceb1419/script/crates/groth16-schema/src) · [schemas/groth16.mol](https://github.com/CECILIA-MULANDI/groth16-ckb/blob/e969ad154ea2c00df57f68238ddfbcbc9ceb1419/schemas/groth16.mol) (commit read when writing this spec (default-branch HEAD 2026-11-04). No code_hash is published; the testnet deployment is derived on chain from the cell_deps of the e2e tx 0xc658f9e8…3c96 linked in README.md (Phase 3, 2026-05-15). That code cell predates this commit, so the deployed binary may come from earlier source. Pre-audit.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-12
- contributors: [@CECILIA-MULANDI](https://github.com/CECILIA-MULANDI)

## Deployments

### testnet — no published code_hash: data hash of cell_dep 0x8e849c96…a75e:0 of the e2e tx 0xc658f9e8…3c96 linked in groth16-ckb README.md (Phase 3, Pudge)

- code_hash: `0xc884d0c2b45ebe5db3e559b5a2450f52defaf6945f78c5d7e9da6ed0b5852dfb` · hash_type: `data1`
- deployed in tx [`0x8e849c96509c1805d8bf1e906454151ea9f6c3d118d3e616ebb25c50f7d3a75e`](https://testnet.explorer.nervos.org/transaction/0x8e849c96509c1805d8bf1e906454151ea9f6c3d118d3e616ebb25c50f7d3a75e) (block 21097898) · data_hash `0xc884d0c2b45ebe5db3e559b5a2450f52defaf6945f78c5d7e9da6ed0b5852dfb`

```json
{
  "script": { "code_hash": "0xc884d0c2b45ebe5db3e559b5a2450f52defaf6945f78c5d7e9da6ed0b5852dfb", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8e849c96509c1805d8bf1e906454151ea9f6c3d118d3e616ebb25c50f7d3a75e", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create a trigger cell (no verification)

**Input** · any inputs (without this type)

```
—
```

**Output** · trigger cell

```
Cell{
  type: GROTH16_VERIFIER{ args: {{vk_data_hash 32B}} },
  data: any
}
```

byte layout: type.args (32B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | vk_data_hash | 32B | blake2b-256 of the VK cell data (ckb-default-hash) | length = 32 | 11 |

Example:

- vk_data_hash: `0x1bac22cfcd79a18a529c5038d9f795a91fbfe5dcf972a91563cba365696ab638`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | load_script succeeds | 10 |
| script.args | length = 32 | 11 |
| group inputs | none → return 0 immediately (no witness / VK / proof checks) | — |

### 2. `1 → *` Consume a trigger cell: verify the Groth16 proof

**Input** · trigger cell (group input)

```
Cell{ type: GROTH16_VERIFIER{ args: {{vk_data_hash}} } }
```

**Input** · witness[group input 0]

```
WitnessArgs{ input_type: {{Groth16Witness}} }
```

**Output** · outputs: any

```
outputs with the same type are unrestricted too
```

byte layout: witness[group input 0].input_type = Groth16Witness (molecule)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | table hdr | 12B | molecule table header (total ‖ 2 offsets) | well-formed | 17 |
| 1 | version | 2B u16 LE | wire-format version | = 1 | 18 |
| 2 | union id | 4B | WitnessContent union: 0 = Bn254Witness | = 0 (only variant) | 17 |
| 3 | proof | 128B | ProofBn254 { a: G1 32B, b: G2 64B, c: G1 32B } (arkworks compressed) | deserializable, not infinity | 2 |
| 4 | public_inputs | FrVec: u32 n ‖ 32B × n | BN254 Fr public inputs (LE) | canonical; n + 1 = VK ic count | 3 / 4 |

Example:

- header: `0xc2000000 0c000000 0e000000`
- version: `0x0100`
- union id: `0x00000000`
- proof: `0x3dc6d41b…637c17 (128B)`
- public_inputs: `0x01000000 ‖ 0x3100…00`

Note: Example: witness[0].input_type of Pudge tx 0xc658f9e8…3c96 (194B)

byte layout: VK cell data = Groth16VerifyingKey (molecule)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 2B | wire-format version | = 1 | 18 |
| 1 | union id | 4B | 0 = VerifyingKeyBn254 |  | 14 |
| 2 | alpha_g1 | 32B |  | not infinity | 1 |
| 3 | beta/gamma/delta_g2 | 64B × 3 |  | not infinity | 1 |
| 4 | gamma_abc_g1 | G1Vec | IC points | ≥ 1, none at infinity | 1 |

Note: the cell_dep whose data hash = type.args; look_for_dep_with_data_hash takes the first match (same data hash ⇒ same bytes)

**Also**

- cell_deps: [ verifier code, {{VK cell: data hash = args}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | load_script succeeds | 10 |
| script.args | length = 32 | 11 |
| witness[group 0] | loads as WitnessArgs | 15 |
| WitnessArgs.input_type | must be present | 16 |
| cell_deps | a cell with data hash = args exists | 12 |
| VK cell | loadable | 13 |
| VK cell data | valid Groth16VerifyingKey molecule | 14 |
| version | VK and witness version both = 1 | 18 |
| input_type | valid Groth16Witness molecule | 17 |
| VK | rebuilt arkworks VK: length, ic_len ≥ 1, deserializable, no infinity points | 1 |
| proof | 128B, deserializable, A/B/C not infinity | 2 |
| public_inputs | length = 4 + 32n, canonical Fr | 3 |
| public_inputs | n + 1 = VK ic_len | 4 |
| Groth16 | BN254 pairing check passes | 5 |

## Notes

- Error codes are the constants in script/crates/ckb-script/src/main.rs: 1 INVALID_VK, 2 INVALID_PROOF, 3 INVALID_PUBLIC_INPUTS, 4 PUBLIC_INPUT_COUNT_MISMATCH, 5 VERIFICATION_FAILED, 10 SCRIPT_LOAD_FAILED, 11 BAD_ARGS_LENGTH, 12 VK_CELL_NOT_FOUND, 13 VK_LOAD_FAILED, 14 VK_MOLECULE_DECODE, 15 WITNESS_LOAD_FAILED, 16 WITNESS_MISSING_INPUT_TYPE, 17 WITNESS_MOLECULE_DECODE, 18 VERSION_MISMATCH; 19 UNSUPPORTED_CURVE is reserved and unused.
- Only the witness of group input 0 is verified: several trigger cells in one group share one proof. The script checks no outputs and does not bind the proof to the transaction (public inputs carry no tx context), so a proof is replayable; binding must come from an outer lock / circuit.
- Deployment source: the repo publishes no code_hash; the testnet constant here is taken from the cell_deps of the Pudge e2e tx 0xc658f9e8…3c96 linked in the README (code cell 0x8e849c96…a75e:0, deployed 2026-05, before this commit). The data hash is not in the repo; binary unverified. README: pre-audit infrastructure, do not deploy to mainnet.

## Example transactions

- testnet · groth16-ckb e2e verification (square-root example, README Phase 3) · [0xc658f9e8a846747a3aad373b2145ac49d920aba00c88885219d6c25f3dc53c96](https://testnet.explorer.nervos.org/transaction/0xc658f9e8a846747a3aad373b2145ac49d920aba00c88885219d6c25f3dc53c96) · `node decode-tx.js 0xc658f9e8a846747a3aad373b2145ac49d920aba00c88885219d6c25f3dc53c96 --testnet`
- testnet · groth16-ckb trigger cell creation · [0x8c135e6e745cc5ba4d325e8602164d60dc71052ed334de85d3a71461784f44ba](https://testnet.explorer.nervos.org/transaction/0x8c135e6e745cc5ba4d325e8602164d60dc71052ed334de85d3a71461784f44ba) · `node decode-tx.js 0x8c135e6e745cc5ba4d325e8602164d60dc71052ed334de85d3a71461784f44ba --testnet`

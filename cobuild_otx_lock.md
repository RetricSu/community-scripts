# Cobuild OTX Lock Constraints

> Source: xcshuan/cobuild-otx-contracts @f18eeaf contracts/cobuild-otx-lock/src, crates/cobuild-core/src, crates/cobuild-types/schemas　·　no official deployment (reference implementation; fixtures use data2)

- id: `cobuild_otx_lock` · lock script · no on-chain deployment · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/cobuild_otx_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [xcshuan/cobuild-otx-contracts@f18eeaf2](https://github.com/xcshuan/cobuild-otx-contracts/tree/f18eeaf22f29820ecd9a089481ab45b78b2b7454) · [contracts/cobuild-otx-lock/src](https://github.com/xcshuan/cobuild-otx-contracts/blob/f18eeaf22f29820ecd9a089481ab45b78b2b7454/contracts/cobuild-otx-lock/src) · [crates/cobuild-core/src](https://github.com/xcshuan/cobuild-otx-contracts/blob/f18eeaf22f29820ecd9a089481ab45b78b2b7454/crates/cobuild-core/src) · [crates/cobuild-types/schemas](https://github.com/xcshuan/cobuild-otx-contracts/blob/f18eeaf22f29820ecd9a089481ab45b78b2b7454/crates/cobuild-types/schemas) (commit read when writing this spec (default-branch HEAD 2026-06-24). No deployment published in the repo; no code_hash, so deployments are empty.)
- binary vs source: unverified (deployed binary not matched to the source) — no deployment resolved on chain
- on-chain data checked: 2026-11-12
- contributors: [@xcshuan](https://github.com/xcshuan)

## Deployments

No on-chain deployment recorded.

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Tx-level unlock: SighashAll / SighashAllOnly (no OTX, or this lock has inputs outside the OTX range)

**Input** · inputs with this lock

```
Cell{ lock: COBUILD_OTX_LOCK{ args: {{identity 20B}} } }
```

**Input** · witness[group's first input] (carrier)

```
{{SighashAll{ seal, message } | SighashAllOnly{ seal }}}
```

**Input** · witness[other group inputs]

```
{{must be empty}}
```

**Output** · outputs: any

```
covered by the signing hash
```

byte layout: lock.args (20B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | identity | 20B | blake2b-256(compressed secp256k1 pubkey)[0..20] (ckb-default-hash) | length = 20 | 20 |

byte layout: witness = WitnessLayout (molecule union, item id)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | SighashAll | 0xff000001 | { seal, message }: tx-level signature + Message | at most one per tx | 33 |
| 1 | SighashAllOnly | 0xff000002 | { seal }: tx-level signature |  |  |
| 2 | Otx | 0xff000003 | one OTX: message, append_permissions, base_*, append_segments, base_seals | must directly follow OtxStart or the previous Otx | 31 |
| 3 | OtxStart | 0xff000004 | { start_input_cell, start_output_cell, start_cell_deps, start_header_deps } | at most one, followed by ≥ 1 Otx | 31 |

Note: witnesses without a cobuild id are legacy; a reserved id with invalid molecule → 31 / 30

byte layout: seal (65B, recoverable secp256k1 signature)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | r ‖ s | 64B | ECDSA signature | parses | 50 |
| 1 | rec_id | 1B | recovery id (k256 RecoveryId) | 0–3; recovered pubkey hash[0..20] = args | 50 |

Note: length ≠ 65 also returns 50 (VerifyFailure)

byte layout: signing hash (blake2b-256, 16B personal)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | personal | 16B | with Message: "ckbcb_twm_core1\0"; without: "ckbcb_tnm_core1\0" |  |  |
| 1 | message | var | the unique SighashAll.message (if any) |  | 30 |
| 2 | tx_hash | 32B | tx hash |  | 61 |
| 3 | inputs | Σ | each input: CellOutput ‖ u32 len ‖ data |  | 62 |
| 4 | extra witnesses | Σ | witnesses beyond input count: u32 len ‖ w | length ≤ u32::MAX | 63 |

byte layout: Action (element of Message.actions)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | script_info_hash | 32B | script info hash |  |  |
| 1 | script_role | 1B | 0 InputLock / 1 InputType / 2 OutputType | ∈ {0,1,2} | 32 |
| 2 | script_hash | 32B | target script hash | a script with that role exists in the tx | 32 |
| 3 | data | Bytes | application data |  |  |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script.args | length = 20 | 20 |
| witnesses | every witness carrying a cobuild id parses as WitnessLayout | 30 / 31 |
| SighashAll | at most one SighashAll (with Message) in the tx | 33 |
| carrier witness | witness at the group's first input is SighashAll or SighashAllOnly | 39 |
| other group witnesses | must be empty | 39 |
| message.actions | each action's (script_role, script_hash) points to a script in the tx | 32 |
| seal | 65B, recovered pubkey blake160 = args | 50 |
| signature requirements | at least one (otherwise nothing authorizes this lock) | 40 |

### 2. `B` OTX unlock: base_seals / append-segment seals (all of this lock's inputs inside the OTX range)

**Input** · this lock's inputs inside the OTX range

```
Cell{ lock: COBUILD_OTX_LOCK{ args: {{identity}} } }
```

**Input** · witnesses

```
… ‖ {{OtxStart}} ‖ {{Otx_1}} ‖ … ‖ {{Otx_n}} (contiguous) ‖ …
```

**Output** · OTX base / append outputs

```
signed per base_output_masks and append segments
```

byte layout: Otx (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | message | Message | OTX actions | action targets valid | 32 |
| 1 | append_permissions | 1B | bit0 inputs, bit1 outputs, bit2 cell_deps, bit3 header_deps | upper 4 bits zero; appended kinds must be permitted | 31 |
| 2 | base_input_cells | u32 | base input count | ≥ 1 | 31 |
| 3 | base_*_masks | Bytes | inputs 2 bits each, outputs 4 bits each, cell_deps / header_deps 1 bit each | length = ceil(bits/8), unused high bits zero | 31 |
| 4 | append_segments | vec | each: segment_flags, counts, seals | flags ⊆ {0x01 allow-more, 0x02 cover-previous}; non-last segments need 0x01 | 31 |
| 5 | base_seals | LockSealVec | list of { script_hash, seal } | exactly one for this lock hash | 35 / 36 |

byte layout: OTX signing hashes

| # | field | size | meaning |
| --- | --- | --- | --- |
| 0 | base | "ckbcb_otb_core1\0" | message ‖ append_permissions ‖ base inputs/outputs/cell_deps/header_deps (by mask) |
| 1 | segment | "ckbcb_ots_core1\0" | base_hash ‖ (with 0x02: previous count + segments) ‖ flags ‖ this segment's entities |

byte layout: seal (65B, recoverable secp256k1 signature)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | r ‖ s | 64B | ECDSA signature | parses | 50 |
| 1 | rec_id | 1B | recovery id (k256 RecoveryId) | 0–3; recovered pubkey hash[0..20] = args | 50 |

Note: length ≠ 65 also returns 50 (VerifyFailure)

byte layout: lock.args (20B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | identity | 20B | blake2b-256(compressed secp256k1 pubkey)[0..20] (ckb-default-hash) | length = 20 | 20 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script.args | length = 20 | 20 |
| witnesses | every witness carrying a cobuild id parses as WitnessLayout | 30 / 31 |
| SighashAll | at most one SighashAll (with Message) in the tx | 33 |
| OtxStart | at most one; followed by ≥ 1 contiguous Otx; no Otx before OtxStart | 31 |
| OTX ranges | base / append counts accumulate from OtxStart; end ≤ the tx counts | 31 |
| Otx | base_input_cells ≥ 1; append_permissions / segment_flags / masks valid | 31 |
| message.actions | action targets exist | 32 |
| base inputs contain this lock | exactly one base_seals entry with script_hash = this lock hash | 35 / 36 |
| append segment inputs contain this lock | exactly one entry for this lock hash in that segment's seals | 35 / 36 |
| coverage | with only OTX signatures, every input of this lock lies in the aggregate OTX input range | 34 |
| seal | each requirement: 65B recoverable signature, pubkey blake160 = args | 50 |
| signature requirements | at least one | 40 |

## Notes

- Error codes from contracts/cobuild-otx-lock/src/error.rs (Error::code): 1–10 ckb-std SysError, 20 InvalidArgs, 30 MalformedCobuild, 31 InvalidOtxLayout, 32 InvalidMessageTarget, 33 DuplicateSighashAll, 34 MissingLockGroupCoverage, 35 MissingLockSeal, 36 DuplicateLockSeal, 38 DuplicateMatchingAction, 39 InvalidLockGroupWitness, 40 LockSemanticFailure, 41 ActionNotFound, 50 VerifyFailure, 60 InternalFailure, 61 InvalidContextInput, 62 MissingHashInput, 63 HashInputTooLarge. 38, 41 and 60 do not occur in the lock flow (they serve type scripts / helper APIs).
- One lock may need a tx-level signature and several OTX signatures at once (base + every append segment containing its inputs); each must pass. With no cobuild witness at all there is no tx-level requirement → 40. What the masks select for signing is described in docs/superpowers/specs/2026-06-22-otx-mask-default-value-signing-design.md; this page lists only the length rules in the code.
- No official deployment and no on-chain txs: the plugin match is empty (static page only). The README says test fixtures use ScriptHashType::Data2.

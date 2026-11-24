# standard-udt sUDT Type Script Constraints

> Source: xcshuan/ckb-standard-udt-contracts @d6e6da0 contracts/sudt/src, lib/script-utils, lib/types　·　no deployment published (SUDT_CODE_HASH is a build-time constant)

- id: `std_sudt` · type script · no on-chain deployment · tags: token, open-source, community
- links: page https://retricsu.github.io/community-scripts/std_sudt.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [xcshuan/ckb-standard-udt-contracts@d6e6da01](https://github.com/xcshuan/ckb-standard-udt-contracts/tree/d6e6da0109e082551af9873c64cda0d1f514c9e3) · [contracts/sudt/src](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/contracts/sudt/src) · [lib/script-utils/src/amount.rs](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/script-utils/src/amount.rs) · [lib/script-utils/src/authority.rs](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/script-utils/src/authority.rs) · [lib/types/src/metadata](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/types/src/metadata) · [lib/types/src/schemas/metadata.mol](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/types/src/schemas/metadata.mol) (commit read when writing this spec (default-branch HEAD, 2026-05-18). No deployment or code_hash is published (dependent code hashes are injected at build time); checksums.txt lists sha256 of release binaries only.)
- binary vs source: unverified (deployed binary not matched to the source) — no deployment resolved on chain
- on-chain data checked: 2026-11-12
- contributors: [@xcshuan](https://github.com/xcshuan)

## Deployments

No on-chain deployment recorded.

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `Σin ≥ Σout` Transfer / burn (sudt only checks format)

**Input** · sUDT

```
Cell{
  type: SUDT{ args: meta_type_hash } (data2),
  data: {{amount}}
}
```

**Output** · sUDT

```
Cell{
  type: SUDT{ args: meta_type_hash } (data2),
  data: {{amount′}}
}
```

byte layout: sUDT cell

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type.args | 32B | type hash of the metadata cell | length = 32 | 20 |
| 1 | data[0..16] | 16B u128 LE | amount; trailing bytes ignored | ≥ 16B | 30 |

Note: sudt-meta only counts cells with hash_type = data2, code_hash = SUDT_CODE_HASH, args = metadata type hash

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | = 32B | 20 |
| data | every group cell ≥ 16B | 30 |
| Σ | u128 sums do not overflow | 31 |
| classification | Σout ≤ Σin passes in sudt; if the tx spends the metadata cell, sudt-meta accounts the decrease as a protocol burn, else it is user destruction (supply unchanged) | — |

### 2. `Σin < Σout` Mint

**Input** · sUDT

```
Cell{
  type: SUDT{ args: meta_type_hash } (data2),
  data: amount
}
```

**Input** · metadata cell (must be an input when tracked)

```
Cell{ type: {{hash = args}}, data: SudtMeta }
```

**Output** · sUDT

```
Cell{
  type: SUDT{ args: meta_type_hash } (data2),
  data: {{amount + minted}}
}
```

byte layout: sUDT cell

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type.args | 32B | type hash of the metadata cell | length = 32 | 20 |
| 1 | data[0..16] | 16B u128 LE | amount; trailing bytes ignored | ≥ 16B | 30 |

Note: sudt-meta only counts cells with hash_type = data2, code_hash = SUDT_CODE_HASH, args = metadata type hash

**Also**

- cell_deps: when untracked the metadata cell may be a cell_dep

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | = 32B | 20 |
| data | ≥ 16B | 30 |
| locate metadata | cell_deps first, then inputs, type hash = args; more than one in a source → 42; parse failure → 40 | 42 / 40 |
| initial mint | if neither has it, the outputs must contain the metadata cell (creation checked by sudt-meta) | 41 |
| tracked | metadata must come from an input (cell_dep → 43); supply is accounted by sudt-meta | 43 |
| untracked | mint_authority exists and passes | 50 / 51 / 52 |
| untracked | current_supply = 0 | 45 |

## Notes

- Error codes (contracts/sudt/src/error.rs): 1–9 SysError, 10 SyscallUnknown, 20 InvalidArgs, 30 AmountEncoding, 31 AmountOverflow, 32 SupplyOverflow, 33 SupplyUnderflow, 40 InvalidMetaData, 41 MetaMissing, 42 MetaNotUnique, 43 MetaInputMissing, 44 MetaOutputMissing, 45 MetaStateMismatch, 50 AuthorityMissing, 51 AuthorityFailed, 52 UnsupportedAuthorityLocation. 32, 33 and 44 are unused in sudt.
- The README says sudt validates “protocol-burn classification and user destruction”, but entry.rs only calls validate_mint when Σout > Σin; decreases are accounted solely by sudt-meta (when the metadata cell is spent).
- sudt does not check its own hash_type, while sudt-meta only counts data2-bound cells: an sUDT referencing the same binary with another hash_type is not counted in tracked supply. An untracked initial mint (metadata in outputs) checks no authority.
- Authority: InputLock / InputType = an input has that lock / type hash; OutputType = an output has that type hash; DynamicLinking calls udt_authorize; Spawn must exit 0
- Deployment: no code_hash is published; match is empty and there is no test tx.

# standard-udt sUDT Metadata Type Script Constraints

> Source: xcshuan/ckb-standard-udt-contracts @d6e6da0 contracts/sudt-meta/src, lib/script-utils, lib/types　·　no deployment published (SUDT_CODE_HASH is a build-time constant)

- id: `std_sudt_meta` · type script · no on-chain deployment · tags: token, open-source, community
- links: page https://retricsu.github.io/community-scripts/std_sudt_meta.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [xcshuan/ckb-standard-udt-contracts@d6e6da01](https://github.com/xcshuan/ckb-standard-udt-contracts/tree/d6e6da0109e082551af9873c64cda0d1f514c9e3) · [contracts/sudt-meta/src](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/contracts/sudt-meta/src) · [lib/script-utils/src/authority.rs](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/script-utils/src/authority.rs) · [lib/script-utils/src/token.rs](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/script-utils/src/token.rs) · [lib/script-utils/src/supply.rs](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/script-utils/src/supply.rs) · [lib/types/src/metadata](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/types/src/metadata) · [lib/types/src/schemas/metadata.mol](https://github.com/xcshuan/ckb-standard-udt-contracts/blob/d6e6da0109e082551af9873c64cda0d1f514c9e3/lib/types/src/schemas/metadata.mol) (commit read when writing this spec (default-branch HEAD, 2026-05-18). No deployment or code_hash is published (dependent code hashes are injected at build time); checksums.txt lists sha256 of release binaries only.)
- binary vs source: unverified (deployed binary not matched to the source) — no deployment resolved on chain
- on-chain data checked: 2026-11-12
- contributors: [@xcshuan](https://github.com/xcshuan)

## Deployments

No on-chain deployment recorded.

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → Meta` Create metadata (optionally with the initial mint)

**Input** · inputs[0]

```
any cell; determines the type id
```

**Output** · metadata cell

```
Cell{
  lock: ALWAYS_SUCCESS (data2),
  type: SUDT_META{ args: {{type_id}} },
  data: SudtMeta{ config_flags, {{current_supply}}, … }
}
```

**Output** · sUDT (optional)

```
Cell{
  type: SUDT{ args: meta_type_hash } (data2),
  data: {{amount}}
}
```

byte layout: Metadata cell data = SudtMeta (molecule table, 9 fields)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | header | 4 + 9×4 B | molecule table header | well-formed | 30 / 40 |
| 1 | config_flags | 1B | bit0 = SUPPLY_TRACKED; sUDT allows only this bit | ⊆ 0x01 | 30 / 40 |
| 2 | current_supply | 16B u128 LE | tracked total supply | must be 0 when untracked | 31 |
| 3 | decimals | 1B |  |  |  |
| 4 | name / symbol / uri / extra_data | Bytes × 4 | limits 1024 / 128 / 2048 / 16384 B |  | 30 / 40 |
| 5 | mint_authority | AuthorityOpt | Authority{ type 0 InputLock \| 1 InputType \| 2 OutputType \| 3 DynamicLinking \| 4 Spawn, script_hash 32B, script: ScriptOpt } | script = None for 0–2; for 3–4 the script hashes to script_hash | 30 / 40 |
| 6 | metadata_authority | AuthorityOpt |  |  | 30 / 40 |

Example:

- header: `0x82000000 28000000 29000000 39000000 3a000000 42000000 49000000 4d000000 51000000 82000000`
- config_flags: `0x01`
- current_supply: `0x0010a5d4e8000000…00 (1 000 000 000 000)`
- decimals: `0x08`
- name / symbol: `0x0400000054657374 ("Test") ‖ 0x03000000545354 ("TST")`
- uri / extra_data: `0x00000000 ‖ 0x00000000`
- mint_authority: `0x31000000 10000000 11000000 31000000 00 ‖ abab…ab ‖ (None)`
- metadata_authority: `(None, 0 B)`

Note: Example is a hand-encoded 130B value following metadata.mol (tracked, InputLock authority), not on-chain data

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | = 32B | 20 |
| group | ≤ 1 per side; not both empty | 21 / 20 |
| output lock | hash_type = data2 and code_hash = 0x3b521cc4…f7f1 (always-success whitelist) | 20 |
| SudtMeta | Molecule, size limits, config_flags ⊆ 0x01, Authority shape | 30 |
| type id | args = blake2b(inputs[0] ‖ output index u64 LE) | 10 |
| current_supply | tracked: = total bound sUDT in outputs; untracked: = 0 | 31 |
| authority | creation checks no authority | — |

### 2. `Meta → Meta` Update metadata / account mints and protocol burns

**Input** · metadata cell

```
Cell{
  lock: ALWAYS_SUCCESS (data2),
  type: SUDT_META{ args: type_id },
  data: SudtMeta{ supply, mint_authority, metadata_authority, … }
}
```

**Input** · authority + sUDT

```
cells satisfying the Authority; sUDT being minted / burned
```

**Output** · metadata cell

```
Cell{
  lock: ALWAYS_SUCCESS (data2),
  type: SUDT_META{ args: type_id },
  data: SudtMeta{ {{supply ± Δ}}, {{…changed fields}} }
}
```

byte layout: Metadata cell data = SudtMeta (molecule table, 9 fields)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | header | 4 + 9×4 B | molecule table header | well-formed | 30 / 40 |
| 1 | config_flags | 1B | bit0 = SUPPLY_TRACKED; sUDT allows only this bit | ⊆ 0x01 | 30 / 40 |
| 2 | current_supply | 16B u128 LE | tracked total supply | must be 0 when untracked | 31 |
| 3 | decimals | 1B |  |  |  |
| 4 | name / symbol / uri / extra_data | Bytes × 4 | limits 1024 / 128 / 2048 / 16384 B |  | 30 / 40 |
| 5 | mint_authority | AuthorityOpt | Authority{ type 0 InputLock \| 1 InputType \| 2 OutputType \| 3 DynamicLinking \| 4 Spawn, script_hash 32B, script: ScriptOpt } | script = None for 0–2; for 3–4 the script hashes to script_hash | 30 / 40 |
| 6 | metadata_authority | AuthorityOpt |  |  | 30 / 40 |

Example:

- header: `0x82000000 28000000 29000000 39000000 3a000000 42000000 49000000 4d000000 51000000 82000000`
- config_flags: `0x01`
- current_supply: `0x0010a5d4e8000000…00 (1 000 000 000 000)`
- decimals: `0x08`
- name / symbol: `0x0400000054657374 ("Test") ‖ 0x03000000545354 ("TST")`
- uri / extra_data: `0x00000000 ‖ 0x00000000`
- mint_authority: `0x31000000 10000000 11000000 31000000 00 ‖ abab…ab ‖ (None)`
- metadata_authority: `(None, 0 B)`

Note: Example is a hand-encoded 130B value following metadata.mol (tracked, InputLock authority), not on-chain data

**Constraints**

| field | condition | error |
| --- | --- | --- |
| output lock | always-success whitelist | 20 |
| SudtMeta | input and output parse | 30 / 31 |
| config_flags | SUPPLY_TRACKED bit immutable | 32 |
| current_supply | untracked: = 0; tracked: = old + Σout − Σin (all bound sUDT in the tx) | 31 |
| authority | metadata_authority passes; falls back to mint_authority when missing or failing | 50 / 51 |
| authority | current_supply or mint_authority changed ⇒ mint_authority also required | 50 / 51 |
| no-op | spending the metadata cell needs authority even for a no-op | 50 / 51 |

### 3. `Meta → 0` Destroy metadata (reclaim CKB)

**Input** · metadata cell

```
Cell{
  lock: ALWAYS_SUCCESS (data2),
  type: SUDT_META{ args: type_id },
  data: SudtMeta{ {{tracked}}, {{current_supply = 0}} }
}
```

**Input** · mint authority

```
cells satisfying mint_authority
```

**Output** · no metadata output

```
and no sUDT outputs bound to it
```

byte layout: Metadata cell data = SudtMeta (molecule table, 9 fields)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | header | 4 + 9×4 B | molecule table header | well-formed | 30 / 40 |
| 1 | config_flags | 1B | bit0 = SUPPLY_TRACKED; sUDT allows only this bit | ⊆ 0x01 | 30 / 40 |
| 2 | current_supply | 16B u128 LE | tracked total supply | must be 0 when untracked | 31 |
| 3 | decimals | 1B |  |  |  |
| 4 | name / symbol / uri / extra_data | Bytes × 4 | limits 1024 / 128 / 2048 / 16384 B |  | 30 / 40 |
| 5 | mint_authority | AuthorityOpt | Authority{ type 0 InputLock \| 1 InputType \| 2 OutputType \| 3 DynamicLinking \| 4 Spawn, script_hash 32B, script: ScriptOpt } | script = None for 0–2; for 3–4 the script hashes to script_hash | 30 / 40 |
| 6 | metadata_authority | AuthorityOpt |  |  | 30 / 40 |

Example:

- header: `0x82000000 28000000 29000000 39000000 3a000000 42000000 49000000 4d000000 51000000 82000000`
- config_flags: `0x01`
- current_supply: `0x0010a5d4e8000000…00 (1 000 000 000 000)`
- decimals: `0x08`
- name / symbol: `0x0400000054657374 ("Test") ‖ 0x03000000545354 ("TST")`
- uri / extra_data: `0x00000000 ‖ 0x00000000`
- mint_authority: `0x31000000 10000000 11000000 31000000 00 ‖ abab…ab ‖ (None)`
- metadata_authority: `(None, 0 B)`

Note: Example is a hand-encoded 130B value following metadata.mol (tracked, InputLock authority), not on-chain data

**Constraints**

| field | condition | error |
| --- | --- | --- |
| config_flags | must be tracked | 31 |
| current_supply | = 0 | 31 |
| outputs | no bound sUDT (data2, SUDT_CODE_HASH, args = this type hash) | 31 |
| authority | mint_authority must exist and pass | 50 / 51 |

## Notes

- Error codes (contracts/sudt-meta/src/error.rs): 1–9 SysError, 10 SysTypeIdError, 11 SyscallUnknown, 20 InvalidArgs, 21 DuplicateMetaCell, 30 InvalidMetaData, 31 InvalidSupply, 32 ImmutableSupplyMode, 50 AuthorityMissing, 51 AuthorityFailed (UnsupportedAuthorityLocation also maps to 51). Types-layer InvalidSupply → 31, other parse errors → 30.
- Authority: InputLock / InputType = an input has that lock / type hash; OutputType = an output has that type hash; DynamicLinking calls udt_authorize; Spawn must exit 0
- The metadata cell lock is restricted to always-success (data2 0x3b521cc4…f7f1; debug builds also allow the ckb-testtool always-success), so all safety comes from this type script and its authorities.
- Deployment: no code_hash is published and SUDT_CODE_HASH is injected at build time; match is empty and there is no test tx. checksums.txt only lists sha256 of release binaries.

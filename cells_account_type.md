# Cells name (account-cell-type) Constraints

> Source: LusoCryptoLabs/cells-contracts @34dad3c / contracts/account-cell-type/src/main.rs + crates/cells-core　·　mainnet 0xd96c…fe54 / testnet 0xe070…d1d9 (type, cellula-sdk)

- id: `cells_account_type` · type script · networks: mainnet, testnet · tags: identity, open-source, community, p-cells
- links: page https://retricsu.github.io/community-scripts/cells_account_type.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [LusoCryptoLabs/cells-contracts@6d29dab2](https://github.com/LusoCryptoLabs/cells-contracts/tree/6d29dab2770fa0980e13b9cbeefff0c844ef4101) · [contracts/account-cell-type/src/main.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/contracts/account-cell-type/src/main.rs) · [crates/cells-core/src/lib.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/crates/cells-core/src/lib.rs) (commit read after #5 plain-payment fix (2026-11-06 mainnet upgrade); docs/TRUST.md hashes)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted); mainnet data hash matches docs/TRUST.md at recorded commit (script does not treat TRUST.md as checksum evidence); testnet hash also upgraded on-chain (TRUST.md testnet table may lag)
- on-chain data checked: 2026-11-09
- contributors: [@LusoCryptoLabs](https://github.com/LusoCryptoLabs)

## Deployments

### mainnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.account; cells-contracts docs/TRUST.md

- code_hash: `0xd96cee56727a2bb9a21408c154d278df5095fb4b4dcfd50516156424479bfe54` · hash_type: `type`
- deployed in tx [`0x0d48aa833f97aa1c10f803c03a58e32b4184556f0ddba3137b014aa48df55109`](https://explorer.nervos.org/transaction/0x0d48aa833f97aa1c10f803c03a58e32b4184556f0ddba3137b014aa48df55109) (block 20943808) · data_hash `0xe44bd56626ef4d17d8a62c6819924f213e5151836a60fdbc630645cdd37c7d98` · type_id args `0x51709700704ca6cb5dd695e42b9637bccbbd28bb6c29dd6d31dab9aab3de9a5a`

```json
{
  "script": { "code_hash": "0xd96cee56727a2bb9a21408c154d278df5095fb4b4dcfd50516156424479bfe54", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0d48aa833f97aa1c10f803c03a58e32b4184556f0ddba3137b014aa48df55109", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.account

- code_hash: `0xe0706b176678181d982290d93dfcd82098e60cceaa4a87f10f32dcbcc91df1d9` · hash_type: `type`
- deployed in tx [`0x1d791fd5f8edfa9199346ff8ec19d0d341a3adb4f43c26ea32a4d59b94fc1eab`](https://testnet.explorer.nervos.org/transaction/0x1d791fd5f8edfa9199346ff8ec19d0d341a3adb4f43c26ea32a4d59b94fc1eab) (block 22975812) · data_hash `0x7fbd4d36d9b467d894919ba5cfdf1e7040223535178c671931a98267eeccff06` · type_id args `0x4b33dfe66b3f11ca7ac2626bd538d2933f3ebfda237c2c2a185a961b2d7a98f0`

```json
{
  "script": { "code_hash": "0xe0706b176678181d982290d93dfcd82098e60cceaa4a87f10f32dcbcc91df1d9", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x1d791fd5f8edfa9199346ff8ec19d0d341a3adb4f43c26ea32a4d59b94fc1eab", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Genesis

**Input** · input[*] genesis token

```
Cell{
  capacity: any,
  lock: any,
  type: {{type-id cell: type hash[0..20] = namespace}},
  data: any
}
```

**Output** · output[0] root sentinel

```
Cell{
  capacity: any,
  lock: account-lock (not checked at genesis),
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, {{next = 0}}, expires,
        {{owner = 0}}, {{manager = 0}}, {{label empty (98B)}} }
}
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ output_type: {{records of output[0]}} }
// no action is read when there are no AccountCell inputs
```

byte layout: data: AccountData v3 (98-byte header + label)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | layout version | = 0x03 | 20 |
| 1 | witness_hash | 32B | blake2b(records payload); records live in witnesses[i].output_type | = blake2b(witness) | 21 |
| 2 | next | 20B | id of the successor in the ring (id = blake2b(label)[0..20], not stored) | relink rules | 24 / 25 |
| 3 | expires | 5B LE | expiry, unix seconds | 1–10 years at register | 39 / 43 |
| 4 | owner | 20B | first 20 bytes of the owner lock hash (consent = spending an input under it) | ≠ 0, ≠ account-lock | 38 / 44 |
| 5 | manager | 20B | delegate lock hash prefix; may edit records; = owner when none | ≠ 0, ≠ account-lock | 38 / 44 |
| 6 | label | 1–40B | the name without .cell; a-z 0-9 -, at most one dot (sub-name) | charset / length / depth | 30 / 31 / 45 |

Example:

- version: `0x{{03}}`
- witness_hash: `0x5f0c…(32B)`
- next: `0x9a1e…(20B)`
- expires: `0x{{80b7c96e00}}  ← 0x6ec9b780 = 1858713472 (2028-11-24 UTC)`
- owner: `0x3c4b…(20B)`
- manager: `0x3c4b…(20B, = owner)`
- label: `0x{{616c696365}}  ← "alice"`

byte layout: type.args (20 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | namespace | 20B | first 20 bytes of the genesis token type hash; also part of the commitment | ≥ 20B | 4 |

Example:

- args: `0x1a2b…(20B)`

**Also**

- Code 34 GenesisSeedMissing is still reachable in code (SPEC.md says 34 is unreachable — doc/code discrepancy)

**Constraints**

| field | condition | error |
| --- | --- | --- |
| genesis token | consume an input whose type hash[0..20] = args | 34 |
| outputs | exactly 1 AccountCell output | 25 |
| id / next | id = next = 0 | 25 |
| data | exactly 98 bytes (empty label), owner = manager = 0 | 20 |
| witness | blake2b(witnesses[0].output_type) = witness_hash | 21 |

### 2. `1 → 2` Register

**Input** · input[0] predecessor AccountCell p

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label,
        next: N  // x.id ∈ (p.id, N) }
}
```

**Input** · input[1] CommitCell (registrant’s own)

```
Cell{
  since: {{0xC0… relative timestamp ≥ 60 s}},
  capacity: any,
  lock: {{registrant lock: hash[0..20] = x.owner, not anyone-can-pay}},
  type: null  // not checked,
  data: {{blake2b(namespace ‖ label ‖ owner20 ‖ secret32)}}  // exactly 32B
}
// any input position; found by data match
```

**Input** · input[2] payment cell (registrant)

```
Cell{
  capacity: fee + rent + tx fee,
  lock: registrant lock,
  type: null,
  data: 0x
}
// not checked by the script; just funds the outputs
```

**Output** · output[0] p′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label,
        {{next = x.id}}  // every other field = p }
}
```

**Output** · output[1] new name x

```
Cell{
  capacity: {{≥ 240 CKB}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash,
        next: {{p.next}}, expires: {{now + 1–10 y}},
        owner: {{≠0, ≠ account-lock}}, manager: {{= owner}},
        label: {{a-z0-9-, 1–40B, ≤1 dot}} }
}
```

**Output** · output[2] treasury

```
Cell{
  capacity: {{Σ pure ≥ fee×factor − referral + sale fees owed}},
  lock: {{lock hash == TREASURY_LOCK_HASH}} (mainnet 0x57d9…742d),
  type: {{null}},  // typed or non-empty-data outputs do not count
  data: 0x
}
```

**Output** · output[3] change (optional)

```
Cell{
  capacity: rest,
  lock: registrant lock,
  type: null,
  data: 0x
}
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

cell_dep: code of the payer / owner locks

```
e.g. secp256k1 dep_group — for the other inputs’ locks
```

cell_dep: price cell (optional)

```
Cell{ type: hash == {{PRICE_CELL_TYPE_HASH}} (mainnet 0x3f1c…7586),
      data: 0x01 ‖ bps u32 LE }
// price_factor(): found by type hash; missing/malformed → full price
```

cell_dep: inviter name (optional)

```
Cell{ type: {{same ACCOUNT_TYPE script}}, data: AccountData{ owner: I } }
// referral_discount(): every cell dep with this type is a candidate;
// pays only if I ≠ treasury, no input under I, and pure outputs (no type and empty data) to I ≥ cut
```

#### header_deps

header_deps: the CommitCell’s block

```
block hash of input[1]’s creating block
// header_time_seconds(): load_header(commit input) → now = timestamp/1000
// term = x.expires − now must be 1–10 years
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ lock: (input[0] is account-lock: unused),
  input_type:  {{"register"}}           // action, ASCII
  output_type: {{records of output[0] p′}} // blake2b = p′.witness_hash }
```

witnesses[1]

```
{ lock: signature for input[1]’s lock group,
  input_type:  {{secret 32B}}              // witnesses[x index].input_type
  output_type: {{records of output[1] x}} // blake2b = x.witness_hash }
```

witnesses[2…]

```
other inputs’ lock witnesses (may be empty in the same lock group)
```

#### sub-name only (label has one dot, e.g. shop.alice)

extra cell_dep: parent AccountCell

```
Cell{ type: {{same ACCOUNT_TYPE script}},
      data: AccountData{ label: {{= parent ("alice")}}, owner: PO, expires: PE } }
// require_parent(): missing → 40
```

extra input: a cell of the parent owner

```
Cell{ lock: {{hash[0..20] = PO, consenting lock}} }
// require_owner(PO) → 29; and x.expires ≤ PE → 41
// fee = parent length line / 5
```

byte layout: data: AccountData v3 (98-byte header + label)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | layout version | = 0x03 | 20 |
| 1 | witness_hash | 32B | blake2b(records payload); records live in witnesses[i].output_type | = blake2b(witness) | 21 |
| 2 | next | 20B | id of the successor in the ring (id = blake2b(label)[0..20], not stored) | relink rules | 24 / 25 |
| 3 | expires | 5B LE | expiry, unix seconds | 1–10 years at register | 39 / 43 |
| 4 | owner | 20B | first 20 bytes of the owner lock hash (consent = spending an input under it) | ≠ 0, ≠ account-lock | 38 / 44 |
| 5 | manager | 20B | delegate lock hash prefix; may edit records; = owner when none | ≠ 0, ≠ account-lock | 38 / 44 |
| 6 | label | 1–40B | the name without .cell; a-z 0-9 -, at most one dot (sub-name) | charset / length / depth | 30 / 31 / 45 |

Example:

- version: `0x{{03}}`
- witness_hash: `0x5f0c…(32B)`
- next: `0x9a1e…(20B)`
- expires: `0x{{80b7c96e00}}  ← 0x6ec9b780 = 1858713472 (2028-11-24 UTC)`
- owner: `0x3c4b…(20B)`
- manager: `0x3c4b…(20B, = owner)`
- label: `0x{{616c696365}}  ← "alice"`

byte layout: witnesses[i] (WitnessArgs, i = output index of the AccountCell)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | witnesses[0].input_type | ASCII | action name: register / renew / edit_records / edit_manager / transfer / recycle | must be known | 23 |
| 1 | witnesses[i].output_type | records | records: u16 LE count; each key(u8 len) ‖ label(u8 len) ‖ value(u16 len) ‖ ttl(u32) | blake2b = witness_hash | 21 |
| 2 | witnesses[x].input_type | 32B | commit secret of the new name x (register only) | = 32 bytes | 36 |

Example:

- witnesses[0].input_type: `0x{{7265676973746572}}  ← "register"`
- output_type: `0x{{0100}} 0b 616464726573732e333039 00 2a00 636b62317179… 00000000  ← 1 record: address.309`

**Also**

- Fee per year: ≥5 chars 5,000; 4: 20,000; 3: 80,000; 2: 200,000; 1: 500,000 CKB; sub-name = parent line / 5; one year in five free; the price cell (cell dep) can only discount; an inviter (a name in cell deps) gets 10%.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 1 AccountCell in, 2 out | 25 |
| x.id | ≠ 0 (root) | 46 |
| x.owner | not all-zero | 38 |
| x.owner / manager | ≠ account-lock hash[0..20] | 44 |
| x.manager | = x.owner | 27 |
| x.id | strictly inside (p.id, p.next) (wrap-around) | 24 |
| relink | p′.id = p.id, p′.next = x.id, x.next = p.next | 25 |
| p′ | witness_hash / expires / owner / manager / label / lock unchanged, capacity not reduced | 27 |
| x.capacity | ≥ 240 CKB | 35 |
| lock | output AccountCell lock = the input account-lock | 48 |
| label | 1–40 bytes / charset / at most one dot | 31 / 30 / 45 |
| secret | witnesses[x].input_type is 32 bytes and a matching CommitCell exists | 36 |
| CommitCell | holder = x.owner and consents | 47 |
| CommitCell since | relative timestamp ≥ 60 s | 37 |
| expires | term ≥ 1 year (now = CommitCell block time) | 39 |
| expires | ≤ 10 years | 43 |
| sub-name | parent cell dep exists; parent owner consents; not outliving the parent | 40 / 29 / 41 |
| treasury | pure outputs (no type and empty data) paid in full | 42 |

### 3. `1 → 1` Renew

**Input** · input[0] name AccountCell

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label }
}
```

**Output** · output[0] name′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ {{expires: E′ > E (≤ +10 y)}}; all else unchanged }
}
```

**Output** · output[1] treasury

```
Cell{
  capacity: {{Σ pure ≥ fee(label, years)×factor + sale fees owed}},
  lock: {{lock hash == TREASURY_LOCK_HASH}},
  type: {{null}},
  data: 0x
}
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

cell_dep: code of the payer / owner locks

```
e.g. secp256k1 dep_group — for the other inputs’ locks
```

cell_dep: price cell (optional)

```
Cell{ type: hash == {{PRICE_CELL_TYPE_HASH}} (mainnet 0x3f1c…7586),
      data: 0x01 ‖ bps u32 LE }
// price_factor(): found by type hash; missing/malformed → full price
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ input_type:  {{"renew"}},
  output_type: {{records of output[0]}} // blake2b = witness_hash }
```

#### sub-name only

extra cell_dep: parent AccountCell

```
Cell{ type: same ACCOUNT_TYPE, data: { label: {{= parent}}, owner: PO, expires: {{≥ E′}} } }  // 40 / 41
```

extra input: a cell of the parent owner

```
Cell{ lock: {{hash[0..20] = PO}} }  // 29
```

**Also**

- Anyone may renew a plain name; only the parent owner can renew a sub-name.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 1 in 1 out | 27 |
| data | only expires grows; id/next/label/owner/manager/witness_hash unchanged | 27 |
| lock / capacity | lock unchanged, capacity not reduced | 27 |
| expires | extension ≤ 10 years | 43 |
| treasury | pure outputs (no type and empty data) paid in full | 42 |
| sub-name | parent cell dep; not outliving it; parent owner consents | 40 / 41 / 29 |

### 4. `1 → 1` Edit records

**Input** · input[0] name AccountCell

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label }
}
```

**Input** · input[1] owner / manager authorization cell

```
Cell{
  capacity: any,
  lock: {{lock hash[0..20] = owner / manager, a consenting lock}},
  type: any,
  data: any
}
// any position; spending it is the consent (no signature read by the type)
```

**Output** · output[0] name′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ {{witness_hash may change}}; all else unchanged }
}
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

cell_dep: code of the payer / owner locks

```
e.g. secp256k1 dep_group — for the other inputs’ locks
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ input_type:  {{"edit_records"}},
  output_type: {{records of output[0]}} // blake2b = witness_hash }
```

byte layout: witnesses[i] (WitnessArgs, i = output index of the AccountCell)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | witnesses[0].input_type | ASCII | action name: register / renew / edit_records / edit_manager / transfer / recycle | must be known | 23 |
| 1 | witnesses[i].output_type | records | records: u16 LE count; each key(u8 len) ‖ label(u8 len) ‖ value(u16 len) ‖ ttl(u32) | blake2b = witness_hash | 21 |
| 2 | witnesses[x].input_type | 32B | commit secret of the new name x (register only) | = 32 bytes | 36 |

Example:

- witnesses[0].input_type: `0x{{7265676973746572}}  ← "register"`
- output_type: `0x{{0100}} 0b 616464726573732e333039 00 2a00 636b62317179… 00000000  ← 1 record: address.309`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 1 in 1 out | 27 |
| data | only witness_hash may change | 27 |
| lock / capacity | lock unchanged, capacity not reduced | 27 |
| auth | owner or manager consents | 29 |

### 5. `1 → 1` Edit manager

**Input** · input[0] name AccountCell

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label }
}
```

**Input** · input[1] owner authorization cell

```
Cell{
  capacity: any,
  lock: {{lock hash[0..20] = owner, a consenting lock}},
  type: any,
  data: any
}
// any position; spending it is the consent (no signature read by the type)
```

**Output** · output[0] name′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ {{manager: ≠0, ≠ account-lock}}; all else unchanged }
}
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

cell_dep: code of the payer / owner locks

```
e.g. secp256k1 dep_group — for the other inputs’ locks
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ input_type:  {{"edit_manager"}},
  output_type: {{records of output[0]}} // blake2b = witness_hash }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 1 in 1 out | 27 |
| data | only manager may change (witness_hash fixed) | 27 |
| manager | not all-zero | 38 |
| manager | ≠ account-lock | 44 |
| lock / capacity | lock unchanged, capacity not reduced | 27 |
| auth | owner consents | 29 |

### 6. `1 → 1` Transfer

**Input** · input[0] name AccountCell

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label }
}
```

**Input** · input[1] owner authorization cell

```
Cell{
  capacity: any,
  lock: {{lock hash[0..20] = owner, a consenting lock}},
  type: any,
  data: any
}
// any position; spending it is the consent (no signature read by the type)
```

**Output** · output[0] name′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ {{owner: B (≠0, ≠ account-lock)}}, {{manager = B}};
        witness_hash / expires unchanged }
}
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

cell_dep: code of the payer / owner locks

```
e.g. secp256k1 dep_group — for the other inputs’ locks
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ input_type:  {{"transfer"}},
  output_type: {{records of output[0]}} // blake2b = witness_hash }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 1 in 1 out | 27 |
| data | id/next/label/expires/witness_hash unchanged (records travel) | 27 |
| owner | not all-zero | 38 |
| owner | ≠ account-lock | 44 |
| manager | = new owner | 27 |
| lock / capacity | lock unchanged, capacity not reduced | 27 |
| auth | current owner consents | 29 |

### 7. `2 → 1` Recycle

**Input** · input[0] predecessor p

```
Cell{
  capacity: P,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label,
        next: x.id }
}
```

**Input** · input[1] expired name x

```
Cell{
  since: {{0x40… absolute timestamp ≥ x.expires + 2,592,000}},
  capacity: X,
  lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label,
        next: N }
}
```

**Output** · output[0] p′

```
Cell{
  capacity: {{≥ P}},
  lock: {{{ codeHash: ACCOUNT_LOCK, hashType: type, args: 0x }}},
  type: { codeHash: ACCOUNT_TYPE, hashType: type, args: {{namespace 20B}} },
  data: AccountData{ version 0x03, witness_hash, next, expires,
        owner, manager, label,
        {{next = N}}; all else = p }
}
```

**Output** · output[1…] anything

```
X capacity: destination not constrained
```

#### cell_deps

cell_dep: ACCOUNT_TYPE code

```
code cell (mainnet 0x3072…bf0b:0)
// needed by CKB to run the type; not read by the script
```

cell_dep: ACCOUNT_LOCK code

```
code cell (mainnet 0x522c…9268:1)
// needed by CKB to run the lock; not read by the script
```

#### witnesses (WitnessArgs)

witnesses[0]

```
{ input_type: {{"recycle"}},
  output_type: {{records of output[0] p′}} }
```

byte layout: since (x input)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | flags | 1B | 0x40 = absolute + timestamp | = 0x40 | 28 |
| 1 | timestamp | 7B | unix seconds | ≥ expires + 30d | 28 |

Example:

- since: `0x{{40}}0000006f0c5a00  ← ts 0x6f0c5a00`

**Also**

- Anyone may recycle; where x’s capacity goes is not constrained.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| arity | 2 in 1 out | 25 |
| relink | p′.next = x.next; x.id = p.next | 25 |
| p′ | label/expires/owner/manager/witness_hash/lock unchanged, capacity not reduced | 27 |
| x | not the root | 46 |
| x since | absolute timestamp ≥ expires + 2,592,000 s | 28 |

## Notes

- Error codes (cells-core Error): 20 MalformedAccountData, 21 WitnessHashMismatch, 23 UnknownAction, 24 NotInPredecessorRange, 25 LinkedListBroken, 27 StructuralDrift, 28 NotExpired, 29 Unauthorized, 30 InvalidCharset, 31 InvalidLength, 34 GenesisSeedMissing, 35 InsufficientPrice, 36 CommitMissing, 37 CommitTooYoung, 38 NullOwner, 39 ExpiryTooSoon, 40 ParentMissing, 41 ParentOutlived, 42 TreasuryUnpaid, 43 TermTooLong, 44 OwnerIsCellLock, 45 TooDeep, 46 RootNotRecyclable, 47 CommitNotOwned, 48 CellLockNotAccountLock; 4 Encoding (syscall / args too short).
- Consent: ACP / anyone-can-pay Omnilock / PW-Lock inputs give none; an input-type-proxy-lock (deed) consents only if the type cell in its args is spent under a consenting lock (≤ 2 levels); a sale-lock input consents to transfer only.
- No signatures checked: authorization is “spend a cell under the owner lock”. The contracts are upgradeable by a key/multisig (docs/TRUST.md).

## Example transactions

- mainnet · genesis (root sentinel) · [0x219d1540e4dc06fd877a5094b93c5d5d302221b31fb972a4ff3d04f320f315ed](https://explorer.nervos.org/transaction/0x219d1540e4dc06fd877a5094b93c5d5d302221b31fb972a4ff3d04f320f315ed) · `node decode-tx.js 0x219d1540e4dc06fd877a5094b93c5d5d302221b31fb972a4ff3d04f320f315ed`
- mainnet · register · [0x8ee4e6fe22d2933eaa25763fb397e7edbb78869c5269d1ee8de59858771bd35a](https://explorer.nervos.org/transaction/0x8ee4e6fe22d2933eaa25763fb397e7edbb78869c5269d1ee8de59858771bd35a) · `node decode-tx.js 0x8ee4e6fe22d2933eaa25763fb397e7edbb78869c5269d1ee8de59858771bd35a`
- mainnet · transfer · [0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd](https://explorer.nervos.org/transaction/0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd) · `node decode-tx.js 0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd`
- testnet · testnet (first account tx) · [0x89ca2c196972905168ef2e8776540876b31100458f45ccaa462e7da2b2e90e4a](https://testnet.explorer.nervos.org/transaction/0x89ca2c196972905168ef2e8776540876b31100458f45ccaa462e7da2b2e90e4a) · `node decode-tx.js 0x89ca2c196972905168ef2e8776540876b31100458f45ccaa462e7da2b2e90e4a --testnet`

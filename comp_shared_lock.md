# COMP Shared Lock (Shared Cell) Constraints

> Source: gpBlockchain/comp-shared-lock @fd2370a contracts/comp-shared-lock/src/main.rs, json.rs, docs/contract-design.md　·　testnet 0xbc47…73c1 (type, Type ID)　·　deployment in deployment.json　·　"Anyone may use the Cell, but nobody may take the Cell"

- id: `comp_shared_lock` · lock script · networks: testnet · tags: proxy, open-source, community
- links: page https://retricsu.github.io/community-scripts/comp_shared_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [gpBlockchain/comp-shared-lock@fd2370ab](https://github.com/gpBlockchain/comp-shared-lock/tree/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63) · [contracts/comp-shared-lock/src/main.rs](https://github.com/gpBlockchain/comp-shared-lock/blob/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63/contracts/comp-shared-lock/src/main.rs) · [contracts/comp-shared-lock/src/json.rs](https://github.com/gpBlockchain/comp-shared-lock/blob/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63/contracts/comp-shared-lock/src/json.rs) · [docs/contract-design.md](https://github.com/gpBlockchain/comp-shared-lock/blob/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63/docs/contract-design.md) · [docs/wall-binary-payload.md](https://github.com/gpBlockchain/comp-shared-lock/blob/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63/docs/wall-binary-payload.md) · [deployment.json](https://github.com/gpBlockchain/comp-shared-lock/blob/fd2370ab4bfe15892fa2bc99c1cd92506c8bac63/deployment.json) (default-branch (master) HEAD read on 2026-11-12; contract source last changed in 1898f9d (2026-08-21, v0.3.0). Deployment from deployment.json (identical to frontend/public/deployment.json): Type ID code cell, upgraded once in 0x54d0bc54… (dataHash 0x47cf5e… → 0x81dae1…). Not surfaced by ckb-talk-radar; added at user request.)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-12
- contributors: [@gpBlockchain](https://github.com/gpBlockchain)

## Deployments

### testnet — gpBlockchain/comp-shared-lock deployment.json @fd2370a (codeHash = Type ID typeHash, hashType type)

- code_hash: `0xbc475946ff0e50276ca152c423cc260b8817de1c42a3be2eafffc55765f873c1` · hash_type: `type`
- deployed in tx [`0x54d0bc54693cdfcaf2447ce920b3fe117cb8c490a2917b8a1d6094789651db64`](https://testnet.explorer.nervos.org/transaction/0x54d0bc54693cdfcaf2447ce920b3fe117cb8c490a2917b8a1d6094789651db64) (block 22154878) · data_hash `0x81dae172b482fcf4748d7a71afae9adee91d02df70e29c022902db60b600c4d8` · type_id args `0xecf583fa79b907a7f055fee7cef4205e15863e21fd29f62d962357075fb5a2c0`

```json
{
  "script": { "code_hash": "0xbc475946ff0e50276ca152c423cc260b8817de1c42a3be2eafffc55765f873c1", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x54d0bc54693cdfcaf2447ce920b3fe117cb8c490a2917b8a1d6094789651db64", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create a COMP shared cell (lock not executed)

**Input** · any funding cells

```
unlocked by their own locks
```

**Output** · new COMP cell(s) (several per tx allowed)

```
Cell{
  capacity: any (≥ occupied),
  lock: COMP_LOCK{ args: {{channel_hash ‖ max_fee}} },
  type: should be none,
  data: any
}
```

byte layout: lock.args byte layout (40B, byte-identical in input and successor)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | channel_hash | off 0 · 32B · Byte32 | application state / channel id; opaque to the lock | args length = 40; immutable in successor | 6 / 11 |
| 1 | max_fee | off 32 · 8B · u64 LE | max capacity the COMP cell may lose per transition (shannon) | successor capacity + max_fee ≥ input capacity | 12 |

Example:

- channel_hash: `0x3bf471b16283375362945f60972e6dd4a998db34b53623457dcaa800b6a42726`
- max_fee: `0x40420f0000000000 = 1,000,000 shannon (0.01 CKB)`

Note: Example: sharedCell.lockArgs in deployment.json (shared cell #0)

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | not checked by this contract: an output lock does not run until it is spent (note: Not a contract rule: if a cell is created with args ≠ 40 bytes or with a type, every later spend fails (6 / 10), locking it forever. Testnet has creation txs making 10 or 40 COMP cells at once, e.g. 0x6a2af0eb…7a15.) |  |

### 2. `1 → 1` Anonymous message / update (anyone)

**Input** · COMP shared cell (group input, the only one)

```
Cell{
  capacity: {{C}},
  lock: COMP_LOCK{ args: {{channel_hash ‖ max_fee}} },
  type: {{none}},
  data: any
}
since: {{0x8000000000000001}}
```

**Input** · witness[group 0] (optional)

```
absent, or WitnessArgs{ lock: None / empty /
  {"public_key":null,"signature":null,
   "extensions":{…}} }
```

**Input** · cell_deps

```
COMP code cell (Type ID singleton)
0x54d0bc54…db64:0 dep_type code
```

**Output** · successor COMP cell (the only one)

```
Cell{
  capacity: {{≥ C − max_fee}},
  lock: same as input (immutable),
  type: {{none}},
  data: {{new data (unchecked)}}
}
```

**Output** · other outputs

```
no other COMP-locked output
```

byte layout: input.since (8B u64, must equal exactly 0x8000000000000001)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | relative flag | bit 63 | 1 = relative | must be 1 | 16 |
| 1 | metric | bit 61–62 | 00 = block number | must be block number | 16 |
| 2 | value | bit 0–55 | relative block count | must be 1 (0, 2, absolute 1 rejected) | 16 |

Example:

- since: `0x8000000000000001`

Note: Effect: a COMP cell created in block H is first spendable in H+1, so each cell lineage advances at most once per block (not a global quota).

byte layout: witness[group 0]: WitnessArgs.lock = UTF-8 JSON message

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | public_key | "0x"+66 hex · 33B | compressed SEC1 secp256k1 key (0x02/0x03 ‖ x), independent of CKB addresses; 0x optional, either hex case accepted | string or null; present together with signature; exactly 33 bytes | 13 / 14 |
| 1 | signature | "0x"+130 hex · 65B | r[32] ‖ s[32] ‖ recid[1], recid ∈ {0..3, 27, 28} | recovered compressed key must equal public_key | 14 / 15 |
| 2 | extensions | raw JSON | application payload, object or array; hashed as raw bytes when signed | required for signed messages; none of the three known keys may repeat | 14 |

Example:

- anonymous: `{"public_key":null,"signature":null,"extensions":{"protocol":"comp","version":2,"type":"text","payload":"hello"}}`
- signed: `{"public_key":"0x03e07dfd…ba61","signature":"0xb544e24f…25cb01","extensions":{"protocol":"comp","version":2,"type":"text","payload":"test"}}`

Note: Examples from testnet tx 0xac085cab…8d01 (anonymous) and 0x07a093a2…d50b (signed). Unknown top-level keys are syntax-checked then ignored.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | load_script succeeds (note: Error::Encoding; every syscall failure (since / type / capacity / tx_hash load) also maps to 4) | 4 |
| script.args | length = 40 (channel_hash 32B ‖ max_fee u64 LE) | 6 |
| GroupInput | exactly 1 (no merge) | 8 |
| group input since | = 0x8000000000000001 (relative 1 block) | 16 |
| inputs | only 1 input in the whole tx may use the COMP code_hash + hash_type (other COMP cells with different args included) | 7 |
| outputs | exactly 1 output with the COMP code_hash + hash_type (successor; 0 = destroy, ≥2 = fork) | 9 |
| input.type / successor.type | both must be absent | 10 |
| successor.lock | byte-identical to the input lock (code_hash, hash_type, args) (note: the successor is found by code_hash + hash_type, so a successor with changed args fails with 11, not 9) | 11 |
| successor.capacity | + max_fee ≥ input capacity (checked_add; overflow passes; may increase) | 12 |
| outputs_data[successor] | not checked (application-owned) |  |
| witness[group 0] | missing → anonymous pass; present but not valid WitnessArgs (including empty 0x) → fail | 14 |
| WitnessArgs.lock | None or empty → anonymous pass; otherwise must be UTF-8 and a complete JSON object | 14 |
| JSON | public_key / signature must be string or null, extensions object / array / null; none may repeat; no trailing bytes; nesting < 64 (note: applies to anonymous messages too) | 14 |
| public_key, signature | both null / absent → anonymous pass; exactly one → fail | 13 |

### 3. `1 → 1` Signed message (compressed public key + recoverable signature)

**Input** · COMP shared cell (group input, the only one)

```
Cell{
  capacity: {{C}},
  lock: COMP_LOCK{ args: {{channel_hash ‖ max_fee}} },
  type: {{none}},
  data: any
}
since: {{0x8000000000000001}}
```

**Input** · witness[group 0]

```
WitnessArgs{ lock: {
  "public_key": {{0x02|03… (33B)}},
  "signature": {{0x… (65B)}},
  "extensions": {{{…}}}
} }
```

**Input** · cell_deps

```
COMP code cell (Type ID singleton)
0x54d0bc54…db64:0 dep_type code
```

**Output** · successor COMP cell (the only one)

```
Cell{
  capacity: {{≥ C − max_fee}},
  lock: same as input (immutable),
  type: {{none}},
  data: {{new data (unchecked)}}
}
```

byte layout: witness[group 0]: WitnessArgs.lock = UTF-8 JSON message

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | public_key | "0x"+66 hex · 33B | compressed SEC1 secp256k1 key (0x02/0x03 ‖ x), independent of CKB addresses; 0x optional, either hex case accepted | string or null; present together with signature; exactly 33 bytes | 13 / 14 |
| 1 | signature | "0x"+130 hex · 65B | r[32] ‖ s[32] ‖ recid[1], recid ∈ {0..3, 27, 28} | recovered compressed key must equal public_key | 14 / 15 |
| 2 | extensions | raw JSON | application payload, object or array; hashed as raw bytes when signed | required for signed messages; none of the three known keys may repeat | 14 |

Example:

- anonymous: `{"public_key":null,"signature":null,"extensions":{"protocol":"comp","version":2,"type":"text","payload":"hello"}}`
- signed: `{"public_key":"0x03e07dfd…ba61","signature":"0xb544e24f…25cb01","extensions":{"protocol":"comp","version":2,"type":"text","payload":"test"}}`

Note: Examples from testnet tx 0xac085cab…8d01 (anonymous) and 0x07a093a2…d50b (signed). Unknown top-level keys are syntax-checked then ignored.

byte layout: signing digest (signed messages only)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | message_hash | 32B | CKB_BLAKE2B(65 zero bytes ‖ raw extensions bytes) |  | 15 |
| 1 | signing_digest | 32B | CKB_BLAKE2B(tx_hash ‖ message_hash); tx_hash commits to inputs, outputs, outputs_data, deps, since, not witnesses | secp256k1 recover_from_prehash(digest, sig, recid) == public_key | 15 |

Note: CKB_BLAKE2B = blake2b-256 with personal "ckb-default-hash". public_key is not hashed; it is bound by equality with the recovered key.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | load_script succeeds (note: Error::Encoding; every syscall failure (since / type / capacity / tx_hash load) also maps to 4) | 4 |
| script.args | length = 40 (channel_hash 32B ‖ max_fee u64 LE) | 6 |
| GroupInput | exactly 1 (no merge) | 8 |
| group input since | = 0x8000000000000001 (relative 1 block) | 16 |
| inputs | only 1 input in the whole tx may use the COMP code_hash + hash_type (other COMP cells with different args included) | 7 |
| outputs | exactly 1 output with the COMP code_hash + hash_type (successor; 0 = destroy, ≥2 = fork) | 9 |
| input.type / successor.type | both must be absent | 10 |
| successor.lock | byte-identical to the input lock (code_hash, hash_type, args) (note: the successor is found by code_hash + hash_type, so a successor with changed args fails with 11, not 9) | 11 |
| successor.capacity | + max_fee ≥ input capacity (checked_add; overflow passes; may increase) | 12 |
| outputs_data[successor] | not checked (application-owned) |  |
| witness[group 0] | missing → anonymous pass; present but not valid WitnessArgs (including empty 0x) → fail | 14 |
| WitnessArgs.lock | None or empty → anonymous pass; otherwise must be UTF-8 and a complete JSON object | 14 |
| JSON | public_key / signature must be string or null, extensions object / array / null; none may repeat; no trailing bytes; nesting < 64 (note: applies to anonymous messages too) | 14 |
| public_key, signature | both null / absent → anonymous pass; exactly one → fail | 13 |
| extensions | must be present and non-null for signed messages | 14 |
| public_key | hex (0x optional) decodes to exactly 33 bytes | 14 |
| signature | hex (0x optional) decodes to exactly 65 bytes | 14 |
| signature[0..64] | valid (r, s) | 15 |
| signature[64] | recid ∈ {0,1,2,3,27,28} (27/28 minus 27) | 15 |
| recovered key | = public_key (compressed, byte comparison) | 15 |

### 4. `1+N → 1+M` Sponsor / top-up (capacity increases)

**Input** · COMP shared cell (group input, the only one)

```
Cell{
  capacity: {{C}},
  lock: COMP_LOCK{ args: {{channel_hash ‖ max_fee}} },
  type: {{none}},
  data: any
}
since: {{0x8000000000000001}}
```

**Input** · sponsor inputs

```
normal-lock cells,
unlocked by their own lock + witness
```

**Output** · successor COMP cell (the only one)

```
Cell{
  capacity: {{≥ C − max_fee (may be > C)}},
  lock: same as input (immutable),
  type: {{none}},
  data: {{new data (unchecked)}}
}
```

**Output** · change

```
normal lock, must not be COMP
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script | load_script succeeds (note: Error::Encoding; every syscall failure (since / type / capacity / tx_hash load) also maps to 4) | 4 |
| script.args | length = 40 (channel_hash 32B ‖ max_fee u64 LE) | 6 |
| GroupInput | exactly 1 (no merge) | 8 |
| group input since | = 0x8000000000000001 (relative 1 block) | 16 |
| inputs | only 1 input in the whole tx may use the COMP code_hash + hash_type (other COMP cells with different args included) | 7 |
| outputs | exactly 1 output with the COMP code_hash + hash_type (successor; 0 = destroy, ≥2 = fork) | 9 |
| input.type / successor.type | both must be absent | 10 |
| successor.lock | byte-identical to the input lock (code_hash, hash_type, args) (note: the successor is found by code_hash + hash_type, so a successor with changed args fails with 11, not 9) | 11 |
| successor.capacity | + max_fee ≥ input capacity (checked_add; overflow passes; may increase) | 12 |
| sponsor inputs | must not use the COMP lock (else 7) (note: Funding (total inputs ≥ outputs + fee) is a CKB consensus rule, not this contract; the lock only bounds the COMP cell's own loss by max_fee. No such tx was found on testnet; this card follows the "Sponsor" scenario in docs/contract-design.md.) | 7 |

### 5. `✗` Rejected shapes: merge / fork / destroy / change lock / add type / overspend

**Input** · COMP inputs

```
{{2 with same lock}} → 8
{{2 with different args}} → 7
since ≠ relative 1 → 16
```

**Output** · COMP outputs

```
{{0}} (destroy / take) → 9
{{≥ 2}} (fork) → 9
changed args → 11
with type → 10
capacity < C − max_fee → 12
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | no reclaim / close path: a COMP cell can only be continued, never removed (note: The repo's scripts/reclaim.mjs cannot bypass this lock (script not reviewed line by line). max_fee bounds per-transition loss only; repeated transitions can drain capacity down to the occupied minimum.) | 9 |

## Notes

- Error codes from enum Error in main.rs (#[repr(i8)]): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 6 ArgsEncoding, 7 MultipleLockGroups, 8 InvalidInputCount, 9 InvalidSuccessorCount, 10 TypeScriptNotAllowed, 11 LockMismatch, 12 CapacityExceeded, 13 InvalidIdentity, 14 WitnessFormat, 15 SignatureInvalid, 16 InvalidSince. 5 is unused; 1–3 are never returned, only 4 is used for syscall failures.
- Check order (differs from the enum order): 6 args → 8 group input count → 16 since → 7 COMP input count → 9 successor count → 10 type → 11 lock → 12 capacity → 14/13/15 witness. When several rules fail, the first one wins, e.g. two COMP inputs with the same lock fail with 8, not 7.
- Comment / doc vs code: README says message_bytes = [0;65] ‖ utf8(compact_json(extensions)) and the main.rs comment says canonical_encode(...), but the code hashes the raw extensions bytes exactly as they appear in the witness, with no compaction or canonicalization (docs/contract-design.md's raw_json(extensions) is the accurate one). Signers must sign the exact bytes written to the witness. README's "Validation rules" list is also not in execution order (since is rule 8 there but the 3rd check in code).
- An empty witness (0x) is not "no witness": ckb-std load_witness_args fails to parse empty bytes → 14. Only a missing witness slot (index out of bound) or a None / empty WitnessArgs.lock counts as anonymous.
- The extensions.payload formats (comp text, comp-wall v1 JSON, v2 "CW2:"+base64 binary per docs/wall-binary-payload.md) are frontend conventions; the on-chain lock does not check them. The decoder only shows protocol / version / type and the payload length.
- Deployment: the COMP lock code_hash is the Type ID script hash (hash_type type); the code cell is 0x54d0bc54…db64:0 (upgraded 2026-08-21, dataHash 0x47cf5e… → 0x81dae1…). Testnet txs before the upgrade (block < 22154878) use since = 0, which the old binary did not require; the decoder flags them with 16 under the current rules. The README's v0.1 data2 deployment (0x43fd…12d9) uses the old witness schema and is not included.
- Binary unverified: the on-chain data_hash matches the deployment.json record, but the repo commits no binary or checksum; rebuilding fd2370a locally with rust 1.95.0 and the Makefile RUSTFLAGS gave 131672 bytes vs 131984 on chain, so the build was not reproduced. The decoder checks args, since, COMP input/output counts, type, lock, capacity and witness JSON shape offline; secp256k1 recovery is NOT_CHECKED (signing_digest is shown).

## Example transactions

- testnet · COMP anonymous message (public_key / signature null, since = relative 1) · [0xac085cabb479775bb4f1e3c2bfebd5b9c189b908fbd4fdfe2a8a6dd995238d01](https://testnet.explorer.nervos.org/transaction/0xac085cabb479775bb4f1e3c2bfebd5b9c189b908fbd4fdfe2a8a6dd995238d01) · `node decode-tx.js 0xac085cabb479775bb4f1e3c2bfebd5b9c189b908fbd4fdfe2a8a6dd995238d01 --testnet`
- testnet · COMP signed message (compressed public key + recoverable signature) · [0x07a093a2673d36664369f9fe12a0c528903515f2783c22fbcdd9b75b48e3d50b](https://testnet.explorer.nervos.org/transaction/0x07a093a2673d36664369f9fe12a0c528903515f2783c22fbcdd9b75b48e3d50b) · `node decode-tx.js 0x07a093a2673d36664369f9fe12a0c528903515f2783c22fbcdd9b75b48e3d50b --testnet`
- testnet · COMP signed message on another channel (max_fee 0.01 CKB, UTF-8 payload) · [0x92a4da5af311a26a68cb95f973f7fe423f707366010b9f99e633659b2da470a1](https://testnet.explorer.nervos.org/transaction/0x92a4da5af311a26a68cb95f973f7fe423f707366010b9f99e633659b2da470a1) · `node decode-tx.js 0x92a4da5af311a26a68cb95f973f7fe423f707366010b9f99e633659b2da470a1 --testnet`

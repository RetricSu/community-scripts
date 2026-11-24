# Omnilock V1 Constraints (early 2022 build)

> Source: nervosnetwork/ckb-production-scripts@ddaeae8 c/omni_lock.c + c/ckb_identity.h (binary hash pinned in build.rs = mainnet V1 data hash 0xf18e…dee5)　·　mainnet 0xa439…086d / testnet 0x79f9…2e1e, hash_type type

- id: `omnilock_v1` · lock script · networks: mainnet, testnet · tags: identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/omnilock_v1.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-production-scripts@ddaeae8f](https://github.com/nervosnetwork/ckb-production-scripts/tree/ddaeae8f065a5b600805b46d75c53de9bf290e68) · [c/omni_lock.c](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/c/omni_lock.c) · [c/ckb_identity.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/c/ckb_identity.h) · [c/omni_lock_time_lock.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/c/omni_lock_time_lock.h) · [c/omni_lock_acp.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/c/omni_lock_acp.h) · [c/omni_lock_supply.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/c/omni_lock_supply.h) · [build.rs](https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/build.rs) (build.rs at this commit pins the omni_lock binary hash f18e295b…dee5 = mainnet OMNI Lock V1 code cell data hash (the checker below only scans checksum/deployment files, so it reports unverified). Testnet V1 / Force Bridge binary 0x1bf147d1…67d1 not matched to any commit.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — CKB Explorer registry "OMNI Lock V1" (API /api/v2/scripts + fill_contracts_info.rake); binary 0xf18e…dee5 pinned in ckb-production-scripts build.rs @ddaeae8

- code_hash: `0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d` · hash_type: `type`
- deployed in tx [`0x625696834db4320214a8af09de74fd51fc8a83be69d920243f8ccd219071473b`](https://explorer.nervos.org/transaction/0x625696834db4320214a8af09de74fd51fc8a83be69d920243f8ccd219071473b) (block 7469215) · data_hash `0xf18e295b6a9286108639df659b822b1cc75216776df3d52ac9ed11a1dadadee5` · type_id args `0xf3a8efcb165546ab0d7bc2aaf35c52c3432c571b4b1b2abee0619e872539654d`

```json
{
  "script": { "code_hash": "0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x625696834db4320214a8af09de74fd51fc8a83be69d920243f8ccd219071473b", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — CKB Explorer registry "OMNI Lock V1" (testnet); binary 0x1bf1…67d1 NOT matched to a source commit

- code_hash: `0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e` · hash_type: `type`
- deployed in tx [`0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c`](https://testnet.explorer.nervos.org/transaction/0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c) (block 2787244) · data_hash `0x1bf147d1c95a5ad51016bd426c33f364257e685af54df26fc69ec40e3ae267d1` · type_id args `0x1b8572b16c07f46a0efed623aea6de05d45985b9a7c1b0b52276da5d9f9615b7`

```json
{
  "script": { "code_hash": "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c", "index": "0x0" }, "dep_type": "code" }
}
```

### mainnet — CKB Explorer registry "Force Bridge" = pre-release Omnilock (Magickbase/ckb-explorer-public-issues#532); binary 0x1bf1…67d1 NOT matched to a source commit

- code_hash: `0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f` · hash_type: `type`
- deployed in tx [`0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a`](https://explorer.nervos.org/transaction/0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a) (block 5361164) · data_hash `0x1bf147d1c95a5ad51016bd426c33f364257e685af54df26fc69ec40e3ae267d1` · type_id args `0xf5ddc0db6eb9942a269abadba4dc6e45bcc4f408ed2a31ea1f3093c8f8859727`

```json
{
  "script": { "code_hash": "0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Normal unlock (auth signature)

**Input** · input (same Omnilock group)

```
Cell{
  lock: { codeHash: OMNILOCK,
          args: {{auth(21B)}} ‖ {{omnilock flags 1B}} ‖ {{optional fields}} }
}
```

**Input** · witness[group's first]

```
WitnessArgs{
  lock: OmniLockWitnessLock{
    signature: {{Some(sig)}},
    omni_identity: None,
    preimage: None/Some
  }
}
```

**Output** · outputs: any

```
Cell{ lock: any, type: any }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | auth flag | 1B | 0 CKB / 1 ETH / 6 multisig / 0xFC owner lock / 0xFD exec / 0xFE dl (V1: 2 EOS / 3 Tron / 4 BTC / 5 Doge are defined but ckb_verify_identity does not handle them → 4; 0x12 undefined) | known value | CKB_INVALID_DATA (4) |
| 1 | auth content | 20B | pubkey hash / address / multisig script hash / lock script hash[0..20] | matches the recovered signer | -31 |
| 2 | omnilock flags | 1B | bit0 admin (omni_root) · bit1 ACP · bit2 time-lock · bit3 supply | selects the optional fields | 87 |
| 3 | omni_root? | 32B | RC cell type_id (bit0) | — | 87 |
| 4 | acp min? | 2B | min CKB / UDT payment as 10^n (bit1) | — | 87 |
| 5 | since? | 8B | time-lock (bit2) | — | 87 |
| 6 | info_cell? | 32B | supply info cell type hash (bit3) | — | 87 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length = 22 + chosen optional fields, exactly | 87 |
| signature | auth flag 0 / 1: exactly 65 bytes | 71 |
| auth flag | only 0, 1, 6, 0xFC, 0xFD, 0xFE are accepted; anything else (incl. 2–5, 0x12) returns CKB_INVALID_DATA | 4 |
| signature | recovered signer = auth content | -31 |
| auth flag 6 | multisig rules as in secp multisig | -41…-52 |
| auth flag 0xFC | some input lock hash[0..20] = auth content | 70 |
| since（bit2） | each group input since has same flags and ≥ args.since | -23 / -24 |
| supply（bit3） | info cell supply ≤ max, no burn, etc. | 90 / 91 / 92 / 93 |

### 2. `B` ACP mode (bit1, no signature)

**Input** · input

```
Cell{
  lock: OMNILOCK(args flags bit1),
  capacity: C, data: {{udt amount}}?
}
```

**Input** · witness

```
signature: None
```

**Output** · output with the same lock

```
Cell{
  lock: same,
  capacity: {{≥ C + 10^ckb_min}},
  udt: {{≥ + 10^udt_min}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| pairing | each input lock pairs with exactly one output | -44 / -45 / -46 |
| amount | CKB and UDT don't decrease and grow by at least the minimum | -42 |
| type | at most 32 type hashes | -43 |

### 3. `C` Administrator mode (omni_identity)

**Input** · witness

```
OmniLockWitnessLock{
  signature: Some,
  omni_identity: {{Some(Identity{identity 21B, proofs})}}
}
```

**Input** · cell_deps

```
RC cell (type_id = omni_root) with whitelist SMT root
```

**Output** · outputs

```
any; since / supply / ACP don't apply
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | must have omni_root (bit0) | 47 |
| omni_identity | must include proofs | 47 |
| RC rules | at least one rule, whitelist | 82 / 83 |
| proof | proof count = rule count, identity in whitelist SMT | 81 / 59 |

## Notes

- Version check: the mainnet OMNI Lock V1 (0xa439…086d) code cell data hashes (blake2b) to 0xf18e295b…dee5. That value is pinned in ckb-production-scripts build.rs from commit ddaeae8 "Omnilock (#21)" (2022-03-07) until 716433e changed it; build.rs checks build outputs against it, so V1 is c/omni_lock.c of that period. These rules were read at ddaeae8.
- The testnet OMNI Lock V1 (0x79f9…2e1e) binary has data hash 0x1bf147d1…67d1, different from mainnet V1, and no matching commit was found in ckb-production-scripts / omnilock history; the rules are not verified for that binary.
- The same 0x1bf147d1 binary is deployed on mainnet as 0x9f3a…f52f (CKB Explorer calls it "Force Bridge"): per the Explorer public issue Magickbase/ckb-explorer-public-issues#532 it is an Omnilock that Force Bridge / Yokai Swap deployed from unreleased source before Omnilock launched on mainnet. This plugin matches it too, with the rules likewise unverified.
- Differences from V2 (omnilock page): V1 does not support auth flags 2–5 or 0x12; time-lock compares as epoch only for the absolute-epoch flag (0x20) (V2 also handles relative epoch 0xA0); other error codes are the same as V2.
- Error codes: 80 UNKNOWN_FLAGS · 81 PROOF_LENGTH_MISMATCHED · 82 NO_OMNIRULE · 83 NO_WHITE_LIST · 84 INVALID_IDENTITY_ID · 85 INVALID_OMNI_LOCK_ARGS · 86 ISO9796_2_VERIFY · 87 ARGS_FORMAT; 70–75 identity errors (70 LOCK_SCRIPT_HASH_NOT_FOUND, 71 WRONG_ARGS); 40–63 from rce.h
- Signing message is the same sighash_all as secp256k1_blake160, then wrapped per chain format for ETH/BTC/etc.
- A missing witness doesn't fail immediately (owner-lock mode may need none)
- 2026-11-19 upstream review (not an on-chain upgrade claim): V1 files were removed on repository migration; the old build.rs records mainnet hash f18e…dee5. A later shared-identity multisig array fix is not evidence of a V1 upgrade; V2 has its own omnilock plugin. Retain V1 auth/deployments; exact source of testnet/Force Bridge binaries remains unproven.

## Example transactions

- mainnet · Omnilock V1 · [0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7](https://explorer.nervos.org/transaction/0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7) · `node decode-tx.js 0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7`
- mainnet · Omnilock V1 (2) · [0x9cdda31eb12bc63d0acbf833dc955ef1440feef8b054076518d62d0fa328c8c6](https://explorer.nervos.org/transaction/0x9cdda31eb12bc63d0acbf833dc955ef1440feef8b054076518d62d0fa328c8c6) · `node decode-tx.js 0x9cdda31eb12bc63d0acbf833dc955ef1440feef8b054076518d62d0fa328c8c6`
- testnet · Omnilock V1 testnet · [0x87a52bde77820449f35b5ab63248c08e29774e3f79d210eddc6e71e36fddf58c](https://testnet.explorer.nervos.org/transaction/0x87a52bde77820449f35b5ab63248c08e29774e3f79d210eddc6e71e36fddf58c) · `node decode-tx.js 0x87a52bde77820449f35b5ab63248c08e29774e3f79d210eddc6e71e36fddf58c --testnet`
- mainnet · Force Bridge pre-release Omnilock · [0x0392d425a531608670db14f48c54ebba97b27c4ed521c7ca85047490a6f8c3ed](https://explorer.nervos.org/transaction/0x0392d425a531608670db14f48c54ebba97b27c4ed521c7ca85047490a6f8c3ed) · `node decode-tx.js 0x0392d425a531608670db14f48c54ebba97b27c4ed521c7ca85047490a6f8c3ed`

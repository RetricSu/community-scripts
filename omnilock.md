# Omnilock (lock) Constraints

> Source: nervosnetwork/omnilock / c/omni_lock.c + ckb_identity.h　·　mainnet 0x9b81…6f26 / testnet 0xf329…52cb, hash_type type (RFC 0042)

- id: `omnilock` · lock script · networks: mainnet, testnet · tags: identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/omnilock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/omnilock@280dd97a](https://github.com/nervosnetwork/omnilock/tree/280dd97ac0930ea1ed766a18d49478229347c832) · [c/omni_lock.c](https://github.com/nervosnetwork/omnilock/blob/280dd97ac0930ea1ed766a18d49478229347c832/c/omni_lock.c) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-24
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — RFC 0042 (mainnet)

- code_hash: `0x9b819793a64463aed77c615d6cb226eea5487ccfc0783043a587254cda2b6f26` · hash_type: `type`
- deployed in tx [`0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842`](https://explorer.nervos.org/transaction/0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842) (block 12017064) · data_hash `0x768f306681da232ceb0b94f436c5f813377179762a831c5ad8797bd4fd2d118d` · type_id args `0x855508fe0f0ca25b935b070452ecaee48f6c9f1d66cd15f046616b99e948236a`

```json
{
  "script": { "code_hash": "0x9b819793a64463aed77c615d6cb226eea5487ccfc0783043a587254cda2b6f26", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — RFC 0042 (testnet)

- code_hash: `0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb` · hash_type: `type`
- deployed in tx [`0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602`](https://testnet.explorer.nervos.org/transaction/0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602) (block 12898141) · data_hash `0x6b29b6f10346b43c540e53806ba88ba0fe3a0c3a29d7448ef555840c8f8318fa` · type_id args `0x761f51fc9cd6a504c32c6ae64b3746594d1af27629b427c5ccf6c9a725a89144`

```json
{
  "script": { "code_hash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602", "index": "0x0" }, "dep_type": "code" }
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
| 0 | auth flag | 1B | 0 CKB / 1 ETH / 2 EOS / 3 Tron / 4 BTC / 5 Doge / 6 multisig / 0x12 ETH-displaying / 0xFC owner lock / 0xFD exec / 0xFE dl | known value | CKB_INVALID_DATA |
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
| signature | auth flag 0–5 / 0x12: exactly 65 bytes | 71 |
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

- Error codes: 80 UNKNOWN_FLAGS · 81 PROOF_LENGTH_MISMATCHED · 82 NO_OMNIRULE · 83 NO_WHITE_LIST · 84 INVALID_IDENTITY_ID · 85 INVALID_OMNI_LOCK_ARGS · 86 ISO9796_2_VERIFY · 87 ARGS_FORMAT; 70–75 identity errors (70 LOCK_SCRIPT_HASH_NOT_FOUND, 71 WRONG_ARGS); 40–63 from rce.h
- Signing message is the same sighash_all as secp256k1_blake160, then wrapped per chain format for ETH/BTC/etc.
- A missing witness doesn't fail immediately (owner-lock mode may need none)

## Example transactions

- mainnet · Omnilock · [0xd2bfaae562e59d5f7b5157df076e4258c9b51a5b3fb7c558af86361116ebc56b](https://explorer.nervos.org/transaction/0xd2bfaae562e59d5f7b5157df076e4258c9b51a5b3fb7c558af86361116ebc56b) · `node decode-tx.js 0xd2bfaae562e59d5f7b5157df076e4258c9b51a5b3fb7c558af86361116ebc56b`

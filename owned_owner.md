# iCKB owned_owner (lock + type) Constraints

> Source: ickb/contracts / scripts/contracts/owned_owner/src　·　mainnet code_hash 0xacc7…1bd0 (data1)

- id: `owned_owner` · lock script · networks: mainnet · tags: defi, open-source, community, p-ickb
- links: page https://retricsu.github.io/community-scripts/owned_owner.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ickb/contracts@c951927e](https://github.com/ickb/contracts/tree/c951927e35fb5d4a13e28c5e55687d49cea7ca05) · [scripts/contracts/owned_owner/src](https://github.com/ickb/contracts/blob/c951927e35fb5d4a13e28c5e55687d49cea7ca05/scripts/contracts/owned_owner/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-10-20
- contributors: [@phroi](https://github.com/phroi)

## Deployments

### mainnet — blake2b of ickb/contracts release binary, confirmed on mainnet

- code_hash: `0xacc79e07d107831feef4c70c9e683dac5644d5993b9cb106dca6e74baa381bd0` · hash_type: `data1`
- deployed in tx [`0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44`](https://explorer.nervos.org/transaction/0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44) (block 14010067) · data_hash `0xacc79e07d107831feef4c70c9e683dac5644d5993b9cb106dca6e74baa381bd0`

```json
{
  "script": { "code_hash": "0xacc79e07d107831feef4c70c9e683dac5644d5993b9cb106dca6e74baa381bd0", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x621a6f38de3b9f453016780edac3b26bfcbfa3e2ecb47c2da275471a5d3ed165", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 2` Create: withdrawal request + owner token

**Input** · iCKB deposit etc.

```
Cell{ lock: ICKB_LOGIC, type: NERVOS_DAO }
```

**Output** · owned (output i)

```
Cell{
  lock: {{OWNED_OWNER}},
  type: NERVOS_DAO, data: {{block number ≠ 0}}
}
```

**Output** · owner (output j)

```
Cell{
  lock: user,
  type: {{OWNED_OWNER}},
  data: owned_distance = {{i − j}} (i32)
}
```

byte layout: owner data: OwnedOwnerData (struct 4B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owned_distance | 4B | index offset of the owned cell relative to the owner i32 LE | points to exactly one owned cell | 8 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| owned | a cell locked by this script must be a DAO withdrawal request | 6 |
| cell | not both lock and type = this script | 7 |
| pairing | in outputs each owned has exactly one owner pointing to it (index + distance) | 8 |

### 2. `2 → 0` Claim: unlock the withdrawal request with the owner

**Input** · owned

```
Cell{ lock: OWNED_OWNER, type: NERVOS_DAO }  @ OutPoint(tx, i)
```

**Input** · owner

```
Cell{ lock: user (signs), type: OWNED_OWNER, data: distance }  @ OutPoint(tx, j)
```

**Output** · withdrawn CKB

```
any (DAO rules checked separately)
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| pairing | in inputs by OutPoint: owned (tx, i) = owner (tx, j + distance), one to one | 8 |
| owner data | ≥ 4 bytes | 4 |

## Notes

- Error codes: 1–4 syscall · 5 NotEmptyArgs · 6 NotWithdrawalRequest · 7 ScriptMisuse · 8 Mismatch
- Purpose: anyone can create a DAO withdrawal for a user, but only the owner-cell holder can claim it

## Example transactions

- mainnet · iCKB owned owner · [0x33410eb3915d46fea183cf0267fca90e1ee566c27358531f4c4e9d3acc0e028c](https://explorer.nervos.org/transaction/0x33410eb3915d46fea183cf0267fca90e1ee566c27358531f4c4e9d3acc0e028c) · `node decode-tx.js 0x33410eb3915d46fea183cf0267fca90e1ee566c27358531f4c4e9d3acc0e028c`

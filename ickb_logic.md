# iCKB logic (lock + type) Constraints

> Source: ickb/contracts / scripts/contracts/ickb_logic/src　·　mainnet code_hash 0x2a81…3bd3 (data1, computed from the release binary and confirmed on-chain)

- id: `ickb_logic` · type script · networks: mainnet · tags: token, defi, open-source, community, p-ickb
- links: page https://retricsu.github.io/community-scripts/ickb_logic.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ickb/contracts@c951927e](https://github.com/ickb/contracts/tree/c951927e35fb5d4a13e28c5e55687d49cea7ca05) · [scripts/contracts/ickb_logic/src](https://github.com/ickb/contracts/blob/c951927e35fb5d4a13e28c5e55687d49cea7ca05/scripts/contracts/ickb_logic/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-10-20
- contributors: [@phroi](https://github.com/phroi)

## Deployments

### mainnet — blake2b of ickb/contracts release binary, confirmed on mainnet

- code_hash: `0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3` · hash_type: `data1`
- deployed in tx [`0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44`](https://explorer.nervos.org/transaction/0xd7309191381f5a8a2904b8a79958a9be2752dbba6871fa193dab6aeb29dc8f44) (block 14010067) · data_hash `0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3`

```json
{
  "script": { "code_hash": "0x2a8100ab5990fa055ab1b50891702e1e895c7bd1df6322cd725c1a6115873bd3", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x621a6f38de3b9f453016780edac3b26bfcbfa3e2ecb47c2da275471a5d3ed165", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `Phase 1` Deposit CKB → deposit + receipt

**Input** · any CKB

```
Cell{ lock: user }
```

**Output** · DAO deposits (N, same amount)

```
Cell{
  lock: {{ICKB_LOGIC (empty args)}},
  type: NERVOS_DAO, data: 0x0000000000000000,
  unoccupied: {{1,000 – 1,000,000 CKB}}
}
```

**Output** · receipt

```
Cell{
  lock: user,
  type: {{ICKB_LOGIC}},
  data: ReceiptData{ quantity: {{N}}, amount: {{unoccupied}} }
}
```

byte layout: receipt data: ReceiptData (struct 12B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | deposit_quantity | 4B | number of deposits u32 LE | > 0 | 9 |
| 1 | deposit_amount | 8B | unoccupied capacity of one deposit (shannons) | matches the output deposits | 10 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| deposit | unoccupied ≥ 1,000 CKB | 7 |
| deposit | unoccupied ≤ 1,000,000 CKB | 8 |
| receipt | quantity > 0 | 9 |
| accounting | per amount: output deposit count = Σ receipt quantity | 10 |

### 2. `Phase 2` Receipt → iCKB (xUDT)

**Input** · receipt

```
Cell{ type: ICKB_LOGIC, data: {quantity, amount} }
// header_deps: the receipt's block
```

**Output** · iCKB xUDT

```
Cell{
  type: xUDT( args = {{hash(ICKB_LOGIC) ‖ 0x00000080}} ),
  data: {{u128 amount}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| value | iCKB = amount × AR₀ / AR_m (AR₀ = 10¹⁶), 10% off above 100,000 iCKB per deposit | 11 |
| balance | Σ input UDT + Σ input receipt value = Σ output UDT + Σ input deposit value | 11 |
| udt | each output UDT amount ≤ u64::MAX | 12 |

### 3. `Burn` iCKB → withdraw a deposit

**Input** · iCKB xUDT

```
Cell{ type: iCKB xUDT, data: amount }
```

**Input** · any iCKB deposit

```
Cell{ lock: ICKB_LOGIC, type: NERVOS_DAO }
```

**Output** · DAO withdrawal request (usually locked by owned_owner)

```
Cell{ lock: OWNED_OWNER, type: NERVOS_DAO, data: {{block number}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| balance | burned iCKB = deposit value at its block AR | 11 |

## Notes

- Misuse (6 ScriptMisuse, all cells): a DAO deposit or iCKB xUDT can never be a lock; an ICKB_LOGIC lock must carry a DAO deposit type
- Error codes: 1–4 syscall · 5 NotEmptyArgs · 6 ScriptMisuse · 7 DepositTooSmall · 8 DepositTooBig · 9 EmptyReceipt · 10 ReceiptMismatch · 11 AmountMismatch · 12 AmountUnreasonablyBig
- args must be empty, and no output lock with the same code but other args may exist (5)

## Example transactions

- mainnet · iCKB phase 1 (deposit + receipt) · [0xdc92e6a30c09e2c537742490cc687528d026e83064b1b654f037598d2ba619c5](https://explorer.nervos.org/transaction/0xdc92e6a30c09e2c537742490cc687528d026e83064b1b654f037598d2ba619c5) · `node decode-tx.js 0xdc92e6a30c09e2c537742490cc687528d026e83064b1b654f037598d2ba619c5`
- mainnet · iCKB phase 2 (receipt → iCKB) · [0x69f1d05ca190a813597127badfd3eeb48254436c650c0a25b36eaa45051175ea](https://explorer.nervos.org/transaction/0x69f1d05ca190a813597127badfd3eeb48254436c650c0a25b36eaa45051175ea) · `node decode-tx.js 0x69f1d05ca190a813597127badfd3eeb48254436c650c0a25b36eaa45051175ea`
- mainnet · iCKB burn (iCKB → deposit) · [0xa27b19a9f600e37fc57f8e6d34846dc9bab03eea58aa1264e33431e0a9f1f8f0](https://explorer.nervos.org/transaction/0xa27b19a9f600e37fc57f8e6d34846dc9bab03eea58aa1264e33431e0a9f1f8f0) · `node decode-tx.js 0xa27b19a9f600e37fc57f8e6d34846dc9bab03eea58aa1264e33431e0a9f1f8f0`

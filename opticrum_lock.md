# Opticrum (Fiber liquidity rental) Lock Script Constraints

> Source: Opticrum/ckb-contract-script @803523a contracts/opticrum/src, opticrum-protocol/src/lib.rs　·　framework ckb-cinnabar-verifier @f50d8e9　·　testnet type_id 0x1f84…0247 (deployment/testnet/opticrum.json)

- id: `opticrum_lock` · lock script · networks: testnet · tags: defi, channel, open-source, community
- links: page https://retricsu.github.io/community-scripts/opticrum_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [Opticrum/ckb-contract-script@803523a4](https://github.com/Opticrum/ckb-contract-script/tree/803523a472041262b6f1b049067550801d136f66) · [contracts/opticrum/src/main.rs](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/contracts/opticrum/src/main.rs) · [contracts/opticrum/src/error.rs](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/contracts/opticrum/src/error.rs) · [contracts/opticrum/src/state.rs](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/contracts/opticrum/src/state.rs) · [contracts/opticrum/src/utils.rs](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/contracts/opticrum/src/utils.rs) · [contracts/opticrum/src/verifiers](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/contracts/opticrum/src/verifiers) · [opticrum-protocol/src/lib.rs](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/opticrum-protocol/src/lib.rs) · [deployment/testnet/opticrum.json](https://github.com/Opticrum/ckb-contract-script/blob/803523a472041262b6f1b049067550801d136f66/deployment/testnet/opticrum.json) (commit read when writing this spec (default-branch HEAD 2026-11-12). Framework ckb-cinnabar-verifier pinned at ashuralyk/ckb-cinnabar@f50d8e9 (system error codes 1–11). Testnet code_hash is the type_id from deployment/testnet/opticrum.json; the live code cell is v0.3.2 (0x6a3319f8…:0). Older versions under the same type_id used different args/data layouts.)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-12
- contributors: [@ashuralyk](https://github.com/ashuralyk)

## Deployments

### testnet — Opticrum deployment/testnet/opticrum.json (type_id, v0.1.1 → v0.3.2 migrations)

- code_hash: `0x1f8452818672fbb60f39c72e2d30dadd1814f322dfc21bf552784d83054f0247` · hash_type: `type`
- deployed in tx [`0x6a3319f835dc32e47ff6aac59235e70de1a4a7e6f52a82768d447978bd82f5c4`](https://testnet.explorer.nervos.org/transaction/0x6a3319f835dc32e47ff6aac59235e70de1a4a7e6f52a82768d447978bd82f5c4) (block 22145886) · data_hash `0xdf7c875f63746641995c59b0af914314b924d636ae021dfe9e126fab22d0cdf2` · type_id args `0x3b009c195d6dd5617d687a0387bccefae99eac8a1a5e393bf2563a3afb7feb49`

```json
{
  "script": { "code_hash": "0x1f8452818672fbb60f39c72e2d30dadd1814f322dfc21bf552784d83054f0247", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x6a3319f835dc32e47ff6aac59235e70de1a4a7e6f52a82768d447978bd82f5c4", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → Order` Buyer posts an Order (lock not executed)

**Input** · buyer funds

```
any cells
```

**Output** · Order cell

```
Cell{
  lock: OPTICRUM{ args: {{fiber_pubkey ‖ buyer_lock_hash}} },
  data: {{xudt_amount ‖ channel_capacity ‖ shannons_per_block}}
}
```

byte layout: Order lock.args (65B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | fiber_pubkey | 33B | buyer Fiber node pubkey (compressed secp256k1); the contract only compares it as args |  | 35 |
| 1 | buyer_lock_hash | 32B | buyer lock hash: authorizes cancel / inject / withdraw | total length = 65 | 35 |

Example:

- fiber_pubkey: `0x037aa2f692451e2f14f0fb1305e0f2a7e564fde080c44649dfe18c1e12d4e8f262`
- buyer_lock_hash: `0x716619d4cc4d8ca5ae7f67b9bf26bdff2acd8a8139fa96a2196e4c2e57cf6753`

Note: Example: the input Order cell of testnet tx 0xd5e460e4…

byte layout: Order data (exactly 32B)

| # | field | size | meaning | error |
| --- | --- | --- | --- | --- |
| 0 | xudt_amount | 16B u128 LE | xUDT rent offered (0 in CKB mode) | 25 |
| 1 | channel_capacity | 8B u64 LE | requested channel capacity (shannons) | 25 |
| 2 | shannons_per_block | 8B u64 LE | rent per block | 25 |

Example:

- xudt_amount: `0x00000000000000000000000000000000`
- channel_capacity: `0x0030ef7dba020000 (3 000 000 000 000)`
- shannons_per_block: `0xb169010000000000 (92 593)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| creation | a lock only runs when spent: args / data are not checked on creation; a malformed Order only fails when spent | — |

### 2. `Order → 0` Buyer cancels the Order

**Input** · Order cell

```
Cell{
  lock: OPTICRUM{ args: {{… ‖ buyer_lock_hash}} },
  data: …
}
```

**Input** · buyer cell

```
Cell{ lock: {{hash = buyer_lock_hash}} }
```

**Output** · no Opticrum output

```
funds go anywhere
```

byte layout: Order lock.args (65B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | fiber_pubkey | 33B | buyer Fiber node pubkey (compressed secp256k1); the contract only compares it as args |  | 35 |
| 1 | buyer_lock_hash | 32B | buyer lock hash: authorizes cancel / inject / withdraw | total length = 65 | 35 |

Example:

- fiber_pubkey: `0x037aa2f692451e2f14f0fb1305e0f2a7e564fde080c44649dfe18c1e12d4e8f262`
- buyer_lock_hash: `0x716619d4cc4d8ca5ae7f67b9bf26bdff2acd8a8139fa96a2196e4c2e57cf6753`

Note: Example: the input Order cell of testnet tx 0xd5e460e4…

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock.args | length 65 → Order, 133 → Match, else → 35 | 35 |
| output Opticrum cell | the first output whose lock has the same code_hash and hash_type = type (args not compared) | — |
| Order data | exactly 32B | 25 |
| route | Order with no Opticrum output → OrderCancel | 40 |
| authorization | buyer_lock_hash equals some input lock hash | 36 |

### 3. `Order → Match` Seller opens a channel and matches

**Input** · Order cell

```
Cell{
  lock: OPTICRUM{ args: {{order_args}} },
  data: {{xudt_amount ‖ channel_capacity ‖ shannons_per_block}}
}
```

**Input** · seller cell

```
Cell{ lock: {{hash = seller_lock_hash}} }
```

**Output** · Match cell

```
Cell{
  lock: OPTICRUM{ args: {{order_args}} ‖ {{channel_outpoint}} ‖ {{seller_lock_hash}} },
  data: xudt_amount ‖ shannons_per_block ‖ {{last_extraction_block = 0}}
}
```

byte layout: Match lock.args (133B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | order_args | 65B | = the original Order args (fiber_pubkey ‖ buyer_lock_hash) | must be equal on match | 40 |
| 1 | channel_outpoint | 36B | Fiber channel funding cell: tx_hash 32B ‖ index u32 LE | must be in cell_deps | 22 |
| 2 | seller_lock_hash | 32B | seller lock hash: authorizes match / extract / destroy | total length = 133 | 35 |

Example:

- order_args: `0x037aa2…f262 ‖ 0x716619…6753`
- channel_outpoint: `0xfade972d2b5d27890345dd06b69985752d85183f417c18916464f29cbb1847e9 ‖ 00000000`
- seller_lock_hash: `0x5cbfb4398b8d8c080e6e68da34bce43761229d70c7eff56d8502e755b7516980`

Note: Example: the output Match cell of testnet tx 0xd5e460e4…

byte layout: Match data (≥ 32B, only the first 32B are read)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | xudt_amount | 16B u128 LE | remaining xUDT rent | = Order.xudt_amount on match | 26 |
| 1 | shannons_per_block | 8B u64 LE | rent per block | never changes | 33 |
| 2 | last_extraction_block | 8B u64 LE | block of the seller’s last extraction (0 = never) | = 0 on match | 28 / 30 |

Example:

- xudt_amount: `0x00000000000000000000000000000000`
- shannons_per_block: `0xb169010000000000`
- last_extraction_block: `0x0000000000000000`

**Also**

- cell_deps: [ opticrum code, {{Fiber channel funding cell = channel_outpoint}} ]
- header_deps: [ {{Order cell block}}, {{channel cell block}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock.args | length 65 → Order, 133 → Match, else → 35 | 35 |
| output Opticrum cell | the first output whose lock has the same code_hash and hash_type = type (args not compared) | — |
| route | output is Match, Match.order_args = Order args, same xUDT (amount + type) → OrderMatch; else 40 | 40 |
| Match data | ≥ 32B | 28 |
| channel_outpoint | in cell_deps; its lock is Fiber funding (code_hash = testnet 0x6c67…6d7c / mainnet 0xe45b…f4f1 / mock, hash_type type); capacity ≥ channel_capacity, or in xUDT mode same type and amount ≥ xudt_amount | 22 |
| authorization | seller_lock_hash among inputs | 37 |
| Match data | shannons_per_block = Order value, last_extraction_block = 0 | 28 |
| capacity | unoccupied capacity of Order and Match equal | 23 |
| xudt_amount | Match = Order | 26 |
| header_deps | contain the Order cell block and the channel cell block; missing → 29 | 29 |
| ordering | channel cell block > Order cell block | 24 |

### 4. `Match → Match (seller)` Seller extracts rent

**Input** · Match cell

```
Cell{
  lock: OPTICRUM{ args: order_args ‖ channel_outpoint ‖ seller_lock_hash },
  data: xudt_amount ‖ rate ‖ {{base}}
}
```

**Input** · seller cell

```
Cell{ lock: {{hash = seller_lock_hash}} }
```

**Output** · Match cell

```
Cell{
  lock: OPTICRUM{ args: {{unchanged}} },
  data: xudt_amount ‖ rate ‖ {{tip}}
  capacity: {{− rate × (tip − base)}}
}
```

byte layout: Match data (≥ 32B, only the first 32B are read)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | xudt_amount | 16B u128 LE | remaining xUDT rent | = Order.xudt_amount on match | 26 |
| 1 | shannons_per_block | 8B u64 LE | rent per block | never changes | 33 |
| 2 | last_extraction_block | 8B u64 LE | block of the seller’s last extraction (0 = never) | = 0 on match | 28 / 30 |

Example:

- xudt_amount: `0x00000000000000000000000000000000`
- shannons_per_block: `0xb169010000000000`
- last_extraction_block: `0x0000000000000000`

**Also**

- cell_deps: [ opticrum code, {{channel cell still live}} ]
- header_deps: [ {{tip block (index 0)}}, Match cell block (first extraction) ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock.args | length 65 → Order, 133 → Match, else → 35 | 35 |
| output Opticrum cell | the first output whose lock has the same code_hash and hash_type = type (args not compared) | — |
| route | same Match args and xUDT (amount + type) → MatchUpdate | 40 |
| Match args | unchanged | 31 |
| shannons_per_block | unchanged | 33 |
| authorization | exactly one party: seller among inputs, buyer not; both or neither → 38 | 38 |
| channel_outpoint | still in cell_deps (channel not closed) | 22 |
| exhaustion | old state not exhausted: remaining value > rate × (tip − base) (error named MatchNotExhausted, opposite meaning) | 32 |
| extraction | unoccupied capacity decrease = rate × (tip − base); base = last_extraction_block, or the Match cell block when it is 0 | 27 |
| last_extraction_block | = block number of header_deps[0] | 30 |
| hesitation | first extraction (base = 0): tip − Match cell block > 3600 | 42 |
| header_deps | missing → 29 | 29 |

### 5. `Match → Match (buyer)` Buyer withdraws / injects

**Input** · Match cell

```
Cell{
  lock: OPTICRUM{ args: order_args ‖ …  },
  data: xudt_amount ‖ rate ‖ last_extraction_block
}
```

**Input** · buyer cell

```
Cell{ lock: {{hash = buyer_lock_hash}} }
```

**Output** · Match cell

```
Cell{
  lock: OPTICRUM{ args: {{unchanged}} },
  data: … ‖ {{last_extraction_block unchanged}}
  capacity: {{dump all → 0 unoccupied | increase}}
}
```

byte layout: Match data (≥ 32B, only the first 32B are read)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | xudt_amount | 16B u128 LE | remaining xUDT rent | = Order.xudt_amount on match | 26 |
| 1 | shannons_per_block | 8B u64 LE | rent per block | never changes | 33 |
| 2 | last_extraction_block | 8B u64 LE | block of the seller’s last extraction (0 = never) | = 0 on match | 28 / 30 |

Example:

- xudt_amount: `0x00000000000000000000000000000000`
- shannons_per_block: `0xb169010000000000`
- last_extraction_block: `0x0000000000000000`

**Also**

- header_deps: [ {{tip block (index 0)}}, Match cell block ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock.args | length 65 → Order, 133 → Match, else → 35 | 35 |
| output Opticrum cell | the first output whose lock has the same code_hash and hash_type = type (args not compared) | — |
| Match args | unchanged | 31 |
| shannons_per_block | unchanged | 33 |
| authorization | exactly one party: buyer among inputs, seller not | 38 |
| last_extraction_block | unchanged | 30 |
| xUDT type | unchanged | 31 |
| withdraw | a decrease must dump everything (unoccupied capacity and xUDT both 0) | 43 |
| withdraw window | only inside the hesitation window: seller never extracted and tip − Match cell block ≤ 3600 | 41 |
| inject | an increase must be outside the hesitation window | 44 |
| no-op | neither increase nor decrease → 31 | 31 |

### 6. `Match → 0` Seller destroys an exhausted Match

**Input** · Match cell

```
Cell{
  lock: OPTICRUM{ args: … ‖ {{seller_lock_hash}} },
  data: xudt_amount ‖ rate ‖ base
}
```

**Input** · seller cell

```
Cell{ lock: {{hash = seller_lock_hash}} }
```

**Output** · no Opticrum output

```
remaining funds go anywhere
```

**Also**

- header_deps: [ {{tip block (index 0)}}, Match cell block ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock.args | length 65 → Order, 133 → Match, else → 35 | 35 |
| output Opticrum cell | the first output whose lock has the same code_hash and hash_type = type (args not compared) | — |
| route | Match with no Opticrum output → MatchDestroy | 40 |
| authorization | seller_lock_hash among inputs | 37 |
| exhaustion | rate × (tip − base) ≥ remaining value (xudt_amount in xUDT mode, else unoccupied capacity) | 32 |
| header_deps | missing → 29 | 29 |

## Notes

- Error codes: framework ckb-cinnabar-verifier 1–5 are system errors, 10 NotFoundRootVerifier, 11 NotFoundBranchVerifier; contract error.rs starts at 20: 20 BadOrderCancel, 21 BadOrderMatch, 22 ChannelCellNotInDep, 23 ChannelCapacityMismatch, 24 ChannelCreatedBeforeOrder, 25 OrderDataNotSet, 26 BadXudtAmount, 27 BadExtractionAmount, 28 MatchDataNotSet, 29 HeaderNotSet, 30 BadMatchDataUpdate, 31 BadMatchUpdate, 32 MatchNotExhausted, 33 RentPerBlockMismatch, 34 MatchNotViable (unused), 35 BadArgsLength, 36 BuyerAuthMissing, 37 SellerAuthMissing, 38 AuthorizationMissing, 39 UnexpectedBranch, 40 UnknownState, 41 WithdrawWindowExpired, 42 HesitationNotElapsed, 43 PartialWithdrawNotAllowed, 44 InjectDuringHesitation.
- Comment/code discrepancies: opticrum-protocol says “MatchData — 40-byte”, but the code uses MATCH_DATA_LEN = 32 and from_slice only requires ≥ 32B. Error 32 MatchNotExhausted means “already exhausted” on the extraction path (opposite meaning).
- Routing compares xUDT as an (amount, type) tuple (parse_xudt reads data[0..16]), so in xUDT mode any Match update that changes the xUDT amount routes to 40 UnknownState; extraction / withdraw / inject are in practice only reachable in CKB mode. This is code behaviour, not a rule inferred by this page.
- The output Opticrum cell is “the first output whose lock has the same code_hash and hash_type = type”; args are not compared, so with several Opticrum cells in one tx another cell may be picked. The lock checks no signature; authorization is only “that party’s lock hash appears among the inputs”.
- Deployment: testnet migrated several times under type_id 0x1f84…0247 (v0.1.1 → v0.3.2); earlier versions used different args (166B) / data (40–41B) layouts and this page only decodes the current one. No mainnet deployment is published.

## Example transactions

- testnet · Opticrum order cancel (v0.3.1) · [0xeae315454cf6ec837355b3cf36bc3f5d034ce9b54516c4ba9909c23087ae49e7](https://testnet.explorer.nervos.org/transaction/0xeae315454cf6ec837355b3cf36bc3f5d034ce9b54516c4ba9909c23087ae49e7) · `node decode-tx.js 0xeae315454cf6ec837355b3cf36bc3f5d034ce9b54516c4ba9909c23087ae49e7 --testnet`
- testnet · Opticrum order match → Match cell (v0.3.1) · [0xd5e460e4082ace0d95ccf206087d7a1f0c6574a1a1ea44f51995ae6d2ef5ad44](https://testnet.explorer.nervos.org/transaction/0xd5e460e4082ace0d95ccf206087d7a1f0c6574a1a1ea44f51995ae6d2ef5ad44) · `node decode-tx.js 0xd5e460e4082ace0d95ccf206087d7a1f0c6574a1a1ea44f51995ae6d2ef5ad44 --testnet`
- testnet · Opticrum match update (v0.3.2) · [0xedb05ee072027cd9c13de2e6111e4290fdde9fe03ba63eaa4397b70205faf47e](https://testnet.explorer.nervos.org/transaction/0xedb05ee072027cd9c13de2e6111e4290fdde9fe03ba63eaa4397b70205faf47e) · `node decode-tx.js 0xedb05ee072027cd9c13de2e6111e4290fdde9fe03ba63eaa4397b70205faf47e --testnet`

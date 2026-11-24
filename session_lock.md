# Session lock (session-key lock) Constraints

> Source: luongthanhtung03/ckb-session-kit @ f51f07c / contracts/session-lock/src/main.rs　·　testnet 0xab41…08ce (data2)　·　community project, testnet only

- id: `session_lock` · lock script · networks: testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/session_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [luongthanhtung03/ckb-session-kit@8157a644](https://github.com/luongthanhtung03/ckb-session-kit/tree/8157a64458ebe20e83b28e71f26331fdd95965e4) · [contracts/session-lock/src/main.rs](https://github.com/luongthanhtung03/ckb-session-kit/blob/8157a64458ebe20e83b28e71f26331fdd95965e4/contracts/session-lock/src/main.rs) · [src/lock.ts](https://github.com/luongthanhtung03/ckb-session-kit/blob/8157a64458ebe20e83b28e71f26331fdd95965e4/src/lock.ts) · [deployment/testnet.json](https://github.com/luongthanhtung03/ckb-session-kit/blob/8157a64458ebe20e83b28e71f26331fdd95965e4/deployment/testnet.json) · [docs/SECURITY-EVIDENCE.md](https://github.com/luongthanhtung03/ckb-session-kit/blob/8157a64458ebe20e83b28e71f26331fdd95965e4/docs/SECURITY-EVIDENCE.md) (commit bumped after docs/SDK work (58 commits); contracts/session-lock/src/main.rs unchanged since before f51f07cc)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-10-31
- contributors: [@luongthanhtung03](https://github.com/luongthanhtung03)

## Deployments

### testnet — ckb-session-kit src/lock.ts TESTNET_DEPLOYMENT, deployment/testnet.json, docs/SECURITY-EVIDENCE.md

- code_hash: `0xab419466529ea479590d4be7b23580ce2ddc640ba902735c9ad9a22dc64c08ce` · hash_type: `data2`
- deployed in tx [`0xf3098bdb9a7bb1c500990be0f1159b7e66f507fef6b7a4f904046024284877f2`](https://testnet.explorer.nervos.org/transaction/0xf3098bdb9a7bb1c500990be0f1159b7e66f507fef6b7a4f904046024284877f2) (block 22736207) · data_hash `0xab419466529ea479590d4be7b23580ce2ddc640ba902735c9ad9a22dc64c08ce`

```json
{
  "script": { "code_hash": "0xab419466529ea479590d4be7b23580ce2ddc640ba902735c9ad9a22dc64c08ce", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf3098bdb9a7bb1c500990be0f1159b7e66f507fef6b7a4f904046024284877f2", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `owner` Owner mode: spend anything / revoke

**Input** · session-lock cell(s)

```
Cell{
  lock: { codeHash: SESSION_LOCK (data2),
          args: {{owner ‖ session ‖ max_per_tx ‖ min_interval}} }
}
```

**Input** · owner's cell (its own lock verifies)

```
Cell{
  lock: {{lock hash = owner_lock_hash}}
}
```

**Output** · anything

```
no rule applied
```

byte layout: lock.args byte layout (80 / 112 / 128 / 160B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owner_lock_hash | 32B | owner's lock hash | any input with this lock hash → owner mode, pass | 11 |
| 1 | session_lock_hash | 32B | session key cell lock hash | required among inputs when owner is absent | 11 |
| 2 | max_per_tx | 8B | max outflow per tx u64 LE (shannons, fee included) | Σ group inputs − change ≤ max_per_tx | 12 |
| 3 | min_interval | 8B | min interval u64 LE (blocks) | if > 0 each group input's since must be relative block number ≥ it | 14 |
| 4 | recipient / token… | 0/32/48/80B | 80B: none; 112B: recipient(32); 128B: token_type_hash(32)+max_per_tx_token u128(16); 160B: token + recipient | other lengths → 10 | 10 |

Example:

- owner_lock_hash: `0x1111111111111111111111111111111111111111111111111111111111111111`
- session_lock_hash: `0x2222222222222222222222222222222222222222222222222222222222222222`
- max_per_tx: `0x00e40b5402000000 (=100 CKB)`
- min_interval: `0x0300000000000000 (=3)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | args length ∈ {80,112,128,160}; script buffer 256B | 10 |
| inputs | neither owner nor session lock hash among inputs | 11 |

### 2. `N → ≤1` Session spend (CKB, any payee)

**Input** · session-lock cell(s) (group)

```
Cell{
  lock: SESSION_LOCK(args 80B),
  type: {{none}},
  since: {{if min_interval>0: relative blocks ≥ min_interval}}
}
```

**Input** · session key cell

```
Cell{
  lock: {{lock hash = session_lock_hash}}
}
```

**Output** · change (at most 1)

```
Cell{
  lock: {{same SESSION_LOCK script}},
  type: {{none}}
}
```

**Output** · payment

```
Cell{ lock: any }  // no recipient set
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| since | min_interval>0 and a group input since is not relative-block or < min_interval | 14 |
| type | group input or change has a type script | 18 |
| outputs | more than 1 output back to this lock | 16 |
| capacity | Σ group input capacity − change (saturating) > max_per_tx (fee counts) | 12 |
| capacity | checked add overflow | 15 |

### 3. `recipient` Session spend (recipient-scoped, 112B / 160B)

**Input** · session-lock cell(s)

```
Cell{
  lock: { codeHash: SESSION_LOCK (data2),
          args: {{owner ‖ session ‖ max_per_tx ‖ min_interval ‖ {{recipient 32B}}}} }
}
```

**Input** · session key cell

```
Cell{ lock: {{session_lock_hash}} }
```

**Output** · change ≤ 1

```
Cell{ lock: same SESSION_LOCK }
```

**Output** · payment

```
Cell{
  lock: {{recipient or owner}},
  type: {{none (token type allowed in token sessions)}}
}
```

**Output** · session key change

```
Cell{ lock: session_lock_hash }  // capacity / tokens must not grow
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock | other output lock ∉ {this lock, session key, recipient, owner} | 13 |
| type | recipient / owner output has a non-token type | 18 |
| capacity | session-key outputs capacity > session-key inputs capacity (no siphon to the key) | 17 |
| capacity | as above: outflow > max_per_tx | 12 |

### 4. `token` Token session (128B / 160B, u128 xUDT/sUDT-like amounts)

**Input** · session-lock token cell(s)

```
Cell{
  lock: SESSION_LOCK(… ‖ token_type_hash ‖ max_per_tx_token),
  type: {{token type, hash = token_type_hash}},
  data: {{amount u128 LE (≥16B)}}
}
```

**Output** · token change ≤ 1

```
Cell{
  lock: same SESSION_LOCK,
  type: {{none or the token type}},
  data: {{exactly 16B if token}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type | group input / change has another type | 18 |
| data | token input data < 16B, or token change data ≠ 16B | 19 |
| data | Σ token in − token change > max_per_tx_token | 20 |
| data | recipient set and session-key token out > in | 17 |
| capacity | CKB capacity still bounded by max_per_tx | 12 |

## Notes

- This lock verifies no signature: owner / session key signatures are checked by their own locks in the same tx (an input with that lock hash counts as authorization).
- Expiry is off-chain (SDK) only, not enforced on chain; revoking = spending the cell in owner mode.
- Error codes: 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 10 BadArgs · 11 NotAuthorized · 12 OutflowExceeded · 13 RecipientNotAllowed · 14 RateLimited · 15 CapacityOverflow · 16 TooManyChangeCells · 17 KeyCellGrew · 18 TypedCell · 19 TokenData · 20 TokenOutflowExceeded.
- The repo also lists older testnet deployments (8 Oct 0x1ae8…bc20, 13 Oct 0x1cb7…90cd) with different rules; they are not matched here.

## Example transactions

- testnet · Session spend of exactly max_per_tx (100 CKB), session key only · [0xe2fced3a5d73059465f0b9400acdf0cba3fc27e441b82d1faebcbe44b1b20a8b](https://testnet.explorer.nervos.org/transaction/0xe2fced3a5d73059465f0b9400acdf0cba3fc27e441b82d1faebcbe44b1b20a8b) · `node decode-tx.js 0xe2fced3a5d73059465f0b9400acdf0cba3fc27e441b82d1faebcbe44b1b20a8b --testnet`
- testnet · Rate-limited cell spent with since = 3 relative blocks · [0xe53e4ada7f76d847b7e1883115c9b31851d8962e195cc2eb1fdaeb53e6b07653](https://testnet.explorer.nervos.org/transaction/0xe53e4ada7f76d847b7e1883115c9b31851d8962e195cc2eb1fdaeb53e6b07653) · `node decode-tx.js 0xe53e4ada7f76d847b7e1883115c9b31851d8962e195cc2eb1fdaeb53e6b07653 --testnet`
- testnet · Token session, recipient-scoped: 3 units to the creator · [0xa8d1d98f8fd5b22cab9fd989b58a39995171e7099b1df5df46292c6ca8f94a88](https://testnet.explorer.nervos.org/transaction/0xa8d1d98f8fd5b22cab9fd989b58a39995171e7099b1df5df46292c6ca8f94a88) · `node decode-tx.js 0xa8d1d98f8fd5b22cab9fd989b58a39995171e7099b1df5df46292c6ca8f94a88 --testnet`
- testnet · Owner sweep ignoring the scope · [0x8019404b3708050660b921201ec534cc7f20ef68fa1e836012d33f531066bae5](https://testnet.explorer.nervos.org/transaction/0x8019404b3708050660b921201ec534cc7f20ef68fa1e836012d33f531066bae5) · `node decode-tx.js 0x8019404b3708050660b921201ec534cc7f20ef68fa1e836012d33f531066bae5 --testnet`

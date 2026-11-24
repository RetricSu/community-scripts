# CKBSwap Constant-product AMM Constraints

> Source: ckbswap/contracts @b7cd845 contracts/swap/src/main.rs, crates/protocol/src/lib.rs　·　one binary, three roles (args[0])　·　no deployment published

- id: `ckbswap_amm` · type script · no on-chain deployment · tags: token, defi, open-source, community
- links: page https://retricsu.github.io/community-scripts/ckbswap_amm.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckbswap/contracts@b7cd8458](https://github.com/ckbswap/contracts/tree/b7cd8458a798b4386c1b401ce7dd10333a728443) · [contracts/swap/src/main.rs](https://github.com/ckbswap/contracts/blob/b7cd8458a798b4386c1b401ce7dd10333a728443/contracts/swap/src/main.rs) · [crates/protocol/src/lib.rs](https://github.com/ckbswap/contracts/blob/b7cd8458a798b4386c1b401ce7dd10333a728443/crates/protocol/src/lib.rs) · [README.md](https://github.com/ckbswap/contracts/blob/b7cd8458a798b4386c1b401ce7dd10333a728443/README.md) (commit read when writing this spec (default-branch HEAD, 2026-10-27). The repository publishes no deployment (README: no deployment configuration, transaction builder or CKB-VM integration tests), so there is no on-chain code_hash and no test tx.)
- binary vs source: unverified (deployed binary not matched to the source) — no deployment resolved on chain
- on-chain data checked: 2026-11-12
- contributors: [@ckbswap](https://github.com/ckbswap)

## Deployments

No on-chain deployment recorded.

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → State` Create a pool (genesis)

**Input** · inputs[0]

```
any cell; its CellInput determines pool_id
```

**Output** · output 0: State

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: {{500 CKB}},
  data: CSWP\x01 ‖ {{nonce 0}} ‖ asset0 ‖ asset1 ‖ {{0 ‖ 0 ‖ 0}}
}
```

**Output** · outputs 1..: one reserve per xUDT asset

```
Cell{
  lock: SWAP{ args: 0x02 ‖ pool_id ‖ asset },
  type: xUDT{ args: … ‖ 00000000 },
  capacity: 200 CKB,
  data: {{0u128}}
}
```

byte layout: script.args (three roles share one code_hash)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | role | 1B | 0 = state type, 1 = state lock, 2 = xUDT reserve lock | 0 / 1 → 33B total; 2 → 65B total | 5 |
| 1 | pool_id | 32B | ckb_hash(creating tx inputs[0] ‖ u64 LE 0) | checked at genesis | 14 |
| 2 | asset | 32B (role 2) | the reserve’s xUDT type hash |  | 5 |

Example:

- role: `0x00`
- pool_id: `0x… (32B)`

byte layout: State cell data (exactly 125B, LE)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | magic | 5B | "CSWP" ‖ 0x01 | exact | 5 |
| 1 | nonce | 8B u64 | +1 per action |  | 9 |
| 2 | asset0 | 32B | CKB = all zero, else xUDT type hash | asset0 < asset1 (byte order) | 9 |
| 3 | asset1 | 32B |  |  | 9 |
| 4 | reserve0 | 16B u128 |  | ≤ 2^112 − 1 | 9 |
| 5 | reserve1 | 16B u128 |  | ≤ 2^112 − 1 | 9 |
| 6 | total_lp | 16B u128 | includes the permanently locked 1000 | 0 ⇒ reserves 0; else ≥ 1000 and reserves > 0 | 9 |

Example:

- magic: `0x4353575001`
- nonce: `0x0100000000000000`
- asset0: `0x00…00 (CKB)`
- asset1: `0x0101…01`
- reserve0: `0x40420f00000000000000000000000000 (1 000 000)`
- reserve1: `0x80841e00000000000000000000000000 (2 000 000)`
- total_lp: `0x45941500000000000000000000000000 (1 414 213)`

Note: Example values are built from the protocol unit test pool() (after the first ADD 1 000 000 / 2 000 000), not on-chain data

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type args | role 0 ‖ pool_id, 33B; invalid role/length combination → 5 | 5 |
| structure | same-type outputs are exactly [0]; ≤ 1 same-type input; exactly one state output tx-wide for this code_hash, and state input count = this pool’s input count | 11 |
| output 0 | lock = role 1 ‖ pool_id; capacity = 500 CKB + (reserve0 if asset0 is CKB) | 12 |
| reserve outputs | one role-2 cell per xUDT asset, at outputs 1, 2 in asset order; tx-wide role-2 cell count for the pool = number of xUDT assets | 11 |
| reserve cell | type is canonical xUDT (code_hash 0x50bd…1b95, hash_type data1, 36B args ending in four zero bytes), hash = asset, ≠ LP token, data exactly 16B = reserve, capacity = 200 CKB | 13 |
| LP | neither asset may be the pool’s own LP token | 13 |
| pool_id | = ckb_hash(serialized inputs[0] ‖ u64 LE 0) | 14 |
| state | = State::new(asset0, asset1): nonce, reserves, total_lp all 0 | 14 |
| LP | total LP token of this pool is 0 in both inputs and outputs | 14 |
| state data | 125B, magic, asset0 < asset1 and other validity | 5 / 9 |

### 2. `State → State (ADD)` Add liquidity

**Input** · State + reserves (same previous tx, reserve indices 1, 2)

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: 500 CKB + reserve0?,
  data: … ‖ reserve0 ‖ reserve1 ‖ total_lp
}
```

**Input** · actor

```
Cell{ lock: {{hash = actor}} } + deposited assets
```

**Output** · output 0: State

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: {{+ in0 (CKB pool)}},
  data: {{nonce + 1}} ‖ … ‖ {{reserve0 + in0}} ‖ {{reserve1 + in1}} ‖ {{total_lp + lp_mint}}
}
```

**Output** · reserves

```
Cell{
  lock: SWAP{ args: 0x02 ‖ pool_id ‖ asset },
  type: xUDT{ args: … ‖ 00000000 },
  capacity: 200 CKB,
  data: {{reserve + in}}
}
```

**Output** · actor

```
{{LP token + lp_mint}}
```

byte layout: witness[state input].input_type = Action (exactly 114B, LE)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | op | 1B | 0 ADD, 1 REMOVE, 2 SWAP_IN, 3 SWAP_OUT |  | 5 |
| 1 | side | 1B | swap direction: 0 = 0→1, 1 = 1→0; liquidity actions require 0 | ≤ 1 | 5 / 7 |
| 2 | actor | 32B | actor lock hash | appears among inputs | 10 |
| 3 | amount0 | 16B u128 |  |  | 7 |
| 4 | amount1 | 16B u128 |  |  | 7 |
| 5 | min0 | 16B u128 |  |  | 8 |
| 6 | min1 | 16B u128 |  |  | 8 |
| 7 | min_lp | 16B u128 |  |  | 8 |

Example:

- op: `0x02 (SWAP_IN)`
- side: `0x00`
- actor: `0x0303…03`
- amount0: `0x10270000000000000000000000000000 (10 000)`
- amount1 / min0 / min1 / min_lp: `0x00…`

Note: Example: unit test fee_stays_in_pool, SWAP_IN 10 000 → out1 = 19 743

**Also**

- witness[state input].input_type = {{Action{ op: 0 ADD }}}

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type args | role 0 ‖ pool_id, 33B; invalid role/length combination → 5 | 5 |
| structure | same-type outputs are exactly [0]; ≤ 1 same-type input; exactly one state output tx-wide for this code_hash, and state input count = this pool’s input count | 11 |
| output 0 | lock = role 1 ‖ pool_id; capacity = 500 CKB + (reserve0 if asset0 is CKB) | 12 |
| reserve outputs | one role-2 cell per xUDT asset, at outputs 1, 2 in asset order; tx-wide role-2 cell count for the pool = number of xUDT assets | 11 |
| reserve cell | type is canonical xUDT (code_hash 0x50bd…1b95, hash_type data1, 36B args ending in four zero bytes), hash = asset, ≠ LP token, data exactly 16B = reserve, capacity = 200 CKB | 13 |
| LP | neither asset may be the pool’s own LP token | 13 |
| input state | lock = role 1, capacity formula; reserve inputs come from the same tx as the state, at indices 1, 2 | 12 / 11 |
| witness | WitnessArgs.input_type at the state input index exists and is exactly 114B | 5 |
| actor | lock hash appears among inputs | 10 |
| amounts | side = 0, amount0 / amount1 ∈ (0, 2^112) | 7 |
| first deposit | root = ⌊√(a0·a1)⌋ > 1000; lp_mint = root − 1000; total_lp = root | 7 |
| later deposits | take (in0, in1) at the reserve ratio; lp_mint = min(in0·L/r0, in1·L/r1) > 0 | 7 |
| slippage | in0 ≥ min0, in1 ≥ min1, lp_mint ≥ min_lp | 8 |
| state | output state = apply(input state, action) | 9 |
| actor balances | xUDT: new + in = old + out; CKB: new + in + fee ≥ old + out | 13 / 12 |
| LP | tx-wide and for the actor: new + burn = old + mint | 13 |
| arithmetic | overflow / divide by zero | 6 |

### 3. `State → State (REMOVE)` Remove liquidity

**Input** · State + reserves

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: …,
  data: … ‖ reserve0 ‖ reserve1 ‖ total_lp
}
```

**Input** · actor

```
Cell{ lock: {{hash = actor}} } + LP token
```

**Output** · output 0: State

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: …,
  data: {{nonce + 1}} ‖ … ‖ {{reserve0 − out0}} ‖ {{reserve1 − out1}} ‖ {{total_lp − burn}}
}
```

**Output** · actor

```
{{+ out0, + out1; LP − burn}}
```

byte layout: witness[state input].input_type = Action (exactly 114B, LE)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | op | 1B | 0 ADD, 1 REMOVE, 2 SWAP_IN, 3 SWAP_OUT |  | 5 |
| 1 | side | 1B | swap direction: 0 = 0→1, 1 = 1→0; liquidity actions require 0 | ≤ 1 | 5 / 7 |
| 2 | actor | 32B | actor lock hash | appears among inputs | 10 |
| 3 | amount0 | 16B u128 |  |  | 7 |
| 4 | amount1 | 16B u128 |  |  | 7 |
| 5 | min0 | 16B u128 |  |  | 8 |
| 6 | min1 | 16B u128 |  |  | 8 |
| 7 | min_lp | 16B u128 |  |  | 8 |

Example:

- op: `0x02 (SWAP_IN)`
- side: `0x00`
- actor: `0x0303…03`
- amount0: `0x10270000000000000000000000000000 (10 000)`
- amount1 / min0 / min1 / min_lp: `0x00…`

Note: Example: unit test fee_stays_in_pool, SWAP_IN 10 000 → out1 = 19 743

**Also**

- witness[state input].input_type = {{Action{ op: 1 REMOVE, amount0: burn }}}

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type args | role 0 ‖ pool_id, 33B; invalid role/length combination → 5 | 5 |
| structure | same-type outputs are exactly [0]; ≤ 1 same-type input; exactly one state output tx-wide for this code_hash, and state input count = this pool’s input count | 11 |
| output 0 | lock = role 1 ‖ pool_id; capacity = 500 CKB + (reserve0 if asset0 is CKB) | 12 |
| reserve outputs | one role-2 cell per xUDT asset, at outputs 1, 2 in asset order; tx-wide role-2 cell count for the pool = number of xUDT assets | 11 |
| reserve cell | type is canonical xUDT (code_hash 0x50bd…1b95, hash_type data1, 36B args ending in four zero bytes), hash = asset, ≠ LP token, data exactly 16B = reserve, capacity = 200 CKB | 13 |
| LP | neither asset may be the pool’s own LP token | 13 |
| parameters | side = 0, amount1 = 0, min_lp = 0, 0 < burn ≤ total_lp − 1000 | 7 |
| returns | out_i = ⌊burn · r_i / total_lp⌋ > 0 | 7 |
| slippage | out0 ≥ min0, out1 ≥ min1 | 8 |
| state / balances | as ADD: apply equality, actor and LP balance conservation | 9 / 12 / 13 |
| actor | lock hash appears among inputs | 10 |

### 4. `State → State (SWAP)` Swap (SWAP_IN exact input / SWAP_OUT exact output)

**Input** · State + reserves

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: …,
  data: … ‖ r_in ‖ r_out ‖ total_lp
}
```

**Input** · actor

```
Cell{ lock: {{hash = actor}} } + input asset
```

**Output** · output 0: State

```
Cell{
  lock: SWAP{ args: 0x01 ‖ pool_id },
  type: SWAP{ args: 0x00 ‖ pool_id },
  capacity: …,
  data: {{nonce + 1}} ‖ … ‖ {{r_in + input}} ‖ {{r_out − output}} ‖ total_lp
}
```

**Output** · actor

```
{{+ output}}
```

byte layout: witness[state input].input_type = Action (exactly 114B, LE)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | op | 1B | 0 ADD, 1 REMOVE, 2 SWAP_IN, 3 SWAP_OUT |  | 5 |
| 1 | side | 1B | swap direction: 0 = 0→1, 1 = 1→0; liquidity actions require 0 | ≤ 1 | 5 / 7 |
| 2 | actor | 32B | actor lock hash | appears among inputs | 10 |
| 3 | amount0 | 16B u128 |  |  | 7 |
| 4 | amount1 | 16B u128 |  |  | 7 |
| 5 | min0 | 16B u128 |  |  | 8 |
| 6 | min1 | 16B u128 |  |  | 8 |
| 7 | min_lp | 16B u128 |  |  | 8 |

Example:

- op: `0x02 (SWAP_IN)`
- side: `0x00`
- actor: `0x0303…03`
- amount0: `0x10270000000000000000000000000000 (10 000)`
- amount1 / min0 / min1 / min_lp: `0x00…`

Note: Example: unit test fee_stays_in_pool, SWAP_IN 10 000 → out1 = 19 743

**Also**

- witness[state input].input_type = {{Action{ op: 2 | 3, side }}}

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type args | role 0 ‖ pool_id, 33B; invalid role/length combination → 5 | 5 |
| structure | same-type outputs are exactly [0]; ≤ 1 same-type input; exactly one state output tx-wide for this code_hash, and state input count = this pool’s input count | 11 |
| output 0 | lock = role 1 ‖ pool_id; capacity = 500 CKB + (reserve0 if asset0 is CKB) | 12 |
| reserve outputs | one role-2 cell per xUDT asset, at outputs 1, 2 in asset order; tx-wide role-2 cell count for the pool = number of xUDT assets | 11 |
| reserve cell | type is canonical xUDT (code_hash 0x50bd…1b95, hash_type data1, 36B args ending in four zero bytes), hash = asset, ≠ LP token, data exactly 16B = reserve, capacity = 200 CKB | 13 |
| LP | neither asset may be the pool’s own LP token | 13 |
| parameters | min1 = 0, min_lp = 0; SWAP_IN also needs amount1 = 0; SWAP_OUT needs min0 = 0 | 5 |
| SWAP_IN | output = ⌊in·997·r_out / (r_in·1000 + in·997)⌋, 0 < output < r_out, in ≤ 2^112 − 1 | 7 |
| SWAP_IN | output ≥ min0 | 8 |
| SWAP_OUT | input = ⌊r_in·out·1000 / ((r_out − out)·997)⌋ + 1 ≤ 2^112 − 1, 0 < out < r_out | 7 |
| SWAP_OUT | input ≤ amount1 (max input) | 8 |
| invariant | (r0′·1000 − in0·3)(r1′·1000 − in1·3) ≥ r0·r1·10^6 (0.3% fee stays in the pool) | 9 |
| state / balances | apply equality, actor balance conservation; total_lp unchanged | 9 / 12 / 13 |
| actor | lock hash appears among inputs | 10 |

### 5. `lock roles` State lock (role 1) and reserve lock (role 2)

**Input** · role 1 lock group

```
Cell{ lock: SWAP{ args: 0x01 ‖ pool_id }, type: {{SWAP{ 0x00 ‖ pool_id }}} }
```

**Input** · role 2 lock group

```
Cell{ lock: SWAP{ args: 0x02 ‖ pool_id ‖ asset } }
```

**Output** · constrained by the state type

```
the locks check no outputs
```

byte layout: script.args (three roles share one code_hash)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | role | 1B | 0 = state type, 1 = state lock, 2 = xUDT reserve lock | 0 / 1 → 33B total; 2 → 65B total | 5 |
| 1 | pool_id | 32B | ckb_hash(creating tx inputs[0] ‖ u64 LE 0) | checked at genesis | 14 |
| 2 | asset | 32B (role 2) | the reserve’s xUDT type hash |  | 5 |

Example:

- role: `0x00`
- pool_id: `0x… (32B)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| role 1 | args 33B; exactly 1 group input whose type = role 0 ‖ same pool_id | 11 |
| role 2 | args 65B; exactly 1 tx input has type = role 0 ‖ pool_id | 10 |
| args | any other role / length combination | 5 |
| signature | neither lock checks a signature or witness; safety comes entirely from the state type checks | — |

## Notes

- Error codes (crates/protocol/src/lib.rs Error): 5 Encoding, 6 Arithmetic, 7 Amount, 8 Slippage, 9 Invariant, 10 Authorization, 11 Structure, 12 Capacity, 13 Token, 14 Genesis. Every syscall failure is mapped to 11 Structure by sys().
- There is no pool-destruction path: the state type requires same-type outputs to be exactly [0], so a pool can only be updated after creation. Only one state output (same code_hash) is allowed per tx, so several pools cannot be updated in one transaction.
- LP token = xUDT (code_hash 0x50bd…1b95, data1), args = hash(role 1 state lock) ‖ 00000000; minting relies on xUDT owner mode (the state cell is an input). XUDT_CODE_HASH is hard-coded in the protocol crate.
- Deployment: the README says the repo contains no deployment configuration, transaction builder or CKB-VM integration tests; no official code_hash was found, so match is empty and there are no test txs. The plugin recomputes apply in JS (cross-checked against the protocol unit-test values) and marks balances and reserve layout as not checked.

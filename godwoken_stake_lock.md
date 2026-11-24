# Godwoken block-producer stake (stake-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/stake-lock/src/entry.rs　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_stake_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_stake_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/stake-lock/src/entry.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/stake-lock/src/entry.rs) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@jjyr](https://github.com/jjyr), [@keroro520](https://github.com/keroro520)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json stake_lock

- code_hash: `0xb619184ab9142c51b0ee75f4e24bcec3d077eefe513115bad68836d06738fd2c` · hash_type: `type`
- deployed in tx [`0x2e46a10a67987594d4eaee2d5f9ac96ce651f7bfb44e82c286a12a1950ad4f29`](https://explorer.nervos.org/transaction/0x2e46a10a67987594d4eaee2d5f9ac96ce651f7bfb44e82c286a12a1950ad4f29) (block 7469211) · data_hash `0x107f292ab7eeaaa9d412a2719f6a264985e90f935e557cf895f267909835e8a9` · type_id args `0xd3847a81e252069632d45a1f975297c288551307624b5e49f9fb778840ed54a1`

```json
{
  "script": { "code_hash": "0xb619184ab9142c51b0ee75f4e24bcec3d077eefe513115bad68836d06738fd2c", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x2e46a10a67987594d4eaee2d5f9ac96ce651f7bfb44e82c286a12a1950ad4f29", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json stake_lock

- code_hash: `0x7f5a09b8bd0e85bcf2ccad96411ccba2f289748a1c16900b0635c2ed9126f288` · hash_type: `type`
- deployed in tx [`0x053fdb4ed3181eab3a3a5f05693b53a8cdec0a24569e16369f444bac48be7de9`](https://testnet.explorer.nervos.org/transaction/0x053fdb4ed3181eab3a3a5f05693b53a8cdec0a24569e16369f444bac48be7de9) (block 5292884) · data_hash `0x107f292ab7eeaaa9d412a2719f6a264985e90f935e557cf895f267909835e8a9` · type_id args `0x0fc0f22f9a6e000692159c9d5dc633fba7ffcd1f1f2218d23aa2ede96f4b471d`

```json
{
  "script": { "code_hash": "0x7f5a09b8bd0e85bcf2ccad96411ccba2f289748a1c16900b0635c2ed9126f288", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x053fdb4ed3181eab3a3a5f05693b53a8cdec0a24569e16369f444bac48be7de9", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → 1` Reused by the rollup when producing a block

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
// {{type hash == args[0..32]}}
```

**Input** · input[1] stake cell

```
Cell{
  capacity: S,
  lock: STAKE_LOCK(rollup_type_hash ‖ owner ‖ timepoint),
  type: null,
  data: 0x
}
```

**Output** · output[0] rollup cell′

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
```

**Output** · output[k] stake cell′

```
Cell{
  capacity: ≥ S, ≥ required_staking_capacity,
  lock: STAKE_LOCK(same owner, timepoint = this block),
  type: null,
  data: 0x
}
// checked by state-validator (25)
```

#### cell_deps

cell_dep: STAKE_LOCK code

```
code cell (see deployments)
// needed by CKB to run the script
```

byte layout: args (72B) = rollup_type_hash ‖ StakeLockArgs (struct)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_type_hash | 32B | rollup cell type hash |  | 5 |
| 1 | owner_lock_hash | 32B | block producer L1 lock hash |  | 22 |
| 2 | stake_finalized_timepoint | 8B LE | finality point of the last block using this stake | must be finalized to withdraw | 22 |

Example:

- args: `0x{{40d7…(32B)}}{{9b1a…(32B)}}{{e803000000000080}}  ← timestamp timepoint`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | valid StakeLockArgs | 5 |
| rollup | a rollup cell in inputs → pass | 0 |

### 2. `1 → 0` Producer withdraws

**Input** · input[0] stake cell

```
Cell{
  capacity: S,
  lock: STAKE_LOCK(…),
  type: null,
  data: 0x
}
```

**Input** · input[1] owner cell

```
Cell{
  capacity: any,
  lock: {{lock hash == owner_lock_hash}},
  type: any,
  data: any
}
```

**Output** · outputs

```
any
```

#### cell_deps

cell_dep: rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
// read only: GlobalState.last_finalized_timepoint
```

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| finality | the rollup cell in cell_deps shows stake_finalized_timepoint finalized | 22 |
| owner | an input with lock hash = owner_lock_hash | 22 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.
- Timepoint (u64): top bit 0 = L2 block number, 1 = millisecond timestamp (low 63 bits).

## Example transactions

- mainnet · stake cell spent · [0x711676493b4f407f3354025687b36584fae1b875aac5cfaf846c3163a6faf39a](https://explorer.nervos.org/transaction/0x711676493b4f407f3354025687b36584fae1b875aac5cfaf846c3163a6faf39a) · `node decode-tx.js 0x711676493b4f407f3354025687b36584fae1b875aac5cfaf846c3163a6faf39a`

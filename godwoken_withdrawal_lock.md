# Godwoken withdrawal (withdrawal-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/withdrawal-lock/src/entry.rs + gw-utils/src/withdrawal.rs　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_withdrawal_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_withdrawal_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/withdrawal-lock/src/entry.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/withdrawal-lock/src/entry.rs) · [gwos/contracts/gw-utils/src/withdrawal.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/withdrawal.rs) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@keroro520](https://github.com/keroro520), [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json withdrawal_lock

- code_hash: `0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658` · hash_type: `type`
- deployed in tx [`0xe6389b5cf63eec1e2592e930414bc43f92508e529bdd5f5a07fa1dd140f4f20a`](https://explorer.nervos.org/transaction/0xe6389b5cf63eec1e2592e930414bc43f92508e529bdd5f5a07fa1dd140f4f20a) (block 7469203) · data_hash `0x8ae445bca5ebe150fb01b17f0e3e639c38fe2db9dc5bc149644e447068bace84` · type_id args `0xffc2139a9fb7d05fd5927d537eb8ed692cb67d29404fc710333f01dbfd17043a`

```json
{
  "script": { "code_hash": "0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe6389b5cf63eec1e2592e930414bc43f92508e529bdd5f5a07fa1dd140f4f20a", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json withdrawal_lock

- code_hash: `0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6` · hash_type: `type`
- deployed in tx [`0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93`](https://testnet.explorer.nervos.org/transaction/0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93) (block 5292884) · data_hash `0x8ae445bca5ebe150fb01b17f0e3e639c38fe2db9dc5bc149644e447068bace84` · type_id args `0xbfef6580c1f93b98fa7d33bb3faa63255caba9bfbebfbada5eab4ce195052b9f`

```json
{
  "script": { "code_hash": "0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → 1` Claim after finality (UnlockWithdrawalViaFinalize)

**Input** · input[i] withdrawal cell

```
Cell{
  since: {{timestamp timepoint: absolute timestamp ≥ finalized ts}},
  capacity: W,
  lock: WITHDRAWAL_LOCK(rollup_type_hash ‖ args ‖ owner_lock),
  type: null | sUDT,
  data: …
}
```

**Output** · output[i] (same index)

```
Cell{
  capacity: {{= W}},
  lock: {{owner_lock}},
  type: {{same as input}},
  data: {{same as input}}
}
// if any withdrawal input lacks such an output, an input under owner_lock_hash is required instead (8)
```

#### cell_deps

cell_dep: WITHDRAWAL_LOCK code

```
code cell (see deployments)
// needed by CKB to run the script
```

cell_dep: rollup cell + RollupConfig (block-number timepoint)

```
rollup cell (type hash = rollup_type_hash; may be an input instead) → GlobalState
RollupConfig by data hash → is_finalized()
```

#### witnesses (WitnessArgs)

witnesses[first group input]

```
{ lock: {{UnlockWithdrawalWitness::UnlockWithdrawalViaFinalize{}}}  // 0x00000000 + empty table }
```

byte layout: args = rollup_type_hash ‖ WithdrawalLockArgs (104B struct) ‖ owner_lock_len (u32 BE) ‖ owner_lock (Script)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_type_hash | 32B | rollup cell type hash |  | 5 |
| 1 | withdrawal_block_hash | 32B | L2 block containing the withdrawal |  | 29 |
| 2 | withdrawal_finalized_timepoint | 8B | finalized Timepoint |  | 45 |
| 3 | account_script_hash | 32B | L2 account script hash |  |  |
| 4 | owner_lock_hash | 32B | L1 recipient lock hash | = hash(owner_lock) | 5 |
| 5 | owner_lock_len | 4B BE | owner_lock byte length (big-endian!) | = remaining length | 5 |
| 6 | owner_lock | Script | L1 recipient lock script |  | 5 |

Example:

- owner_lock_len: `0x{{00000049}}  ← 73 bytes (secp256k1 script, BE)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length ≥ 32+104+4; owner_lock length matches; hash = owner_lock_hash | 5 |
| witness.lock | valid UnlockWithdrawalWitness | 11 |
| block number | rollup cell (deps or inputs) exists and finalized | 9 / 10 / 45 |
| timestamp | since is an absolute timestamp ≥ timepoint | 6 / 45 |
| outputs | each same-lock input i: output[i] same capacity / data / type and lock = owner_lock; else an owner input | 8 |

### 2. `1 → 1` Block reverted (UnlockWithdrawalViaRevert)

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
```

**Input** · input[1] withdrawal cell

```
Cell{
  capacity: W,
  lock: WITHDRAWAL_LOCK(…),
  type: …,
  data: …
}
```

**Output** · output[0] rollup cell′

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState …
}
// witness RollupSubmitBlock: {{reverted_block_hashes ∋ withdrawal_block_hash}}
```

**Output** · output[k] custodian cell

```
Cell{
  capacity: {{= W}},
  lock: { codeHash: {{config.custodian_script_type_hash}}, hashType: type,
          args: rollup_type_hash ‖ {{deposit_block_hash = 0, timepoint = 0}} ‖ … },
  type: {{same}},
  data: {{same}}
}
```

#### cell_deps

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

#### witnesses (WitnessArgs)

witnesses[first group input]

```
{ lock: {{UnlockWithdrawalViaRevert{ custodian_lock_hash 32B }}}  // item id 1 }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| rollup | a rollup output whose action is SubmitBlock and whose reverted list contains withdrawal_block_hash | 9 / 29 |
| custodian | an output with lock hash = custodian_lock_hash; args[0..32] = rollup_type_hash | 7 / 5 |
| custodian | code_hash = config.custodian_script_type_hash, type, zero block hash and timepoint, same content | 7 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.
- Timepoint (u64): top bit 0 = L2 block number, 1 = millisecond timestamp (low 63 bits).

## Example transactions

- mainnet · withdrawal cell spent · [0x31f86157b9656673dca539ea571eb91268b1eaef6036fd3c4e77311dfb9f9be7](https://explorer.nervos.org/transaction/0x31f86157b9656673dca539ea571eb91268b1eaef6036fd3c4e77311dfb9f9be7) · `node decode-tx.js 0x31f86157b9656673dca539ea571eb91268b1eaef6036fd3c4e77311dfb9f9be7`
- testnet · testnet withdrawal spent · [0xd6cc4f518eaad355f7c5b8de5a70b5fe130dcf400cd0b70bf9a85fedc9e609d0](https://testnet.explorer.nervos.org/transaction/0xd6cc4f518eaad355f7c5b8de5a70b5fe130dcf400cd0b70bf9a85fedc9e609d0) · `node decode-tx.js 0xd6cc4f518eaad355f7c5b8de5a70b5fe130dcf400cd0b70bf9a85fedc9e609d0 --testnet`

# Godwoken challenge (challenge-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/challenge-lock/src/entry.rs + verifications/　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_challenge_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_challenge_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/challenge-lock/src](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/challenge-lock/src) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@jjyr](https://github.com/jjyr), [@keroro520](https://github.com/keroro520)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json challenge_lock

- code_hash: `0x628b5f956b46ae27b50819a9ebab79ce5f957e6899ba0c75b8e142de2ed0dcd2` · hash_type: `type`
- deployed in tx [`0x8eca99207a462a9005bd91d04e24911627769096220f867d1cc0a32e75a287a6`](https://explorer.nervos.org/transaction/0x8eca99207a462a9005bd91d04e24911627769096220f867d1cc0a32e75a287a6) (block 7469207) · data_hash `0xbaaae1cc39656301d65d2ac8151a21f967b344a18c9d6e967ac0945761401efd` · type_id args `0xb0cf1d97b353716058a5ce70fa6bd2d4014ed5a14e8307038c56cad726cd457e` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x628b5f956b46ae27b50819a9ebab79ce5f957e6899ba0c75b8e142de2ed0dcd2", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8eca99207a462a9005bd91d04e24911627769096220f867d1cc0a32e75a287a6", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json challenge_lock

- code_hash: `0x5a86c3bf1e8648b6a6f8abe6875720ccf9745ab225b68fa7c195f9d6635dea80` · hash_type: `type`
- deployed in tx [`0x15598fb4d3fc4b7e0afcffc80ed0c02b62edb3f7875771f0397f17eef712b65d`](https://testnet.explorer.nervos.org/transaction/0x15598fb4d3fc4b7e0afcffc80ed0c02b62edb3f7875771f0397f17eef712b65d) (block 5292883) · data_hash `0xbaaae1cc39656301d65d2ac8151a21f967b344a18c9d6e967ac0945761401efd` · type_id args `0x7997689a9038a5487535cd8297d37b39840e140c849efd6f07ecc20ee9b9c244` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x5a86c3bf1e8648b6a6f8abe6875720ccf9745ab225b68fa7c195f9d6635dea80", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x15598fb4d3fc4b7e0afcffc80ed0c02b62edb3f7875771f0397f17eef712b65d", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → 0` Challenge stands / revert

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
```

**Input** · input[1] challenge cell

```
Cell{
  capacity: C,
  lock: CHALLENGE_LOCK(rollup_type_hash ‖ ChallengeLockArgs),
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
// witness action: {{RollupEnterChallenge | RollupRevert}}
```

#### witnesses (WitnessArgs)

witnesses[rollup output]

```
{ output_type: RollupAction }
```

byte layout: args = rollup_type_hash ‖ ChallengeLockArgs (table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_type_hash | 32B | rollup cell type hash |  | 5 |
| 1 | target.block_hash | 32B | challenged block |  | 32 |
| 2 | target.target_index | 4B LE | tx / withdrawal index |  |  |
| 3 | target.target_type | 1B | 0 tx execution / 1 tx signature / 2 withdrawal signature | 0–2 | 5 |
| 4 | rewards_receiver_lock | Script | reward receiver lock if the challenge succeeds |  | 30 |

Example:

- target: `0x{{9f…(32B)}}{{03000000}}{{01}}  ← tx #3, signature`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | valid ChallengeLockArgs | 5 |
| rollup | a rollup cell in outputs | 9 |
| action | EnterChallenge / Revert → pass; SubmitBlock → fail | 5 |

### 2. `1 → 0` Cancel challenge (prove the target is valid)

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState{ status: halting }
}
```

**Input** · input[1] challenge cell

```
Cell{
  capacity: C,
  lock: CHALLENGE_LOCK(…),
  type: null,
  data: 0x
}
```

**Input** · input[…] proof cells (per target_type)

```
e.g. a cell under the L2 account lock (eth-account-lock) whose data is the signing message
```

**Output** · output[0] rollup cell′

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
// witness action: {{RollupCancelChallenge}}
```

#### cell_deps

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

cell_dep: account lock / backend code

```
for signature / execution verification
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| rollup | a rollup cell in inputs (RollupConfig read) | 9 / 10 |
| target_type | 0–2 | 5 |
| verify | tx execution / tx signature / withdrawal signature | 13 / 32 / 41 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Deployed per godwoken-info, but no L1 tx using this lock was found (no challenge ever happened); tests.json is empty.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.

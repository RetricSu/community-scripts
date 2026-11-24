# Godwoken rollup cell (state-validator, type) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/state-validator + gw-utils　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_state_validator` · type script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_state_validator.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/state-validator/src](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/state-validator/src) · [gwos/contracts/gw-utils/src](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@keroro520](https://github.com/keroro520), [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json state_validator

- code_hash: `0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718` · hash_type: `type`
- deployed in tx [`0x9f8e73e096f1583696760281004d71dc0cebd3c9aa6fb584949facde6e543e67`](https://explorer.nervos.org/transaction/0x9f8e73e096f1583696760281004d71dc0cebd3c9aa6fb584949facde6e543e67) (block 7469219) · data_hash `0x2ba2f8f9831af130793b74846ec794322b7dc764f53755b5728fe703fd90291f` · type_id args `0x70f9600824eed849a2e9988f34ca7d8356b990b2294aa50e28dba1055e326d32`

```json
{
  "script": { "code_hash": "0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9f8e73e096f1583696760281004d71dc0cebd3c9aa6fb584949facde6e543e67", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json state_validator

- code_hash: `0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854` · hash_type: `type`
- deployed in tx [`0xbcd73881ba53f1cd95d0c855395c4ffe6f54e041765d9ab7602d48a7cb71612e`](https://testnet.explorer.nervos.org/transaction/0xbcd73881ba53f1cd95d0c855395c4ffe6f54e041765d9ab7602d48a7cb71612e) (block 5292884) · data_hash `0x2ba2f8f9831af130793b74846ec794322b7dc764f53755b5728fe703fd90291f` · type_id args `0x063555cc66a1c270aafbe9324718232289a462f4d9edfc7a57f9c6e0f8257669`

```json
{
  "script": { "code_hash": "0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xbcd73881ba53f1cd95d0c855395c4ffe6f54e041765d9ab7602d48a7cb71612e", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Initialize rollup cell

**Input** · input[0] any cell

```
Cell{
  capacity: any,
  lock: deployer lock,
  type: null,
  data: any
}
// used for type_id
```

**Output** · output[i] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock,
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: {{type_id(inputs[0], i) 32B}} },
  data: {{GlobalState}}
}
```

#### cell_deps

cell_dep: STATE_VALIDATOR code

```
code cell (see deployments)
// needed by CKB to run the script
```

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

byte layout: data: GlobalState (190-byte struct; V0 is 181 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_config_hash | 32 | data hash of the RollupConfig cell |  | 10 |
| 1 | account | 32+4 | L2 account SMT root + count |  |  |
| 2 | block | 32+8 | L2 block SMT root + count | submit: +1 | 23 |
| 3 | reverted_block_root | 32 | reverted block SMT root |  | 13 |
| 4 | tip_block_hash | 32 | latest L2 block hash |  | 23 |
| 5 | tip_block_timestamp | 8 | latest block timestamp (absent in V0) |  |  |
| 6 | last_finalized_timepoint | 8 | last finalized Timepoint |  | 23 |
| 7 | status | 1 | 0 running / 1 halting |  | 21 |
| 8 | version | 1 | rollup version (absent in V0) | ≤ 2, no downgrade | 23 |

Example:

- rollup_config_hash: `0x…(32B)`
- block.count: `0x{{a086010000000000}}  ← 100000`
- last_finalized_timepoint: `0x{{80}}0001…  ← top bit 1 = timestamp`
- status / version: `0x{{00}}{{02}}`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 32 bytes; first 32 bytes satisfy the type_id rule | 39 |
| data | valid GlobalState | 4 |
| cell_deps | a RollupConfig whose data hash = rollup_config_hash | 10 |

### 2. `1 → 1` Submit L2 block (RollupSubmitBlock)

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState{ status: {{0 running}}, block.count: n, … }
}
```

**Input** · input[1…] deposit cells (collected by this block)

```
Cell{
  capacity: ≥ deposit,
  lock: { DEPOSIT_LOCK, args: {{rollup_type_hash}} ‖ DepositLockArgs },
  type: null | sUDT,
  data: 0x | sUDT amount
}
```

**Input** · input[…] custodian cells (fund withdrawals)

```
Cell{
  capacity: X,
  lock: { CUSTODIAN_LOCK, args: rollup_type_hash ‖ CustodianLockArgs },
  type: null | sUDT,
  data: …
}
```

**Input** · input[…] producer stake cell (optional, reused)

```
Cell{
  capacity: S,
  lock: { STAKE_LOCK, args: rollup_type_hash ‖ owner ‖ timepoint },
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
  data: GlobalState{ {{block.count = n+1}}, {{tip_block_hash = new block}},
  account = block.post_account, {{config / reverted_root / status unchanged}} }
}
// lock {{unchanged}}
```

**Output** · output[…] stake cell

```
Cell{
  capacity: {{≥ required_staking_capacity, ≥ input stake}},
  lock: { STAKE_LOCK, args: {{same owner, stake_finalized_timepoint = this block}} },
  type: null,
  data: 0x
}
```

**Output** · output[…] custodian cells (new deposits)

```
Cell{
  capacity: = deposits,
  lock: { CUSTODIAN_LOCK, args: {{deposit_block_hash = this block, deposit_finalized_timepoint, deposit_lock_args}} },
  type: null | sUDT,
  data: …
}
```

**Output** · output[…] withdrawal cells (this block’s withdrawals)

```
Cell{
  capacity: = request,
  lock: { WITHDRAWAL_LOCK, args: {{rollup_type_hash ‖ WithdrawalLockArgs ‖ owner_lock}} },
  type: null | sUDT,
  data: …
}
```

#### cell_deps

cell_dep: STATE_VALIDATOR code

```
code cell (see deployments)
// needed by CKB to run the script
```

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

cell_dep: lock codes

```
custodian / deposit / withdrawal / stake lock code cells
```

#### witnesses (WitnessArgs)

witnesses[rollup output index]

```
{ lock: signature for the rollup cell lock (block producer),
  output_type: {{RollupAction::RollupSubmitBlock{ block: L2Block,
                 reverted_block_hashes, reverted_block_proof }}} }
```

byte layout: data: GlobalState (190-byte struct; V0 is 181 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_config_hash | 32 | data hash of the RollupConfig cell |  | 10 |
| 1 | account | 32+4 | L2 account SMT root + count |  |  |
| 2 | block | 32+8 | L2 block SMT root + count | submit: +1 | 23 |
| 3 | reverted_block_root | 32 | reverted block SMT root |  | 13 |
| 4 | tip_block_hash | 32 | latest L2 block hash |  | 23 |
| 5 | tip_block_timestamp | 8 | latest block timestamp (absent in V0) |  |  |
| 6 | last_finalized_timepoint | 8 | last finalized Timepoint |  | 23 |
| 7 | status | 1 | 0 running / 1 halting |  | 21 |
| 8 | version | 1 | rollup version (absent in V0) | ≤ 2, no downgrade | 23 |

Example:

- rollup_config_hash: `0x…(32B)`
- block.count: `0x{{a086010000000000}}  ← 100000`
- last_finalized_timepoint: `0x{{80}}0001…  ← top bit 1 = timestamp`
- status / version: `0x{{00}}{{02}}`

byte layout: witnesses[rollup output index].output_type: RollupAction (molecule union)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | item_id | 4B LE | 0 SubmitBlock / 1 EnterChallenge / 2 CancelChallenge / 3 Revert |  | 4 |
| 1 | body | table | action args (e.g. SubmitBlock{block, reverted_block_hashes, reverted_block_proof}) | ≤ 512 KiB | 4 |

Example:

- RollupSubmitBlock: `0x{{00000000}}…`

**Also**

- The full submit rules (submit_block.rs, 1000+ lines) are summarized by error code; the decoder does not recompute SMT proofs or assets offline.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| lock | rollup cell lock unchanged | 7 |
| version | post ≤ 2 and ≥ prev | 23 |
| status | prev = running | 21 |
| block | checkpoints / withdrawal root / txs / timestamp | 19 / 20 |
| SMT | kv_state_proof, block / account proofs | 13 / 18 |
| stake | output stake capacity ≥ required; args match the input | 25 |
| deposit | deposit cells match L2 minting | 26 |
| withdrawal | withdrawal cells match requests | 27 / 33 |
| custodian | custodian assets balance | 28 / 16 / 17 |
| challenge | no challenge cell in the tx | 24 |
| post GlobalState | exactly equals the expected state | 23 |
| reverted_block_hashes | SMT proof against reverted_block_root | 13 |

### 3. `1 → 1` Enter / cancel challenge, revert

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
```

**Input** · input[…] challenge cell (cancel / revert)

```
Cell{
  capacity: C,
  lock: { CHALLENGE_LOCK, args: rollup_type_hash ‖ ChallengeLockArgs },
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
  data: GlobalState{ {{status: Enter → 1 halting; Cancel / Revert → 0 running}} }
}
```

**Output** · output[…] challenge cell (enter challenge)

```
Cell{
  capacity: C,
  lock: { CHALLENGE_LOCK, args: {{target{block_hash, target_index, target_type}}} ‖ rewards_receiver_lock },
  type: null,
  data: 0x
}
```

#### witnesses (WitnessArgs)

witnesses[rollup output index]

```
{ output_type: {{RollupEnterChallenge{ChallengeWitness} | RollupCancelChallenge{} |
                RollupRevert{reverted_blocks, block_proof, reverted_block_proof, new_tip_block}}} }
```

byte layout: witnesses[rollup output index].output_type: RollupAction (molecule union)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | item_id | 4B LE | 0 SubmitBlock / 1 EnterChallenge / 2 CancelChallenge / 3 Revert |  | 4 |
| 1 | body | table | action args (e.g. SubmitBlock{block, reverted_block_hashes, reverted_block_proof}) | ≤ 512 KiB | 4 |

Example:

- RollupSubmitBlock: `0x{{00000000}}…`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| Enter | prev running; no input / one output challenge cell; target block exists and is not finalized | 21 / 24 / 32 |
| Cancel | an input challenge cell; reward / burn correct; status back to running | 24 / 30 / 23 |
| Revert | challenge matured; reverted blocks and proofs; rewards; stake slashed | 24 / 29 / 30 / 25 / 6 / 23 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.
- Timepoint (u64): top bit 0 = L2 block number, 1 = millisecond timestamp (low 63 bits).

## Example transactions

- mainnet · rollup cell initialization (v1 genesis) · [0xa908bc6113ebfcb8807ac039898012f1470dc27c0d55207ef91addc484f3a37a](https://explorer.nervos.org/transaction/0xa908bc6113ebfcb8807ac039898012f1470dc27c0d55207ef91addc484f3a37a) · `node decode-tx.js 0xa908bc6113ebfcb8807ac039898012f1470dc27c0d55207ef91addc484f3a37a`
- mainnet · submit block (latest found) · [0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7](https://explorer.nervos.org/transaction/0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7) · `node decode-tx.js 0xb1c468e47a507425814fea33402ed50fe800899d975875033f992a9cb19419b7`
- testnet · testnet rollup tx · [0x6a2071473b12adbc962c597f0ae76f7796d208cf1d3782230538d3a473889791](https://testnet.explorer.nervos.org/transaction/0x6a2071473b12adbc962c597f0ae76f7796d208cf1d3782230538d3a473889791) · `node decode-tx.js 0x6a2071473b12adbc962c597f0ae76f7796d208cf1d3782230538d3a473889791 --testnet`

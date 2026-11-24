# Godwoken deposit request (deposit-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/deposit-lock/src/entry.rs　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_deposit_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_deposit_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/deposit-lock/src/entry.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/deposit-lock/src/entry.rs) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@jjyr](https://github.com/jjyr), [@keroro520](https://github.com/keroro520)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json deposit_lock

- code_hash: `0xff602581f07667eef54232cce850cbca2c418b3418611c132fca849d1edcd775` · hash_type: `type`
- deployed in tx [`0x61e576a7e5d2398ecc5b1a969d1af0142c87db0996c2f6fce41bf28f68d805b2`](https://explorer.nervos.org/transaction/0x61e576a7e5d2398ecc5b1a969d1af0142c87db0996c2f6fce41bf28f68d805b2) (block 7469198) · data_hash `0xf4a3b28cf0a7f4c67f9107f334db8ed5e54f6d390281712c42e3c45752a766ec` · type_id args `0x5c6ca761d45ddb7612bea1ad8e55f8c80e2487d502f430a75c02caae7f64fd35`

```json
{
  "script": { "code_hash": "0xff602581f07667eef54232cce850cbca2c418b3418611c132fca849d1edcd775", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x61e576a7e5d2398ecc5b1a969d1af0142c87db0996c2f6fce41bf28f68d805b2", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json deposit_lock

- code_hash: `0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18` · hash_type: `type`
- deployed in tx [`0x9caeec735f3cd2a60b9d12be59bb161f7c61ddab1ac22c4383a94c33ba6404a2`](https://testnet.explorer.nervos.org/transaction/0x9caeec735f3cd2a60b9d12be59bb161f7c61ddab1ac22c4383a94c33ba6404a2) (block 5292883) · data_hash `0xf4a3b28cf0a7f4c67f9107f334db8ed5e54f6d390281712c42e3c45752a766ec` · type_id args `0x86d24e5cb132478005dcf2b59680a9f37011cb54a5947f42f19ba5076bc6594d`

```json
{
  "script": { "code_hash": "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9caeec735f3cd2a60b9d12be59bb161f7c61ddab1ac22c4383a94c33ba6404a2", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Request deposit

**Input** · input[0] user cell

```
Cell{
  capacity: ≥ amount,
  lock: user lock (hash = owner_lock_hash),
  type: null | sUDT,
  data: …
}
```

**Output** · output[0] deposit cell

```
Cell{
  capacity: CKB to deposit,
  lock: { DEPOSIT_LOCK, hashType: type, args: {{rollup_type_hash ‖ DepositLockArgs}} },
  type: null | sUDT,
  data: 0x | sUDT amount
}
// creating a lock runs no script
```

byte layout: args = rollup_type_hash ‖ DepositLockArgs (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_type_hash | 32B | type hash of the target rollup cell | ≥ 32B | 5 |
| 1 | owner_lock_hash | 32B | L1 owner lock hash (cancel needs an input under it) |  | 8 |
| 2 | layer2_lock | Script | lock script of the L2 account to credit |  |  |
| 3 | cancel_timeout | 8B LE | since value after which the user may cancel | same since flags and ≥ | 6 |
| 4 | registry_id | 4B LE | L2 address registry id |  |  |

Example:

- rollup_type_hash: `0x40d73f0d…(32B)`
- DepositLockArgs: `0x{{a9000000}}{{14000000}}…  ← total size 169, 4 offsets`
- cancel_timeout: `0x{{c0}}00000000093a80  ← relative timestamp 604800 s (7 d)`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | not run at creation; checked when spent and by state-validator | — |

### 2. `1 → 0` Collected by the rollup

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

**Input** · input[1] deposit cell

```
Cell{
  capacity: D,
  lock: DEPOSIT_LOCK(rollup_type_hash ‖ args),
  type: null | sUDT,
  data: …
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

**Output** · output[…] custodian cell

```
Cell{
  capacity: D,
  lock: CUSTODIAN_LOCK(…deposit_lock_args),
  type: same,
  data: same
}
```

#### cell_deps

cell_dep: DEPOSIT_LOCK code

```
code cell (see deployments)
// needed by CKB to run the script
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 32 bytes, then a valid DepositLockArgs | 5 |
| path 1 | an input with type hash = rollup_type_hash → pass (the rest is state-validator: 26) | 0 |

### 3. `1 → 0` Cancel after timeout

**Input** · input[0] deposit cell

```
Cell{
  since: {{same flags as cancel_timeout, value ≥ it}},
  capacity: D,
  lock: DEPOSIT_LOCK(rollup_type_hash ‖ args),
  type: any,
  data: any
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

#### witnesses (WitnessArgs)

witnesses[owner input]

```
owner lock signature (deposit-lock reads no witness)
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| since | GroupInput[0] since has cancel_timeout’s flags and value ≥ | 6 |
| owner | an input with lock hash = owner_lock_hash | 8 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.

## Example transactions

- mainnet · deposit cell spent · [0x9c0b66a180af81fb4d41ec6be2bc3762cebd8e9df1888a233ac46f9ed8dcd0d4](https://explorer.nervos.org/transaction/0x9c0b66a180af81fb4d41ec6be2bc3762cebd8e9df1888a233ac46f9ed8dcd0d4) · `node decode-tx.js 0x9c0b66a180af81fb4d41ec6be2bc3762cebd8e9df1888a233ac46f9ed8dcd0d4`
- testnet · testnet deposit spent · [0xad1b87ed3af41aa38af7a99b4cbbbe58a80d44df33fab171a2bbb46200090265](https://testnet.explorer.nervos.org/transaction/0xad1b87ed3af41aa38af7a99b4cbbbe58a80d44df33fab171a2bbb46200090265) · `node decode-tx.js 0xad1b87ed3af41aa38af7a99b4cbbbe58a80d44df33fab171a2bbb46200090265 --testnet`

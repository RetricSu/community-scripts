# Godwoken custodian (custodian-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/custodian-lock/src/entry.rs　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_custodian_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_custodian_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/custodian-lock/src/entry.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/custodian-lock/src/entry.rs) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@jjyr](https://github.com/jjyr), [@keroro520](https://github.com/keroro520)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json custodian_lock

- code_hash: `0x000f87062a2fe9bb4a6cc475212ea11014b84deb32e0375ee51e6ec4a553e009` · hash_type: `type`
- deployed in tx [`0x71b55e3641fdc8d00d9943a93b2c6e6ab42f7e57909009c2a1ad5c234956cdc5`](https://explorer.nervos.org/transaction/0x71b55e3641fdc8d00d9943a93b2c6e6ab42f7e57909009c2a1ad5c234956cdc5) (block 7469194) · data_hash `0xa254fee1ed74ae1e2e9b30df6607b27e6368aa950e5c0b8eaf33267c6c8addb0` · type_id args `0x3ef49f39b45bd41a5bcc8ef103e88c675e850c1de2b51b1cb3c70edd6ee56936`

```json
{
  "script": { "code_hash": "0x000f87062a2fe9bb4a6cc475212ea11014b84deb32e0375ee51e6ec4a553e009", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x71b55e3641fdc8d00d9943a93b2c6e6ab42f7e57909009c2a1ad5c234956cdc5", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json custodian_lock

- code_hash: `0x85ae4db0dd83f428a31deb342e4000af37ce2c9645d9e619df00096e3c50a2bb` · hash_type: `type`
- deployed in tx [`0x7aed145beb6984fff008ca6224d0726d06a19959c4f01d15e49942d76e28747a`](https://testnet.explorer.nervos.org/transaction/0x7aed145beb6984fff008ca6224d0726d06a19959c4f01d15e49942d76e28747a) (block 5292883) · data_hash `0xa254fee1ed74ae1e2e9b30df6607b27e6368aa950e5c0b8eaf33267c6c8addb0` · type_id args `0xc4695745c69c298c89bc701b6cc8614332c6fd8a2ed160e04748fc6fda636e71`

```json
{
  "script": { "code_hash": "0x85ae4db0dd83f428a31deb342e4000af37ce2c9645d9e619df00096e3c50a2bb", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7aed145beb6984fff008ca6224d0726d06a19959c4f01d15e49942d76e28747a", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → *` Finalized: used by the rollup

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

**Input** · input[1] custodian cell

```
Cell{
  capacity: X,
  lock: CUSTODIAN_LOCK(rollup_type_hash ‖ args),
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

**Output** · output[…]

```
withdrawal / merged custodian cells (checked by state-validator)
```

#### cell_deps

cell_dep: CUSTODIAN_LOCK code

```
code cell (see deployments)
// needed by CKB to run the script
```

cell_dep: RollupConfig cell

```
Cell{ data: RollupConfig (molecule) }
// load_rollup_config(): found by {{data hash == GlobalState.rollup_config_hash}} → else 10
```

byte layout: args = rollup_type_hash ‖ CustodianLockArgs (table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_type_hash | 32B | rollup cell type hash |  | 5 |
| 1 | deposit_block_hash | 32B | L2 block that took the deposit (0 = finalized/merged) |  |  |
| 2 | deposit_finalized_timepoint | 8B | finalized Timepoint |  |  |
| 3 | deposit_lock_args | DepositLockArgs | used to restore the deposit cell on revert | revert output must match | 7 |

Example:

- deposit_finalized_timepoint: `0x{{80}}…  ← timestamp form`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | valid | 5 |
| rollup | a rollup cell in inputs (its GlobalState is read) | 9 |
| config | RollupConfig in cell_deps | 10 |
| finality | deposit_finalized_timepoint finalized → pass | 0 |

### 2. `1 → 1` Not finalized: deposit block reverted, restore the deposit cell

**Input** · input[0] rollup cell

```
Cell{
  capacity: R,
  lock: rollup lock (mainnet: omni_lock deployment),
  type: { codeHash: STATE_VALIDATOR, hashType: type, args: type_id 32B },
  data: GlobalState (190B)
}
```

**Input** · input[1] custodian cell

```
Cell{
  capacity: X,
  lock: CUSTODIAN_LOCK(…),
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
// its witness = RollupSubmitBlock with {{reverted_block_hashes ∋ deposit_block_hash}}
```

**Output** · output[k] restored deposit cell

```
Cell{
  capacity: …,
  lock: { codeHash: {{config.deposit_script_type_hash}}, hashType: {{type}},
          args: {{rollup_type_hash ‖ deposit_lock_args}} },
  type: …,
  data: …
}
```

#### witnesses (WitnessArgs)

witnesses[first custodian input]

```
{ lock: {{UnlockCustodianViaRevertWitness{ deposit_lock_hash 32B }}} }  // must parse, else 5
```

witnesses[rollup output]

```
{ output_type: RollupAction (must be RollupSubmitBlock) }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | lock field is a 32-byte deposit_lock_hash | 5 |
| output | an output whose lock hash = deposit_lock_hash | 7 |
| output lock | args[0..32] = rollup_type_hash | 5 |
| output lock | code_hash = config.deposit_script_type_hash, hash_type type, args equal deposit_lock_args | 7 |
| rollup | a rollup cell in outputs | 9 |
| revert | RollupSubmitBlock.reverted_block_hashes contains deposit_block_hash | 29 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.
- Timepoint (u64): top bit 0 = L2 block number, 1 = millisecond timestamp (low 63 bits).

## Example transactions

- mainnet · custodian cell spent · [0xe490ce3b65486ae14d0b0a52463ad8de0cb34ffbe48bb19f429ae5f24aaa6d43](https://explorer.nervos.org/transaction/0xe490ce3b65486ae14d0b0a52463ad8de0cb34ffbe48bb19f429ae5f24aaa6d43) · `node decode-tx.js 0xe490ce3b65486ae14d0b0a52463ad8de0cb34ffbe48bb19f429ae5f24aaa6d43`

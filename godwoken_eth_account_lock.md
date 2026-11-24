# Godwoken Ethereum account lock (eth-account-lock) Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/eth-account-lock/src/entry.rs + eth_signature.rs　·　deployments: godwoken-info @8ce6390 mainnet_v1 / testnet_v1_1

- id: `godwoken_eth_account_lock` · lock script · networks: mainnet, testnet · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_eth_account_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/eth-account-lock/src](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/eth-account-lock/src) · [gwos/contracts/gw-utils/src/error.rs](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/gw-utils/src/error.rs) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-21
- contributors: [@jjyr](https://github.com/jjyr), [@keroro520](https://github.com/keroro520)

## Deployments

### mainnet — godwoken-info mainnet_v1/scripts-deploy-result.json eth_account_lock

- code_hash: `0x096df264f38fff07f3acd318995abc2c71ae0e504036fe32bc38d5b6037364d4` · hash_type: `type`
- deployed in tx [`0xf0cfb02fb435bf2f061cbf33b1b024a4944b3f4a95968a9d997d95dd2f76a7f9`](https://explorer.nervos.org/transaction/0xf0cfb02fb435bf2f061cbf33b1b024a4944b3f4a95968a9d997d95dd2f76a7f9) (block 7469232) · data_hash `0x685ae74d35fdbffe2ac08b46c428f89136fd3b10d170f1c0570ddd0b28199235` · type_id args `0x9fa95a4ca1d71ea942940eca96ca8e8f10904322daa00461755724cf065075b2` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x096df264f38fff07f3acd318995abc2c71ae0e504036fe32bc38d5b6037364d4", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf0cfb02fb435bf2f061cbf33b1b024a4944b3f4a95968a9d997d95dd2f76a7f9", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — godwoken-info testnet_v1_1/scripts-deploy-result.json eth_account_lock

- code_hash: `0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0` · hash_type: `type`
- deployed in tx [`0x21da20f275af89ca7172cb1cd7fcb8676056e4212ba3782e8c77afebae57c6ed`](https://testnet.explorer.nervos.org/transaction/0x21da20f275af89ca7172cb1cd7fcb8676056e4212ba3782e8c77afebae57c6ed) (block 5292883) · data_hash `0x685ae74d35fdbffe2ac08b46c428f89136fd3b10d170f1c0570ddd0b28199235` · type_id args `0x66056785e4e989729053508c30d620ead06b377f600eedc0419e6858e459ccfa` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x21da20f275af89ca7172cb1cd7fcb8676056e4212ba3782e8c77afebae57c6ed", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → 0` Verify an L2 signature when cancelling a challenge

**Input** · input[i] signature cell

```
Cell{
  capacity: any,
  lock: { ETH_ACCOUNT_LOCK, args: {{rollup_script_hash 32B ‖ eth_address 20B}} },
  type: any,
  data: {{owner_lock_hash 32B ‖ signing_type 1B ‖ message 32B}}
}
```

**Input** · input[j] one-time owner cell

```
Cell{
  capacity: any,
  lock: {{lock hash == data.owner_lock_hash}},
  type: any,
  data: any
}
```

**Output** · outputs

```
any (the challenge-cancel tx)
```

#### witnesses (WitnessArgs)

witnesses[first group input]

```
{ lock: {{65B secp256k1 recoverable signature}} }
```

byte layout: args (52B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | rollup_script_hash | 32B | rollup type hash | exactly 52 long | 5 |
| 1 | eth_address | 20B | Ethereum address |  | 41 |

Example:

- args: `0x{{40d7…(32B)}}{{f39fd6e51aad88f6f4ce6ab8827279cfffb92266}}`

byte layout: data (65B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owner_lock_hash | 32B | lock hash of the one-time owner cell |  | 8 |
| 1 | signing_type | 1B | 0 Raw / 1 WithPrefix (Ethereum personal-sign prefix) | 0 or 1 | 4 |
| 2 | message | 32B | message that was signed |  | 41 |

Example:

- data: `0x{{…(32B)}}{{01}}{{…(32B)}}`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length = 52 | 5 |
| data | length = 65, signing_type ∈ {0,1} | 4 |
| owner | an input with lock hash = data.owner_lock_hash | 8 |
| signature | witness.lock is 65B and recovers eth_address | 41 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- This is an L2 account lock: verified by Godwoken nodes inside L2 txs; on L1 it only runs when cancelling a challenge. No L1 tx found; tests.json is empty.
- Error codes (gw-utils/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 InvalidSince, 7 InvalidOutput, 8 OwnerCellNotFound, 9 RollupCellNotFound, 10 RollupConfigNotFound, 11 ProofNotFound, 13 MerkleProof, 14 AmountOverflow, 15 InsufficientAmount, 16/17 Insufficient{Input,Output}FinalizedAssets, 18 SMTKeyMissing, 19 InvalidStateCheckpoint, 20 InvalidBlock, 21 InvalidStatus, 22 InvalidStakeCellUnlock, 23 InvalidPostGlobalState, 24 InvalidChallengeCell, 25 InvalidStakeCell, 26 InvalidDepositCell, 27 InvalidWithdrawalCell, 28 InvalidCustodianCell, 29 InvalidRevertedBlocks, 30 InvalidChallengeReward, 32 InvalidChallengeTarget, 33 InvalidWithdrawalRequest, 34 UnknownEOAScript, 39 InvalidTypeID, 41 WrongSignature, 43 RegistryAddressNotFound, 45 NotFinalized.

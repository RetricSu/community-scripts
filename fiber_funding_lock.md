# Fiber Funding Lock Constraints

> Source: nervosnetwork/fiber-scripts / contracts/funding-lock/src/main.rs　·　deployments: nervosnetwork/fiber config/mainnet|testnet/config.yml　·　mainnet 0xe45b…f4f1 / testnet 0x6c67…6d7c (type)

- id: `fiber_funding_lock` · lock script · networks: mainnet, testnet · tags: channel, open-source, nervos, p-fiber
- links: page https://retricsu.github.io/community-scripts/fiber_funding_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/fiber-scripts@6bfcebfb](https://github.com/nervosnetwork/fiber-scripts/tree/6bfcebfb62f2eee2af2cec881eaa795595268c58) · [contracts/funding-lock/src/main.rs](https://github.com/nervosnetwork/fiber-scripts/blob/6bfcebfb62f2eee2af2cec881eaa795595268c58/contracts/funding-lock/src/main.rs) (same fiber-scripts HEAD as commitment-lock; funding-lock source and data hash unchanged)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-09
- contributors: [@quake](https://github.com/quake)

## Deployments

### mainnet — nervosnetwork/fiber config/mainnet/config.yml

- code_hash: `0xe45b1f8f21bff23137035a3ab751d75b36a981deec3e7820194b9c042967f4f1` · hash_type: `type`
- deployed in tx [`0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6`](https://explorer.nervos.org/transaction/0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6) (block 18372567) · data_hash `0x17b1910fbcfdfc146ee2ed05587f0e862b799d33ca3c8e1c52d18f2f67716e47` · type_id args `0x64818d82a372312fb007c480391e1b9759d21b2c7f7959b9c177d72cdc243394`

```json
{
  "script": { "code_hash": "0xe45b1f8f21bff23137035a3ab751d75b36a981deec3e7820194b9c042967f4f1", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6", "index": "0x1" }, "dep_type": "code" }
}
```

### testnet — nervosnetwork/fiber config/testnet/config.yml

- code_hash: `0x6c67887fe201ee0c7853f1682c0b77c0e6214044c156c7558269390a8afa6d7c` · hash_type: `type`
- deployed in tx [`0x12c569a258dd9c5bd99f632bb8314b1263b90921ba31496467580d6b79dd14a7`](https://testnet.explorer.nervos.org/transaction/0x12c569a258dd9c5bd99f632bb8314b1263b90921ba31496467580d6b79dd14a7) (block 19249889) · data_hash `0x17b1910fbcfdfc146ee2ed05587f0e862b799d33ca3c8e1c52d18f2f67716e47` · type_id args `0x3cb7c0304fe53f75bb5727e2484d0beae4bd99d979813c6fc97c3cca569f10f6`

```json
{
  "script": { "code_hash": "0x6c67887fe201ee0c7853f1682c0b77c0e6214044c156c7558269390a8afa6d7c", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x12c569a258dd9c5bd99f632bb8314b1263b90921ba31496467580d6b79dd14a7", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Channel funding → commitment tx (2-of-2 aggregated Schnorr)

**Input** · funding cell (the only group input)

```
Cell{ lock: { codeHash: FUNDING_LOCK, args: {{pubkey_hash 20B}} },
      type: xUDT?, capacity }
```

**Output** · commitment cell

```
Cell{ lock: COMMITMENT_LOCK(...) }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pubkey_hash | 20B | blake160(x-only aggregated pubkey of both parties) | checked by ckb-auth | 8 |

byte layout: witness byte layout (112 bytes, not WitnessArgs)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | empty_witness_args | 16B | empty WitnessArgs placeholder for xUDT compatibility | = 0x10000000…10000000 | 7 |
| 1 | pubkey | 32B | x-only aggregated pubkey (Schnorr cannot recover it) | blake160 = args | 8 |
| 2 | signature | 64B | MuSig2 aggregated signature | over blake2b(raw tx without cell_deps) | 8 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| inputs | exactly 1 input in the group | 5 |
| witness | length exactly 112 = 16 + 32 + 64 | 6 |
| witness[0..16] | = empty WitnessArgs placeholder | 7 |
| signature | exec ckb-auth (Schnorr, algorithm 7), message = blake2b(raw tx without cell_deps) (not checked) | 8 |

## Notes

- Error codes (main.rs Error): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 MultipleInputs · 6 WitnessLenError · 7 EmptyWitnessArgsError · 8 AuthError
- The message omits cell_deps, so deps can be swapped without re-signing (e.g. after an upgrade)

## Example transactions

- mainnet · Fiber funding → commitment · [0x4ee49a3d29a8023f1ab5f0f78b2f643d1d5b6a968d7f0deed9949bb1274bebb3](https://explorer.nervos.org/transaction/0x4ee49a3d29a8023f1ab5f0f78b2f643d1d5b6a968d7f0deed9949bb1274bebb3) · `node decode-tx.js 0x4ee49a3d29a8023f1ab5f0f78b2f643d1d5b6a968d7f0deed9949bb1274bebb3`
- testnet · Fiber funding (testnet) · [0x2384abfc2cc39b0492d14df9e9bdb005dca59d5d99bf8be28bbf514b80cf7faa](https://testnet.explorer.nervos.org/transaction/0x2384abfc2cc39b0492d14df9e9bdb005dca59d5d99bf8be28bbf514b80cf7faa) · `node decode-tx.js 0x2384abfc2cc39b0492d14df9e9bdb005dca59d5d99bf8be28bbf514b80cf7faa --testnet`

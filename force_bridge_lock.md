# Force Bridge bridge lockscript Constraints

> Source: nervosnetwork/force-bridge@f3d7df7 ckb-contracts/lib/bridge-lockscript-lib/src/lib.rs + adapter.rs　·　mainnet 0x93bc…1789 / testnet 0x2170…b50e, hash_type type (force-bridge official config)

- id: `force_bridge_lock` · lock script · networks: mainnet, testnet · tags: token, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/force_bridge_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/force-bridge@f3d7df76](https://github.com/nervosnetwork/force-bridge/tree/f3d7df767eff27b58e58bedd7b0990392ca8066a) · [ckb-contracts/contracts/bridge-lockscript/src/main.rs](https://github.com/nervosnetwork/force-bridge/blob/f3d7df767eff27b58e58bedd7b0990392ca8066a/ckb-contracts/contracts/bridge-lockscript/src/main.rs) · [ckb-contracts/lib/bridge-lockscript-lib/src/lib.rs](https://github.com/nervosnetwork/force-bridge/blob/f3d7df767eff27b58e58bedd7b0990392ca8066a/ckb-contracts/lib/bridge-lockscript-lib/src/lib.rs) · [ckb-contracts/lib/bridge-lockscript-lib/src/adapter.rs](https://github.com/nervosnetwork/force-bridge/blob/f3d7df767eff27b58e58bedd7b0990392ca8066a/ckb-contracts/lib/bridge-lockscript-lib/src/adapter.rs) · [ckb-contracts/types/schemas/force_bridge_lockscript.mol](https://github.com/nervosnetwork/force-bridge/blob/f3d7df767eff27b58e58bedd7b0990392ca8066a/ckb-contracts/types/schemas/force_bridge_lockscript.mol) · [ckb-contracts/contracts-helper/src/entry.rs](https://github.com/nervosnetwork/force-bridge/blob/f3d7df767eff27b58e58bedd7b0990392ca8066a/ckb-contracts/contracts-helper/src/entry.rs) (default-branch HEAD read 2026-11-06 (bridge-lockscript last changed 2abe679, 2021-06-16))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@JacobDenver007](https://github.com/JacobDenver007)

## Deployments

### mainnet — nervosnetwork/force-bridge devops/mainnet-verifier.config.example (ckb.deps.bridgeLock)

- code_hash: `0x93bc7a915d3d8f8b9678bc6c7a1751738c99ce6e66bba4dfab56672f6d691789` · hash_type: `type`
- deployed in tx [`0x3f9fd8ba3b47bd2617171d18d02c23c6f9a9e6178ebb5e1d73e99201322d0441`](https://explorer.nervos.org/transaction/0x3f9fd8ba3b47bd2617171d18d02c23c6f9a9e6178ebb5e1d73e99201322d0441) (block 5483659) · data_hash `0xfd8264c1d3595b873eaa674bfbbde4c1db51ac36fa897e13fc09bc792617e871` · type_id args `0x32cf6f895f30cb27b15d7bd0523c57b539e5a083fbb3f0a19743e6d0bd9cf770`

```json
{
  "script": { "code_hash": "0x93bc7a915d3d8f8b9678bc6c7a1751738c99ce6e66bba4dfab56672f6d691789", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3f9fd8ba3b47bd2617171d18d02c23c6f9a9e6178ebb5e1d73e99201322d0441", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — nervosnetwork/force-bridge devops/verifier-testnet-docker/force-bridge/force_bridge.json (ckb.deps.bridgeLock)

- code_hash: `0x2170ffdb67574651c7bc51455d98f29394f2ee134a306c84533732f52e0eb50e` · hash_type: `type`
- deployed in tx [`0x9b76017d200be714f5da85e8218d89d6e262c41f874f72f232941eb66b45814b`](https://testnet.explorer.nervos.org/transaction/0x9b76017d200be714f5da85e8218d89d6e262c41f874f72f232941eb66b45814b) (block 2277171) · data_hash `0x3ad1982c4f22f7fd4ebd5cf5c869f9ffaf1b3dad29157bef2a0dd85e3bae3b28` · type_id args `0xa899df4e89b005df5fa1cf4b2696cd15aaaa344a53fe040c89996f6ac51d651e`

```json
{
  "script": { "code_hash": "0x2170ffdb67574651c7bc51455d98f29394f2ee134a306c84533732f52e0eb50e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x9b76017d200be714f5da85e8218d89d6e262c41f874f72f232941eb66b45814b", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → N` Unlock: authorised by the owner cell lock (committee multisig)

**Input** · input (bridge lock)

```
Cell{
  lock: { codeHash: BRIDGE_LOCK,
          args: ForceBridgeLockscriptArgs{
            {{owner_cell_type_hash}}, chain, asset } }
}
```

**Input** · another input (owner authorisation)

```
Cell{ lock: {{hash = owner cell lock hash}} }
```

**Output** · outputs: any

```
this lock does not check outputs
```

#### cell_deps

owner cell

```
Cell{
  type: {{hash = owner_cell_type_hash}} (Type ID),
  lock: committee multisig
}
first cell_dep (in order) whose type hash matches
```

byte layout: args byte layout (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | header | 16B | total_size + 3 offsets | strict molecule verify | -1 |
| 1 | owner_cell_type_hash | 32B | type script hash of the owner cell | must be found in cell_deps | -1 |
| 2 | chain | 1B | origin chain (off-chain ChainType: 0 BTC / 1 ETH / 2 EOS / 3 TRON / 4 POLKADOT) | not checked by the lock |  |
| 3 | asset | 4+nB | asset id (e.g. ETH token address string) | not checked by the lock |  |

Example:

- args: `0x5f000000 10000000 30000000 31000000 | c5fe9a19…e18d | 01 | 2a000000 "0xeca82185adCE47f39c684352B0439f030f860318"`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ForceBridgeLockscriptArgsReader::verify(args, false) passes | -1 |
| owner cell | a cell_dep with type hash = owner_cell_type_hash exists, else panic "owner cell not found" | -1 |
| inputs | some input lock hash = that owner cell lock hash, else panic "not authorized to unlock the cell" | -1 |

## Notes

- Every failure is a panic; contracts-helper panic_handler exits with -1, so there are no finer error codes.
- No signature is checked here: security comes entirely from the owner cell lock (committee secp256k1 multisig per the official deployment doc) and the Type ID uniqueness of the owner cell.
- Note: the CKB Explorer registry entry named "Force Bridge" (0x9f3a…f52f) is not this bridge lockscript but a pre-release Omnilock deployed by Force Bridge (see the omnilock_v1 page).
- The recipient-typescript in the same repo is not in the list and was not added.

## Example transactions

- mainnet · Force Bridge unlock (committee multisig) · [0xea17fb551d27ccf13786410133a849ae2b8f470f9536fdbd8b8ccb9ee82dc73c](https://explorer.nervos.org/transaction/0xea17fb551d27ccf13786410133a849ae2b8f470f9536fdbd8b8ccb9ee82dc73c) · `node decode-tx.js 0xea17fb551d27ccf13786410133a849ae2b8f470f9536fdbd8b8ccb9ee82dc73c`
- testnet · Force Bridge testnet unlock · [0x65451004919a327a4fd8971bc842515bbc4ec47ae7cee8cdd84b0e51cdf47ece](https://testnet.explorer.nervos.org/transaction/0x65451004919a327a4fd8971bc842515bbc4ec47ae7cee8cdd84b0e51cdf47ece) · `node decode-tx.js 0x65451004919a327a4fd8971bc842515bbc4ec47ae7cee8cdd84b0e51cdf47ece --testnet`

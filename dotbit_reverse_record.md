# .bit ReverseRecordCell Type Constraints

> Source: dotbitHQ/did-contracts @0cc9fbf contracts/reverse-record-cell-type ("sync the source code from latest deployed contracts")

- id: `dotbit_reverse_record` · type script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/dotbit_reverse_record.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [dotbitHQ/did-contracts@0cc9fbf5](https://github.com/dotbitHQ/did-contracts/tree/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370) · [contracts/reverse-record-cell-type/src/entry.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/contracts/reverse-record-cell-type/src/entry.rs) · [libs/das-core/src/verifiers/misc.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/verifiers/misc.rs) · [libs/das-core/src/verifiers/common.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/verifiers/common.rs) · [libs/das-core/src/error.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/error.rs) ("sync the source code from latest deployed contracts" (2025-03-20); type-id args from dotbitHQ/das-lib core/env.go @57eb578)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@linkdesu](https://github.com/linkdesu)

## Deployments

### mainnet — dotbitHQ/das-lib core/env.go EnvMainNet ReverseRecordCellType type-id args 0x000f3e1a…; code hash = Type ID script hash; live code cell 0x302a1db6…:0

- code_hash: `0xebc9e13658f6df13593cf59b7e9cd159602b6c3c7d54b14dea43bae600ebae11` · hash_type: `type`
- deployed in tx [`0x302a1db6601fdb8ff4ca3f729be8e696bd33d7df79b6a2871bbf32ded14d4a32`](https://explorer.nervos.org/transaction/0x302a1db6601fdb8ff4ca3f729be8e696bd33d7df79b6a2871bbf32ded14d4a32) (block 15198800) · data_hash `0x84bdd29c78d8adb3b4477a63f3cc7fecd203195fa597b6474f9742d70784fd72` · type_id args `0x000f3e1a89d85d268ed6d36578d474ecf91d8809f4f696dd2e5b97fe67b84a2e`

```json
{
  "script": { "code_hash": "0xebc9e13658f6df13593cf59b7e9cd159602b6c3c7d54b14dea43bae600ebae11", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x302a1db6601fdb8ff4ca3f729be8e696bd33d7df79b6a2871bbf32ded14d4a32", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — das-lib core/env.go EnvTestnet2 ReverseRecordCellType type-id args 0x334d7841…

- code_hash: `0x61711416468fa5211ead5f24c6f3efadfbbc332274c5d40e50c6feadcb5f9606` · hash_type: `type`
- deployed in tx [`0x7e327a507d4071f70b2b1f62ad7c373dc187e234638238ed30a8078905f610e9`](https://testnet.explorer.nervos.org/transaction/0x7e327a507d4071f70b2b1f62ad7c373dc187e234638238ed30a8078905f610e9) (block 14415502) · data_hash `0xd42e6e5400d1872afe78c2e90b1cfbecc61a3a0b8322ee71654ae9654cd32fe1` · type_id args `0x334d7841eb156b8aa5abd7b09277e91e782d840140905496bb5bff0ea6ce9d75`

```json
{
  "script": { "code_hash": "0x61711416468fa5211ead5f24c6f3efadfbbc332274c5d40e50c6feadcb5f9606", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7e327a507d4071f70b2b1f62ad7c373dc187e234638238ed30a8078905f610e9", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `n → 0` retract_reverse_record: retract reverse records

**Input** · inputs #0..#n-1: ReverseRecordCells (all inputs)

```
Cell{
  lock: {{L (same for all)}},
  type: {{REVERSE_RECORD}}
}
```

**Output** · BalanceCell (refund)

```
Cell{
  lock: {{L}},
  type: {{BALANCE_CELL}} | none,
  capacity: {{≥ Σ inputs − common_fee}}
}
```

**Also**

- Witness: "das" ‖ 00000000 ‖ ActionData{ action: "retract_reverse_record", params }

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | das ActionData witness decodes | 46 |
| system switch | ConfigCellMain.status ≠ off (config, not checked) | -1 |
| action | only retract_reverse_record is supported | 27 |
| count | inputs > 0, outputs = 0 | 6 |
| position | contiguous from input #0, nothing after | 6 |
| lock | all inputs share one lock | 6 |
| refund | BalanceCell outputs with lock L hold ≥ Σ inputs − common_fee (config, not checked) | 34 |

## Notes

- Deployment: the code hash is the Type ID script hash; type-id args come from dotbitHQ/das-lib core/env.go (mainnet 0x000f3e1a…, testnet Testnet2 0x334d7841…); live code cells and txs seen on both networks.
- Type ID contracts are upgradable: the mainnet code cell has been replaced several times. The source read is 0cc9fbf (officially described as synced from the latest deployed contracts); no reproducible build.
- Earlier deployed binaries also supported declare_reverse_record / redeclare_reverse_record (such txs exist on chain); the current source returns 27 for them, and the decoder shows those txs as not checked.
- The system switch, BalanceCell type id and common_fee come from ConfigCells in cell_deps; the decoder does not load cell_dep data, so these are not checked.
- Error codes (das-core error.rs): -1 SystemOff · 6 InvalidTransactionStructure · 27 ActionNotSupported · 34 ChangeError · 46 WitnessDataDecodingError

## Example transactions

- mainnet · retract_reverse_record · [0xd5d5dff69d7614ebaa34b6340406c7f602c617074d3c782c05ae4866df957931](https://explorer.nervos.org/transaction/0xd5d5dff69d7614ebaa34b6340406c7f602c617074d3c782c05ae4866df957931) · `node decode-tx.js 0xd5d5dff69d7614ebaa34b6340406c7f602c617074d3c782c05ae4866df957931`
- mainnet · retract_reverse_record (2) · [0x0bd0b37688d273aaa4131284e85796951f3fe4ab6a2c3e9eec9a966a1b8d8396](https://explorer.nervos.org/transaction/0x0bd0b37688d273aaa4131284e85796951f3fe4ab6a2c3e9eec9a966a1b8d8396) · `node decode-tx.js 0x0bd0b37688d273aaa4131284e85796951f3fe4ab6a2c3e9eec9a966a1b8d8396`
- testnet · retract_reverse_record (testnet) · [0x4ff7807e8bf28a1b1d9a5e1ff5255f6321533a812a264b007fbd30cdaf543f23](https://testnet.explorer.nervos.org/transaction/0x4ff7807e8bf28a1b1d9a5e1ff5255f6321533a812a264b007fbd30cdaf543f23) · `node decode-tx.js 0x4ff7807e8bf28a1b1d9a5e1ff5255f6321533a812a264b007fbd30cdaf543f23 --testnet`
- testnet · declare_reverse_record (older binary, not checked) · [0x04bbb81d774d40c332eddeec7bbedea0ec3091dda0df24b707b1df78699bd477](https://testnet.explorer.nervos.org/transaction/0x04bbb81d774d40c332eddeec7bbedea0ec3091dda0df24b707b1df78699bd477) · `node decode-tx.js 0x04bbb81d774d40c332eddeec7bbedea0ec3091dda0df24b707b1df78699bd477 --testnet`

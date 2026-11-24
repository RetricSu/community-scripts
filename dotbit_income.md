# .bit IncomeCell Type Constraints

> Source: dotbitHQ/did-contracts @0cc9fbf contracts/income-cell-type

- id: `dotbit_income` · type script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/dotbit_income.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [dotbitHQ/did-contracts@0cc9fbf5](https://github.com/dotbitHQ/did-contracts/tree/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370) · [contracts/income-cell-type/src/entry.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/contracts/income-cell-type/src/entry.rs) · [libs/das-core/src/verifiers/misc.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/verifiers/misc.rs) · [libs/das-core/src/verifiers/common.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/verifiers/common.rs) · [libs/das-core/src/error.rs](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/libs/das-core/src/error.rs) · [.env.mainnet](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/.env.mainnet) · [.env.testnet2](https://github.com/dotbitHQ/did-contracts/blob/0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370/.env.testnet2) ("sync the source code from latest deployed contracts" (2025-03-20); type-id args from dotbitHQ/das-lib core/env.go @57eb578)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@linkdesu](https://github.com/linkdesu)

## Deployments

### mainnet — dotbitHQ/das-lib core/env.go EnvMainNet IncomeCellType type-id args 0x108fba6a…; code hash = Type ID script hash; live code cell 0x0266b5a1…:0

- code_hash: `0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39` · hash_type: `type`
- deployed in tx [`0x0266b5a13edddd62f6954a6ee40b94eda76d7d5b9466ee9c5059817958dfd8e8`](https://explorer.nervos.org/transaction/0x0266b5a13edddd62f6954a6ee40b94eda76d7d5b9466ee9c5059817958dfd8e8) (block 15198783) · data_hash `0x4c14e91789cdaebba45388f422ec687cdf22ad895b769d1c1ad37ff0ce029354` · type_id args `0x108fba6a9b9f2898b4cdf11383ba2a6ed3da951b458c48e5f5de0353bbca2d46`

```json
{
  "script": { "code_hash": "0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0266b5a13edddd62f6954a6ee40b94eda76d7d5b9466ee9c5059817958dfd8e8", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — dotbitHQ/das-lib core/env.go EnvTestnet2 IncomeCellType type-id args 0xd7b9d821…

- code_hash: `0x08d1cdc6ab92d9cabe0096a2c7642f73d0ef1b24c94c43f21c6c3a32ffe0bb5e` · hash_type: `type`
- deployed in tx [`0x2219d49ae71d2b4f45248ff581adcff605549213ceb7e316c3dd8264025fd221`](https://testnet.explorer.nervos.org/transaction/0x2219d49ae71d2b4f45248ff581adcff605549213ceb7e316c3dd8264025fd221) (block 14851498) · data_hash `0x5cbc65b40cfacc3c9dafb8763b244ee6aec8b81989bcd887d7c004599cdc7c3d` · type_id args `0xd7b9d8213671aec03f3a3ab95171e0e79481db2c084586b9ea99914c00ff3716`

```json
{
  "script": { "code_hash": "0x08d1cdc6ab92d9cabe0096a2c7642f73d0ef1b24c94c43f21c6c3a32ffe0bb5e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x2219d49ae71d2b4f45248ff581adcff605549213ceb7e316c3dd8264025fd221", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` create_income: create an IncomeCell

**Inputs**: none

**Output** · IncomeCell

```
Cell{
  lock: {{always-success}},
  type: {{INCOME}},
  capacity: {{= basic_capacity}}
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | das ActionData witness decodes | 46 |
| system switch | ConfigCellMain.status ≠ off (config, not checked) | -1 |
| count | 0 IncomeCells in inputs, 1 in outputs | 6 |
| lock | always-success lock (code_hash = ALWAYS_SUCCESS_LOCK_TYPE_ID, hash_type type) | 30 |
| witness records | exactly 1, owned by the creator, amount = basic_capacity (not checked) | 6 |
| capacity | = ConfigCellIncome.basic_capacity (config, not checked) | -122 |

### 2. `n → m` consolidate_income: merge income records

**Input** · IncomeCell × n (n ≥ 2)

```
Cell{ type: {{INCOME}} }
```

**Output** · IncomeCell × m (m ≤ n)

```
Cell{ type: {{INCOME}} }
```

**Output** · cells paid to record owners

```
Cell{ lock: {{owner}}, capacity: {{≥ amount − fee}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | das ActionData witness decodes | 46 |
| system switch | ConfigCellMain.status ≠ off (config, not checked) | -1 |
| count | inputs ≥ 2, outputs ≤ inputs | -126 |
| records | split into transfer / keep by max_records, min_transfer_capacity and the consolidate profit rate; each transferred record has exactly one output cell with its lock and enough capacity; no waste (not checked: needs decoded witnesses and config) | -125 · -124 · -123 · 6 |

### 3. `* → *` Used inside other actions

**Inputs**: none

**Output** · IncomeCell

```
Cell{ type: {{INCOME}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | das ActionData witness decodes | 46 |
| system switch | ConfigCellMain.status ≠ off (config, not checked) | -1 |
| confirm_proposal | a ProposalCell is in inputs (by config type id, not checked) | 6 |
| buy_account | an AccountSaleCell is in inputs (not checked) | 6 |
| accept_offer | an OfferCell is in inputs (not checked) | 6 |
| renew_account | an AccountCell is in inputs (not checked) | 6 |
| other actions | not supported | 27 |

## Notes

- Deployment: the code hash is the Type ID script hash; type-id args come from dotbitHQ/das-lib core/env.go (mainnet 0x108fba6a…, testnet Testnet2 0xd7b9d821…); live code cells and txs seen on both networks.
- This type does not check signatures: IncomeCells use the always-success lock, so all rules live in the type.
- Most rules depend on the molecule records in IncomeCell witnesses and on ConfigCellIncome / ConfigCellProfitRate in cell_deps; the decoder does not load cell_dep data and this plugin does not decode IncomeCell witnesses, so those items show as not checked.
- Type ID contracts are upgradable; the source read (0cc9fbf) is officially described as synced from the latest deployed contracts; no reproducible build.
- Error codes (das-core error.rs): -1 SystemOff · 6 InvalidTransactionStructure · 27 ActionNotSupported · 30 AlwaysSuccessLockIsRequired · 46 WitnessDataDecodingError · -126 ConsolidateConditionNotSatisfied · -125 ConsolidateError · -124 ConsolidateWaste · -123 TransferError · -122 CapacityError

## Example transactions

- mainnet · consolidate_income (2 → 0) · [0xcbeaa157e03f69e519a187c7aeb401fa04adad02dcfe5c524e4049fd6dca433d](https://explorer.nervos.org/transaction/0xcbeaa157e03f69e519a187c7aeb401fa04adad02dcfe5c524e4049fd6dca433d) · `node decode-tx.js 0xcbeaa157e03f69e519a187c7aeb401fa04adad02dcfe5c524e4049fd6dca433d`
- mainnet · consolidate_income (2 → 1) · [0xd415592c3d435ea45472233c844896b4939658e907480f36c7a60390dfe540c0](https://explorer.nervos.org/transaction/0xd415592c3d435ea45472233c844896b4939658e907480f36c7a60390dfe540c0) · `node decode-tx.js 0xd415592c3d435ea45472233c844896b4939658e907480f36c7a60390dfe540c0`
- mainnet · renew_account · [0x8ab5da21f9616db8f8e177b7e979f2e2dc0808c63fc907900b13fb3204fbbca3](https://explorer.nervos.org/transaction/0x8ab5da21f9616db8f8e177b7e979f2e2dc0808c63fc907900b13fb3204fbbca3) · `node decode-tx.js 0x8ab5da21f9616db8f8e177b7e979f2e2dc0808c63fc907900b13fb3204fbbca3`
- mainnet · confirm_proposal · [0x84e9989e7341f5c607018e46f7552751868858eadb506a2c033912fbdd641dd9](https://explorer.nervos.org/transaction/0x84e9989e7341f5c607018e46f7552751868858eadb506a2c033912fbdd641dd9) · `node decode-tx.js 0x84e9989e7341f5c607018e46f7552751868858eadb506a2c033912fbdd641dd9`
- testnet · consolidate_income (testnet) · [0xb60dcdd2ba9105b6ec9d821ddb04f1b7922263dd79f8054dcf08b6ba7b7f57e3](https://testnet.explorer.nervos.org/transaction/0xb60dcdd2ba9105b6ec9d821ddb04f1b7922263dd79f8054dcf08b6ba7b7f57e3) · `node decode-tx.js 0xb60dcdd2ba9105b6ec9d821ddb04f1b7922263dd79f8054dcf08b6ba7b7f57e3 --testnet`

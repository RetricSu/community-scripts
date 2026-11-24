# Cells name lock (account-lock) Constraints

> Source: LusoCryptoLabs/cells-contracts @34dad3c / contracts/account-lock/src/main.rs　·　mainnet 0x9f0f…71ab / testnet 0xede6…4afd (type, cellula-sdk)

- id: `cells_account_lock` · lock script · networks: mainnet, testnet · tags: identity, open-source, community, p-cells
- links: page https://retricsu.github.io/community-scripts/cells_account_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [LusoCryptoLabs/cells-contracts@6d29dab2](https://github.com/LusoCryptoLabs/cells-contracts/tree/6d29dab2770fa0980e13b9cbeefff0c844ef4101) · [contracts/account-lock/src/main.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/contracts/account-lock/src/main.rs) (commit read after #5 plain-payment fix (2026-11-06 mainnet upgrade); docs/TRUST.md hashes)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-09
- contributors: [@LusoCryptoLabs](https://github.com/LusoCryptoLabs)

## Deployments

### mainnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.lock; cells-contracts docs/TRUST.md

- code_hash: `0x9f0f0ba142b58cba2fe047546cfd8481d5b1769437cd3533e6458b21b61871ab` · hash_type: `type`
- deployed in tx [`0x522c91d3242450fdc5ae4cc6891d566de34d6f99663679f15e96c03d01c59268`](https://explorer.nervos.org/transaction/0x522c91d3242450fdc5ae4cc6891d566de34d6f99663679f15e96c03d01c59268) (block 20515861) · data_hash `0xa46c19f2262abc0d0db0de3952b7477792b36b392645e0f60e74637ae3e3f13b` · type_id args `0xd0713d8ece69fb0e7123f575d31b2a474c39b0336d635cdce31caf6f942ba026`

```json
{
  "script": { "code_hash": "0x9f0f0ba142b58cba2fe047546cfd8481d5b1769437cd3533e6458b21b61871ab", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x522c91d3242450fdc5ae4cc6891d566de34d6f99663679f15e96c03d01c59268", "index": "0x1" }, "dep_type": "code" }
}
```

### testnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.lock

- code_hash: `0xede6a3d80717c3d7927eea678d095abbe68dbb08ca6fdbbbdd9de906455a4afd` · hash_type: `type`
- deployed in tx [`0x968ec1a8cb35aa093b1bede3b41ad769f499b481db32662645b8bd95fec5a30a`](https://testnet.explorer.nervos.org/transaction/0x968ec1a8cb35aa093b1bede3b41ad769f499b481db32662645b8bd95fec5a30a) (block 22382771) · data_hash `0xa46c19f2262abc0d0db0de3952b7477792b36b392645e0f60e74637ae3e3f13b` · type_id args `0x6df5e3f226a09a768a59766224543ab08079b56159626c218cafa1b641eb8e92`

```json
{
  "script": { "code_hash": "0xede6a3d80717c3d7927eea678d095abbe68dbb08ca6fdbbbdd9de906455a4afd", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x968ec1a8cb35aa093b1bede3b41ad769f499b481db32662645b8bd95fec5a30a", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock by anyone

**Input** · name cell

```
Cell{ lock: { codeHash: ACCOUNT_LOCK, hashType: type, args: 0x },
      type: ACCOUNT_TYPE … }
```

**Output** · outputs: any

```
constrained by account-cell-type
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | program_entry always returns 0 | 0 |

## Notes

- Error codes: none
- Intentional: every name shares one lock hash and all authorization lives in account-cell-type (decision 0002). Never use it on a cell without a guarding type.

## Example transactions

- mainnet · name cell spent under account-lock (transfer) · [0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd](https://explorer.nervos.org/transaction/0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd) · `node decode-tx.js 0x53a0519e06fc4aac3eca2606e12fc19849919a226af872f687dfb3209a0470fd`

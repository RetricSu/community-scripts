# Cells listing (sale-lock) Constraints

> Source: LusoCryptoLabs/cells-contracts @34dad3c / contracts/sale-lock/src/main.rs + cells-core sale_fee　·　mainnet 0x086c…0879 / testnet 0x498a…0ae4 (type, cellula-sdk)

- id: `cells_sale_lock` · lock script · networks: mainnet, testnet · tags: identity, open-source, community, p-cells
- links: page https://retricsu.github.io/community-scripts/cells_sale_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [LusoCryptoLabs/cells-contracts@6d29dab2](https://github.com/LusoCryptoLabs/cells-contracts/tree/6d29dab2770fa0980e13b9cbeefff0c844ef4101) · [contracts/sale-lock/src/main.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/contracts/sale-lock/src/main.rs) · [crates/cells-core/src/lib.rs](https://github.com/LusoCryptoLabs/cells-contracts/blob/6d29dab2770fa0980e13b9cbeefff0c844ef4101/crates/cells-core/src/lib.rs) (commit read after #5 plain-payment fix (2026-11-06 mainnet upgrade); docs/TRUST.md hashes)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted); mainnet data hash matches docs/TRUST.md at recorded commit (script does not treat TRUST.md as checksum evidence); testnet hash also upgraded on-chain (TRUST.md testnet table may lag)
- on-chain data checked: 2026-11-09
- contributors: [@LusoCryptoLabs](https://github.com/LusoCryptoLabs)

## Deployments

### mainnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_MAINNET.sale; cells-contracts README / docs/TRUST.md

- code_hash: `0x086c8f4e9d4272e3dfbaca399792f730e6604591e87931ee6d67047a3c900879` · hash_type: `type`
- deployed in tx [`0xe72ac6421e9b9cd582dda77383ca0f100d7e05f1f08ae191d1f3b569f35ab7da`](https://explorer.nervos.org/transaction/0xe72ac6421e9b9cd582dda77383ca0f100d7e05f1f08ae191d1f3b569f35ab7da) (block 20943808) · data_hash `0x00744b0fbf48cf261c0263843f38099ce0d66c57695f9e7330b80299fe20be61` · type_id args `0x05238ca98c4bc67cb6592707ba40301141344b53687f73d73f702f0cc2d7985f`

```json
{
  "script": { "code_hash": "0x086c8f4e9d4272e3dfbaca399792f730e6604591e87931ee6d67047a3c900879", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe72ac6421e9b9cd582dda77383ca0f100d7e05f1f08ae191d1f3b569f35ab7da", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — cellula-sdk@0.2.1 deployments.js CELLS_DEPLOYMENT_TESTNET.sale

- code_hash: `0x498ab6b49b6b25b3c47fcea74bd8a4447bc4efda6417809152a846e058ad0ae4` · hash_type: `type`
- deployed in tx [`0x279ab20ee45be9a58be6cb5cfecfc16d368ca03b62e6f115f48a55e0bb161e40`](https://testnet.explorer.nervos.org/transaction/0x279ab20ee45be9a58be6cb5cfecfc16d368ca03b62e6f115f48a55e0bb161e40) (block 22975820) · data_hash `0xa5c166bb3a317d49afa4b3bb1efb9ce34cea2b080b3dc27fbf698e2ca0d5ee69` · type_id args `0xd02a9ec3afff1b51bcb54e46ff7f79a7a587bb69e5ecf2bc1454c842ea749585`

```json
{
  "script": { "code_hash": "0x498ab6b49b6b25b3c47fcea74bd8a4447bc4efda6417809152a846e058ad0ae4", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x279ab20ee45be9a58be6cb5cfecfc16d368ca03b62e6f115f48a55e0bb161e40", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` List

**Input** · name

```
account-cell-type transfer: owner → lock hash of sale-lock(seller, price)
```

**Output** · offer cell

```
Cell{
  lock: { codeHash: SALE_LOCK, hashType: {{type}},
          args: {{seller_lock_hash 32B ‖ price u64 LE}} },
  capacity: deposit
}
```

byte layout: lock.args (40 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | seller_lock_hash | 32B | seller full lock hash: payee and cancel identity |  |  |
| 1 | price | 8B LE | asking price in shannons; in args so it is part of the lock hash | > 0 (purchase path) | 2 |

Example:

- args: `0x{{a1b2…(32B)}}{{00e40b5402000000}}  ← price 0x02540be400 = 10,000 CKB`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | creating a lock runs no script; checks happen at spend | — |

### 2. `1 → 0` Cancel / relist (seller path)

**Input** · offer cell

```
Cell{ lock: SALE_LOCK(seller, price) }
```

**Input** · seller input

```
lock hash = {{seller_lock_hash}}, not an anyone-can-pay lock
```

**Output** · outputs

```
any
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length 40 | 2 |
| seller | an input under seller_lock_hash whose lock needs a signature (lets_anyone_spend false) → pass | 0 |

### 3. `1 → 0` Buy (payment path)

**Input** · offer cell

```
Cell{ lock: SALE_LOCK(seller, {{price > 0}}), hashType {{type}}, capacity: deposit }
```

**Input** · name

```
transferred to the buyer in the same tx
```

**Output** · seller

```
pure outputs (no type and empty data) to seller lock hash: ≥ Σ(price − fee + deposit) over that seller’s offers
```

**Output** · treasury

```
pure outputs (no type and empty data) ≥ Σ fee (every offer in the tx whose seller is absent)
```

byte layout: lock.args (40 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | seller_lock_hash | 32B | seller full lock hash: payee and cancel identity |  |  |
| 1 | price | 8B LE | asking price in shannons; in args so it is part of the lock hash | > 0 (purchase path) | 2 |

Example:

- args: `0x{{a1b2…(32B)}}{{00e40b5402000000}}  ← price 0x02540be400 = 10,000 CKB`

byte layout: sale_fee(price)

| # | field | size | meaning |
| --- | --- | --- | --- |
| 0 | price ≥ 6,300 CKB | 1% | 1% share |
| 1 | 630 ≤ price < 6,300 | 63 CKB | flat 63 CKB |
| 2 | price < 630 | 0 | none |

Example:

- 10,000 CKB: `fee 100 CKB → seller 9,900 + deposit`

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | length 40 | 2 |
| price | > 0 | 2 |
| hash_type | = type (named by type id) | 5 |
| seller payout | pure outputs (no type and empty data) total ≥ owed | 3 |
| treasury | pure outputs (no type and empty data) total ≥ Σ fee (zero if seller is the treasury) | 4 |

## Notes

- Error codes: 1 Encoding, 2 BadArgs, 3 Unpaid, 4 FeeUnpaid, 5 NotByTypeId
- The treasury lock hash is compiled in: mainnet 0x57d9…742d (README build values).
- No signature checked: the seller path relies on the seller’s own lock.

## Example transactions

- mainnet · listing cell spent · [0xe2f8d40497c1d484bf5e2a622b1f1279c87ce218633e5002c8e30dd451f7a357](https://explorer.nervos.org/transaction/0xe2f8d40497c1d484bf5e2a622b1f1279c87ce218633e5002c8e30dd451f7a357) · `node decode-tx.js 0xe2f8d40497c1d484bf5e2a622b1f1279c87ce218633e5002c8e30dd451f7a357`
- testnet · testnet listing cell spent · [0x38cc560320cd5d13e76d94365ccf6b488f6f5d12279a0ac4abde737df2b6b14d](https://testnet.explorer.nervos.org/transaction/0x38cc560320cd5d13e76d94365ccf6b488f6f5d12279a0ac4abde737df2b6b14d) · `node decode-tx.js 0x38cc560320cd5d13e76d94365ccf6b488f6f5d12279a0ac4abde737df2b6b14d --testnet`

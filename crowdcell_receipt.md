# CrowdCell Receipt Type Script Constraints

> Source: alesfer001/CrowdCell / contracts/receipt/src/main.rs@acbb40e　·　0x5237…8bf8b5 (data2, testnet only)　·　community contract, not independently audited

- id: `crowdcell_receipt` · type script · networks: testnet · tags: defi, open-source, community, p-crowdcell
- links: page https://retricsu.github.io/community-scripts/crowdcell_receipt.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [alesfer001/CrowdCell@acbb40ed](https://github.com/alesfer001/CrowdCell/tree/acbb40ed1426bc8c763eb29c12a83e4bb391b654) · [contracts/receipt/src/main.rs](https://github.com/alesfer001/CrowdCell/blob/acbb40ed1426bc8c763eb29c12a83e4bb391b654/contracts/receipt/src/main.rs) (branch fix/pledge-deadline-binding (PR alesfer001/CrowdCell#11, after three review rounds), updated 2026-11-04 by the author. Testnet redeploy 2026-10-31; deployment from deployment/deployed-contracts-testnet.json, all hash_type data2. A clean ./scripts/build-contracts.sh at this commit reproduces the deployed code hashes, listed in deployment/checksums-testnet.txt. Originally offered by Ayoub_Lesfer in https://talk.nervos.org/t/11014/2)
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-11-04
- contributors: [@alesfer001](https://github.com/alesfer001)

## Deployments

### testnet — alesfer001/CrowdCell@acbb40ed deployment/deployed-contracts-testnet.json (receipt codeHash, deployedAt 2026-10-31) + deployment/checksums-testnet.txt

- code_hash: `0x523716e6c46501480391965a9305d2be33045ce3be19300f62546ff3aa8bf8b5` · hash_type: `data2`
- deployed in tx [`0xe40519d726f365e0d24baf31f5e4402d021efca4a62449f5d4215a800e60436d`](https://testnet.explorer.nervos.org/transaction/0xe40519d726f365e0d24baf31f5e4402d021efca4a62449f5d4215a800e60436d) (block 22924447) · data_hash `0x523716e6c46501480391965a9305d2be33045ce3be19300f62546ff3aa8bf8b5`

```json
{
  "script": { "code_hash": "0x523716e6c46501480391965a9305d2be33045ce3be19300f62546ff3aa8bf8b5", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe40519d726f365e0d24baf31f5e4402d021efca4a62449f5d4215a800e60436d", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create receipt with a pledge

**Input** · —

```
no group input
```

**Output** · receipt

```
Cell{ type: { codeHash: RECEIPT, hashType: data2, args: {{pledge_code_hash 32B}} ‖ {{pledge_lock_code_hash 32B}} }, data(80B): {{amount}} ‖ {{backer}} ‖ {{campaign_hash}} ‖ {{deadline}} }
```

**Output** · receipts

```
at most 1 receipt output per transaction
```

**Output** · pledge

```
first output with type code_hash = args[0..32] and data ≥ 72B; its lock code_hash must equal args[32..64]
```

byte layout: receipt type args byte layout (64B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pledge_code_hash | 32B | pledge type script code_hash | = pledge output type code_hash | 14 |
| 1 | pledge_lock_code_hash | 32B | pledge lock code_hash (the lock a real pledge sits under) | = pledge output lock code_hash | 26 |

byte layout: receipt data byte layout (80B at creation)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pledge_amount | 8B | pledge amount u64 LE | > 0; = pledge amount | 12 / 21 |
| 1 | backer_lock_hash | 32B | backer lock hash | non-zero; = pledge data[32..64] | 13 / 22 |
| 2 | campaign_type_hash | 32B | campaign type script hash | = pledge lock args[0..32] | 24 |
| 3 | deadline_block | 8B | deadline u64 LE | = pledge lock args[32..40] | 24 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| receipt outputs | ≤ 1 (receipt outputs in the tx) | 27 |
| args | ≥ 64 bytes | 20 |
| data | ≥ 80 bytes | 10 |
| pledge_amount | > 0 | 12 |
| backer_lock_hash | ≠ 0 | 13 |
| pledge | an output with type code_hash = args[0..32] and data ≥ 72B exists | 14 |
| amount | = pledge data[64..72] | 21 |
| backer | = pledge data[32..64] | 22 |
| pledge lock | pledge cell lock code_hash = args[32..64] | 26 |
| campaign | pledge lock args ≥ 72B and [0..32] = campaign hash, [32..40] = deadline | 24 |
| load cell data / type | load fails (out-of-bounds excepted) | 9 |
| load script | loading the type script fails | 19 |
| load pledge lock | loading the matching pledge output's lock fails | 16 |

### 2. `1 → 0` Destroy receipt to reclaim its deposit

**Input** · receipt (each group input checked separately)

```
Cell{
  type: RECEIPT,
  data(80B): {{amount}} ‖ {{backer}} ‖ {{campaign_hash}} ‖ {{deadline}},
  since: {{absolute block number, grace-period branch}}
}
```

**Output** · no group output

```
the script does not check where the capacity goes (the receipt's own lock decides, outside this contract)
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | each group input ≥ 80 bytes (the 40-byte legacy form is rejected) | 10 |
| settled (cell_dep) | a cell_dep with the campaign type hash and data[56] ≠ 0 (1 Success / 2 Failed) → passes | — |
| settled (since) | since is an absolute block number ≥ deadline + 1,944,000 → passes | — |
| settled | neither holds → not allowed (every group input must satisfy it) | 23 |
| since | loading the group input's since fails | 25 |

### 3. `1 → 1` Modify

**Input** · receipt

```
Cell{ type: RECEIPT, … }
```

**Output** · receipt

```
Cell{ type: RECEIPT, … }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | receipt in both inputs and outputs is not allowed | 11 |

## Notes

- Error codes (contracts/receipt/src/main.rs, 16 in total): 9 LOAD_DATA · 10 INVALID_RECEIPT_DATA · 11 RECEIPT_MODIFICATION_NOT_ALLOWED · 12 ZERO_PLEDGE_AMOUNT · 13 ZERO_BACKER_HASH · 14 NO_MATCHING_PLEDGE · 16 LOAD_LOCK · 19 LOAD_SCRIPT · 20 INVALID_ARGS · 21 AMOUNT_MISMATCH · 22 BACKER_MISMATCH · 23 CAMPAIGN_NOT_SETTLED · 24 CAMPAIGN_MISMATCH · 25 LOAD_SINCE · 26 NOT_PLEDGE_LOCK · 27 MULTIPLE_RECEIPTS. 15, 17 and 18 are no longer in the source.
- Creation checks only the first pledge output found (type code_hash matches and data ≥ 72B); other outputs are not checked
- All receipts share one script group, so destruction checks every group input's settlement, not only the first
- A receipt only guards its own deposit and cannot take pledged funds; pledged funds are settled by the pledge lock
- The 300 CKB deposit is a frontend constant computed as (8 + 80 + 65 + 97) × 1.2 (RECEIPT_CELL_CAPACITY); the contract does not check capacity
- Binary: deployment/checksums-testnet.txt (acbb40e) records a blake2b equal to the code_hash above; the author rebuilt with ./scripts/build-contracts.sh at that commit on 2026-11-04 and all five hashes matched the testnet deployment
- Decoder limitation: cell_dep data is not resolved, so the cell_dep settled branch shows as not checked; the since grace-period branch is checked offline
- A transaction with no receipt cells returns 0 from the script (not an error code)

## Example transactions

- testnet · Receipt created with a pledge (campaign update, pledge, receipt; block 22946820) · [0x282adf8e8a25bef1bde96d285856c96c1fd7d1f4ff7d28da3e67669879a12b67](https://testnet.explorer.nervos.org/transaction/0x282adf8e8a25bef1bde96d285856c96c1fd7d1f4ff7d28da3e67669879a12b67) · `node decode-tx.js 0x282adf8e8a25bef1bde96d285856c96c1fd7d1f4ff7d28da3e67669879a12b67 --testnet`
- testnet · Receipt destroyed, campaign Failed (status 2 in cell_deps); receipt from the tx above · [0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25](https://testnet.explorer.nervos.org/transaction/0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25) · `node decode-tx.js 0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25 --testnet`
- testnet · Receipt destroyed alone, campaign Success (status 1 in cell_deps) · [0xf949c08a5d8060ae98499f3aba053ce7efcf809cf7bb9f2acf87398ada218176](https://testnet.explorer.nervos.org/transaction/0xf949c08a5d8060ae98499f3aba053ce7efcf809cf7bb9f2acf87398ada218176) · `node decode-tx.js 0xf949c08a5d8060ae98499f3aba053ce7efcf809cf7bb9f2acf87398ada218176 --testnet`

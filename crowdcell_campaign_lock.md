# CrowdCell Campaign Lock Constraints

> Source: alesfer001/CrowdCell / contracts/campaign-lock/src/main.rs@acbb40e　·　0xd975…02a3 (data2, testnet only)　·　community contract, not independently audited

- id: `crowdcell_campaign_lock` · lock script · networks: testnet · tags: defi, open-source, community, p-crowdcell
- links: page https://retricsu.github.io/community-scripts/crowdcell_campaign_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [alesfer001/CrowdCell@acbb40ed](https://github.com/alesfer001/CrowdCell/tree/acbb40ed1426bc8c763eb29c12a83e4bb391b654) · [contracts/campaign-lock/src/main.rs](https://github.com/alesfer001/CrowdCell/blob/acbb40ed1426bc8c763eb29c12a83e4bb391b654/contracts/campaign-lock/src/main.rs) (branch fix/pledge-deadline-binding (PR alesfer001/CrowdCell#11, after three review rounds), updated 2026-11-04 by the author. Testnet redeploy 2026-10-31; deployment from deployment/deployed-contracts-testnet.json, all hash_type data2. A clean ./scripts/build-contracts.sh at this commit reproduces the deployed code hashes, listed in deployment/checksums-testnet.txt. Originally offered by Ayoub_Lesfer in https://talk.nervos.org/t/11014/2)
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-11-04
- contributors: [@alesfer001](https://github.com/alesfer001)

## Deployments

### testnet — alesfer001/CrowdCell contracts/campaign-lock/src/main.rs@acbb40e; code cell per deployment/deployed-contracts-testnet.json (campaignLock, hash_type data2)

- code_hash: `0xd975780a890b817303a5414167ce235c041a9e63bb5e85f764acc71209fd02a3` · hash_type: `data2`
- deployed in tx [`0x1ea89700f68f672f950cd43bb764bf7148039d7c8151dad04922437d33d21504`](https://testnet.explorer.nervos.org/transaction/0x1ea89700f68f672f950cd43bb764bf7148039d7c8151dad04922437d33d21504) (block 22924443) · data_hash `0xd975780a890b817303a5414167ce235c041a9e63bb5e85f764acc71209fd02a3`

```json
{
  "script": { "code_hash": "0xd975780a890b817303a5414167ce235c041a9e63bb5e85f764acc71209fd02a3", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x1ea89700f68f672f950cd43bb764bf7148039d7c8151dad04922437d33d21504", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Active campaign carried forward (pre-deadline pledge)

**Input** · campaign

```
Cell{ capacity: C, type: {{campaign type}}, lock: { codeHash: CAMPAIGN_LOCK, args: {{deadline_block 8B}} } }
(every group input under this lock must qualify)
```

**Output** · campaign

```
first output with the same campaign type: Cell{ lock: {{same lock}}, data(≥65B)[56] = {{0 Active}}, {{capacity ≥ C}} }
```

byte layout: lock args byte layout (≥8B; extra bytes not read)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | deadline_block | 8B | deadline block u64 LE | non-carry path needs since ≥ it | 13 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 8 bytes (load_script failure is also 10) | 10 |
| cell reads | reading lock, type, data or capacity fails | 14 |
| capacity | when every group input qualifies: first same-type output has capacity ≥ input (otherwise the B deadline rules apply) | 15 |
| carry-forward | carry-forward: input has a type; first same-type output has the same lock, data ≥ 65 bytes and status 0 Active; any failure falls to B |  |

### 2. `B` Spend after the deadline (finalize / destroy)

**Input** · campaign

```
Cell{ lock: {{deadline_block}} }, {{since (first group input) = absolute block ≥ deadline_block}}
```

**Output** · outputs: any (rules from the campaign type script)

```
any
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| since | load fails | 11 |
| since | first group input since must be absolute, valid flags, block number | 12 |
| since | block number ≥ deadline_block (since = 0 counts as block 0) | 13 |

## Notes

- Error codes (main.rs@acbb40e): 10 INVALID_ARGS (args < 8B, or load_script fails) · 11 LOAD_SINCE · 12 INVALID_SINCE · 13 SINCE_BELOW_DEADLINE · 14 LOAD_CELL · 15 CAPACITY_DECREASED
- The carry-forward path needs every group input to qualify; if one does not, the whole group falls back to the B deadline rules (no error of its own; since decides). B reads only the first group input's since
- No signature is checked: anyone can move the campaign; validity and lock preservation (28) come from the campaign type script

## Example transactions

- testnet · Campaign carried forward by a pledge · [0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5](https://testnet.explorer.nervos.org/transaction/0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5) · `node decode-tx.js 0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5 --testnet`
- testnet · Campaign finalized to Failed after deadline · [0xed4bced8eb9ab217da28d07e421636286c01d0aacd95c33191564d44fe1f21d3](https://testnet.explorer.nervos.org/transaction/0xed4bced8eb9ab217da28d07e421636286c01d0aacd95c33191564d44fe1f21d3) · `node decode-tx.js 0xed4bced8eb9ab217da28d07e421636286c01d0aacd95c33191564d44fe1f21d3 --testnet`

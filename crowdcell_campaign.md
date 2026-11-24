# CrowdCell Campaign Type Script Constraints

> Source: alesfer001/CrowdCell / contracts/campaign/src/main.rs@acbb40e　·　0xd50c…a8f5 (data2, testnet only)　·　community contract, not independently audited

- id: `crowdcell_campaign` · type script · networks: testnet · tags: defi, open-source, community, p-crowdcell
- links: page https://retricsu.github.io/community-scripts/crowdcell_campaign.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [alesfer001/CrowdCell@acbb40ed](https://github.com/alesfer001/CrowdCell/tree/acbb40ed1426bc8c763eb29c12a83e4bb391b654) · [contracts/campaign/src/main.rs](https://github.com/alesfer001/CrowdCell/blob/acbb40ed1426bc8c763eb29c12a83e4bb391b654/contracts/campaign/src/main.rs) (branch fix/pledge-deadline-binding (PR alesfer001/CrowdCell#11, after three review rounds), updated 2026-11-04 by the author. Testnet redeploy 2026-10-31; deployment from deployment/deployed-contracts-testnet.json, all hash_type data2. A clean ./scripts/build-contracts.sh at this commit reproduces the deployed code hashes, listed in deployment/checksums-testnet.txt. Originally offered by Ayoub_Lesfer in https://talk.nervos.org/t/11014/2)
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-11-04
- contributors: [@alesfer001](https://github.com/alesfer001)

## Deployments

### testnet — alesfer001/CrowdCell contracts/campaign/src/main.rs@acbb40e; code cell per deployment/deployed-contracts-testnet.json (campaign, hash_type data2)

- code_hash: `0xd50ca43249515bb0ebe8534f4d7f74520e4fb7c1163d488c288672ffd7e7a8f5` · hash_type: `data2`
- deployed in tx [`0x8ffc8f88be667072ca06e89127444be41029baabae30306d8247c11dd6f1c799`](https://testnet.explorer.nervos.org/transaction/0x8ffc8f88be667072ca06e89127444be41029baabae30306d8247c11dd6f1c799) (block 22924440) · data_hash `0xd50ca43249515bb0ebe8534f4d7f74520e4fb7c1163d488c288672ffd7e7a8f5`

```json
{
  "script": { "code_hash": "0xd50ca43249515bb0ebe8534f4d7f74520e4fb7c1163d488c288672ffd7e7a8f5", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8ffc8f88be667072ca06e89127444be41029baabae30306d8247c11dd6f1c799", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create campaign

**Input** · first input

```
any cell (seeds the TypeID)
```

**Output** · campaign

```
Cell{ type: { codeHash: CAMPAIGN, args: {{type_id 32B}} ‖ {{pledge_lock_code_hash 32B}} },
  data: creator_lock_hash ‖ {{funding_goal>0}} ‖ {{deadline_block>0}} ‖ {{total_pledged=0}} ‖ {{status=0}} ‖ reserved ‖ metadata }
```

byte layout: type args byte layout (64B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type_id | 32B | TypeID | check_type_id(0,32) | 12 |
| 1 | pledge_lock_code_hash | 32B | code hash of pledge-lock | non-zero | 15 |

byte layout: campaign data byte layout (≥65B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | creator_lock_hash | 32B | creator lock hash | immutable |  |
| 1 | funding_goal | 8B | goal u64 LE (shannons) | > 0 at creation; immutable | 3 |
| 2 | deadline_block | 8B | deadline block u64 LE | > 0 at creation; immutable | 4 |
| 3 | total_pledged | 8B | accumulated pledges u64 LE | = 0 at creation; grows by net pledge inflow | 5 |
| 4 | status | 1B | 0 Active · 1 Success · 2 Failed | other values → 2 | 2 |
| 5 | reserved‖metadata | 8B+ | 8B reserved + metadata tail | [57..] immutable, length unchanged |  |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | TypeID check fails | 12 |
| args | length ≥ 64 and pledge_lock_code_hash ≠ 0 | 15 |
| script | load_script succeeds | 7 |
| group | at most 1 group input and 1 group output | 21 |
| group data | group cell data readable | 9 |
| data | ≥ 65 bytes | 1 |
| data[56] | status ∈ {0,1,2} | 2 |
| funding_goal | > 0 | 3 |
| deadline_block | > 0 (not checked to be in the future) | 4 |
| total_pledged | = 0 | 5 |
| status | = 0 Active | 6 |

### 2. `1 → 1` Pledge: accumulator update (Active → Active)

**Input** · campaign

```
Cell{ lock: {{L}}, capacity: C, type: {{campaign type}}, data: …total_pledged = T, status = 0 }
```

**Input** · optional: consumed pledges of this campaign

```
Cell{ lock: { codeHash: pledge_lock_code_hash, args: campaign_type_hash ‖ {{deadline_block}} ‖ … } }
```

**Output** · campaign

```
Cell{ lock: {{same as input}}, {{capacity ≥ C}}, data: {{total_pledged = T + Σnew − Σold}}, status = 0, other fields unchanged }
```

**Output** · pledge

```
Cell{ lock: { codeHash: {{pledge_lock_code_hash}}, args: {{campaign_type_hash}} ‖ {{deadline_block}} ‖ backer_lock_hash }, data(72B)[64..72] = {{amount ≥ 100 CKB (created)}}, {{capacity ≥ amount + occupied}} }
```

byte layout: pledge lock args byte layout (72B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | campaign_type_hash | 32B | this campaign's type script hash | same as this campaign: counted toward total |  |
| 1 | deadline | 8B | deadline block u64 LE | = campaign deadline_block | 26 |
| 2 | backer_lock_hash | 32B | backer lock hash |  |  |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| capacity | output campaign capacity ≥ input | 17 |
| lock | output campaign lock hash = input lock hash | 28 |
| data | input and output campaign data ≥ 65 bytes; status ∈ {0,1,2} | 1 |
| status | old status must be Active | 16 |
| data | creator_lock_hash / funding_goal / deadline_block / length / [57..] unchanged | 16 |
| pledge lock args | this campaign's pledges: lock args ≥ 72 bytes and [32..40] = deadline_block (created and consumed) | 26 |
| pledge data | pledge cell data of this campaign ≥ 72 bytes | 16 |
| amount | new pledge amount ≥ 100 CKB (10,000,000,000 shannons); consumed pledges not checked | 23 |
| capacity | pledge capacity ≥ amount + occupied capacity | 22 |
| total_pledged | Σcreated > Σconsumed, and new total = old total + delta | 16 |
| u64 | accumulation and amount + occupied do not overflow | 19 |
| cell / pledge data | reading lock, capacity or occupied fails | 20 |
| data load | reading campaign or pledge data fails | 9 |

### 3. `1 → 2` Finalize: Active → Success / Failed

**Input** · campaign

```
Cell{ lock: {{L}}, data: status = 0 }, {{since = absolute block ≥ deadline_block}}
```

**Output** · campaign

```
Cell{ lock: {{same as input}}, {{capacity ≥ C}}, data: {{total_pledged unchanged}}, {{status = total ≥ goal ? 1 : 2}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| capacity | output capacity ≥ input | 17 |
| lock | output campaign lock hash = input lock hash | 28 |
| data | input and output campaign data ≥ 65 bytes; status ∈ {0,1,2} | 1 |
| since | load fails | 14 |
| since | non-zero, absolute, valid flags, block number, ≥ deadline_block | 10 |
| status | old status Active | 10 |
| data | creator_lock_hash / funding_goal / deadline_block / length / [57..] unchanged; total_pledged unchanged | 10 |
| status | Success requires total ≥ goal; Failed requires total < goal | 18 |
| data load | reading campaign data fails | 9 |

### 4. `2 → 0` Destroy a finalized campaign

**Input** · campaign

```
Cell{ capacity: C, data: {{status ∈ {1,2}}} }, {{since = absolute block ≥ deadline + 1,944,000}}
```

**Input** · other inputs of the same tx

```
no pledge-lock cell; no cell with another type script
```

**Output** · creator

```
Σ Cell{ lock hash = creator_lock_hash }.capacity {{≥ C − 1 CKB}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| status | Active cannot be destroyed | 13 |
| inputs | no pledge-lock cell may be spent in the same tx | 25 |
| inputs | no cell with another type script may be spent in the same tx (including another campaign of the same creator) | 27 |
| outputs | capacity paid to creator_lock_hash ≥ C − 1 CKB (checked before since) | 24 |
| since | non-zero, absolute, valid flags, block number, ≥ deadline_block + 1,944,000 (~180 days) | 13 |
| cell reads | reading lock, type or capacity fails | 20 |
| payout sum | sum of capacity paid to the creator overflows | 19 |
| data load | reading campaign data fails | 9 |
| since | load fails | 14 |

## Notes

- Error codes (main.rs@acbb40e): 1 data too short · 2 bad status · 3 goal=0 · 4 deadline=0 · 5 total≠0 at creation · 6 not Active at creation · 7 NO_SCRIPT · 9 LOAD_DATA · 10 INVALID_FINALIZATION · 11 MODIFICATION_NOT_ALLOWED (defined, unused) · 12 INVALID_TYPE_ID · 13 DESTRUCTION_NOT_ALLOWED · 14 LOAD_SINCE · 15 INVALID_ARGS · 16 INVALID_PLEDGE_UPDATE · 17 CAPACITY_DECREASED · 18 STATUS_NOT_JUSTIFIED · 19 OVERFLOW · 20 LOAD_CELL · 21 MULTIPLE_CAMPAIGN_CELLS · 22 PLEDGE_UNDERFUNDED · 23 PLEDGE_BELOW_MINIMUM · 24 CREATOR_NOT_PAID · 25 DESTRUCTION_WITH_PLEDGES · 26 PLEDGE_DEADLINE_MISMATCH · 27 DESTRUCTION_OTHER_TYPED_INPUT · 28 CAMPAIGN_LOCK_CHANGED
- Every transition checks lock unchanged (28) and capacity not decreased (17); data parse errors (1 / 2) come first. An Active output always takes the pledge path, so the Active-target branch of check_status_justified (also 10) is unreachable
- A pledge belongs to the campaign when its lock code_hash = args[32..64] and lock args[0..32] = this campaign's type hash. A belonging pledge must have lock args ≥ 72 bytes and the campaign's deadline (else 26). pledge data's campaign_id is informational only
- Consumed pledges have no minimum amount but still need the matching deadline (26) and enough capacity (22); created pledges need amount ≥ 100 CKB (23)
- Since rule: since = 0 is absolute block 0, not an invalid encoding, so it fails with 10 in 1 → 2 and 13 in 2 → 0; destruction checks creator payout (24) before since (13)
- Who may spend the campaign cell (and whether it can finalize before the deadline) is decided by campaign-lock, not covered here (see the crowdcell_campaign_lock card); pledge cells' own type rules live in CrowdCell's pledge type script (not included)
- Not a contract rule: the README's ~180 days assumes 8 s blocks
- CrowdCell describes itself as a testnet preview; not independently audited

## Example transactions

- testnet · CrowdCell campaign creation · [0xe7cc8694569443981742f791ca4ea67c87cc2b6b6067ea1623fedd15322064d9](https://testnet.explorer.nervos.org/transaction/0xe7cc8694569443981742f791ca4ea67c87cc2b6b6067ea1623fedd15322064d9) · `node decode-tx.js 0xe7cc8694569443981742f791ca4ea67c87cc2b6b6067ea1623fedd15322064d9 --testnet`
- testnet · CrowdCell pledge (accumulator update) · [0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5](https://testnet.explorer.nervos.org/transaction/0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5) · `node decode-tx.js 0x0027096b8eef9b5c429be956aedf1eabca495ce84224e65c49caf4b3d0584ab5 --testnet`
- testnet · CrowdCell finalize Active → Success · [0xf911c1515f16de66f8cf47a97a8e0c794579485539ac4b1a4eb6ece03b784fdb](https://testnet.explorer.nervos.org/transaction/0xf911c1515f16de66f8cf47a97a8e0c794579485539ac4b1a4eb6ece03b784fdb) · `node decode-tx.js 0xf911c1515f16de66f8cf47a97a8e0c794579485539ac4b1a4eb6ece03b784fdb --testnet`

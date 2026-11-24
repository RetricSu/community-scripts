# CrowdCell Pledge Lock Constraints

> Source: alesfer001/CrowdCell / contracts/pledge-lock/src/main.rs@acbb40e (unchanged since 2fd13f6)　·　0xc28d…a525 (data2, testnet only, redeployed 2026-10-31)　·　community contract, not independently audited

- id: `crowdcell_pledge_lock` · lock script · networks: testnet · tags: defi, open-source, community, p-crowdcell
- links: page https://retricsu.github.io/community-scripts/crowdcell_pledge_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [alesfer001/CrowdCell@acbb40ed](https://github.com/alesfer001/CrowdCell/tree/acbb40ed1426bc8c763eb29c12a83e4bb391b654) · [contracts/pledge-lock/src/main.rs](https://github.com/alesfer001/CrowdCell/blob/acbb40ed1426bc8c763eb29c12a83e4bb391b654/contracts/pledge-lock/src/main.rs) (branch fix/pledge-deadline-binding (PR alesfer001/CrowdCell#11, after three review rounds), updated 2026-11-04 by the author. Testnet redeploy 2026-10-31; deployment from deployment/deployed-contracts-testnet.json, all hash_type data2. A clean ./scripts/build-contracts.sh at this commit reproduces the deployed code hashes, listed in deployment/checksums-testnet.txt. Originally offered by Ayoub_Lesfer in https://talk.nervos.org/t/11014/2)
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-11-04
- contributors: [@alesfer001](https://github.com/alesfer001)

## Deployments

### testnet — alesfer001/CrowdCell@acbb40e deployment/deployed-contracts-testnet.json (pledgeLock, deployedAt 2026-10-31; code cell 0x53d7d644…:0, data hash = code_hash checked on chain); hash_type data2 seen on chain (pledge-lock lock scripts in 2026-10-31 txs)

- code_hash: `0xc28d8042a1cf39d02db0cbc769a26faad80b39563c2d2de40536ddb66ae3a525` · hash_type: `data2`
- deployed in tx [`0x53d7d6447fb21b4da1e211a48a4fb2d5ceafd510ec88c966666b08085708bf1e`](https://testnet.explorer.nervos.org/transaction/0x53d7d6447fb21b4da1e211a48a4fb2d5ceafd510ec88c966666b08085708bf1e) (block 22889830) · data_hash `0xc28d8042a1cf39d02db0cbc769a26faad80b39563c2d2de40536ddb66ae3a525`

```json
{
  "script": { "code_hash": "0xc28d8042a1cf39d02db0cbc769a26faad80b39563c2d2de40536ddb66ae3a525", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x53d7d6447fb21b4da1e211a48a4fb2d5ceafd510ec88c966666b08085708bf1e", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Before deadline: merge (input since = 0)

**Input** · ≥2 pledges

```
Cell{ lock: { codeHash: PLEDGE_LOCK, args: {{campaign_hash 32B}} ‖ {{deadline 8B}} ‖ {{backer_lock_hash 32B}} }, type: T, data[64..72] = aᵢ }, {{since = 0}}
```

**Output** · single merged cell

```
Cell{ lock: {{same lock}}, {{capacity = Σinputs}}, type: {{T}}, data[64..72] = {{Σaᵢ}} }
```

byte layout: lock args byte layout (72B)

| # | field | size | meaning | error |
| --- | --- | --- | --- | --- |
| 0 | campaign_type_script_hash | 32B | type script hash of the campaign; on settlement it is looked up in cell_deps (not checked on merge) |  |
| 1 | deadline_block | 8B | deadline block u64 LE; on settlement since must be ≥ it (not checked on merge) | 13 |
| 2 | backer_lock_hash | 32B | backer lock hash; refund / overhead destination on settlement (not checked on merge) | 32 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 72 bytes | 10 |
| inputs | ≥ 2 group inputs (otherwise 40) | 40 |
| outputs | exactly one output with the same lock (none → 41, several → 42) | 41 / 42 |
| capacity | output capacity = Σ input capacity (no fee taken) | 43 |
| type | all inputs and the output share one non-empty type | 45 |
| data | input/output data ≥ 72 bytes and amounts sum equal (a short input also gives 46) | 46 |
| u64 | addition overflows (capacity or amount) | 33 |
| lock hash | group inputs with differing lock hash (note: defensive check: unreachable in practice under Source::GroupInput) | 44 |
| load | failure to load input / output capacity, lock hash, type hash or data | 30 / 31 |

### 2. `B` After deadline + Success: release to creator

**Input** · pledge(s)

```
pledges with this lock, {{since = absolute block ≥ deadline}}
```

**Input** · cell_dep

```
campaign Cell{ type hash = campaign_hash, data[0..32] = creator_lock_hash, data[56] = {{1 Success}} }
```

**Output** · creator

```
Σ Cell{ lock hash = creator_lock_hash } {{≥ Σamount}}
```

**Output** · backer

```
Σ Cell{ lock hash = backer_lock_hash } {{≥ Σcapacity − Σamount − 1 CKB}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | ≥ 72 bytes | 10 |
| since | when non-zero must be absolute, valid flags, block number | 12 |
| since | block number ≥ deadline_block | 13 |
| cell_dep | rejected while the campaign is Active (an unparseable cell_dep counts as missing, see C) | 20 |
| inputs | no other pledge-lock group (same code_hash, different lock hash) may be spent | 34 |
| outputs | creator ≥ Σamount, backer ≥ overhead − 1 CKB; if creator = backer, total ≥ Σcapacity − 1 CKB | 32 |
| u64 | addition overflows | 33 |
| load | failure to load input capacity, lock hash or output capacity | 30 / 31 |

### 3. `C` After deadline + Failed (or no cell_dep after grace): refund

**Input** · pledge(s)

```
{{since ≥ deadline}}; campaign in cell_deps is Failed, or absent and {{since ≥ deadline + 1,944,000}}
```

**Output** · backer

```
Σ Cell{ lock hash = backer_lock_hash } {{≥ Σcapacity − 1 CKB}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| cell_dep | campaign cell_dep missing and grace period not over | 21 |
| cell_dep | rejected while the campaign is Active | 20 |
| inputs | no other pledge-lock group may be spent | 34 |
| outputs | to backer_lock_hash ≥ Σcapacity − 1 CKB | 32 |
| u64 | addition overflows | 33 |
| load | failure to load input capacity, lock hash or output capacity | 30 / 31 |

## Notes

- Error codes (main.rs): 10 INVALID_ARGS · 11 LOAD_SINCE · 12 INVALID_SINCE · 13 SINCE_BELOW_DEADLINE · 20 CAMPAIGN_STILL_ACTIVE · 21 CAMPAIGN_CELL_DEP_MISSING · 30 LOAD_CAPACITY · 31 LOAD_LOCK_HASH · 32 INSUFFICIENT_OUTPUT · 33 OVERFLOW · 34 MIXED_PLEDGE_INPUTS · 40 NOT_A_MERGE · 41 NO_MERGE_OUTPUT · 42 MULTIPLE_MERGE_OUTPUTS · 43 MERGE_CAPACITY_MISMATCH · 44 MERGE_LOCK_MISMATCH · 45 MERGE_TYPE_MISMATCH · 46 MERGE_AMOUNT_MISMATCH
- Only the first group input's since picks the path; since = 0 takes the merge path but does not prove the chain is before the deadline (source comment: the merged output keeps the same lock)
- On release/refund each pledge's amount is data[64..72]; if data < 72 B or amount > capacity, the whole capacity counts instead
- A campaign cell_dep that cannot be parsed (data < 65 bytes, status byte not 0/1/2, or no cell with that type hash) is treated as missing and takes the grace-period branch
- The campaign type script requires the deadline in pledge lock args (bytes 32–40) to equal the campaign's deadline and rejects otherwise with error 26 (see the campaign card); this script does not check it
- No signature is checked: anyone may build release/refund (README: finalization bot or anyone)
- Decoder limitation: this page does not read cell_deps data, so campaign status, the creator lock hash and the outcome of the release / refund branch show as not checked

## Example transactions

- testnet · Release on Success: 250 CKB to creator, overhead back to backer (block 22925178) · [0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf](https://testnet.explorer.nervos.org/transaction/0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf) · `node decode-tx.js 0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf --testnet`
- testnet · Refund on Failed: 502 CKB pledge, single input, all to backer (block 22925189) · [0xca68924245c6c34e7ee302a0a0d5c12a2258baf9cfed08b3a08d6a03e22d6db0](https://testnet.explorer.nervos.org/transaction/0xca68924245c6c34e7ee302a0a0d5c12a2258baf9cfed08b3a08d6a03e22d6db0) · `node decode-tx.js 0xca68924245c6c34e7ee302a0a0d5c12a2258baf9cfed08b3a08d6a03e22d6db0 --testnet`
- testnet · Refund on Failed with an extra funding input: 352 CKB pledge (block 22946856) · [0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25](https://testnet.explorer.nervos.org/transaction/0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25) · `node decode-tx.js 0xa2e7acc7f95cf88c42f462ee470502e5d26934356c52fa30d37f444096c07d25 --testnet`

# CrowdCell Pledge Type Script Constraints

> Source: alesfer001/CrowdCell / contracts/pledge/src/main.rs@acbb40e (unchanged since 2fd13f6)　·　0xe45d…b024 (data2, testnet only, redeployed 2026-10-31)　·　community contract, not independently audited

- id: `crowdcell_pledge` · type script · networks: testnet · tags: defi, open-source, community, p-crowdcell
- links: page https://retricsu.github.io/community-scripts/crowdcell_pledge.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [alesfer001/CrowdCell@acbb40ed](https://github.com/alesfer001/CrowdCell/tree/acbb40ed1426bc8c763eb29c12a83e4bb391b654) · [contracts/pledge/src/main.rs](https://github.com/alesfer001/CrowdCell/blob/acbb40ed1426bc8c763eb29c12a83e4bb391b654/contracts/pledge/src/main.rs) (branch fix/pledge-deadline-binding (PR alesfer001/CrowdCell#11, after three review rounds), updated 2026-11-04 by the author. Testnet redeploy 2026-10-31; deployment from deployment/deployed-contracts-testnet.json, all hash_type data2. A clean ./scripts/build-contracts.sh at this commit reproduces the deployed code hashes, listed in deployment/checksums-testnet.txt. Originally offered by Ayoub_Lesfer in https://talk.nervos.org/t/11014/2)
- binary vs source: verified (deployed binary matches the source) — deployed data hash matches a binary / checksum in the repo at the recorded commit
- on-chain data checked: 2026-11-04
- contributors: [@alesfer001](https://github.com/alesfer001)

## Deployments

### testnet — alesfer001/CrowdCell@acbb40e deployment/deployed-contracts-testnet.json (pledge, deployedAt 2026-10-31; code cell 0x49961d44…:0, data hash = code_hash checked on chain); hash_type data2 seen on chain (pledge type scripts in 2026-10-31 txs)

- code_hash: `0xe45d09f08d0e842340afb004cfb6b6b6414ad387f9cd2f3e0b9abcd6ae8eb024` · hash_type: `data2`
- deployed in tx [`0x49961d44d1712cdeade84d86fe2ca2466b8a1d77462a61dcfc9c27944277af3d`](https://testnet.explorer.nervos.org/transaction/0x49961d44d1712cdeade84d86fe2ca2466b8a1d77462a61dcfc9c27944277af3d) (block 22889827) · data_hash `0xe45d09f08d0e842340afb004cfb6b6b6414ad387f9cd2f3e0b9abcd6ae8eb024`

```json
{
  "script": { "code_hash": "0xe45d09f08d0e842340afb004cfb6b6b6414ad387f9cd2f3e0b9abcd6ae8eb024", "hash_type": "data2", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x49961d44d1712cdeade84d86fe2ca2466b8a1d77462a61dcfc9c27944277af3d", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create pledge

**Input** · —

```
no group input
```

**Output** · pledge

```
Cell{ type: { codeHash: PLEDGE, hashType: data2, args: receipt_code_hash 32B }, lock: PLEDGE_LOCK, data: {{campaign_id≠0}} ‖ {{backer_lock_hash≠0}} ‖ {{amount>0}} }
```

**Output** · receipt in the same tx (not checked here)

```
Cell{ type: { codeHash: args[0..32], args: 64B }, capacity: 300 CKB, data[0..8] = pledged amount u64 LE }, checked by the receipt contract; as observed in 2026-10-31 testnet txs
```

byte layout: pledge data byte layout (72B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | campaign_id | 32B | campaign id; must match across inputs and output on merge and partial refund (routing is decided by pledge-lock args) | non-zero | 3 |
| 1 | backer_lock_hash | 32B | backer lock hash (only non-zero is checked here; refund destination is set by pledge-lock args) | non-zero | 4 |
| 2 | amount | 8B | amount u64 LE (shannon) | > 0 | 5 |

byte layout: type args (32B or longer)

| # | field | size | meaning | constraint |
| --- | --- | --- | --- | --- |
| 0 | receipt_code_hash | 32B | receipt contract code_hash; used to find the receipt input on partial refund | only the code_hash is compared, not the full type script |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | ≥ 72 bytes (only the first group output is checked) | 1 |
| campaign_id | ≠ 0 | 3 |
| backer_lock_hash | ≠ 0 | 4 |
| amount | > 0 | 5 |

### 2. `n → 1` Merge (≥2 inputs → 1 output)

**Input** · pledges

```
data: {{campaign_id}} ‖ … ‖ aᵢ
```

**Output** · pledge

```
data: {{campaign_id}} ‖ … ‖ {{Σaᵢ}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | every input and the output data ≥ 72 bytes | 1 |
| campaign_id | same in every input and the output | 11 |
| amount | output amount = Σ inputs | 12 |
| u64 | addition overflows | 13 |
| data | failure to load group input / output data | 9 |

### 3. `1 → 1` Partial refund (amount decreases)

**Input** · pledge

```
data: campaign_id ‖ … ‖ a
```

**Input** · receipt

```
input cell whose type code_hash = args[0..32], data[0..8] = {{a − a′}} (required only when args ≥ 32 bytes)
```

**Output** · pledge

```
data: {{campaign_id}} ‖ … ‖ {{a′ < a}}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | input and output data ≥ 72 bytes | 1 |
| campaign_id | input and output equal | 14 |
| amount | output amount < input amount | 15 |
| receipt | when args ≥ 32 bytes: first receipt input (data ≥ 8B) amount = difference | 16 |
| receipt | when args ≥ 32 bytes a receipt must be in inputs | 17 |
| data | failure to load input / output / receipt data | 9 |

### 4. `1 → 0` Destroy (on release or refund settlement)

**Input** · pledge

```
any
```

**Output** · —

```
no group output
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | always allowed (routing enforced by pledge-lock) | — |

### 5. `m → k` Other shapes

**Input** · pledges

```
m
```

**Output** · pledges

```
k
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | neither n→1 (n≥2 and exactly 1 output) nor 1→1 (1 input and 1 output) | 10 |

## Notes

- Error codes (main.rs): 1 data too short · 3 campaign_id=0 · 4 backer=0 · 5 amount=0 · 7 NO_SCRIPT · 9 LOAD_DATA · 10 MODIFICATION_NOT_ALLOWED · 11 MERGE_DIFFERENT_CAMPAIGNS · 12 MERGE_AMOUNT_MISMATCH · 13 OVERFLOW · 14 CAMPAIGN_MISMATCH · 15 PARTIAL_REFUND_INVALID · 16 REFUND_AMOUNT_MISMATCH · 17 NO_RECEIPT_IN_INPUTS
- type args optional: when ≥ 32 bytes the first 32 are the receipt code_hash, matched by code_hash only (any receipt input with that code_hash counts); shorter args mean partial refunds need no receipt
- Creation accepts any number of group outputs and checks only the first; merge requires exactly one group output, otherwise the shape falls to m → k (error 10)
- Whether a pledge counts toward a campaign is not decided here: the campaign type script (contracts/campaign/src/main.rs, sum_campaign_pledges) selects pledges by pledge-lock code_hash, the campaign hash and deadline in lock args (bytes 32–40), and sums data[64..72] (see the campaign card)
- As of 2026-11-04 there is no merge or partial-refund transaction on testnet (a search of the pledge type script finds no tx with two or more pledge inputs, and none with a pledge input and a pledge output); these two paths rest on source reading only, not on-chain runs

## Example transactions

- testnet · Pledge created 400 CKB with receipt (0→1, 2026-10-31 deploy, block 22925033) · [0x20807a9966508e3afb86afdb6ad1e7725b2c28e4a5b6c1f45f923779ee911928](https://testnet.explorer.nervos.org/transaction/0x20807a9966508e3afb86afdb6ad1e7725b2c28e4a5b6c1f45f923779ee911928) · `node decode-tx.js 0x20807a9966508e3afb86afdb6ad1e7725b2c28e4a5b6c1f45f923779ee911928 --testnet`
- testnet · Pledge 250 CKB destroyed on release, campaign Success (1→0, block 22925178) · [0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf](https://testnet.explorer.nervos.org/transaction/0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf) · `node decode-tx.js 0x36ebac8d2b4d4fe3e0bc459c5f74cd85938511506011e8b0e5fa049ce1e09bdf --testnet`
- testnet · Pledge 150 CKB destroyed on refund, campaign Failed (1→0, block 22925189) · [0x0f226497bef6ff7724b5a1a80f85025db0f617ef1d32ce27dafd83f15af5ca0f](https://testnet.explorer.nervos.org/transaction/0x0f226497bef6ff7724b5a1a80f85025db0f617ef1d32ce27dafd83f15af5ca0f) · `node decode-tx.js 0x0f226497bef6ff7724b5a1a80f85025db0f617ef1d32ce27dafd83f15af5ca0f --testnet`

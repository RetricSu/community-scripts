# Bitcoin SPV Type Lock Constraints (mainnet btc-mainnet-v0.1.0)

> Source: ckb-cell/ckb-bitcoin-spv-contracts @f3e3ba8 (tag btc-mainnet-v0.1.0) contracts/ckb-bitcoin-spv-type-lock + ckb-bitcoin-spv verifier @a3c43fd　·　mainnet 0xa76e…741d (type)

- id: `btc_spv_type_lock` · type script · networks: mainnet · tags: btc, open-source, cryptape, p-rgbpp
- links: page https://retricsu.github.io/community-scripts/btc_spv_type_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-cell/ckb-bitcoin-spv-contracts@f3e3ba84](https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/tree/f3e3ba846c1de580ae7f0720cbb64df13036b80a) · [contracts/ckb-bitcoin-spv-type-lock/src](https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/blob/f3e3ba846c1de580ae7f0720cbb64df13036b80a/contracts/ckb-bitcoin-spv-type-lock/src) · [checksums.txt](https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/blob/f3e3ba846c1de580ae7f0720cbb64df13036b80a/checksums.txt) (tag btc-mainnet-v0.1.0 (= origin/production). sha256 of the mainnet code cell data 481b173ca6d264c4c447210fae466ef4a2f9d7a78f5d6fd07dda4d61cf1bf34c equals checksums.txt here (checksums are sha256, so check-deployments cannot match them; binary status set by hand). Verifier types: ckb-cell/ckb-bitcoin-spv @a3c43fd)
- binary vs source: verified (deployed binary matches the source) — verified by hand via sha256 checksums.txt (check-deployments compares blake2b only and would rewrite this as unverified)
- on-chain data checked: 2026-11-06
- contributors: [@chaoticlonghair](https://github.com/chaoticlonghair)

## Deployments

### mainnet — type of the SPV client cell 0xd6b2fcb7…:1 whose type hash 0x00a2…c6f7 is btc_lc_type_hash in the RGB++ lock config cell 0x04c5c3e6…:1 (mainnet)

- code_hash: `0xa76e227da81b97d23deabf0d8964aa41c042f4bcf2db2b8bd873fe8521de741d` · hash_type: `type`
- deployed in tx [`0x1dc9a53526bb7a9a4974aa6de7636014279bff996321c9acc5180912e7d8a2b8`](https://explorer.nervos.org/transaction/0x1dc9a53526bb7a9a4974aa6de7636014279bff996321c9acc5180912e7d8a2b8) (block 12576657) · data_hash `0x0a1d2402d7ccd9fe9b6e86eda78c6bd89cd3e00d84521bd5271c62846da7dbbf` · type_id args `0xe58e5edfb4b7320cf822be815b025d6b8c0d5767b44c5eb1209e3edc52c97eb7`

```json
{
  "script": { "code_hash": "0xa76e227da81b97d23deabf0d8964aa41c042f4bcf2db2b8bd873fe8521de741d", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x1dc9a53526bb7a9a4974aa6de7636014279bff996321c9acc5180912e7d8a2b8", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1 + n` Create an SPV instance

**Input** · inputs[0]: any

```
CellInput{ since, previous_output }
```

**Output** · Info cell

```
Cell{ type: { codeHash: {{SPV_TYPE_LOCK}}, args: SpvTypeArgs }, data: SpvInfo { tip_client_id: {{0}} } }
```

**Output** · Client cell × n

```
Cell{ type: same type,
  data: SpvClient { id: {{0..n-1}}, tip_block_hash, headers_mmr_root, target_adjust_info } }
```

**Output** · witness[info]

```
WitnessArgs{ output_type: SpvBootstrap { height, header 80B } }
```

byte layout: args (SpvTypeArgs, 34 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | type_id | 32B | instance id | = blake2b(inputs[0] ‖ output count u64) | 0x23 |
| 1 | clients_count | 1B | number of client cells | outputs = 1 + it | 0x22 |
| 2 | flags | 1B | 0x80 = skip difficulty / PoW checks | — | — |

byte layout: SpvClient data (113 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | id | 1B | client id | 0..n-1 ring | 0x32 |
| 1 | tip_block_hash | 32B | latest BTC block hash (internal byte order) | = sha256d of the last header | 0x7a |
| 2 | headers_mmr_root | 72B | HeaderDigest { min_height, max_height, partial_chain_work U256 LE, children_hash } | incremental MMR proof | 0x71/0x72 |
| 3 | target_adjust_info | 8B | start_time ‖ next_compact_target | updated per difficulty period | 0x7d |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| outputs | instance outputs ≥ 4, contiguous, count = 1 + clients_count | 0x20 / 0x21 / 0x22 |
| type_id | blake2b(first CellInput ‖ output count u64) | 0x23 |
| info | first output = SpvInfo with tip 0 | 0x24 / 0x25 |
| clients | all equal the client derived from the bootstrap, ids increasing | 0x26–0x28 |

### 2. `2 → 2` Update: overwrite the oldest client

**Input** · Info cell

```
SpvInfo { tip_client_id: t }
```

**Input** · Client cell

```
SpvClient { id: {{next(t)}} } // oldest
```

**Output** · Info cell

```
SpvInfo { tip_client_id: {{next(t)}} }
```

**Output** · Client cell

```
SpvClient { id: next(t), tip_block_hash: {{new tip}}, … }
```

**Output** · witness[info]

```
WitnessArgs{ output_type: SpvUpdate { headers, new_headers_mmr_proof } }
```

**Also**

- The current tip client (id = t) goes in cell_deps; the new client is that client extended by the headers.

**Constraints**

| field | condition | error |
| --- | --- | --- |
| inputs / outputs | one SpvInfo + one SpvClient each; input client id = next(t); output info = next(t) | 0x30–0x35 |
| cell_deps | exactly one client of this instance, id = t | 0x36–0x39 |
| headers | non-empty; continue the tip; bits = expected difficulty; PoW; MMR proof; new client id, tip, heights, target_adjust_info correct | 0x3a / 0x69–0x7d |

### 3. `m → m` Reorg (m > 2)

**Input** · Info cell

```
SpvInfo { tip_client_id: t }
```

**Input** · Client cells × (m−1)

```
SpvClient { id ∈ {t, prev(t), …} }
```

**Output** · Info cell

```
SpvInfo { tip_client_id: {{oldest rolled-back id}} }
```

**Output** · Client cells × (m−1)

```
SpvClient { identical except id }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| inputs | one info + ≥ 2 clients whose ids are a consecutive run back from tip | 0x41–0x47 |
| outputs | same id set; all clients identical; info points at the oldest | 0x48–0x4d / 0x35 |
| chain work | new partial_chain_work > old tip | 0x40 |
| cell_deps / headers | cell_dep is the fork-point client; headers follow the update rules | 0x4e–0x51 / 0x69–0x7d |

## Notes

- Version: the sha256 of the on-chain mainnet code cell data (0x1dc9a535…:0, type-id upgradable, never upgraded so far) is 481b173c…, equal to the ckb-bitcoin-spv-type-lock line in checksums.txt at tag btc-mainnet-v0.1.0 (= origin/production = f3e3ba8).
- Code hash source: btc_lc_type_hash in the RGB++ lock config cell (0x04c5c3e6…:1) is 0x00a2…c6f7, the type of cell_dep 0xd6b2fcb7…:1, whose code_hash is this script.
- Testnet not included: the BTC testnet3 instance 0xc8a3…6d28 currently runs a binary (sha256 043f7318…) not listed in any tag's checksums.txt; the signet instance 0x73d9…e25e is tag v0.2.0 (destroy enabled, flags redefined), whose rules differ from this page.
- This version comments out the destroy branch in entry.rs, so (n, 0) falls to UnknownOperation 0x10.
- The decoder computes each header sha256d and checks internal continuity, PoW and the new tip; everything tied to the tip client in cell_deps (continuation, expected difficulty, MMR, heights, target_adjust_info) cannot be checked.
- Error codes (error.rs): 0x01–0x05 syscall · 0x10 UnknownOperation · 0x20–0x28 create · 0x2f DestroyNotEnoughCells · 0x30–0x3a update · 0x40–0x51 reorg · 0x60 + BootstrapError / UpdateError (0x69 EmptyHeaders · 0x6a UncontinuousHeaders · 0x6b Difficulty · 0x6c Pow · 0x71 Mmr · 0x72 HeadersMmrProof · 0x79 ClientId · 0x7a ClientTipBlockHash · 0x7b/0x7c heights · 0x7d ClientTargetAdjustInfo)
- 2026-11-19 upstream review (not an on-chain upgrade claim): Mainnet production and btc-mainnet-v0.1.0 still point to f3e3ba8. Master adds destroy, testnet reset, operation-dispatch and verifier changes and has a different checksum; these must not be applied to the existing mainnet deployment.

## Example transactions

- mainnet · SPV instance create (12 clients) · [0x17a57444917e01f763af7cf3b71eac7f44692e94d9555e0d048e27dcf08f76a7](https://explorer.nervos.org/transaction/0x17a57444917e01f763af7cf3b71eac7f44692e94d9555e0d048e27dcf08f76a7) · `node decode-tx.js 0x17a57444917e01f763af7cf3b71eac7f44692e94d9555e0d048e27dcf08f76a7`
- mainnet · SPV update · [0x2bb723f671299448501ee41aa9636e6b759922078b769569b9417c8d795b5ed6](https://explorer.nervos.org/transaction/0x2bb723f671299448501ee41aa9636e6b759922078b769569b9417c8d795b5ed6) · `node decode-tx.js 0x2bb723f671299448501ee41aa9636e6b759922078b769569b9417c8d795b5ed6`
- mainnet · SPV reorg · [0x9ad172a6b0fa31322ce90f38fc2869c000d18a6ec7fdc1aee75e6f5df223e6f0](https://explorer.nervos.org/transaction/0x9ad172a6b0fa31322ce90f38fc2869c000d18a6ec7fdc1aee75e6f5df223e6f0) · `node decode-tx.js 0x9ad172a6b0fa31322ce90f38fc2869c000d18a6ec7fdc1aee75e6f5df223e6f0`

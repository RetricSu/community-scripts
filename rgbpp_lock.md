# RGB++ lock Constraints

> Source: utxostack/rgbpp / contracts/rgbpp-lock/src/main.rs + crates/core　·　mainnet 0xbc6c…6936 / testnet3 0x61ca…3248 / signet 0xd075…0364, hash_type type (rgbpp-sdk)

- id: `rgbpp_lock` · lock script · networks: mainnet, testnet · tags: btc, open-source, community, p-rgbpp
- links: page https://retricsu.github.io/community-scripts/rgbpp_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [utxostack/rgbpp@4abd216d](https://github.com/utxostack/rgbpp/tree/4abd216dbd5d25b8f59e843de39643f9b7513f9d) · [contracts/rgbpp-lock/src/main.rs](https://github.com/utxostack/rgbpp/blob/4abd216dbd5d25b8f59e843de39643f9b7513f9d/contracts/rgbpp-lock/src/main.rs) · [crates/core](https://github.com/utxostack/rgbpp/blob/4abd216dbd5d25b8f59e843de39643f9b7513f9d/crates/core) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — rgbpp-sdk packages/ckb/src/constants

- code_hash: `0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936` · hash_type: `type`
- deployed in tx [`0xcb4d9f9726e66306bfda6359d39d3bea8b4e5345d0f95f26a3e51626ebe82a63`](https://explorer.nervos.org/transaction/0xcb4d9f9726e66306bfda6359d39d3bea8b4e5345d0f95f26a3e51626ebe82a63) (block 17659453) · data_hash `0x1c629e18b5b072b44c8befe045ce78ea662bac8dafe614e89629e6b688601324` · type_id args `0x68ad3d9e0bb9ea841a5d1fcd600137bd3f45401e759e353121f26cd0d981452f`

```json
{
  "script": { "code_hash": "0xbc6c568a1a0d0a09f6844dc9d74ddb4343c32143ff25f727c59edf4fb72d6936", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xcb4d9f9726e66306bfda6359d39d3bea8b4e5345d0f95f26a3e51626ebe82a63", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — rgbpp-sdk (BTC testnet3)

- code_hash: `0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248` · hash_type: `type`
- deployed in tx [`0x0d1567da0979f78b297d5311442669fbd1bd853c8be324c5ab6da41e7a1ed6e5`](https://testnet.explorer.nervos.org/transaction/0x0d1567da0979f78b297d5311442669fbd1bd853c8be324c5ab6da41e7a1ed6e5) (block 18311920) · data_hash `0x7e458568bc12ba00bfb10ec1805a485ee1c14b16f4a6930ce1498e2e36e6374a` · type_id args `0xa3bc8441df149def76cfe15fec7b1e51d949548bc27fb7a75e9d4b3ef1c12c7f`

```json
{
  "script": { "code_hash": "0x61ca7a4796a4eb19ca4f0d065cb9b10ddcf002f10f7cbb810c706cb6bb5c3248", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0d1567da0979f78b297d5311442669fbd1bd853c8be324c5ab6da41e7a1ed6e5", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — rgbpp-sdk (BTC signet)

- code_hash: `0xd07598deec7ce7b5665310386b4abd06a6d48843e953c5cc2112ad0d5a220364` · hash_type: `type`
- deployed in tx [`0x61efdeddbaa0bb4132c0eb174b3e8002ff5ec430f61ba46f30768d683c516eec`](https://testnet.explorer.nervos.org/transaction/0x61efdeddbaa0bb4132c0eb174b3e8002ff5ec430f61ba46f30768d683c516eec) (block 13560148) · data_hash `0x7e458568bc12ba00bfb10ec1805a485ee1c14b16f4a6930ce1498e2e36e6374a` · type_id args `0xb69fe766ce3b7014a2a78ad1fe688d82f1679325805371d2856c3b8d18ebfa5a`

```json
{
  "script": { "code_hash": "0xd07598deec7ce7b5665310386b4abd06a6d48843e953c5cc2112ad0d5a220364", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x61efdeddbaa0bb4132c0eb174b3e8002ff5ec430f61ba46f30768d683c516eec", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `N → M` Isomorphic transfer (BTC tx drives the CKB tx)

**Input** · RGB++ cell (bound to a BTC UTXO)

```
Cell{
  lock: { codeHash: RGBPP_LOCK,
          args: {{out_index u32}} ‖ {{btc_txid 32B}} },
  type: xUDT / Spore …
}
```

**Input** · witness[group 0].lock

```
RGBPPUnlock{
  version: {{0}},
  extra_data: { input_len, output_len },
  btc_tx: {{raw BTC tx}},
  btc_tx_proof: {{SPV proof}}
}
// or a 4-byte u32 index of another witness
```

**Input** · cell_deps

```
RGB++ config cell (BTC light client type hash, BTC time lock type hash) + light client cell
```

**Output** · new RGB++ cell (re-sealed to an output of this BTC tx)

```
Cell{
  lock: RGBPP_LOCK( {{i < btc_tx.outputs}} ‖ {{btc_tx.txid}} ),
  type: same asset
}
```

**Output** · or a BTC time lock (leap to CKB)

```
Cell{ lock: BTC_TIME_LOCK{ lock_script, after ≥ 6, btc_txid = btc_tx.txid } }
```

byte layout: args: RGBPPLock (struct 36B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | out_index | 4B | BTC output index u32 LE | BTC tx spends (txid, index) | 0x44 (68) |
| 1 | btc_txid | 32B | BTC txid (internal byte order; reverse for explorers) | — | 0x31 (49) |

byte layout: commitment inside the BTC tx

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | OP_RETURN | 1B | 0x6a | first OP_RETURN output | 0x33 (51) |
| 1 | PUSH32 | 1B | 0x20 | script exactly 34 bytes | 0x33 (51) |
| 2 | commitment | 32B | sha256d("RGB++" ‖ version u16 ‖ input_len ‖ output_len ‖ first input_len OutPoints ‖ first output_len (CellOutput with RGB++/BTC-time-lock btc_txid zeroed ‖ data_len u32 ‖ data)) | matches the CKB tx | 0x42 (66) |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | 36-byte RGBPPLock | 0x31 |
| witness | present and a valid RGBPPUnlock | 0x02 / 0x34 |
| btc_tx | parsable (non-segwit serialization, no trailing bytes) | 0x30 |
| UTXO seal | a BTC tx input = (args.btc_txid, args.out_index) | 0x44 |
| SPV | btc_tx is proven in the BTC light client | 0x20–0x23 |
| commitment | version = 0; input_len, output_len > 0 | 0x43 / 0x33 |
| commitment | uncommitted inputs / outputs carry no type | 0x42 |
| commitment | recomputed value = the 32 bytes in OP_RETURN | 0x42 |
| outputs | each typed output: RGB++ lock with btc_txid = this BTC tx and out_index < output count, or BTC time lock with btc_txid = this tx and after ≥ 6 | 0x41 |
| config | RGB++ config cell is in cell_deps | 0x10 / 0x11 |

## Notes

- Error codes (crates/core/src/error.rs, i8): 0x01–0x05 ckb-std · 0x10 ConfigNotFound · 0x11 ConfigMalformed · 0x20 SpvClientNotFound · 0x21 SpvClientMalformed · 0x22 SpvProofIncorrect · 0x23 SpvProofMalformed · 0x30 BadBtcTx · 0x31 BadRGBPPLock · 0x32 BadBTCTimeLock · 0x33 BadBtcCommitment · 0x34 BadRGBPPUnlock · 0x35 BadBTCTimeUnlock · 0x40 OutputCellMismatch · 0x41 OutputCellWithUnknownLock · 0x42 CommitmentMismatch · 0x43 UnknownCommitmentVersion · 0x44 UtxoSealMismatch
- The decoder parses btc_tx, computes its txid and recomputes the commitment from the CKB tx to compare with OP_RETURN; the SPV proof is not checked

## Example transactions

- mainnet · RGB++ transfer · [0x9644bf0be3111cdc4083630c4ce9470aebebf8723de06bf5dbd3c3b45bcb51b5](https://explorer.nervos.org/transaction/0x9644bf0be3111cdc4083630c4ce9470aebebf8723de06bf5dbd3c3b45bcb51b5) · `node decode-tx.js 0x9644bf0be3111cdc4083630c4ce9470aebebf8723de06bf5dbd3c3b45bcb51b5`
- mainnet · RGB++ (unlock via witness index) · [0x6a34933b86fb76d17b5b6498812155a41fa5b3d0c009e3b6badcdad3e51299ef](https://explorer.nervos.org/transaction/0x6a34933b86fb76d17b5b6498812155a41fa5b3d0c009e3b6badcdad3e51299ef) · `node decode-tx.js 0x6a34933b86fb76d17b5b6498812155a41fa5b3d0c009e3b6badcdad3e51299ef`

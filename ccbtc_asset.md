# ccBTC Asset (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x092c…5ae3 (type)

- id: `ccbtc_asset` · type script · networks: mainnet · tags: token, btc, no-source, community
- links: page https://retricsu.github.io/community-scripts/ccbtc_asset.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — UTXOSwap docs (utxoswap.gitbook.io/zh, pools API example: BTC xudt typeHash 0x3cd44aec…fa57 → codeHash 0x092c…5ae3); confirmed on chain

- code_hash: `0x092c2c4a26ea475a8e860c29cf00502103add677705e2ccd8d6fe5af3caa5ae3` · hash_type: `type`
- deployed in tx [`0x3ceb520f240b168e0bddf0d89b4bcabbe7d4fa69751057cbe8e4f27239fad0e9`](https://explorer.nervos.org/transaction/0x3ceb520f240b168e0bddf0d89b4bcabbe7d4fa69751057cbe8e4f27239fad0e9) (block 13135963) · data_hash `0xa99494ada9bc23cdc018141222640d0e698f29ce3684054e85bf8add7cc9ae2c` · type_id args `0x74f8fd146cca83d5fa2acd8a2b0bc7f0408a38b79a173c1e8ca1fbdfc95122ff`

```json
{
  "script": { "code_hash": "0x092c2c4a26ea475a8e860c29cf00502103add677705e2ccd8d6fe5af3caa5ae3", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3ceb520f240b168e0bddf0d89b4bcabbe7d4fa69751057cbe8e4f27239fad0e9", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · cell carrying this type

```
Cell{
  type: { codeHash: {{0x092c…5ae3}},
          hashType: type,
          args: 0x68e64ba4…0a4ac8 (ccBTC) }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- code_hash taken from the BTC (ccBTC, type hash 0x3cd44aec…fa57, args 0x68e64ba4…4ac8) type script in the official UTXOSwap docs example, confirmed on chain. ccBTC is issued by Cross-Chain Tokens and custodied by Cactus Custody (official press release).
- Its binary data hash (0xa994…ae2c) differs from xUDT (0x50bd…1b95), so xUDT rules cannot be assumed.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · ccBTC (match only) · [0xf73c44f22fe5e468efb6fe58e28bd1fdd4992dad96f49f7c7860b16f9b4e41e2](https://explorer.nervos.org/transaction/0xf73c44f22fe5e468efb6fe58e28bd1fdd4992dad96f49f7c7860b16f9b4e41e2) · `node decode-tx.js 0xf73c44f22fe5e468efb6fe58e28bd1fdd4992dad96f49f7c7860b16f9b4e41e2`

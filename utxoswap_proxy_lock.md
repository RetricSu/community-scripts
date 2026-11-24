# UTXOSwap pool proxy lock (sequencer proxy lock) (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x7ef6…56f7 (type) · testnet 0x30e2…b593 (type)

- id: `utxoswap_proxy_lock` · lock script · networks: mainnet, testnet · tags: defi, no-source, community
- links: page https://retricsu.github.io/community-scripts/utxoswap_proxy_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — on chain: lock of the Pool Cell whose type = pool_type_code_hash 0xc70a8b00…3c98 (UTXOSwap docs, mainnet)

- code_hash: `0x7ef6e226ca9a3514ac76759f0b1550e70c9aa10aff89111fedf2c9d800d256f7` · hash_type: `type`
- deployed in tx [`0x7dfd96165a48fc0f346ad207491e8309f22c76f73f9b0940253471119706b5cb`](https://explorer.nervos.org/transaction/0x7dfd96165a48fc0f346ad207491e8309f22c76f73f9b0940253471119706b5cb) (block 13363528) · data_hash `0x55a9b0386434198d0929c2688c67fd9fa9b4265a5c7c5bd82f0919a1a184c4a6` · type_id args `0x264fd0e34d701449ab87a33639851c317e74e4012da68774a7190611f7695cc1`

```json
{
  "script": { "code_hash": "0x7ef6e226ca9a3514ac76759f0b1550e70c9aa10aff89111fedf2c9d800d256f7", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7dfd96165a48fc0f346ad207491e8309f22c76f73f9b0940253471119706b5cb", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — on chain: lock of the Pool Cell whose type = pool_type_code_hash 0x5b9228b1…8735 (UTXOSwap docs, testnet)

- code_hash: `0x30e2c8a0cc9c27b2b2125ecf3aabe74acd692fe2b6635bcee02dab6973fbb593` · hash_type: `type`
- deployed in tx [`0x452de675cff343e46d6fc7da00255008ef0169eb34deab05dc11661ebe785a5a`](https://testnet.explorer.nervos.org/transaction/0x452de675cff343e46d6fc7da00255008ef0169eb34deab05dc11661ebe785a5a) (block 13407066) · data_hash `0xf2a7278aaa3d9a5aed269a1c0907f5e0afc8ef498de256e709984d3df4e84a5b` · type_id args `0x8acf86d3ba48aed39abe2383d20ecb38a2fb80e75eedf01193c01bac2b69740c`

```json
{
  "script": { "code_hash": "0x30e2c8a0cc9c27b2b2125ecf3aabe74acd692fe2b6635bcee02dab6973fbb593", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x452de675cff343e46d6fc7da00255008ef0169eb34deab05dc11661ebe785a5a", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0x7ef6…56f7}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- The official UTXOSwap docs (LP Token section) describe the tx layout: the Pool Cell lock is the "sequencer proxy lock" and its type is pool_type (mainnet 0xc70a8b00…3c98, testnet 0x5b9228b1…8735). This code_hash is the lock the on-chain Pool Cell actually uses; the role is inferred from that layout and unconfirmed with the maintainer.
- The "pool controlled lock" of pool asset cells in the same txs (mainnet 0x393df335…9a88, testnet 0x75ac9069…260e) is not in the list and was not added.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · UTXOSwap pool tx (match only) · [0x8caa3d638a22276c00e6282a11f85e1774951b816f2361cf98f7513eb6cc0cd4](https://explorer.nervos.org/transaction/0x8caa3d638a22276c00e6282a11f85e1774951b816f2361cf98f7513eb6cc0cd4) · `node decode-tx.js 0x8caa3d638a22276c00e6282a11f85e1774951b816f2361cf98f7513eb6cc0cd4`
- testnet · UTXOSwap pool tx testnet (match only) · [0x7402a9f8e745733d49bed171053036feac6d97a4a5cbd0764d67b25dde127988](https://testnet.explorer.nervos.org/transaction/0x7402a9f8e745733d49bed171053036feac6d97a4a5cbd0764d67b25dde127988) · `node decode-tx.js 0x7402a9f8e745733d49bed171053036feac6d97a4a5cbd0764d67b25dde127988 --testnet`

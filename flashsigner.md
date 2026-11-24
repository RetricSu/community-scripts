# FlashSigner lock (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0x081d…e128 (type) · testnet 0x577a…b242 (type)

- id: `flashsigner` · lock script · networks: mainnet, testnet · tags: identity, no-source, community
- links: page https://retricsu.github.io/community-scripts/flashsigner.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2 (tag flashsigner)

- code_hash: `0x081dbffa88dab54ba426d231ca64eb760cea2fe9e16761a1da400da1b2cbe128` · hash_type: `type`
- deployed in tx [`0xc418a6f5c202911086bc92d46553e535fb72eaef32323a4e2cc46d701f7ebafb`](https://explorer.nervos.org/transaction/0xc418a6f5c202911086bc92d46553e535fb72eaef32323a4e2cc46d701f7ebafb) (block 6230328) · data_hash `0x0d5da9effc2aa91aa2d813fef14c746ce263e0cb70cf8f4d064569ab047a5768` · type_id args `0x5377d5489bc4329c273a2f2bfbdcf709e3340da5438838a66096191fee56600a`

```json
{
  "script": { "code_hash": "0x081dbffa88dab54ba426d231ca64eb760cea2fe9e16761a1da400da1b2cbe128", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0f0c22372a05f3c5f47acb066c65f9bae86bdce043762310e50309cc5a77abd4", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2 (tag flashsigner)

- code_hash: `0x577a5e5930e2ecdd6200765f3442e6119dc99e87df474f22f13cab819c80b242` · hash_type: `type`
- deployed in tx [`0x791547a3fc0bb119bb2635b46b9ec90e52c89c90d982b06e17780954c521c423`](https://testnet.explorer.nervos.org/transaction/0x791547a3fc0bb119bb2635b46b9ec90e52c89c90d982b06e17780954c521c423) (block 3590991) · data_hash `0xe822b7e218bcb85efa3f47c540236f16ac8afda82187fd28b30d05f503812da5` · type_id args `0xfa23c4831d0d6fe08bd920301fc8d59b7b35b665875f583e9573ec86546f43a1`

```json
{
  "script": { "code_hash": "0x577a5e5930e2ecdd6200765f3442e6119dc99e87df474f22f13cab819c80b242", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb66776ff3244033fcd15312ae8b17d384c11bebbb923fce3bd896d89f4744d48", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0x081d…e128}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- The official CKB Explorer script registry names this code_hash "FlashSigner" (lock, dep_type = dep_group); the registry gives no website, source or description.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · FlashSigner (match only) · [0xb55ba9d219dcba515852a5ae0af578a89ccf40d43efa301e5c0be9dc04792f08](https://explorer.nervos.org/transaction/0xb55ba9d219dcba515852a5ae0af578a89ccf40d43efa301e5c0be9dc04792f08) · `node decode-tx.js 0xb55ba9d219dcba515852a5ae0af578a89ccf40d43efa301e5c0be9dc04792f08`
- testnet · FlashSigner testnet (match only) · [0xb5cad5b5942e9bde2e2e4201ac11e484ae57321d3638dc8511b21f77c9c01256](https://testnet.explorer.nervos.org/transaction/0xb5cad5b5942e9bde2e2e4201ac11e484ae57321d3638dc8511b21f77c9c01256) · `node decode-tx.js 0xb5cad5b5942e9bde2e2e4201ac11e484ae57321d3638dc8511b21f77c9c01256 --testnet`

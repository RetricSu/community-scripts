# M-NFT Issuer Constraints

> Source: nervina-labs/ckb-nft-scripts @b5af002 contracts/issuer-type/src/entry.rs　·　mainnet 0x24b0…8b81 / testnet 0xb598…11ed (type)

- id: `mnft_issuer` · type script · networks: mainnet, testnet · tags: nft, open-source, community
- links: page https://retricsu.github.io/community-scripts/mnft_issuer.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervina-labs/ckb-nft-scripts@b5af002e](https://github.com/nervina-labs/ckb-nft-scripts/tree/b5af002e78eb2ff375ce098cde24d77ff414822c) · [contracts/issuer-type/src/entry.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/issuer-type/src/entry.rs) · [contracts/script-utils/src/issuer.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/issuer.rs) · [contracts/script-utils/src/helper.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/helper.rs) · [contracts/script-utils/src/error.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/error.rs) (deployment commit named on the wiki page Lina-Mainnet-deployment; the Aggron testnet deployment commit d0a844def34df6b05b7b8e260a6225a477f1bf39 differs only in helper.rs CLASS_TYPE_CODE_HASH)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@duanyytop](https://github.com/duanyytop)

## Deployments

### mainnet — ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:0)

- code_hash: `0x24b04faf80ded836efc05247778eec4ec02548dab6e2012c0107374aa3f68b81` · hash_type: `type`
- deployed in tx [`0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471`](https://explorer.nervos.org/transaction/0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471) (block 5913754) · data_hash `0xb274adecfb9c1cc07838359fabff1956bbe202239e77961b84aa617758ec7337` · type_id args `0x84b6677980f1e1bf52ded57f368ed5996df3542909a48dd8c24af69f1d75fa28`

```json
{
  "script": { "code_hash": "0x24b04faf80ded836efc05247778eec4ec02548dab6e2012c0107374aa3f68b81", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:0)

- code_hash: `0xb59879b6ea6fff985223117fa499ce84f8cfb028c4ffdfdf5d3ec19e905a11ed` · hash_type: `type`
- deployed in tx [`0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c`](https://testnet.explorer.nervos.org/transaction/0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c) (block 3463076) · data_hash `0x3af02bb0be50befa6bb0496442804c5418a1b0a10f415764b613b8c43ef87bbc` · type_id args `0x309df49e0280c9369069b3cbdb995c26eae9924e6d2acb0cd81e0c314c565747`

```json
{
  "script": { "code_hash": "0xb59879b6ea6fff985223117fa499ce84f8cfb028c4ffdfdf5d3ec19e905a11ed", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create issuer

**Input** · inputs[0]: any

```
CellInput{ since, previous_output }
```

**Output** · Issuer cell

```
Cell{
  type: { codeHash: {{ISSUER_TYPE}}, hashType: type, args: {{issuer_id 20B}} },
  data: version 0 ‖ class_count {{0}} ‖ set_count {{0}} ‖ info
}
```

byte layout: data byte layout (big-endian)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | version | = 0 | 11 |
| 1 | class_count | 4B BE | classes created | 0 on create; never decreases | 8 |
| 2 | set_count | 4B BE | set count | 0 on create; never decreases | 9 |
| 3 | info | u16 BE ‖ bytes | issuer info | length fits | 5 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 20 bytes, = blake2b(first CellInput ‖ first output index with this type)[0..20] | 7 |
| count | issuer cells with this type: 0→1 / 1→1 / 1→0 | 6 |
| data | ≥ 11 bytes, version = 0, class_count = set_count = 0 | 5 / 11 / 8 / 9 |

### 2. `1 → 1` Update issuer

**Input** · Issuer cell

```
Cell{ type: ISSUER, data: { class_count: a, set_count: s } }
```

**Output** · Issuer cell

```
Cell{ type: ISSUER, data: { class_count: {{≥ a}}, set_count: {{≥ s}} } }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | see notes: the matching WitnessArgs.lock is present | 40 |
| class_count / set_count | neither decreases | 8 / 9 |

### 3. `1 → 0` Destroy issuer

**Input** · Issuer cell

```
Cell{ type: ISSUER, data: { class_count: {{0}}, set_count: {{0}} } }
```

**Output** · none

```
—
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | the matching WitnessArgs.lock is present | 40 |
| data | class_count = set_count = 0 | 10 |

## Notes

- Version: the wiki Lina-Mainnet-deployment page names deployment commit b5af002 and Aggron-Testnet-deployment names d0a844d; the contract code differs only in helper.rs CLASS_TYPE_CODE_HASH (mainnet 0xd51e…3d9a / testnet 0x095b…e3fc). Later commits only restructure directories and bump capsule. No reproducible build was attempted.
- Rule 40 (helper.rs): take the first input with this type, take its lock, find the first input with that lock; the WitnessArgs.lock at that index must be present (a missing or unparsable witness counts as absent). It blocks signature-less locks such as ACP from updating / destroying.
- Only the first group input / output data is read.
- Error codes (script-utils/src/error.rs, wiki Error-Codes): 1–4 syscall · 5 IssuerDataInvalid · 6 IssuerCellsCountError · 7 TypeArgsInvalid · 8 IssuerClassCountError · 9 IssuerSetCountError · 10 IssuerCellCannotDestroyed · 11 VersionInvalid · 12 ClassDataInvalid · 13 ClassTotalSmallerThanIssued · 14 ClassCellsCountError · 15 ClassIssuedInvalid · 16 ClassImmutableFieldsNotSame · 17 ClassCellCannotDestroyed · 18 ClassIdIncreaseError · 19 NFTDataInvalid · 20 NFTCellsCountError · 21 NFTTokenIdIncreaseError · 22–39 NFT state rules · 40 GroupInputWitnessNoneError
- 2026-11-19 upstream review (not an on-chain upgrade claim): Official wiki still pins Lina=b5af002 and Aggron=d0a844d. HEAD differs by formatting/import cleanup and switching helper CLASS_TYPE_CODE_HASH from Lina to Aggron. Do not replace the mainnet constant with Aggron; retain network-specific class hashes, layouts, transitions and errors.

## Example transactions

- mainnet · issuer create · [0x9ef7f4c50d53d0317082ea532d606af448d7af031efcfe5c90affd360c737176](https://explorer.nervos.org/transaction/0x9ef7f4c50d53d0317082ea532d606af448d7af031efcfe5c90affd360c737176) · `node decode-tx.js 0x9ef7f4c50d53d0317082ea532d606af448d7af031efcfe5c90affd360c737176`
- mainnet · issuer update + class create · [0x6df315f0a32e8956275ff6282088b8e1a373a8859b938d66a128c047e3bcd64a](https://explorer.nervos.org/transaction/0x6df315f0a32e8956275ff6282088b8e1a373a8859b938d66a128c047e3bcd64a) · `node decode-tx.js 0x6df315f0a32e8956275ff6282088b8e1a373a8859b938d66a128c047e3bcd64a`
- testnet · issuer create (testnet) · [0x02e18bf24b1757fd5172ab6d20744a6ef886b15b4643dd2bb210498d15071963](https://testnet.explorer.nervos.org/transaction/0x02e18bf24b1757fd5172ab6d20744a6ef886b15b4643dd2bb210498d15071963) · `node decode-tx.js 0x02e18bf24b1757fd5172ab6d20744a6ef886b15b4643dd2bb210498d15071963 --testnet`

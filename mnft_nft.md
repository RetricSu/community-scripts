# M-NFT NFT Constraints

> Source: nervina-labs/ckb-nft-scripts @b5af002 contracts/nft-type/src/{entry,validator}.rs　·　mainnet 0x2b24…aec9 / testnet 0xb183…959f (type)

- id: `mnft_nft` · type script · networks: mainnet, testnet · tags: nft, open-source, community
- links: page https://retricsu.github.io/community-scripts/mnft_nft.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervina-labs/ckb-nft-scripts@b5af002e](https://github.com/nervina-labs/ckb-nft-scripts/tree/b5af002e78eb2ff375ce098cde24d77ff414822c) · [contracts/nft-type/src/entry.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/nft-type/src/entry.rs) · [contracts/nft-type/src/validator.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/nft-type/src/validator.rs) · [contracts/script-utils/src/nft.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/nft.rs) · [contracts/script-utils/src/class.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/class.rs) · [contracts/script-utils/src/helper.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/helper.rs) · [contracts/script-utils/src/error.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/error.rs) (deployment commit named on the wiki page Lina-Mainnet-deployment; the Aggron testnet deployment commit d0a844def34df6b05b7b8e260a6225a477f1bf39 differs only in helper.rs CLASS_TYPE_CODE_HASH)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@duanyytop](https://github.com/duanyytop)

## Deployments

### mainnet — ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:2)

- code_hash: `0x2b24f0d644ccbdd77bbf86b27c8cca02efa0ad051e447c212636d9ee7acaaec9` · hash_type: `type`
- deployed in tx [`0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471`](https://explorer.nervos.org/transaction/0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471) (block 5913754) · data_hash `0xf677aac8b653741126c760f1c76a24bd9f49e01949cb68f67f998cf62ac350df` · type_id args `0xfdf9ff0efa7bf770ad865ebecd911b4f2cd3f37e8002329b8e45e3d901a85a3b`

```json
{
  "script": { "code_hash": "0x2b24f0d644ccbdd77bbf86b27c8cca02efa0ad051e447c212636d9ee7acaaec9", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471", "index": "0x2" }, "dep_type": "code" }
}
```

### testnet — ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:2)

- code_hash: `0xb1837b5ad01a88558731953062d1f5cb547adf89ece01e8934a9f0aeed2d959f` · hash_type: `type`
- deployed in tx [`0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c`](https://testnet.explorer.nervos.org/transaction/0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c) (block 3463076) · data_hash `0xcf4b06e9c835577803152da1974ee7e413a4b29518ea4bddec10a585b8f4cab3` · type_id args `0xc5f646d2c14950c30750d48e3f5995acaa4f44e48263e8719186541647ef5537`

```json
{
  "script": { "code_hash": "0xb1837b5ad01a88558731953062d1f5cb547adf89ece01e8934a9f0aeed2d959f", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c", "index": "0x2" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → n` Mint (class 1 → 1)

**Input** · Class cell

```
Cell{ type: CLASS { args: class_args 24B }, data: { issued: a, configure: c } }
```

**Output** · Class cell

```
Cell{ type: CLASS, data: { issued: {{b > a}} } }
```

**Output** · NFT cell × (b − a)

```
Cell{
  type: { codeHash: {{NFT_TYPE}}, hashType: type,
          args: {{class_args 24B}} ‖ {{token_id u32 BE}} },
  data: version 0 ‖ characteristic 8B ‖ configure {{= c}} ‖ state ‖ [extinfo]
}
```

byte layout: data byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | version | = 0 | 11 |
| 1 | characteristic | 8B | characteristic | changeable only if configure bit3 = 0 and not locked | 23 / 39 |
| 2 | configure | 1B | permission bits (1 = forbidden): bit0 claim · bit1 lock · bit2 ext_info · bit3 characteristic · bit4 transfer before claim · bit5 transfer after claim · bit6 destroy before claim · bit7 destroy after claim | = class configure; immutable | 22 / 24 |
| 3 | state | 1B | bit0 claimed · bit1 locked | one-way only (unless approved) | 25 / 26 |
| 4 | extinfo | … | extension info | append-only | 31 / 32 / 37 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 28 bytes | 7 |
| class | exactly 1 input with this class type; its issued increases | 14 / 15 |
| token ids | NFT outputs of this class = the increase, token ids [a..b) in order | 20 / 21 |
| configure | NFT configure = input class configure | 22 |

### 2. `n → n` Update / transfer / claim / lock

**Input** · NFT cell

```
Cell{ lock: A, type: NFT, data: { characteristic, configure, state, extinfo } }
```

**Output** · NFT cell

```
Cell{ lock: {{B}}, type: NFT, data: { … } }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | the matching WitnessArgs.lock is present | 40 |
| characteristic / configure | characteristic change needs permission and no lock; configure unchanged | 23 / 39 / 24 |
| state | without approval: claim needs unlocked + allowed; no un-claim; lock needs permission; no unlock | 35 / 27 / 25 / 28 / 26 |
| lock | lock change = transfer: must be unlocked and allowed by configure for the claim state | 36 / 29 / 30 |
| extinfo | if allowed: append-only and unlocked; otherwise length unchanged | 31 / 32 / 37 |

### 3. `n → 0` Destroy

**Input** · NFT cell

```
Cell{ type: NFT, data: { state } }
```

**Output** · no NFT of this class

```
—
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | the matching WitnessArgs.lock is present | 40 |
| state | without approval: unlocked and allowed by configure for the claim state | 38 / 33 / 34 |

## Notes

- Version: the wiki Lina-Mainnet-deployment page names deployment commit b5af002 and Aggron-Testnet-deployment names d0a844d; the contract code differs only in helper.rs CLASS_TYPE_CODE_HASH (mainnet 0xd51e…3d9a / testnet 0x095b…e3fc). Later commits only restructure directories and bump capsule. No reproducible build was attempted.
- "Approval" (helper.rs): cell_deps[0] lock = inputs[0] lock, and cell_deps[0] type hash[0..20] = issuer id or its type = this class. With approval the claim / lock rules and the destroy rules are skipped. The decoder does not load cell_deps, so those rules show as "not checked" when unmet.
- As written: when configure forbids ext_info, only the data length is compared, so a same-length content change passes.
- The NFT script embeds the class type code hash (a build constant), so the mainnet and testnet binaries differ. The action counts all NFTs of the same class.
- Rule 40 (helper.rs): take the first input with this type, take its lock, find the first input with that lock; the WitnessArgs.lock at that index must be present (a missing or unparsable witness counts as absent). It blocks signature-less locks such as ACP from updating / destroying.
- Error codes (script-utils/src/error.rs, wiki Error-Codes): 1–4 syscall · 5 IssuerDataInvalid · 6 IssuerCellsCountError · 7 TypeArgsInvalid · 8 IssuerClassCountError · 9 IssuerSetCountError · 10 IssuerCellCannotDestroyed · 11 VersionInvalid · 12 ClassDataInvalid · 13 ClassTotalSmallerThanIssued · 14 ClassCellsCountError · 15 ClassIssuedInvalid · 16 ClassImmutableFieldsNotSame · 17 ClassCellCannotDestroyed · 18 ClassIdIncreaseError · 19 NFTDataInvalid · 20 NFTCellsCountError · 21 NFTTokenIdIncreaseError · 22–39 NFT state rules · 40 GroupInputWitnessNoneError
- 2026-11-19 upstream review (not an on-chain upgrade claim): Official wiki still pins Lina=b5af002 and Aggron=d0a844d. HEAD differs by formatting/import cleanup and switching helper CLASS_TYPE_CODE_HASH from Lina to Aggron. Do not replace the mainnet constant with Aggron; retain network-specific class hashes, layouts, transitions and errors.

## Example transactions

- mainnet · mint (class update) · [0x93de3f4cf5dfc29b2b28cd824fbb758f0947bade4b0a644653e2757ec55f9af2](https://explorer.nervos.org/transaction/0x93de3f4cf5dfc29b2b28cd824fbb758f0947bade4b0a644653e2757ec55f9af2) · `node decode-tx.js 0x93de3f4cf5dfc29b2b28cd824fbb758f0947bade4b0a644653e2757ec55f9af2`
- mainnet · transfer · [0xdffc1ca8ca2a3ccb5cecc07a9ec502bdeef26ab3eb654829e33fef6a5e6ceeba](https://explorer.nervos.org/transaction/0xdffc1ca8ca2a3ccb5cecc07a9ec502bdeef26ab3eb654829e33fef6a5e6ceeba) · `node decode-tx.js 0xdffc1ca8ca2a3ccb5cecc07a9ec502bdeef26ab3eb654829e33fef6a5e6ceeba`
- mainnet · batch transfer · [0x952ffd404bec800ec195122e422a99f5fbb9836f25ad41737538843afb0513e8](https://explorer.nervos.org/transaction/0x952ffd404bec800ec195122e422a99f5fbb9836f25ad41737538843afb0513e8) · `node decode-tx.js 0x952ffd404bec800ec195122e422a99f5fbb9836f25ad41737538843afb0513e8`
- testnet · mint (testnet) · [0x1f895ce8d44dd678bf33207bec17a296f8035b79a61adc1df43516be0c9ad29f](https://testnet.explorer.nervos.org/transaction/0x1f895ce8d44dd678bf33207bec17a296f8035b79a61adc1df43516be0c9ad29f) · `node decode-tx.js 0x1f895ce8d44dd678bf33207bec17a296f8035b79a61adc1df43516be0c9ad29f --testnet`
- testnet · update (testnet) · [0x5dd7aec0211d885fa0472d941213332df280937f0b3a4d96269b3c110fe7ba09](https://testnet.explorer.nervos.org/transaction/0x5dd7aec0211d885fa0472d941213332df280937f0b3a4d96269b3c110fe7ba09) · `node decode-tx.js 0x5dd7aec0211d885fa0472d941213332df280937f0b3a4d96269b3c110fe7ba09 --testnet`

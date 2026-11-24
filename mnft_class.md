# M-NFT Class Constraints

> Source: nervina-labs/ckb-nft-scripts @b5af002 contracts/class-type/src/entry.rs　·　mainnet 0xd51e…3d9a / testnet 0x095b…e3fc (type)

- id: `mnft_class` · type script · networks: mainnet, testnet · tags: nft, open-source, community
- links: page https://retricsu.github.io/community-scripts/mnft_class.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervina-labs/ckb-nft-scripts@b5af002e](https://github.com/nervina-labs/ckb-nft-scripts/tree/b5af002e78eb2ff375ce098cde24d77ff414822c) · [contracts/class-type/src/entry.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/class-type/src/entry.rs) · [contracts/script-utils/src/class.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/class.rs) · [contracts/script-utils/src/issuer.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/issuer.rs) · [contracts/script-utils/src/helper.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/helper.rs) · [contracts/script-utils/src/error.rs](https://github.com/nervina-labs/ckb-nft-scripts/blob/b5af002e78eb2ff375ce098cde24d77ff414822c/contracts/script-utils/src/error.rs) (deployment commit named on the wiki page Lina-Mainnet-deployment; the Aggron testnet deployment commit d0a844def34df6b05b7b8e260a6225a477f1bf39 differs only in helper.rs CLASS_TYPE_CODE_HASH)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@duanyytop](https://github.com/duanyytop)

## Deployments

### mainnet — ckb-nft-scripts wiki Lina-Mainnet-deployment (tx 0x5dce8aca…:1)

- code_hash: `0xd51e6eaf48124c601f41abe173f1da550b4cbca9c6a166781906a287abbb3d9a` · hash_type: `type`
- deployed in tx [`0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471`](https://explorer.nervos.org/transaction/0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471) (block 5913754) · data_hash `0xc9aa394982bf0b7b1f8b19fbbbae42a5437516f8d908c84e87778eb19cd95125` · type_id args `0x9b645aade5a5103a3a2808660193e7b4b274c28fa2594820d2243940727430f9`

```json
{
  "script": { "code_hash": "0xd51e6eaf48124c601f41abe173f1da550b4cbca9c6a166781906a287abbb3d9a", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5dce8acab1750d4790059f22284870216db086cb32ba118ee5e08b97dc21d471", "index": "0x1" }, "dep_type": "code" }
}
```

### testnet — ckb-nft-scripts wiki Aggron-Testnet-deployment (tx 0xf11ccb60…:1)

- code_hash: `0x095b8c0b4e51a45f953acd1fcd1e39489f2675b4bc94e7af27bb38958790e3fc` · hash_type: `type`
- deployed in tx [`0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c`](https://testnet.explorer.nervos.org/transaction/0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c) (block 3463076) · data_hash `0x682a109037de36b54bbc4595c137a0ce644ea9efc2118b3b15e6bf24be12a9d3` · type_id args `0x72236511c07cf52b9aec6a6e5bb955431d46acb91a01f5fc2f5524108da464fd`

```json
{
  "script": { "code_hash": "0x095b8c0b4e51a45f953acd1fcd1e39489f2675b4bc94e7af27bb38958790e3fc", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf11ccb6079c1a4b3d86abe2c574c5db8d2fd3505fdc1d5970b69b31864a4bd1c", "index": "0x1" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → n` Create classes (issuer 1 → 1)

**Input** · Issuer cell

```
Cell{ type: ISSUER (hash[0..20] = issuer_id), data: { class_count: a } }
```

**Output** · Issuer cell

```
Cell{ type: ISSUER, data: { class_count: {{b > a}} } }
```

**Output** · Class cell × (b − a)

```
Cell{
  type: { codeHash: {{CLASS_TYPE}}, hashType: type,
          args: {{issuer_id 20B}} ‖ {{class_id u32 BE}} },
  data: version 0 ‖ total ‖ issued {{0}} ‖ configure ‖ name ‖ description ‖ renderer ‖ [extinfo]
}
```

byte layout: args

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | issuer_id | 20B | issuer type hash[0..20] | exactly 1 such issuer input | 6 |
| 1 | class_id | 4B BE | index | = a, a+1, … (output order) | 18 |

byte layout: data byte layout (big-endian)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | version | 1B | version | = 0 | 11 |
| 1 | total | 4B | cap (0 = unlimited) | immutable; issued ≤ total when > 0 | 13 / 16 |
| 2 | issued | 4B | minted | 0 on create; never decreases | 15 |
| 3 | configure | 1B | NFT permission bits | immutable | 16 |
| 4 | name / description | u16 ‖ bytes | name / description | immutable | 12 / 16 |
| 5 | renderer | u16 ‖ bytes | renderer | mutable | 12 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 24 bytes | 7 |
| issuer | exactly 1 input whose type hash[0..20] = issuer_id; its class_count increases | 6 / 8 |
| class ids | class outputs of this issuer = the increase, ids [a..b) in order | 14 / 18 |
| data | ≥ 16 bytes, version 0, issued = 0 | 12 / 11 / 15 |

### 2. `n → n` Update class (e.g. when minting NFTs)

**Input** · Class cell

```
Cell{ type: CLASS, data: { issued: i, … } }
```

**Output** · Class cell

```
Cell{ type: CLASS, data: { issued: {{≥ i}}, total/configure/name/description same } }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| count | class cells of this issuer: inputs = outputs | 14 |
| witness | the matching WitnessArgs.lock is present | 40 |
| data | issued never decreases; total, configure, name, description unchanged | 15 / 16 |

### 3. `n → 0` Destroy class

**Input** · Class cell

```
Cell{ type: CLASS, data: { issued: {{0}} } }
```

**Output** · no class of this issuer

```
—
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness | the matching WitnessArgs.lock is present | 40 |
| issued | = 0 | 17 |

## Notes

- Version: the wiki Lina-Mainnet-deployment page names deployment commit b5af002 and Aggron-Testnet-deployment names d0a844d; the contract code differs only in helper.rs CLASS_TYPE_CODE_HASH (mainnet 0xd51e…3d9a / testnet 0x095b…e3fc). Later commits only restructure directories and bump capsule. No reproducible build was attempted.
- The action is decided by counting all classes of the same issuer (same code_hash and hash_type, 24-byte args with the same first 20 bytes), not just this class; only this group's first input / output data is validated.
- Rule 40 (helper.rs): take the first input with this type, take its lock, find the first input with that lock; the WitnessArgs.lock at that index must be present (a missing or unparsable witness counts as absent). It blocks signature-less locks such as ACP from updating / destroying.
- Error codes (script-utils/src/error.rs, wiki Error-Codes): 1–4 syscall · 5 IssuerDataInvalid · 6 IssuerCellsCountError · 7 TypeArgsInvalid · 8 IssuerClassCountError · 9 IssuerSetCountError · 10 IssuerCellCannotDestroyed · 11 VersionInvalid · 12 ClassDataInvalid · 13 ClassTotalSmallerThanIssued · 14 ClassCellsCountError · 15 ClassIssuedInvalid · 16 ClassImmutableFieldsNotSame · 17 ClassCellCannotDestroyed · 18 ClassIdIncreaseError · 19 NFTDataInvalid · 20 NFTCellsCountError · 21 NFTTokenIdIncreaseError · 22–39 NFT state rules · 40 GroupInputWitnessNoneError
- 2026-11-19 upstream review (not an on-chain upgrade claim): Official wiki still pins Lina=b5af002 and Aggron=d0a844d. HEAD differs by formatting/import cleanup and switching helper CLASS_TYPE_CODE_HASH from Lina to Aggron. Do not replace the mainnet constant with Aggron; retain network-specific class hashes, layouts, transitions and errors.

## Example transactions

- mainnet · class create · [0xfb82fce6fda46514ccb0b1812274231b619c4d3eb4ef48287b5600d73fa50d65](https://explorer.nervos.org/transaction/0xfb82fce6fda46514ccb0b1812274231b619c4d3eb4ef48287b5600d73fa50d65) · `node decode-tx.js 0xfb82fce6fda46514ccb0b1812274231b619c4d3eb4ef48287b5600d73fa50d65`
- testnet · class create (testnet) · [0x59cb0d877b6dfdfcd57bb9fe46e2afd80fe55ec452fe00c6f9bd90cd8dc87e1c](https://testnet.explorer.nervos.org/transaction/0x59cb0d877b6dfdfcd57bb9fe46e2afd80fe55ec452fe00c6f9bd90cd8dc87e1c) · `node decode-tx.js 0x59cb0d877b6dfdfcd57bb9fe46e2afd80fe55ec452fe00c6f9bd90cd8dc87e1c --testnet`

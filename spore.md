# Spore (type) Constraints

> Source: sporeprotocol/spore-contract / contracts/spore/src/entry.rs + lib/utils + lib/errors　·　mainnet 0x4a4d…b9f5 (data1) / testnet v2 0x685a…0a0d, v1 0xbbad…3494 (data1) (spore-sdk)

- id: `spore` · type script · networks: mainnet, testnet · tags: nft, open-source, community, p-spore
- links: page https://retricsu.github.io/community-scripts/spore.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [sporeprotocol/spore-contract@9a6010e4](https://github.com/sporeprotocol/spore-contract/tree/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999) · [contracts/spore/src/entry.rs](https://github.com/sporeprotocol/spore-contract/blob/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999/contracts/spore/src/entry.rs) · [lib/utils](https://github.com/sporeprotocol/spore-contract/blob/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999/lib/utils) · [lib/errors/src/error.rs](https://github.com/sporeprotocol/spore-contract/blob/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999/lib/errors/src/error.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@ashuralyk](https://github.com/ashuralyk)

## Deployments

### mainnet — spore-sdk predefined.ts (Spore v2)

- code_hash: `0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5` · hash_type: `data1`
- deployed in tx [`0x96b198fb5ddbd1eed57ed667068f1f1e55d07907b4c0dbd38675a69ea1b69824`](https://explorer.nervos.org/transaction/0x96b198fb5ddbd1eed57ed667068f1f1e55d07907b4c0dbd38675a69ea1b69824) (block 12042082) · data_hash `0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5`

```json
{
  "script": { "code_hash": "0x4a4dce1df3dffff7f8b2cd7dff7303df3b6150c9788cb75dcf6747247132b9f5", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x96b198fb5ddbd1eed57ed667068f1f1e55d07907b4c0dbd38675a69ea1b69824", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — spore-sdk predefined.ts (Spore v2 preview)

- code_hash: `0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d` · hash_type: `data1`
- deployed in tx [`0x5e8d2a517d50fd4bb4d01737a7952a1f1d35c8afc77240695bb569cd7d9d5a1f`](https://testnet.explorer.nervos.org/transaction/0x5e8d2a517d50fd4bb4d01737a7952a1f1d35c8afc77240695bb569cd7d9d5a1f) (block 12606776) · data_hash `0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d` · type_id args `0xff279a6debd8f916dae75f91a45454526c0c9b937a29ca7746023033a234428a`

```json
{
  "script": { "code_hash": "0x685a60219309029d01310311dba953d67029170ca4848a4ff638e57002130a0d", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5e8d2a517d50fd4bb4d01737a7952a1f1d35c8afc77240695bb569cd7d9d5a1f", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — spore-sdk predefined.ts (Spore v1)

- code_hash: `0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494` · hash_type: `data1`
- deployed in tx [`0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19`](https://testnet.explorer.nervos.org/transaction/0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19) (block 10228288) · data_hash `0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494` · type_id args `0x4b4e91f74472967cc4bd8e802a978796c4e152b6c494c8e2b331cc52e0dae6fe`

```json
{
  "script": { "code_hash": "0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xfd694382e621f175ddf81ce91ce2ecf8bfc027d53d7d31b8438f7d26fc37fd19", "index": "0x0" }, "dep_type": "code" }
}
```

### mainnet — spore-sdk predefined.ts (Spore v2, tag did — dotbit deployment)

- code_hash: `0xcfba73b58b6f30e70caed8a999748781b164ef9a1e218424a6fb55ebf641cb33` · hash_type: `type`
- deployed in tx [`0xb88032a061bf5f4834b7b709ad17f745413ddc049cdf88482405a38d3d960c6d`](https://explorer.nervos.org/transaction/0xb88032a061bf5f4834b7b709ad17f745413ddc049cdf88482405a38d3d960c6d) (block 15198802) · data_hash `0x45721f0b3b48458087f4316410c4118d4d58b20b9de408073f8f59c745e1d6cd` · type_id args `0x62312cd846659e188b05da11dc3f080b083c27371ea701d6026e11e713e0e3de`

```json
{
  "script": { "code_hash": "0xcfba73b58b6f30e70caed8a999748781b164ef9a1e218424a6fb55ebf641cb33", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xb88032a061bf5f4834b7b709ad17f745413ddc049cdf88482405a38d3d960c6d", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — spore-sdk predefined.ts (Spore v2, tag did — dotbit deployment)

- code_hash: `0x0b1f412fbae26853ff7d082d422c2bdd9e2ff94ee8aaec11240a5b34cc6e890f` · hash_type: `type`
- deployed in tx [`0x306961e0eb04ed972c60cb89a0aed1b0ef065d96d2fc0000c62db5275e32dc6f`](https://testnet.explorer.nervos.org/transaction/0x306961e0eb04ed972c60cb89a0aed1b0ef065d96d2fc0000c62db5275e32dc6f) (block 14415430) · data_hash `0x076696859964804a0c984062d9c3bfe983f8632e084d9e230cb84a012aa75927` · type_id args `0x80f0d4bf6b3951911aa6b98cc609d477a8a10b903b35cfd528d098e95c36f680`

```json
{
  "script": { "code_hash": "0x0b1f412fbae26853ff7d082d422c2bdd9e2ff94ee8aaec11240a5b34cc6e890f", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x306961e0eb04ed972c60cb89a0aed1b0ef065d96d2fc0000c62db5275e32dc6f", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Mint

**Input** · tx.inputs[0]

```
any cell (used to derive spore_id)
```

**Input** · optional: cluster authorization

```
cluster cell in inputs+outputs
or the cluster's lock in inputs+outputs (lock proxy)
or a cluster agent
```

**Output** · spore cell

```
Cell{
  type: { codeHash: SPORE, hashType: data1,
          args: {{spore_id = type_id(inputs[0], i)}} },
  data: SporeData{
    content_type: {{"image/png"…}},
    content: {{bytes}},
    cluster_id: Some(32B)?
  }
}
```

byte layout: data: SporeData (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | content_type | Bytes | MIME, may carry ;immortal=true, mutant[]=… | non-empty and parsable | 64 / 80–87 |
| 1 | content | Bytes | NFT content | non-empty; multipart must contain --boundary | 66 / 69 |
| 2 | cluster_id? | BytesOpt | type args of the owning cluster | cluster cell in cell_deps | 6 / 7 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | outputs ≤ 1 | 67 |
| data | is a valid SporeData | 62 |
| args[0..32] | = blake2b(inputs[0] ‖ output index u64) | 63 |
| cluster_id | that cluster is in cell_deps; the cluster or its lock (or agent) must be in both inputs and outputs | 6 / 7 |
| mutant | every declared mutant is in cell_deps, runs and is paid; the cluster's required mutant must be applied | 71 / 72 / 73 / 74 |
| witness | exactly one SporeAction for this script in the co-build Message, fields match the cell (HEAD source; deployed version may differ, unverified) | 8–13 |

### 2. `1 → 1` Transfer

**Input** · spore

```
Cell{ lock: A, type: SPORE({{id}}), data: D }
```

**Output** · spore

```
Cell{ lock: {{B}}, type: SPORE({{id}}), data: {{D}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | inputs ≤ 1, outputs ≤ 1 | 67 / 68 |
| data | byte-identical | 61 |
| witness | exactly one SporeAction for this script in the co-build Message, fields match the cell (HEAD source; deployed version may differ, unverified) | 8–13 |

### 3. `1 → 0` Burn

**Input** · spore

```
Cell{ type: SPORE({{id}}), data: D }
```

**Output** · outputs

```
no cell with this spore
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| content_type | must not have immortal=true | 65 |
| witness | exactly one SporeAction for this script in the co-build Message, fields match the cell (HEAD source; deployed version may differ, unverified) | 8–13 |

## Notes

- Error codes (lib/errors): 5 InvalidClusterData · 6 ClusterCellNotInDep · 7 ClusterOwnershipVerifyFailed · 8–13 co-build · 60 BoundaryEncoding · 61 ModifySporePermanentField · 62 InvalidSporeData · 63 InvalidSporeID · 64 InvalidContentType · 65 DestroyImmortalNFT · 66 EmptyContent · 67 ConflictCreation · 68 MultipleSpend · 69 InvalidMultipartContent · 70 MIMEParsingError · 71–74 extension · 80–87 MIME
- spore-sdk also lists a Spore deployment tagged did (mainnet 0xcfba…cb33 / testnet 0x0b1f…890f, type); the decoder treats it as Spore

## Example transactions

- mainnet · Spore mint · [0xa7ab576ba27e6f318fa49a93a32ac268d4e1bbfeebc69d1521f45c96b5178319](https://explorer.nervos.org/transaction/0xa7ab576ba27e6f318fa49a93a32ac268d4e1bbfeebc69d1521f45c96b5178319) · `node decode-tx.js 0xa7ab576ba27e6f318fa49a93a32ac268d4e1bbfeebc69d1521f45c96b5178319`
- mainnet · Spore transfer · [0x7440d5abeccee718c1e7ce45696c4d459064a230c88f25538eeba1250bd0dab3](https://explorer.nervos.org/transaction/0x7440d5abeccee718c1e7ce45696c4d459064a230c88f25538eeba1250bd0dab3) · `node decode-tx.js 0x7440d5abeccee718c1e7ce45696c4d459064a230c88f25538eeba1250bd0dab3`
- mainnet · Spore burn · [0xeafe9933afdce64e696d27eed1f3f689e56071815dd124ce48e6f6a3d9e6e7da](https://explorer.nervos.org/transaction/0xeafe9933afdce64e696d27eed1f3f689e56071815dd124ce48e6f6a3d9e6e7da) · `node decode-tx.js 0xeafe9933afdce64e696d27eed1f3f689e56071815dd124ce48e6f6a3d9e6e7da`

# Spore Cluster (type) Constraints

> Source: sporeprotocol/spore-contract / contracts/cluster/src/entry.rs　·　mainnet 0x7366…0075 (data1) / testnet v2 0x0bbe…9058, v1 0x598d…6080 (data1) (spore-sdk)

- id: `cluster` · type script · networks: mainnet, testnet · tags: nft, open-source, community, p-spore
- links: page https://retricsu.github.io/community-scripts/cluster.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [sporeprotocol/spore-contract@9a6010e4](https://github.com/sporeprotocol/spore-contract/tree/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999) · [contracts/cluster/src/entry.rs](https://github.com/sporeprotocol/spore-contract/blob/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999/contracts/cluster/src/entry.rs) · [lib/errors/src/error.rs](https://github.com/sporeprotocol/spore-contract/blob/9a6010e43ffd09ac9e6fe7ee389cc915e3e4f999/lib/errors/src/error.rs) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-10-20

## Deployments

### mainnet — spore-sdk predefined.ts (Cluster v2)

- code_hash: `0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075` · hash_type: `data1`
- deployed in tx [`0xe464b7fb9311c5e2820e61c99afc615d6b98bdefbe318c34868c010cbd0dc938`](https://explorer.nervos.org/transaction/0xe464b7fb9311c5e2820e61c99afc615d6b98bdefbe318c34868c010cbd0dc938) (block 12026092) · data_hash `0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075`

```json
{
  "script": { "code_hash": "0x7366a61534fa7c7e6225ecc0d828ea3b5366adec2b58206f2ee84995fe030075", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe464b7fb9311c5e2820e61c99afc615d6b98bdefbe318c34868c010cbd0dc938", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — spore-sdk predefined.ts (Cluster v2 preview)

- code_hash: `0x0bbe768b519d8ea7b96d58f1182eb7e6ef96c541fbd9526975077ee09f049058` · hash_type: `data1`
- deployed in tx [`0xcebb174d6e300e26074aea2f5dbd7f694bb4fe3de52b6dfe205e54f90164510a`](https://testnet.explorer.nervos.org/transaction/0xcebb174d6e300e26074aea2f5dbd7f694bb4fe3de52b6dfe205e54f90164510a) (block 12606811) · data_hash `0x0bbe768b519d8ea7b96d58f1182eb7e6ef96c541fbd9526975077ee09f049058` · type_id args `0xbbb44cfa03cac36ee1f0bd2741c06caea20d19cf0516e8aa4fa99d7f293d8fca`

```json
{
  "script": { "code_hash": "0x0bbe768b519d8ea7b96d58f1182eb7e6ef96c541fbd9526975077ee09f049058", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xcebb174d6e300e26074aea2f5dbd7f694bb4fe3de52b6dfe205e54f90164510a", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — spore-sdk predefined.ts (Cluster v1)

- code_hash: `0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080` · hash_type: `data1`
- deployed in tx [`0x49551a20dfe39231e7db49431d26c9c08ceec96a29024eef3acc936deeb2ca76`](https://testnet.explorer.nervos.org/transaction/0x49551a20dfe39231e7db49431d26c9c08ceec96a29024eef3acc936deeb2ca76) (block 10219183) · data_hash `0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080` · type_id args `0x0105d3692db7f6bfe00966ca999e040edad45cfe29b5cd8e636ee39c1c728762`

```json
{
  "script": { "code_hash": "0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x49551a20dfe39231e7db49431d26c9c08ceec96a29024eef3acc936deeb2ca76", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create

**Input** · tx.inputs[0]

```
any cell (used to derive cluster_id)
```

**Output** · cluster cell

```
Cell{
  type: { codeHash: CLUSTER, hashType: data1,
          args: {{cluster_id = type_id(inputs[0], i)}} },
  data: ClusterData{ name: {{non-empty}}, description, mutant_id? }
}
```

byte layout: data: ClusterData (molecule table)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | name | Bytes | name | non-empty | 52 |
| 1 | description | Bytes | description | — | 5 |
| 2 | mutant_id? (v2) | BytesOpt | Lua extension spores must apply | extension cell in cell_deps | 54 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | inputs and outputs ≤ 1 each | 50 |
| data | valid ClusterData (2-field v1 accepted) | 5 |
| name | non-empty | 52 |
| args[0..32] | = type_id(inputs[0], output index) | 53 |
| mutant_id | extension is in cell_deps | 54 |
| witness | exactly one MintCluster / TransferCluster Action in the co-build Message with matching fields (HEAD source, deployed version unverified) | 8–13 |

### 2. `1 → 1` Transfer / authorize a spore mint

**Input** · cluster

```
Cell{ type: CLUSTER({{id}}), data: D }
```

**Output** · cluster

```
Cell{ type: CLUSTER({{id}}), data: {{D}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | byte-identical | 51 |
| witness | exactly one MintCluster / TransferCluster Action in the co-build Message with matching fields (HEAD source, deployed version unverified) | 8–13 |

### 3. `1 → 0` Destroy (forbidden)

**Input** · cluster

```
Cell{ type: CLUSTER({{id}}) }
```

**Output** · outputs

```
no such cluster
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| group | a cluster can never be destroyed | 50 |

## Notes

- Error codes: 5 InvalidClusterData · 50 InvalidClusterOperation · 51 ModifyClusterPermanentField · 52 EmptyName · 53 InvalidClusterID · 54 MutantNotInDeps; 8–13 co-build
- Cluster Proxy / Agent (errors 30–33 / 40–47) are only listed for testnet in spore-sdk and are not added yet

## Example transactions

- mainnet · Cluster create · [0x1a8da00b65ab873000450933b1d812e952c4a4310cfe21d67e71c43db570eeb2](https://explorer.nervos.org/transaction/0x1a8da00b65ab873000450933b1d812e952c4a4310cfe21d67e71c43db570eeb2) · `node decode-tx.js 0x1a8da00b65ab873000450933b1d812e952c4a4310cfe21d67e71c43db570eeb2`
- mainnet · Cluster transfer / reference · [0x9b44a6f22459a5d4e56a718cdedfd6dcfbf03df1a04dbbb3f4764f738be793ab](https://explorer.nervos.org/transaction/0x9b44a6f22459a5d4e56a718cdedfd6dcfbf03df1a04dbbb3f4764f738be793ab) · `node decode-tx.js 0x9b44a6f22459a5d4e56a718cdedfd6dcfbf03df1a04dbbb3f4764f738be793ab`

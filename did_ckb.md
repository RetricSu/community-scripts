# DID CKB Constraints

> Source: web5fans/did-ckb / contracts/did-ckb-ts/src/entry.rs　·　mainnet 0x4a06…984a / testnet 0x5101…c7c5 (type)

- id: `did_ckb` · type script · networks: mainnet, testnet · tags: identity, open-source, community
- links: page https://retricsu.github.io/community-scripts/did_ckb.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [web5fans/did-ckb@f37c14af](https://github.com/web5fans/did-ckb/tree/f37c14afeaeb4162e7c66ac336372eb81474c39d) · [contracts/did-ckb-ts/src](https://github.com/web5fans/did-ckb/blob/f37c14afeaeb4162e7c66ac336372eb81474c39d/contracts/did-ckb-ts/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — web5fans/did-ckb (mainnet)

- code_hash: `0x4a06164dc34dccade5afe3e847a97b6db743e79f5477fa3295acf02849c5984a` · hash_type: `type`
- deployed in tx [`0xe2f74c56cdc610d2b9fe898a96a80118845f5278605d7f9ad535dad69ae015bf`](https://explorer.nervos.org/transaction/0xe2f74c56cdc610d2b9fe898a96a80118845f5278605d7f9ad535dad69ae015bf) (block 17943462) · data_hash `0x079bb8c1dfb249f60d932f4b1a60fa5cb2a36af3653ac09464f262e2f3f682a9` · type_id args `0x55573ef6d78e3ca75170ff476176732309a8b31efe94320a954ded3d75c2cb18`

```json
{
  "script": { "code_hash": "0x4a06164dc34dccade5afe3e847a97b6db743e79f5477fa3295acf02849c5984a", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xe2f74c56cdc610d2b9fe898a96a80118845f5278605d7f9ad535dad69ae015bf", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — web5fans/did-ckb (testnet)

- code_hash: `0x510150477b10d6ab551a509b71265f3164e9fd4137fcb5a4322f49f03092c7c5` · hash_type: `type`
- deployed in tx [`0x0e7a830e2d5ebd05cd45a55f93f94559edea0ef1237b7233f49f7facfb3d6a6c`](https://testnet.explorer.nervos.org/transaction/0x0e7a830e2d5ebd05cd45a55f93f94559edea0ef1237b7233f49f7facfb3d6a6c) (block 19280654) · data_hash `0x079bb8c1dfb249f60d932f4b1a60fa5cb2a36af3653ac09464f262e2f3f682a9` · type_id args `0x3c27695173b888ed44ddf36f901789014384ad6c05a9137f3db9a0779c141c35`

```json
{
  "script": { "code_hash": "0x510150477b10d6ab551a509b71265f3164e9fd4137fcb5a4322f49f03092c7c5", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0e7a830e2d5ebd05cd45a55f93f94559edea0ef1237b7233f49f7facfb3d6a6c", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Mint

**Input** · inputs[0]: any

```
CellInput{ since, previous_output }
```

**Output** · DID cell

```
Cell{
  type: { codeHash: DID_CKB, args: {{did_id 20B}} ‖ … },
  data: DidCkbData::V1 { document, local_id? }
}
```

**Output** · witness

```
WitnessArgs{ output_type: DidCkbWitness {
  local_id_authorization: { history, sig, rotation_key_indices } } }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | did_id | 20B | first 20 bytes of type_id | = blake2b(inputs[0] ‖ first group output index)[0..20] | 26 |

byte layout: data byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | union_id | 4B | 0 = DidCkbDataV1 | must be 0 | 51 |
| 1 | document | Bytes | DID document (CBOR) | valid CBOR | 52 |
| 2 | local_id | StringOpt | optional did:plc id (UTF-8) | needs PLC authorisation if set | 31–46 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type_id | args ≥ 20 bytes, ≤ 1 group input/output each, args[0..20] by the type_id rule | 26 |
| data | valid molecule and document is valid CBOR | 51 / 52 |
| local_id | empty passes; otherwise the PLC operation history in the witness must be valid and the final signature must cover tx_hash (not checked) | 31–46 |

### 2. `B` Update

**Input** · DID cell

```
Cell{ type: DID_CKB(args), data: V1 {doc, local_id} }
```

**Output** · DID cell

```
Cell{ type: same, data: V1 {doc', local_id} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | both data valid, both documents CBOR | 51 / 52 |
| local_id | local_id must not change | 53 |
| auth | authorised by the lock (the type checks no signature) | — |

### 3. `C` Burn

**Input** · DID cell

```
Cell{ type: DID_CKB }
```

**Output** · no output with that type

```
—
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| — | no further rule | — |

## Notes

- Error codes (error.rs): 21–27 syscall (26 TypeIDError) · 31–46 ckb-did-plc-utils · 51 Molecule · 52 InvalidDocumentCbor · 53 MismatchedFrom

## Example transactions

- mainnet · DID update · [0x3774612f61cce67724c2e68f613c54b698b3c413beb125a9a646191fd02b9961](https://explorer.nervos.org/transaction/0x3774612f61cce67724c2e68f613c54b698b3c413beb125a9a646191fd02b9961) · `node decode-tx.js 0x3774612f61cce67724c2e68f613c54b698b3c413beb125a9a646191fd02b9961`
- mainnet · DID mint · [0xdae362332cc0c2dde6b39e7890569b29ae410b8c3f0b9e02069c057bd65c0537](https://explorer.nervos.org/transaction/0xdae362332cc0c2dde6b39e7890569b29ae410b8c3f0b9e02069c057bd65c0537) · `node decode-tx.js 0xdae362332cc0c2dde6b39e7890569b29ae410b8c3f0b9e02069c057bd65c0537`

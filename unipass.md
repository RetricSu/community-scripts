# UniPass lock (deprecated) (no public source)

> No public source found, unconfirmed with maintainer　·　mainnet 0xd01f…b60a (type) · testnet 0x3e1e…a783 (type) · mainnet 0x614d…09b3 (type) · testnet 0x124a…2be6 (type)

- id: `unipass` · lock script · networks: mainnet, testnet · tags: identity, no-source, community
- links: page https://retricsu.github.io/community-scripts/unipass.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source — No public source found, unconfirmed with maintainer
- on-chain data checked: 2026-11-06

## Deployments

### mainnet — UniPass V3 — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0xd01f5152c267b7f33b9795140c2467742e8424e49ebe2331caec197f7281b60a` · hash_type: `type`
- deployed in tx [`0x86a5e91ad93475caf30a3d3b0258786dd463984f71e8471abc5574f206f6207a`](https://explorer.nervos.org/transaction/0x86a5e91ad93475caf30a3d3b0258786dd463984f71e8471abc5574f206f6207a) (block 6266343) · data_hash `0x641aa0316014005d147b907e7fad7b5223ed0b9a4704b48a6dc592b838bdcde6` · type_id args `0x53391b00ff897809b6927e8e302aa12aadc8c781fbaf0115cdb57ca0b5732769`

```json
{
  "script": { "code_hash": "0xd01f5152c267b7f33b9795140c2467742e8424e49ebe2331caec197f7281b60a", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x86a5e91ad93475caf30a3d3b0258786dd463984f71e8471abc5574f206f6207a", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — UniPass V3 — CKB Explorer registry API /api/v2/scripts (explorer.nervos.org, read 2026-11-06); nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x3e1eb7ed4809b2d60650be96a40abfbdafb3fb942b7b37ec7709e64e2cd0a783` · hash_type: `type`
- deployed in tx [`0x8b98ede6bf7b5baba767b1d2d46a13749fc810375b14152abbc259a7fc98e46d`](https://testnet.explorer.nervos.org/transaction/0x8b98ede6bf7b5baba767b1d2d46a13749fc810375b14152abbc259a7fc98e46d) (block 4337567) · data_hash `0xdcfa6069acc7b2c49c11a4e31ba553c5c1ed443b8dcc3651e957e19bb87c2bfc` · type_id args `0x92c3761b9b94be74ae83b99a4d6a30fd5701a6a5e1459aeb69f9a0eefe2f2617` · cell_dep from: documented cell dep

```json
{
  "script": { "code_hash": "0x3e1eb7ed4809b2d60650be96a40abfbdafb3fb942b7b37ec7709e64e2cd0a783", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x8b98ede6bf7b5baba767b1d2d46a13749fc810375b14152abbc259a7fc98e46d", "index": "0x0" }, "dep_type": "code" }
}
```

### mainnet — UniPass V2 — nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2; nervosnetwork/ckb-explorer lib/tasks/migration/fill_contracts_info.rake @0634b74

- code_hash: `0x614d40a86e1b29a8f4d8d93b9f3b390bf740803fa19a69f1c95716e029ea09b3` · hash_type: `type`
- deployed in tx [`0xd161ce504b34408fcc13f8b642e147aa2a093dd96391b0ad9d400df1c8ab629e`](https://explorer.nervos.org/transaction/0xd161ce504b34408fcc13f8b642e147aa2a093dd96391b0ad9d400df1c8ab629e) (block 12440824) · data_hash `0xbf16af8be58d904d0dbc507430cf042c267570b7d17713d37d75fb8ba9493947` · type_id args `0x1e365f243b9fa9623648c0811ab180974d0eb5d73888cbc4b6b9d9ed09cf831b`

```json
{
  "script": { "code_hash": "0x614d40a86e1b29a8f4d8d93b9f3b390bf740803fa19a69f1c95716e029ea09b3", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xd161ce504b34408fcc13f8b642e147aa2a093dd96391b0ad9d400df1c8ab629e", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — UniPass V2 — nervosnetwork/ckb-explorer-frontend src/constants/scripts.ts @39f93f2

- code_hash: `0x124a60cd799e1fbca664196de46b3f7f0ecb7138133dcaea4893c51df5b02be6` · hash_type: `type`
- deployed in tx [`0x65080f85a9c270c1208cc8648f8d73dfb630bab659699f56fb27cff9039c5820`](https://testnet.explorer.nervos.org/transaction/0x65080f85a9c270c1208cc8648f8d73dfb630bab659699f56fb27cff9039c5820) (block 4172783) · data_hash `0xa2ad72975ac807614eb7c7bef43d56867ed34aef9a419d361e19a92b6d6c5c77` · type_id args `0x50c29e0a9fc9bda2e8ca1f74adf8d2b982c4caf3fd3f6a6133e040a4be780d4a`

```json
{
  "script": { "code_hash": "0x124a60cd799e1fbca664196de46b3f7f0ecb7138133dcaea4893c51df5b02be6", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x65080f85a9c270c1208cc8648f8d73dfb630bab659699f56fb27cff9039c5820", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `?` Identification only: facts verifiable on chain

**Input** · input locked by this script

```
Cell{
  lock: { codeHash: {{0xd01f…b60a}},
          hashType: type,
          args: … }
}
```

**Output** · validation rules

```
unknown: no public source, this page lists no rules or error codes
```

**Also**

- CKB Explorer registry description: "UniPass Wallet is a smart contract wallet solution that supports on-chain Email social recovery." Website https://www.unipass.id
- This plugin matches both the V2 and V3 code_hashes (different binaries); "deprecated" comes from the user-supplied list, the registry does not flag it.

## Notes

- No public source found, unconfirmed with maintainer
- Deployment (code cell / cell_dep / data hash) resolved from chain by scripts/check-deployments.js; see the provenance card below

## Example transactions

- mainnet · UniPass V3 (match only) · [0xfdd97c88fc6bf73c26bd53de5a62eb04b8a5bbe5494e134d4a5cf4c723045940](https://explorer.nervos.org/transaction/0xfdd97c88fc6bf73c26bd53de5a62eb04b8a5bbe5494e134d4a5cf4c723045940) · `node decode-tx.js 0xfdd97c88fc6bf73c26bd53de5a62eb04b8a5bbe5494e134d4a5cf4c723045940`
- mainnet · UniPass V2 (match only) · [0x86d837dbc5320072f272a621a9b5954f4de6c57e9913266d26c1664b5ddb4cc0](https://explorer.nervos.org/transaction/0x86d837dbc5320072f272a621a9b5954f4de6c57e9913266d26c1664b5ddb4cc0) · `node decode-tx.js 0x86d837dbc5320072f272a621a9b5954f4de6c57e9913266d26c1664b5ddb4cc0`

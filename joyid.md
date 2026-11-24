# JoyID lock

- id: `joyid` · lock script · networks: mainnet, testnet · tags: identity, no-source, community
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: no public source
- binary vs source: no public source
- on-chain data checked: 2026-10-20

## Deployments

### mainnet — ccc KnownScript.JoyId

- code_hash: `0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323` · hash_type: `type`
- deployed in tx [`0x673e1843035ce9c249efc36b62865e7a7c9f6e2ca6fc9c66fd108307e81355f9`](https://explorer.nervos.org/transaction/0x673e1843035ce9c249efc36b62865e7a7c9f6e2ca6fc9c66fd108307e81355f9) (block 17894900) · data_hash `0x4af7d832e7c328aa4ad6f2deb669743446aea7b9a2f0c25646897501ac4f1ebe` · type_id args `0x2d1f2d4d1514ccc3bb4f04f5437a5ae30d00636ee57cedd2c70ab3ea75b62adc`

```json
{
  "script": { "code_hash": "0xd00c84f0ec8fd441c38bc3f87a371f547190f2fcff88e642bc5bf54b9e318323", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf05188e5f3a6767fc4687faf45ba5f1a6e25d3ada6129dae8722cb282f262493", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — ccc KnownScript.JoyId

- code_hash: `0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac` · hash_type: `type`
- deployed in tx [`0x4a596d31dc35e88fb1591debbf680b04a44b4a434e3a94453c21ea8950ffb4d9`](https://testnet.explorer.nervos.org/transaction/0x4a596d31dc35e88fb1591debbf680b04a44b4a434e3a94453c21ea8950ffb4d9) (block 18149041) · data_hash `0xd2c0f2f621a337007e046f0ed65f8fe29112c32a00ea1e43c2f8059fd42ca6d7` · type_id args `0x1c9fc299ba0570d077b4d7fb9acff1ccc0de69d369942d82678bae937c44ec30`

```json
{
  "script": { "code_hash": "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263", "index": "0x0" }, "dep_type": "dep_group" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

## Example transactions

- mainnet · JoyID (match only) · [0x44e5e96c783d8a1c7abc34961ebebfea19ccfd048f88696ecf5d37b63ef8517f](https://explorer.nervos.org/transaction/0x44e5e96c783d8a1c7abc34961ebebfea19ccfd048f88696ecf5d37b63ef8517f) · `node decode-tx.js 0x44e5e96c783d8a1c7abc34961ebebfea19ccfd048f88696ecf5d37b63ef8517f`

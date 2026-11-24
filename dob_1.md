# dob_1

- id: `dob_1` · undefined script · networks: mainnet, testnet · tags: nft, open-source, community, p-spore
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [sporeprotocol/spore-dob-1@43ad12a2](https://github.com/sporeprotocol/spore-dob-1/tree/43ad12a24bdee2df9288d772097f6e0ab2fc22fb) · [src/main.rs](https://github.com/sporeprotocol/spore-dob-1/blob/43ad12a24bdee2df9288d772097f6e0ab2fc22fb/src/main.rs) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (migration/mainnet/2024-07-15-142055.json; migration/testnet/2024-07-15-142016.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### mainnet

- code_hash: `0x1b55845004b2d08956e08d9e10bb1bf23951e6056f8159588f2af03b11b08c07` · hash_type: `type`
- deployed in tx [`0x99cc81b5e4c311519173f3f6f771dff64a2f64c97f5f724877c4352cd1b3b32c`](https://explorer.nervos.org/transaction/0x99cc81b5e4c311519173f3f6f771dff64a2f64c97f5f724877c4352cd1b3b32c) (block 13500064) · data_hash `0xda3525549b72970b4c95f5b5749357f20d1293d335710b674f09c32f7d54b6dc` · type_id args `0x8892bea4405a1f077921799bc0f4516e0ebaef7aea0dfc6614a8898fb47d5372`

```json
{
  "script": { "code_hash": "0x1b55845004b2d08956e08d9e10bb1bf23951e6056f8159588f2af03b11b08c07", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x99cc81b5e4c311519173f3f6f771dff64a2f64c97f5f724877c4352cd1b3b32c", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet

- code_hash: `0xaf4e8350a75cc8e6bc05be67483bee3aa4a27a8d7378b56bda8a82376c9f1d88` · hash_type: `type`
- deployed in tx [`0x18c8f1d55906cf9932c5a72ae4dc039e51e41089db6829edb3f92078c6520bc8`](https://testnet.explorer.nervos.org/transaction/0x18c8f1d55906cf9932c5a72ae4dc039e51e41089db6829edb3f92078c6520bc8) (block 13918428) · data_hash `0xda3525549b72970b4c95f5b5749357f20d1293d335710b674f09c32f7d54b6dc` · type_id args `0x784e32cef202b9d4759ea96e80d806f94051e8069fd34d761f452553700138d7`

```json
{
  "script": { "code_hash": "0xaf4e8350a75cc8e6bc05be67483bee3aa4a27a8d7378b56bda8a82376c9f1d88", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x18c8f1d55906cf9932c5a72ae4dc039e51e41089db6829edb3f92078c6520bc8", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

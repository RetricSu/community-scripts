# ccc_btc_lock

- id: `ccc_btc_lock` · undefined script · networks: testnet · tags: identity, open-source, community
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ccc-locks@8c8dc2fc](https://github.com/ckb-devrel/ccc-locks/tree/8c8dc2fc7db45a802af024a5d1817137962480cf) · [contracts/ccc-btc-lock/src/entry.rs](https://github.com/ckb-devrel/ccc-locks/blob/8c8dc2fc7db45a802af024a5d1817137962480cf/contracts/ccc-btc-lock/src/entry.rs) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (deployment/testnet/btc-lock/migrations/2024-08-02-064528.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### testnet

- code_hash: `0x8f026d6113b24800e04bfb33703f98dfaa6db6719097ab5d3050db9cf4fec45e` · hash_type: `type`
- deployed in tx [`0xba5a1a77019be0e8942119ad549f01ca3c61fd9f911aa46e27d508a802236614`](https://testnet.explorer.nervos.org/transaction/0xba5a1a77019be0e8942119ad549f01ca3c61fd9f911aa46e27d508a802236614) (block 14109397) · data_hash `0x3fa562b394f65aac8c2649b6d7d1dea25c677ccfcd4d912e63b272b78bbacb14` · type_id args `0xa7e71bd33324ae5a94f9ac93a5d47a3dc38ee79e9ba9d697fc61331e96bf355f`

```json
{
  "script": { "code_hash": "0x8f026d6113b24800e04bfb33703f98dfaa6db6719097ab5d3050db9cf4fec45e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xba5a1a77019be0e8942119ad549f01ca3c61fd9f911aa46e27d508a802236614", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

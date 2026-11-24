# nostr_binding

- id: `nostr_binding` · undefined script · networks: mainnet, testnet · tags: identity, open-source, cryptape
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [cryptape/nostr-binding@eef134e0](https://github.com/cryptape/nostr-binding/tree/eef134e0a09dd07ccc367eb4eca84c1a5a73fb8b) · [contracts/nostr-binding/src](https://github.com/cryptape/nostr-binding/blob/eef134e0a09dd07ccc367eb4eca84c1a5a73fb8b/contracts/nostr-binding/src) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (deployment/mainnet/nostr-binding-type-script/migrations/2024-07-18-010238.json; deployment/mainnet/nostr-binding-type-script/migrations/2026-01-14-050950.json; deployment/testnet/nostr-binding-type-script/migrations/2024-07-03-014444.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### mainnet

- code_hash: `0xb56ea08c4b10b454ed3389bb0e504ecfc57dcfe3089a5030654525a2def2108e` · hash_type: `type`
- deployed in tx [`0x86d21ad7d41c5b16e18f6e74a1a603ec398ca03b9d604d46e406f9acca88e7bd`](https://explorer.nervos.org/transaction/0x86d21ad7d41c5b16e18f6e74a1a603ec398ca03b9d604d46e406f9acca88e7bd) (block 18373321) · data_hash `0xee39c944c5bea6857d1b55fc1d4ff9fc1e22e59fd89d1a0fed8e6eabc08dda66` · type_id args `0x1f2c9ac4a2a340fb13ff7e9b8511a35e448e4db54e42c44c14f358b4de2dc197`

```json
{
  "script": { "code_hash": "0xb56ea08c4b10b454ed3389bb0e504ecfc57dcfe3089a5030654525a2def2108e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x86d21ad7d41c5b16e18f6e74a1a603ec398ca03b9d604d46e406f9acca88e7bd", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet

- code_hash: `0x4105801324b70b3a1508ded8958aba66a6faf68cab26f863b4902b50dfb8b9ab` · hash_type: `type`
- deployed in tx [`0x0e3949fa8afbbdf6d4abdda0d12ac1206c8d05dd51ec490b7341586291db85a6`](https://testnet.explorer.nervos.org/transaction/0x0e3949fa8afbbdf6d4abdda0d12ac1206c8d05dd51ec490b7341586291db85a6) (block 13783296) · data_hash `0xee39c944c5bea6857d1b55fc1d4ff9fc1e22e59fd89d1a0fed8e6eabc08dda66` · type_id args `0x8f8ef331361e061eccf629b30586969340ba6c9fac051bacf2f811369af49f51`

```json
{
  "script": { "code_hash": "0x4105801324b70b3a1508ded8958aba66a6faf68cab26f863b4902b50dfb8b9ab", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x0e3949fa8afbbdf6d4abdda0d12ac1206c8d05dd51ec490b7341586291db85a6", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

# ccc_eth_lock

- id: `ccc_eth_lock` · undefined script · networks: testnet · tags: identity, open-source, community
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ccc-locks@8c8dc2fc](https://github.com/ckb-devrel/ccc-locks/tree/8c8dc2fc7db45a802af024a5d1817137962480cf) · [contracts/ccc-eth-lock/src/entry.rs](https://github.com/ckb-devrel/ccc-locks/blob/8c8dc2fc7db45a802af024a5d1817137962480cf/contracts/ccc-eth-lock/src/entry.rs) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (deployment/testnet/eth-lock/migrations/2024-08-02-064738.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### testnet

- code_hash: `0x5b1983cf4242009f72e82b37fb6b36790e6d4858474046fc3c798e5142cf8835` · hash_type: `type`
- deployed in tx [`0x2e6a50a9ce96c7b9697ed0fd21bd0a736d3df5e62d25137f728d8354a36cb369`](https://testnet.explorer.nervos.org/transaction/0x2e6a50a9ce96c7b9697ed0fd21bd0a736d3df5e62d25137f728d8354a36cb369) (block 14109409) · data_hash `0x66be3ce5f50be813bc583e733583db33bc1757b462006258471e52e358aced50` · type_id args `0x5058db950c52b1094f5494eda477b945426de0a999dfed23000392105adc50b3`

```json
{
  "script": { "code_hash": "0x5b1983cf4242009f72e82b37fb6b36790e6d4858474046fc3c798e5142cf8835", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x2e6a50a9ce96c7b9697ed0fd21bd0a736d3df5e62d25137f728d8354a36cb369", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

# ccc_sol_lock

- id: `ccc_sol_lock` · undefined script · networks: testnet · tags: identity, open-source, community
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [ckb-devrel/ccc-locks@8c8dc2fc](https://github.com/ckb-devrel/ccc-locks/tree/8c8dc2fc7db45a802af024a5d1817137962480cf) · [contracts/ccc-sol-lock/src/entry.rs](https://github.com/ckb-devrel/ccc-locks/blob/8c8dc2fc7db45a802af024a5d1817137962480cf/contracts/ccc-sol-lock/src/entry.rs) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (deployment/testnet/sol-lock/migrations/2024-08-02-064926.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### testnet

- code_hash: `0x98870bb4f49768bbd5bcf48b7cd189ab8a2cf2649869715c00a5d3cedd9db86b` · hash_type: `type`
- deployed in tx [`0x3fae7df1db56ae21edfd98054995bbbf7331aaebad66c3e1632b84eb50904531`](https://testnet.explorer.nervos.org/transaction/0x3fae7df1db56ae21edfd98054995bbbf7331aaebad66c3e1632b84eb50904531) (block 14109421) · data_hash `0x697ca3d2731f2eca7e1725353ce5b07f30fc4577a6e9250e2232a0f90f97a877` · type_id args `0x86b444e5c6c77d66c32d360026bd34a6c7952685c32602ec76ce6bbc718972d3`

```json
{
  "script": { "code_hash": "0x98870bb4f49768bbd5bcf48b7cd189ab8a2cf2649869715c00a5d3cedd9db86b", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3fae7df1db56ae21edfd98054995bbbf7331aaebad66c3e1632b84eb50904531", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

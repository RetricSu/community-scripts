# dob_0

- id: `dob_0` · undefined script · networks: mainnet, testnet · tags: nft, open-source, community, p-spore
- links: all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [sporeprotocol/spore-dob-0@a592680c](https://github.com/sporeprotocol/spore-dob-0/tree/a592680c9a507a014ebf505075cbef0b21382799) · [src/main.rs](https://github.com/sporeprotocol/spore-dob-0/blob/a592680c9a507a014ebf505075cbef0b21382799/src/main.rs) (default-branch HEAD recorded at community-scripts merge; binary provenance not yet verified)
- binary vs source: unverified (deployed binary not matched to the source) — deployment provenance confirmed against the repo's own deployment records (migration/mainnet/2024-06-24-124552.json; migration/testnet/2024-06-12-094426.json); no committed binary or checksum at the recorded commit, so the build itself is not verified (reproducible build not attempted)
- on-chain data checked: 2026-11-24

## Deployments

### mainnet

- code_hash: `0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c` · hash_type: `data1`
- deployed in tx [`0x71023885a2178648be6a7f138ee49379000a82cda98dd8adabee99eaaca42fde`](https://explorer.nervos.org/transaction/0x71023885a2178648be6a7f138ee49379000a82cda98dd8adabee99eaaca42fde) (block 13315126) · data_hash `0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c`

```json
{
  "script": { "code_hash": "0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x71023885a2178648be6a7f138ee49379000a82cda98dd8adabee99eaaca42fde", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet

- code_hash: `0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c` · hash_type: `data1`
- deployed in tx [`0x4a8a0d079f8438bed89e0ece1b14e67ab68e2aa7688a5f4917a59a185e0f8fd5`](https://testnet.explorer.nervos.org/transaction/0x4a8a0d079f8438bed89e0ece1b14e67ab68e2aa7688a5f4917a59a185e0f8fd5) (block 13560289) · data_hash `0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c`

```json
{
  "script": { "code_hash": "0x13cac78ad8482202f18f9df4ea707611c35f994375fa03ae79121312dda9925c", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x4a8a0d079f8438bed89e0ece1b14e67ab68e2aa7688a5f4917a59a185e0f8fd5", "index": "0x0" }, "dep_type": "code" }
}
```

No cell-flow spec yet: this contract only has deployments and a decoder plugin.

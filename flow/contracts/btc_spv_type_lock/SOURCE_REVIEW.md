# btc_spv_type_lock: issue #19 source/deployment review

Reviewed 2026-11-19 (Asia/Shanghai).

## 结论 / Decision

主网 production 分支及 btc-mainnet-v0.1.0 仍为 f3e3ba8；master 新增销毁、testnet reset、操作分类和 verifier 变更，checksum 也不同，不能直接套到现有主网部署。

Mainnet production and btc-mainnet-v0.1.0 still point to f3e3ba8. Master adds destroy, testnet reset, operation-dispatch and verifier changes and has a different checksum; these must not be applied to the existing mainnet deployment.

- Described/deployment source: `f3e3ba846c1de580ae7f0720cbb64df13036b80a` (unchanged).
- Reviewed upstream: `94f5606bf3a80c201dc1bd341d739c32c1a29198`. This is **not** a deployment or reproducible-build pin.
- Existing network/hash-type/code-hash matches, cell_deps and binary verification statuses are retained.
- Read-only `check-deployments.js` is used to check current chain state; no new binary was built or independently reproduced.
- Evidence: 
  - https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/tree/btc-mainnet-v0.1.0
  - https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/blob/f3e3ba846c1de580ae7f0720cbb64df13036b80a/checksums.txt
  - https://github.com/ckb-cell/ckb-bitcoin-spv-contracts/compare/f3e3ba846c1de580ae7f0720cbb64df13036b80a...94f5606bf3a80c201dc1bd341d739c32c1a29198

## Exact tracked source trees

### deployment source `f3e3ba846c1de580ae7f0720cbb64df13036b80a`

```text
100644 blob 833b8c43edf5fe84cb0e66fe29932e5a5a247ed6	checksums.txt
100644 blob 4b2b126bb6d182d1da87dd295dc63f82da821e8e	contracts/ckb-bitcoin-spv-type-lock/src/entry.rs
100644 blob b5a8aece38d737c474dff38b2a3a9810014c81a0	contracts/ckb-bitcoin-spv-type-lock/src/error.rs
100644 blob a89b0416720ba29645501862aa6d0e8cee6fd3a5	contracts/ckb-bitcoin-spv-type-lock/src/main.rs
100644 blob 21d5732599a6a2d5c271141f9b46a47d30dbfeaa	contracts/ckb-bitcoin-spv-type-lock/src/operations/create.rs
100644 blob 28dceec938daecd35e7b457d02454f294668e073	contracts/ckb-bitcoin-spv-type-lock/src/operations/destroy.rs
100644 blob 6e2b3eceab5ff0119322e8ef36c63e4cd7820b9b	contracts/ckb-bitcoin-spv-type-lock/src/operations/mod.rs
100644 blob 8566e42a2f3f18c6b087a27993f0e25bcf097eae	contracts/ckb-bitcoin-spv-type-lock/src/operations/reorg.rs
100644 blob 1605a5e1d0b92a9e981af16bff486e6813efe5bb	contracts/ckb-bitcoin-spv-type-lock/src/operations/update.rs
100644 blob 518b8738cd8844791317cfabce18b06a010b70ea	contracts/ckb-bitcoin-spv-type-lock/src/utilities/mod.rs
100644 blob a8cb5f5f9a26fa84c78a9bd9b4f788f1c9383665	contracts/ckb-bitcoin-spv-type-lock/src/utilities/type_id.rs
```

### reviewed upstream `94f5606bf3a80c201dc1bd341d739c32c1a29198`

```text
100644 blob a27a2cb0283c5904e956eb5263292fde9ce86f65	checksums.txt
100644 blob c00d46c7be0598f71e80b9aa8f44a00c1b5da47d	contracts/ckb-bitcoin-spv-type-lock/src/entry.rs
100644 blob b5a8aece38d737c474dff38b2a3a9810014c81a0	contracts/ckb-bitcoin-spv-type-lock/src/error.rs
100644 blob a89b0416720ba29645501862aa6d0e8cee6fd3a5	contracts/ckb-bitcoin-spv-type-lock/src/main.rs
100644 blob 1bfb68ebfa57f1adc8542f4c013422109db2589b	contracts/ckb-bitcoin-spv-type-lock/src/operations/create.rs
100644 blob 6e8189959fdeaa6d87466c382dd06a037a6d71dd	contracts/ckb-bitcoin-spv-type-lock/src/operations/destroy.rs
100644 blob 217784e77afaeeef0f434af7969221250e65c943	contracts/ckb-bitcoin-spv-type-lock/src/operations/mod.rs
100644 blob 1a6edb2b7ba51d0abee3ce3ab0c8ec6798dea397	contracts/ckb-bitcoin-spv-type-lock/src/operations/reorg.rs
100644 blob 7e320760289d96434a73f6858c6529694f0cfb1b	contracts/ckb-bitcoin-spv-type-lock/src/operations/reset.rs
100644 blob d3af542103b3a117e0c998eaab7f807c28e1be99	contracts/ckb-bitcoin-spv-type-lock/src/operations/update.rs
100644 blob 6d60657097b349ea80323fdb4595e1105a4b1316	contracts/ckb-bitcoin-spv-type-lock/src/utilities/mod.rs
100644 blob a8cb5f5f9a26fa84c78a9bd9b4f788f1c9383665	contracts/ckb-bitcoin-spv-type-lock/src/utilities/type_id.rs
```

Production checksum: SHA256 `481b173ca6d264c4c447210fae466ef4a2f9d7a78f5d6fd07dda4d61cf1bf34c`; reviewed master: `d85e11c31261d9f34b47f839ddc49e135632fd751667b0c63b167a2a017a7999`. Existing hand-verified binary evidence is preserved, not relabeled as a fresh verification.

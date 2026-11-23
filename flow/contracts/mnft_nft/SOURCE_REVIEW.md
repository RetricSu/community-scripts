# mnft_nft: issue #19 source/deployment review

Reviewed 2026-11-19 (Asia/Shanghai).

## 结论 / Decision

官方 wiki 仍固定 Lina=b5af002、Aggron=d0a844d；与 HEAD 的差异为格式/导入整理及 helper 内 CLASS_TYPE_CODE_HASH 从 Lina 改为 Aggron。不能用 Aggron 常量替换主网；维持按网络选择 class hash，数据布局、转换和错误码不变。

Official wiki still pins Lina=b5af002 and Aggron=d0a844d. HEAD differs by formatting/import cleanup and switching helper CLASS_TYPE_CODE_HASH from Lina to Aggron. Do not replace the mainnet constant with Aggron; retain network-specific class hashes, layouts, transitions and errors.

- Described/deployment source: `b5af002e78eb2ff375ce098cde24d77ff414822c` (unchanged).
- Reviewed upstream: `88caddde5489ce019fab3e5f811eb4f869d7f139`. This is **not** a deployment or reproducible-build pin.
- Existing network/hash-type/code-hash matches, cell_deps and binary verification statuses are retained.
- Read-only `check-deployments.js` is used to check current chain state; no new binary was built or independently reproduced.
- Evidence: 
  - https://github.com/nervina-labs/ckb-nft-scripts/wiki/Lina-Mainnet-deployment
  - https://github.com/nervina-labs/ckb-nft-scripts/wiki/Aggron-Testnet-deployment
  - https://github.com/nervina-labs/ckb-nft-scripts/compare/b5af002e78eb2ff375ce098cde24d77ff414822c...88caddde5489ce019fab3e5f811eb4f869d7f139

## Exact tracked source trees

### deployment source `b5af002e78eb2ff375ce098cde24d77ff414822c`

```text
100644 blob 12de8180c6f39f638bb19c6141a81b15b2ecaef0	contracts/nft-type/src/entry.rs
100644 blob 2f34ee6b09c95f7f67ff8e4b2349f70707db6da9	contracts/nft-type/src/validator.rs
100644 blob 8fff2e17421b2e11f5f1391ca7fe7802c464ac45	contracts/script-utils/src/class.rs
100644 blob 96c289160d9b45235ee948d79b5645c8da9cb5d0	contracts/script-utils/src/error.rs
100644 blob 6f60da03e6c1072bdeaacc18f06332eb32b18b3c	contracts/script-utils/src/helper.rs
100644 blob b8e3f9299560128d0068c0ec9e2490337e550898	contracts/script-utils/src/nft.rs
```

### reviewed upstream `88caddde5489ce019fab3e5f811eb4f869d7f139`

```text
100644 blob 38895bfc276f94ed8a2cb74fe1b891f2a23df941	contracts/nft-type/src/entry.rs
100644 blob 2701418b760c73e624100c25c41184d1886f5025	contracts/nft-type/src/validator.rs
100644 blob 8fff2e17421b2e11f5f1391ca7fe7802c464ac45	contracts/script-utils/src/class.rs
100644 blob 96c289160d9b45235ee948d79b5645c8da9cb5d0	contracts/script-utils/src/error.rs
100644 blob 87829f8f2fdf4bf73f6f3055975150c331aa2c5a	contracts/script-utils/src/helper.rs
100644 blob b8e3f9299560128d0068c0ec9e2490337e550898	contracts/script-utils/src/nft.rs
```

Wiki HEAD read: `658f5f2e272aa4b2d46754235c0059f6b9e6f80b`. Testnet source variant: `d0a844def34df6b05b7b8e260a6225a477f1bf39`. Mainnet class hash remains `0xd51e6eaf48124c601f41abe173f1da550b4cbca9c6a166781906a287abbb3d9a`; testnet remains `0x095b8c0b4e51a45f953acd1fcd1e39489f2675b4bc94e7af27bb38958790e3fc`.

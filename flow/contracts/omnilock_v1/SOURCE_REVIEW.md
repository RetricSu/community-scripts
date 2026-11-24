# omnilock_v1: issue #19 source/deployment review

Reviewed 2026-11-19 (Asia/Shanghai).

## 结论 / Decision

V1 源码已迁仓删除；build.rs 原有主网 hash 为 f18e…dee5。HEAD 的共享 identity 多签数组修复不证明 V1 已升级；V2 已有独立 omnilock 插件。继续保留 V1 认证方式及部署；testnet/Force Bridge 二进制的精确源码仍未证实。

V1 files were removed on repository migration; the old build.rs records mainnet hash f18e…dee5. A later shared-identity multisig array fix is not evidence of a V1 upgrade; V2 has its own omnilock plugin. Retain V1 auth/deployments; exact source of testnet/Force Bridge binaries remains unproven.

- Described/deployment source: `ddaeae8f065a5b600805b46d75c53de9bf290e68` (unchanged).
- Reviewed upstream: `26b0b4f15bb6eeb268b70d7ae006e244b7c06649`. This is **not** a deployment or reproducible-build pin.
- Existing network/hash-type/code-hash matches, cell_deps and binary verification statuses are retained.
- Read-only `check-deployments.js` is used to check current chain state; no new binary was built or independently reproduced.
- Evidence: 
  - https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/README.md
  - https://github.com/nervosnetwork/ckb-production-scripts/blob/ddaeae8f065a5b600805b46d75c53de9bf290e68/build.rs
  - https://github.com/nervosnetwork/ckb-production-scripts/compare/ddaeae8f065a5b600805b46d75c53de9bf290e68...26b0b4f15bb6eeb268b70d7ae006e244b7c06649

## Exact tracked source trees

### deployment source `ddaeae8f065a5b600805b46d75c53de9bf290e68`

```text
100644 blob 02eeed1190b918d965deec683d1d76c71c4c9c5f	build.rs
100644 blob 537da88bce1ce50dd6bf56ae628c8a525d7c2523	c/ckb_identity.h
100644 blob 7199bfc407c645628db71341bf051dc3c424b731	c/omni_lock.c
100644 blob 58fb7558828a5e7e8049dd13bfdd35c28950707b	c/omni_lock_acp.h
100644 blob 0fc61bc1ccaab7efc031f3b0319cd4595e44f577	c/omni_lock_supply.h
100644 blob de9df574f6342fdbc7d7e783485534368eb43a7f	c/omni_lock_time_lock.h
```

### reviewed upstream `26b0b4f15bb6eeb268b70d7ae006e244b7c06649`

```text
100644 blob 035960775d26794c30b9436b8bca0249218a449b	build.rs
100644 blob be8ba600307a6fc7be13b62dfb31e36171275478	c/ckb_identity.h
```

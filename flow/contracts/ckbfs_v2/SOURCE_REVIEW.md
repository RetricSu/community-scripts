# ckbfs_v2: issue #19 source/deployment review

Reviewed 2026-11-19 (Asia/Shanghai).

## 结论 / Decision

README 仍将 V2 部署标为 20241025.db973a8e8032；HEAD 是 V3，新增链式 witness、前序位置校验和 110–112 错误码，并更换 adler32 hash。V3 已由 ckbfs_v3 独立描述，V2 继续保留旧 schema / checksum 规则。

README still identifies V2 deployments as 20241025.db973a8e8032. HEAD is V3: linked witnesses, previous-position validation, errors 110–112 and another adler32 hash. V3 is already described by ckbfs_v3; retain V2 schema and checksum rules.

- Described/deployment source: `db973a8e80322b2bc50b0096c97b0ce7531cfb01` (unchanged).
- Reviewed upstream: `4ee6689bf7ec2515df95311a05a9cdc709f358cb`. This is **not** a deployment or reproducible-build pin.
- Existing network/hash-type/code-hash matches, cell_deps and binary verification statuses are retained.
- Read-only `check-deployments.js` is used to check current chain state; no new binary was built or independently reproduced.
- Evidence: 
  - https://github.com/code-monad/ckbfs/blob/4ee6689bf7ec2515df95311a05a9cdc709f358cb/README.md
  - https://github.com/code-monad/ckbfs/tree/v3
  - https://github.com/code-monad/ckbfs/compare/db973a8e80322b2bc50b0096c97b0ce7531cfb01...4ee6689bf7ec2515df95311a05a9cdc709f358cb

## Exact tracked source trees

### deployment source `db973a8e80322b2bc50b0096c97b0ce7531cfb01`

```text
100644 blob 0a05a346eb3ba0e8abf15dfd6c82aefb2067dad0	contracts/ckb-adler32/src/process.rs
100644 blob b7c8c1452c1ebd3f6376843732a3a47578fc362f	contracts/ckb-adler32/src/utils.rs
100644 blob 5423bbfe6358c125f041a60e23524a98ba790ac7	contracts/ckbfs/src/entry.rs
100644 blob c9746c40489e1f7add429bace87b78e4aab9456c	contracts/ckbfs/src/error.rs
100644 blob 8718af7323ddf2c4a57a57cd71b4e20078017abf	contracts/ckbfs/src/hash.rs
```

### reviewed upstream `4ee6689bf7ec2515df95311a05a9cdc709f358cb`

```text
100644 blob c8cdd9d2834769f9a20f9386863f5ddcbdebbd6b	contracts/ckb-adler32/src/process.rs
100644 blob e528986478e69ea94f61db72dec743da0b98279c	contracts/ckb-adler32/src/utils.rs
100644 blob 7abb71247d8ac3e65165559618c9b99fc9065196	contracts/ckbfs/src/entry.rs
100644 blob 4f3f66aad312d20d7cf3379e77fb4897e3c3f722	contracts/ckbfs/src/error.rs
100644 blob bcdb2383dd578bc8d90ae482e72a042a37a147e7	contracts/ckbfs/src/hash.rs
```

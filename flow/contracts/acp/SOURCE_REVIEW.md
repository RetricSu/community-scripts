# acp: issue #19 source/deployment review

Reviewed 2026-11-19 (Asia/Shanghai).

## 结论 / Decision

旧仓库删除 ACP 是迁仓，不是旧部署升级；README 指向 nervosnetwork/anyone-can-pay。保留 RFC 0026 部署与 e570c11 源码；本次修正离线解码器的饱和最小值和输入数边界。

ACP was removed on repository migration, not an upgrade of the old deployment; README points to nervosnetwork/anyone-can-pay. Retain RFC 0026 deployments and e570c11 source; correct decoder saturation and input-count boundary.

- Described/deployment source: `e570c11aff3eca12a47237c21598429088c610d5` (unchanged).
- Reviewed upstream: `26b0b4f15bb6eeb268b70d7ae006e244b7c06649`. This is **not** a deployment or reproducible-build pin.
- Existing network/hash-type/code-hash matches, cell_deps and binary verification statuses are retained.
- Read-only `check-deployments.js` is used to check current chain state; no new binary was built or independently reproduced.
- Evidence: 
  - https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/README.md
  - https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md
  - https://github.com/nervosnetwork/ckb-production-scripts/compare/e570c11aff3eca12a47237c21598429088c610d5...26b0b4f15bb6eeb268b70d7ae006e244b7c06649

## Exact tracked source trees

### deployment source `e570c11aff3eca12a47237c21598429088c610d5`

```text
100644 blob 889c0693da26263dbeacafd94d7a202f54edc83d	c/anyone_can_pay.c
100644 blob 3f24b192fe0e6a2537ecc3f89c8e357951f6760e	c/defs.h
100644 blob 48f7e14fb0d9f4e7afce92a4ebdb2099e18bc509	c/overflow_add.h
100644 blob 752d2e4ce9848177acd2c10544b955908bab7edc	c/quick_pow10.h
100644 blob 83f6caf299c712606aa19a10c63a1664b0e872f3	c/secp256k1_lock.h
```

### reviewed upstream `26b0b4f15bb6eeb268b70d7ae006e244b7c06649`

```text
(tracked files removed)
```

## Decoder corrections / 解码修正

`quick_pow10.h` saturates overflowing exponents to MAX64/MAX128; zero-to-MAX remains possible. `overflow_add.h` rejects bounded addition overflow. The wallet loop checks `i >= 256` before probing end-of-input, so exactly 256 inputs fails. Both assets may meet their respective thresholds. Regressions: `node --test tests/acp.test.js`.

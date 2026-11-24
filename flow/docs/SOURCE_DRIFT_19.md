# Issue #19: source and deployment synchronization / 源码与部署同步

Review date: 2026-11-19 (Asia/Shanghai). Scope: [issue #19](https://github.com/gpBlockchain/ckb-contract-flow-html/issues/19).

## 结论 / Outcome

这 7 条是历史部署版本与上游默认分支的差异，不是发现了 7 次链上升级。
保留旧部署的识别能力，不把 HEAD 伪装成已部署源码。每个合约的双语说明、
精确源码 tree/blob 记录和证据见 `contracts/<id>/SOURCE_REVIEW.md`。
ACP 解码器发现并修复了饱和最小值、加法溢出边界和 256 个输入的边界问题。
本次没有增加任何未经验证的部署哈希，没有复现编译，也没有把已有 unverified 升为 verified。

The seven entries compare historical deployment versions with default-branch source;
they are not seven demonstrated on-chain upgrades. Keep legacy matches and accurate
source pins. Per-contract bilingual notes and exact source-tree evidence are in
`contracts/<id>/SOURCE_REVIEW.md`. ACP's decoder now reproduces saturating minima,
bounded addition and the strict input-count boundary. No new deployment hashes or
reproducible-build claims are introduced; no unverified binary is promoted to verified.

## Changed source paths / 源码路径确实变化

| Contract | Retained described/deployment source | Reviewed upstream (not a deployment pin) | Decision |
|---|---|---|---|
| [acp](../contracts/acp/SOURCE_REVIEW.md) | `e570c11aff3eca12a47237c21598429088c610d5` | `26b0b4f15bb6eeb268b70d7ae006e244b7c06649` | Repository migration/removal; retain RFC 0026; fix decoder arithmetic and <256 inputs. |
| [btc_spv_type_lock](../contracts/btc_spv_type_lock/SOURCE_REVIEW.md) | `f3e3ba846c1de580ae7f0720cbb64df13036b80a` | `94f5606bf3a80c201dc1bd341d739c32c1a29198` | Production/tag still f3e3ba8; later master destroy/reset/verifier changes and checksum differ. |
| [ckbfs_v2](../contracts/ckbfs_v2/SOURCE_REVIEW.md) | `db973a8e80322b2bc50b0096c97b0ce7531cfb01` | `4ee6689bf7ec2515df95311a05a9cdc709f358cb` | HEAD is V3 (already separate ckbfs_v3 plugin); retain V2 witness/data rules. |
| [mnft_class](../contracts/mnft_class/SOURCE_REVIEW.md) | `b5af002e78eb2ff375ce098cde24d77ff414822c` | `88caddde5489ce019fab3e5f811eb4f869d7f139` | Formatting/import cleanup plus Lina → Aggron helper class constant; retain network variants. |
| [mnft_issuer](../contracts/mnft_issuer/SOURCE_REVIEW.md) | `b5af002e78eb2ff375ce098cde24d77ff414822c` | `88caddde5489ce019fab3e5f811eb4f869d7f139` | Formatting/import cleanup plus Lina → Aggron helper class constant; retain network variants. |
| [mnft_nft](../contracts/mnft_nft/SOURCE_REVIEW.md) | `b5af002e78eb2ff375ce098cde24d77ff414822c` | `88caddde5489ce019fab3e5f811eb4f869d7f139` | Formatting/import cleanup plus Lina → Aggron helper class constant; retain network variants. |
| [omnilock_v1](../contracts/omnilock_v1/SOURCE_REVIEW.md) | `ddaeae8f065a5b600805b46d75c53de9bf290e68` | `26b0b4f15bb6eeb268b70d7ae006e244b7c06649` | Migration/removal + later shared multisig fix; retain V1, do not transplant V2. |

For mNFT the official wiki still names mainnet source
`b5af002e78eb2ff375ce098cde24d77ff414822c` and testnet source
`d0a844def34df6b05b7b8e260a6225a477f1bf39`; using HEAD's Aggron
class constant for Lina would be incorrect. BTC SPV's production branch is still
`f3e3ba846c1de580ae7f0720cbb64df13036b80a` and its checksum differs
from master. CKBFS V3 already has a separate plugin: this is not a reason to
reinterpret V2 cells using V3's witness linkage or errors 110–112.

## Remaining upstream-only entries / 其余条目

Exact tracked paths were compared, including rename-away detection. All comparisons
below were `ahead` with fewer than 300 changed files (the GitHub comparison cap).
None of the tracked source paths changed; do not repin or re-credit these contracts
just because tests, documentation or other scripts changed in their repository.
The iCKB comparisons now resolve successfully (the older issue printed `?`).

下列条目的 tracked paths 均未变化，因此不为了消除“仓库领先”提示而改源码 pin。
表中 ahead 只是仓库提交数；不表示协议、已部署二进制或依赖树已升级。

| Contract | Retained pin | Observed upstream HEAD | Ahead | Tracked paths |
|---|---|---|---:|---|
| `crowdcell_campaign` | `acbb40ed1426bc8c763eb29c12a83e4bb391b654` | `78f8ec6babae7d5d344d90dda1afb12cc4429fd1` | 18 | `contracts/campaign/src/main.rs` |
| `crowdcell_campaign_lock` | `acbb40ed1426bc8c763eb29c12a83e4bb391b654` | `78f8ec6babae7d5d344d90dda1afb12cc4429fd1` | 18 | `contracts/campaign-lock/src/main.rs` |
| `crowdcell_pledge` | `acbb40ed1426bc8c763eb29c12a83e4bb391b654` | `78f8ec6babae7d5d344d90dda1afb12cc4429fd1` | 18 | `contracts/pledge/src/main.rs` |
| `crowdcell_pledge_lock` | `acbb40ed1426bc8c763eb29c12a83e4bb391b654` | `78f8ec6babae7d5d344d90dda1afb12cc4429fd1` | 18 | `contracts/pledge-lock/src/main.rs` |
| `crowdcell_receipt` | `acbb40ed1426bc8c763eb29c12a83e4bb391b654` | `78f8ec6babae7d5d344d90dda1afb12cc4429fd1` | 18 | `contracts/receipt/src/main.rs` |
| `dotbit_income` | `0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370` | `5186304bd7d1f5b8b8507b6d46a121883d31b050` | 1 | `contracts/income-cell-type/src/entry.rs`, `libs/das-core/src/verifiers/misc.rs`, `libs/das-core/src/verifiers/common.rs`, `libs/das-core/src/error.rs`, `.env.mainnet`, `.env.testnet2` |
| `dotbit_reverse_record` | `0cc9fbf51bd508a0c8f532a9e43bb7cb17b79370` | `5186304bd7d1f5b8b8507b6d46a121883d31b050` | 1 | `contracts/reverse-record-cell-type/src/entry.rs`, `libs/das-core/src/verifiers/misc.rs`, `libs/das-core/src/verifiers/common.rs`, `libs/das-core/src/error.rs` |
| `ickb_logic` | `c951927e35fb5d4a13e28c5e55687d49cea7ca05` | `567e95c96883b3daa69ba6ad41f89b4df4f1cd46` | 63 | `scripts/contracts/ickb_logic/src` |
| `limit_order` | `c951927e35fb5d4a13e28c5e55687d49cea7ca05` | `567e95c96883b3daa69ba6ad41f89b4df4f1cd46` | 63 | `scripts/contracts/limit_order/src` |
| `noir_owned_counter` | `bf09ccfa8bf2e474b98d47a23440a6ed29a1af07` | `e4ba787626031a8bed92beaa567a87fe51a6b5f8` | 17 | `contracts/crates/owned-counter/src/main.rs`, `contracts/crates/owned-counter/build.rs`, `crates/artifact-adapter/src/wire.rs`, `circuits/owned-counter-v1/src/main.nr` |
| `owned_owner` | `c951927e35fb5d4a13e28c5e55687d49cea7ca05` | `567e95c96883b3daa69ba6ad41f89b4df4f1cd46` | 63 | `scripts/contracts/owned_owner/src` |
| `sudt` | `e570c11aff3eca12a47237c21598429088c610d5` | `26b0b4f15bb6eeb268b70d7ae006e244b7c06649` | 8 | `c/simple_udt.c` |
| `type_id` | `426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9` | `94a30121031180eaf9684eb4d5ab1882a070e2a9` | 8 | `script/src/type_id.rs` |
| `zero_lock` | `426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9` | `94a30121031180eaf9684eb4d5ab1882a070e2a9` | 8 | `script/src/types.rs`, `script/src/error.rs` |

## Review boundaries / 审阅边界

- `source.commit` continues to mean the version the plugin describes. A bounded,
  evidence-backed `source.upstream_review` only acknowledges differences up to its
  exact commit. The drift checker still reports both pins and reasons, checks the
  chain independently and flags future tracked-path changes. A changed source
  repo/pin/path list invalidates the review; unreadable/diverged/capped comparisons
  fail closed. See [ADD_CONTRACT.md](ADD_CONTRACT.md).
- Existing official deployment records are checked against the live chain without
  rewriting metadata. The BTC SPV SHA256 evidence was already hand-verified before
  this task and is preserved, not represented as a new binary verification.
- ACP, V2 CKBFS, mNFT and V1 Omnilock remain `unverified` for reproducible source-to-
  binary provenance. Omnilock V1 testnet / Force Bridge exact source remains unproven;
  the existing plugin already labels this caveat. No new compatibility claim is made.
- Upstream-only means unchanged **recorded source paths**, not a complete build-
  dependency audit. No claim is made that every repository dependency is unchanged.

部署 pin 与上游审阅 pin 分开记录；后续源码变化仍会告警，链上校验不豁免。
原有未复现构建、V1 testnet / Force Bridge 源码不明等限制如实保留。
“路径未变”仅指记录的路径，不等于做过全量依赖审计。

## Reproduce / 复查

```sh
node --test tests/*.test.js
node gen.js --all out
node scripts/check.js
node scripts/test-tx.js
node scripts/check-deployments.js --report drift.md
```

Generated `out/` files are intentionally not committed.

## Additional findings from the full scan / 全量扫描额外发现

- The iCKB compare response is 1,188,872 bytes, exceeding Node's old 1 MiB
  `execFileSync` buffer. That explains the issue's `?` and later unreadable-compare
  warnings despite a valid API response. Increase the bounded buffer to 32 MiB,
  add a 60-second subprocess timeout and cache identical GitHub reads per scan.
  This is not a source pin update.
- Full scan also discovered **new drift outside #19**: `groth16_verifier`,
  `e969ad154ea2c00df57f68238ddfbcbc9ceb1419` →
  `06a6ba8db1704b2838306e753cbaeaa678743baf` in
  `script/crates/verifier-core/src/lib.rs`. The new source uses a single-product
  pairing check and an explicit decoded input-count guard. It is not silently
  acknowledged here: the drift warning remains. Existing source/binary provenance
  for its old testnet deployment is already unverified. This needs its own review,
  not an automatic deployment upgrade or a blanket suppression.

全量扫描另发现 groth16_verifier 的新源码变化（不在 #19 原始条目中），本 PR 不冒充
已同步该实现，继续保留告警。iCKB 的问号则是比较响应超过旧 1 MiB 缓冲区，已修复读取。

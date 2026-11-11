# CKB 核心合约安全监控与预警系统

实现对应 `docs/SECURITY_MONITORING_PLAN.md`。`src/deployments/*.json` 仍然是唯一的规范部署基线，爬虫规则、别名和白名单均放在适配器或独立配置中。

## 快速开始

```bash
pnpm install
pnpm run build

# 一次完整巡检（主网 + 测试网，所有来源）
pnpm run monitor -- --no-notify

# 只巡检主网，指定来源
node dist/src/index.js monitor --network mainnet \
  --sources onchain-rpc,docs-nervos,rfcs-nervos,ckb-explorer,sdk-ccc \
  --no-notify

# 持续守护，每 30 分钟一次
node dist/src/index.js monitor --watch 1800

# 只跑链上升級追踪；只有白名单升級才允许写回基线
pnpm run monitor:upgrade -- --network mainnet --apply --no-notify
```

报告写入 `results/`：

- `monitor-<timestamp>.json`：完整差异、风险级别、升級 hop、签名 Lock 和 Witness 大小。
- `latest-report.json`：最近一次完整报告。
- `latest-status.json`：给状态页 / CI 使用的摘要。
- `monitor-state.json`：来源连续失败次数和通知去重状态。

默认 `--fail-on P0`，发现 P0 时进程返回非零；可用 `--fail-on P1`、`P2` 或 `none` 调整。巡检过程中单个来源失败会被记录为 P2，不会阻断其他来源。

## 来源与适配器

| 来源 | 适配器 | 说明 |
| --- | --- | --- |
| 链上 RPC | `onchain-rpc` | 逐个检查基线 OutPoint、dep group 成员、DataHash、TypeHash 和 Type ID 当前 Live Cell |
| 官方文档 | `docs-nervos` | 从 `nervosnetwork/docs.nervos.org` 的 Markdown/MDX 源读取 `ecosystem-scripts` 表格 |
| Nervos RFC | `rfcs-nervos` | 读取 RFC-0024/0025/0026/0042/0052 的部署表格 |
| CKB Explorer | `ckb-explorer` | `/api/v2/scripts` + `/api/v2/scripts/general_info`，校验 OutPoint 和死 Cell 标记 |
| CCC SDK | `sdk-ccc` | 复用 `@ckb-ccc/core` 静态脚本表；原 `CCCValidator` 已委托给此适配器 |

新增来源只需实现 `ScriptSourceAdapter.fetchScripts(network)`，输出 `NormalizedScriptInfo[]`，不需要修改部署 JSON 或风险引擎。

### 链上升級追踪

当基线 Cell 死亡时，`UpgradeTracker`：

1. 读取创建交易，取得 Type ID / Lock、旧 DataHash 和大小。
2. 使用 CKB Indexer 按 Type Script（优先）或 Lock Script 查找消费交易，并逐一确认 input 的 `previousOutput`，避免只凭交易列表误判。
3. 沿相同 Type ID 的 successor Cell 追踪多 hop，记录新 OutPoint、DataHash、大小、区块、输入 Lock 和 Witness 大小。
4. 消费交易不在白名单时产生 P0；白名单升級产生 P1，并可用 `--apply` 写回基线，交给 PR 审核。

白名单内置于 `src/engine/upgrade-tracker.ts`，也可以通过 `UPGRADE_WHITELIST_FILE` 提供 JSON 数组：

```json
[
  {
    "scriptName": "omnilock",
    "network": "mainnet",
    "txHash": "0x...consuming-transaction...",
    "newDataHash": "0x...optional...",
    "note": "Official upgrade announcement link"
  }
]
```

**白名单必须基于官方公告和人工审计填写，不要把未知升級直接加入。** `--force` 仅供人工确认后的紧急情况使用。

报告中的每个升级事件都包含首笔消费交易的 `upgradedAt`（ISO 时间）、`upgradedBlock`、`consumingTxHash`、`oldLock`、`newLock` 和 `signerLocks`；控制台摘要也会简短打印这些字段。多 hop 的完整细节仍在 `hops` 中。

已根据官方仓库 migration 记录核对并加入白名单的 Nostr 主网迁移：

- `nostr_binding`：2026-01-14 05:10:21 UTC（区块 18373321），交易 `0x86d21ad7…`，migration `2026-01-14-050950.json`。
- `nostr_lock`：2026-01-14 05:17:51 UTC（区块 18373370），交易 `0x99b116dd…`，migration `2026-01-14-051715.json`。
- 两者官方记录均为 `cryptape/nostr-binding` 仓库 `deployment/mainnet/*/migrations/` 下的文件；旧 Cell 和新 Cell 的 multisig Lock args 分别为 `0xd4ade5100cf112c9cd3e8da12ae5fc6153293087` 与 `0x269ca034aa160f5265b65318123047bee882f244`。

## 通知渠道

通过环境变量启用，未配置的渠道自动跳过；同一指纹默认 24 小时内不重复通知，风险级别变化会立即再次通知。

| 渠道 | 环境变量 | 默认阈值 |
| --- | --- | --- |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | P1 |
| 飞书 / Lark | `FEISHU_WEBHOOK_URL`, 可选 `FEISHU_SECRET` | P1 |
| Discord | `DISCORD_WEBHOOK_URL` | P1 |
| GitHub Issue | `GITHUB_TOKEN`, `GITHUB_REPOSITORY=owner/repo` | P1 |
| 通用 Webhook（短信/电话网关） | `ALERT_WEBHOOK_URL`, 可选 `ALERT_WEBHOOK_BEARER_TOKEN` | P0 |

可用 `TELEGRAM_MIN_LEVEL`、`FEISHU_MIN_LEVEL`、`DISCORD_MIN_LEVEL`、`GITHUB_ISSUE_MIN_LEVEL`、`ALERT_WEBHOOK_MIN_LEVEL` 覆盖阈值。GitHub Issue 使用 `ckb-monitor` 标签和正文指纹去重；生产环境建议使用专门的告警仓库。

RPC 和文档源可配置：

- `CKB_MAINNET_RPC_URL`, `CKB_TESTNET_RPC_URL`
- `CKB_MAINNET_EXPLORER_API`, `CKB_TESTNET_EXPLORER_API`
- `DOCS_REPO`, `DOCS_REF`, `DOCS_PATH`, `RFCS_REPO`, `RFCS_REF`
- `DEPLOYMENTS_DIR`, `UPGRADE_WHITELIST_FILE`, `GITHUB_TOKEN`（提高 GitHub Raw/API 限额）

## 风险口径与已知边界

- 外部源的 `code_hash` 与链上实际哈希不一致按 P0 报疑似投毒；引用死 Cell 按 P1，因为交易会失败。
- 不同但仍活着的部署 Cell 单独报告为 drift；直接指向不匹配代码的 `code` Cell 报 P0，额外辅助 dep group 报 P2，避免把 CCC 的 secp256k1 依赖误报为 Omnilock 恶意代码。
- 基线中 `dataHash` / `typeHash` 为 `"0x"` 或空字符串表示尚未记录，不参与相等判断，只产生补全提示。
- 公共 RPC、Explorer 和文档仓本身都是外部信任边界；高安全环境应使用自建节点 / 多 RPC 交叉验证，并人工复核 P0。
- 非 Type ID Cell 被消费时无法可靠证明“升級 successor”，系统会报告销毁或无法追踪，要求人工审计，而不会自动改写基线。

## 自动化

`.github/workflows/security-monitor.yml` 每 30 分钟运行一次，上传报告并缓存通知状态。若 `monitor upgrade --apply` 产生经过白名单校验的基线变更，工作流通过 `create-pull-request` 生成审核 PR，不会直接推送 master。

单元测试：

```bash
pnpm test
pnpm run build
```

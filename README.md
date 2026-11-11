# CKB 核心合约链上安全防篡改与升级监测预警系统

CKB 核心合约链上安全防篡改与升级监测预警系统是一套面向 Nervos CKB 生态核心合约的自动化安全防护基础设施。系统以 `src/deployments/*.json` 作为**唯一规范部署基线（Canonical Deployment Baseline）**，通过持续抓取链上真实状态与生态权威来源，进行多源交叉比对、Type ID 升级溯源以及风险分级评估，并在出现异常篡改、供应链投毒或合约升级时通过多渠道实时告警。

> 提示：原 SDK 动态发现与测试能力已保留为系统的[附属/兼容功能](#附属功能sdk-动态发现与测试)，满足多场景验证需求。

---

## 快速开始

```bash
# 1. 安装依赖与构建
pnpm install
pnpm run build

# 2. 运行离线单元测试
pnpm test

# 3. 运行完整安全巡检（同时覆盖主网与测试网，不发送外部通知，容忍风险退出码）
pnpm run monitor -- --network both --no-notify --fail-on none
```

### 巡检报告与状态文件

巡检完成后，结果将保存在 `results/` 目录下：

- **`results/latest-report.json`**：最近一次完整多源巡检报告，包含各来源比对差异、P0-P3 风险事件详情、Type ID 升级溯源链路及签名 Lock 信息。`monitor upgrade` 不会覆盖此文件。
- **`results/latest-status.json`**：精简版状态摘要，提供给状态监控看板、健康检查探针或 CI 门禁直接消费，同样只由完整巡检更新。
- **`results/monitor-<timestamp>.json`**：每次巡检（含 upgrade 子命令）生成的带时间戳历史归档报告。
- **`results/monitor-state.json`**：记录数据源连续失败计数与通知指纹去重状态。

---

## 核心监控机制

### 1. 五类多源交叉对比 (Sources & Adapters)

系统解耦了数据获取与安全比对逻辑，通过适配器定期采集 5 类权威来源：

| 来源类别 | 适配器标识 | 采集内容与说明 |
| --- | --- | --- |
| **链上 RPC** | `onchain-rpc` | 直接连接 CKB 节点，逐一核验基线 OutPoint、dep group 成员、DataHash、TypeHash 以及 Type ID 当前 Live Cell 状态 |
| **官方文档** | `docs-nervos` | 解析 `nervosnetwork/docs.nervos.org` 中的 `ecosystem-scripts` 部署表格 |
| **Nervos RFC** | `rfcs-nervos` | 解析 RFC-0024/0025/0026/0042/0052 等规范文档中的部署表格 |
| **CKB Explorer** | `ckb-explorer` | 调用 Explorer API (`/api/v2/scripts` 及 `/general_info`) 校验脚本 OutPoint 与死 Cell 标记 |
| **CCC SDK** | `sdk-ccc` | 读取 `@ckb-ccc/core` 静态脚本表，跨 SDK 校验核心脚本元数据一致性 |

### 2. P0 - P3 风险分级模型

风险评估引擎对所有比对差异实施结构化分级：

- **`P0_CRITICAL`（严重风险）**：
  - **代码哈希不匹配**：外部文档、SDK 或 Explorer 声明的 `code_hash` 与链上实际代码不一致（疑似恶意篡改或外部供应链投毒）。
  - **未授权升级**：合约 Type ID 被消费并生成了新 Cell，但该消费交易不在白名单中。
  - **部署 Cell 销毁**：合约 Cell 被消费且未能找到持有相同 Type ID 的 successor Cell。
- **`P1_HIGH`（高风险）**：
  - **引用死 Cell**：外部文档或 SDK 引用了链上已死亡的 Cell（将直接导致用户交易组装或验证失败）。
  - **授权升级事件**：合约发生了符合官方白名单记录的正常链上升级，提醒同步基线。
- **`P2_MEDIUM`（中风险）**：
  - **CellDep 漂移**：存在额外的辅助 dep group 成员，或指向了可用的同代码备用 Live Cell。
  - **基线未记录**：规范基线中缺少 DataHash/TypeHash 初始记录（触发补全提示）。
  - **单一来源故障**：个别外部 API/文档网络请求失败（不阻断其他数据源巡检）。
- **`P3_LOW`（低风险/建议）**：
  - 格式不规范、非关键字段缺失等非阻塞性改进建议。

### 3. Type ID 升级追踪与白名单 PR

对于采用 Type ID 管理的核心合约，当部署 Cell 被链上消费时，`UpgradeTracker` 通过 CKB Indexer 沿 Type ID 链路自动进行多跳（hop）深度溯源：

- **完整审计要素记录**：
  - **升级时间**（`upgradedAt`）与**区块高度**（`upgradedBlock`）
  - **消费交易哈希**（`consumingTxHash`）
  - **旧 / 新 Cell Lock**（`oldLock` / `newLock`，包括 script hash 与 multisig args）
  - **输入签名 Lock**（`signerLocks`）与 Witness 尺寸
- **白名单机制**：
  - 升级交易必须经官方公告与人工安全审计后，方可写入白名单（内置于 `src/engine/upgrade-tracker.ts` 或通过 `UPGRADE_WHITELIST_FILE` 注入）。
  - **未授权升级（P0）**：直接触发严重警报并阻断自动化流程。
  - **白名单升级（P1）**：运行 `pnpm run monitor:upgrade -- --network mainnet --apply` 更新规范基线，并在 CI 中自动生成 GitHub Pull Request 交由核心团队人工审查，杜绝未审计代码静默写入 master 分支。

---

## 多渠道预警通知

系统支持主流通讯软件与工单平台的实时告警，未配置环境变量的渠道将自动跳过。报警具备指纹去重机制（相同问题 24 小时内不重复发送，风险级别跃升时立即再次通知）。

| 渠道 | 环境变量配置入口 | 默认告警阈值 | 说明 |
| --- | --- | --- | --- |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | P1 | 支持群组与私聊推送，附带风险等级与事件摘要 |
| **飞书 / Lark** | `FEISHU_WEBHOOK_URL`, `FEISHU_SECRET` (可选) | P1 | 富文本卡片格式，支持签名安全校验 |
| **Discord** | `DISCORD_WEBHOOK_URL` | P1 | Webhook Embed 卡片消息 |
| **GitHub Issue**| `GITHUB_TOKEN`, `GITHUB_REPOSITORY` (`owner/repo`) | P1 | 自动打标 `ckb-monitor`，按指纹去重更新或新建 Issue |
| **通用 Webhook** | `ALERT_WEBHOOK_URL`, `ALERT_WEBHOOK_BEARER_TOKEN` (可选) | P0 | 标准 JSON POST，适用于短信、电话网关或 PagerDuty |

各渠道最低告警阈值均可通过 `*_MIN_LEVEL`（如 `TELEGRAM_MIN_LEVEL=P0`）单独覆盖。

> 完整配置选项、节点 RPC 镜像与更多高级用法请参阅 **[`docs/SECURITY_MONITORING.md`](docs/SECURITY_MONITORING.md)**。

---

## 架构设计

项目采用分层解耦架构，核心模块分布如下：

```
src/
├── adapters/                    # 多源数据采集适配器
│   ├── base.ts                  # 适配器基类与统一数据接口
│   ├── docs/                    # Nervos 官方文档与 RFC 表格解析
│   │   ├── ckb-docs-adapter.ts
│   │   ├── markdown-table-parser.ts
│   │   └── rfcs-adapter.ts
│   ├── explorer/                # CKB Explorer API 适配器
│   │   └── explorer-api-adapter.ts
│   ├── onchain/                 # 链上 RPC 实时状态与 Type ID 提取
│   │   └── ckb-rpc-adapter.ts
│   └── sdk/                     # SDK 静态脚本表适配器
│       └── ccc-sdk-adapter.ts
├── cli/                         # 命令行接口与参数解析 (Commander)
│   ├── argv.ts                  # CLI 参数清洗与 pnpm 参数解耦
│   └── monitor.ts               # monitor 及 upgrade 命令行指令
├── deployments/                 # 唯一规范部署基线 (24+ 核心合约规范 JSON)
├── engine/                      # 核心监控与分析引擎
│   ├── baseline.ts              # 规范部署基线加载与只读校验
│   ├── baseline-writer.ts       # 规范部署基线安全写回器
│   ├── monitor.ts               # 巡检流程编排与调度器
│   ├── risk-evaluator.ts        # P0-P3 风险分级评估器
│   ├── state.ts                 # 连续故障状态与通知去重缓存
│   ├── upgrade-tracker.ts       # Type ID 链上升级深度追踪与白名单
│   └── verifier.ts              # 多源交叉比对与漂移检测
├── notifier/                    # 多渠道预警通知系统
│   ├── discord.ts               # Discord Webhook 通知
│   ├── feishu.ts                # 飞书机器人通知
│   ├── github-issue.ts          # GitHub Issue 告警与去重
│   ├── notifier.ts              # 通知调度聚合器与指纹管理
│   ├── telegram.ts              # Telegram Bot 通知
│   └── webhook.ts               # 通用 HTTP Webhook 通知
├── types/                       # 领域数据模型与类型定义
│   ├── adapter.ts               # 标准化脚本结构与适配器类型
│   ├── deployment.ts            # 规范基线配置定义
│   └── report.ts                # 差异发现与分析报告类型
├── utils/                       # 基础工具库 (HTTP 重试、标准化、Molecule 解析)
│   ├── http.ts
│   └── normalize.ts
├── discovery/                   # [附属功能] npm CKB SDK 自动发现
│   └── npm-sdk-discoverer.ts
├── testing/                     # [附属功能] SDK 运行时动态安装与测试
│   ├── daily-test-runner.ts
│   └── dynamic-sdk-tester.ts
├── validate/                    # [附属功能] SDK 脚本规范校验器
│   ├── base.ts
│   ├── ccc.ts
│   └── index.ts
├── security-monitor.ts          # 监控逻辑统一导出
└── index.ts                     # CLI 统一主入口
```

---

## 附属功能：SDK 动态发现与测试

除了安全监控主定位外，本项目依然完整保留了对 CKB 生态 SDK 的动态发现、运行时测试与脚本规范一致性校验功能。

### 命令行使用

```bash
# 自动在 npm 上发现 CKB 相关 SDK
pnpm run discover
# 或 npm start discover

# 测试指定的 SDK
npm start test ckb-sdk-js

# 运行全量日常 SDK 验证测试
pnpm run daily
# 或 npm start daily

# 查看帮助信息
npm start help
```

### 代码集成调用

```typescript
import { DailyTestRunner } from './src/testing/daily-test-runner';
import { NPMSDKDiscoverer } from './src/discovery/npm-sdk-discoverer';
import { DynamicSDKTester } from './src/testing/dynamic-sdk-tester';

// 运行全量日常测试
const runner = new DailyTestRunner();
await runner.runDailyTests();

// 发现可用的 SDK
const discoverer = new NPMSDKDiscoverer();
const sdkNames = await discoverer.discoverSDKs();

// 测试指定 SDK 列表
const tester = new DynamicSDKTester();
const reports = await tester.testAllSDKs(['ckb-sdk-js', 'another-sdk']);
```

### SDK 验证工作流程

1. **动态发现**：在 npm 上检索匹配 `ckb-sdk`、`nervos-sdk`、`ckb-js` 等关键字的包。
2. **运行时安装**：动态临时安装最新版本并反射加载模块。
3. **元数据提取**：尝试多种调用模式（如 `sdk.getScriptInfo`、`sdk.scripts.get` 等）提取脚本配置。
4. **一致性比对**：与规范基线中的 `codeHash`、`hashType`、`cellDeps` 进行比对。
5. **产出报告**：输出控制台统计并在 `results/` 生成 `validation-results-*.json` 与 `validation-summary-*.json`。

### GitHub Actions 持续集成

项目的 `.github/workflows/ci.yml` 会在 Pull Request 和 master push 时执行依赖安装、TypeScript 构建、Biome Lint 与单元测试，作为常规代码质量检查。

---

## 贡献指南

1. Fork 本仓库并基于最新代码创建分支。
2. 保持 `src/deployments/*.json` 规范部署基线的严谨性，任何基线变更均需附带链上交易哈希与官方审计来源。
3. 提交代码前确保运行并通过格式与单元测试：
   ```bash
   pnpm run check
   pnpm run build
   pnpm test
   ```
4. 提交 Pull Request 并详细描述变更内容。

## 许可证

ISC License

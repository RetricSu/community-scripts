# CKB Contract Hub · community-scripts

CKB 生态核心合约的**统一入口**：94 个合约的约束流转规范 + 纯前端交易解码器 + AI 可读知识库，
外加一套面向 24 个核心合约的**链上安全防篡改与升级监测预警系统**。

> 🔗 **在线门户：<https://retricsu.github.io/community-scripts/>**（gp 原版前端：合约目录 + 交易解码入口）
> · [交易解码器](https://retricsu.github.io/community-scripts/tx.html)
> · [llms.txt（AI agent 入口）](https://retricsu.github.io/community-scripts/llms.txt)
>
> 门户由 CI 自动构建发布（`.github/workflows/portal.yml`），仓库内容变更后数分钟内自动更新。

---

## 这个仓库是什么

两个子系统合并成的单一仓库：

### ① 合约知识门户（`flow/` + `scripts/`）

原 [`gpBlockchain/ckb-contract-flow-html`](https://github.com/gpBlockchain/ckb-contract-flow-html) 已整体 vendored 进 `flow/`（上游仓库已归档，**本仓库是其唯一 canonical 家**，见 `flow/NOTICE.md`），门户即 gp 原版前端，样式与上游一致：

- **合约目录层**：94 个合约的约束流转规范页（`flow/contracts/<id>/spec.json` 生成），中英文双语，支持按网络 / 标签 / 关键字过滤
- **交易诊断层**：首页粘贴任意交易哈希，纯浏览器直连 RPC 解码，并按合约插件执行无签名约束校验——不用安装任何东西
- **AI 可读产物**：`llms.txt`、每个合约一份 `<id>.md`、`contracts.json`、单文件解码器 `decode-tx.js`，供 coding agent 直接消费

安全巡检结果**故意不在门户展示**：链上巡检告警完全由 CI 工作流产出与分发，门户是公开网站，不暴露可被攻击参考的风险细节。

### ② 链上安全监测（`src/` TypeScript）

以 `src/deployments/*.json` 为**唯一规范部署基线（Canonical Deployment Baseline）**，每天自动把链上真实状态与 5 类权威来源交叉比对，发现篡改、供应链投毒或未审计升级时按 P0–P3 分级多渠道告警。详见 **[`docs/SECURITY_MONITORING.md`](docs/SECURITY_MONITORING.md)**。

---

## 快速开始

```bash
# 1. 安装依赖与构建
pnpm install
pnpm run build

# 2. 离线单元测试（TS 监控引擎 + flow 生成器）
pnpm test
node --test flow/tests/*.test.js

# 3. 本地构建并预览门户 http://localhost:4173
pnpm run flow:build
pnpm run portal:serve

# 4. 跑一次完整安全巡检（主网+测试网，不发通知，容忍风险退出码）
pnpm run monitor -- --network both --no-notify --fail-on none
```

巡检报告写入 `results/`：`latest-report.json`（完整报告）、`latest-status.json`（看板/探针用摘要）、`monitor-<timestamp>.json`（历史归档）。`monitor upgrade` 只溯源升级链路，不覆盖上述两个 latest 文件。

---

## 数据所有权与合并策略

两个子系统的数据在**构建时**才合并，源数据互不污染：

| 数据源 | 角色 | 说明 |
| --- | --- | --- |
| `src/deployments/*.json` | 监控基线（安全 SSOT，24 个） | 保持最小结构；唯一可选扩展字段 `flowId` 指向 flow 目录 |
| `flow/contracts/<id>/meta.json` | flow 元数据 | 基线成员由**投影生成**（`generated_from` 标记）：机械字段随基线再生成；知识字段（tags / source.commit / contributors 等）人工补过后永不被覆盖 |
| `flow/contracts/<id>/spec.json` 等 | 知识本体 | 手写、上游格式原样保留，不翻译、不迁移，投影层永远不会自动生成 |

新增一个受监控合约：`src/deployments/<name>.json`（唯一手写事实源）→ `pnpm run flow:meta <name> --rpc <url>` 生成 meta → 手写 `spec.json`（约束知识本体）。

### 漂移检查的责任划分

两套 CI 各管一段，互不重叠（基线成员名单通过 `flow-lib.resolveFlowId` 自动映射，无需手工维护清单）：

| 合约范围 | 链上漂移检查 | 修复路径 |
| --- | --- | --- |
| 基线拥有的（`src/deployments` 投影的 meta） | `security-monitor.yml`（每日，告警 + 白名单升级自动 PR）；`ci.yml` 的 `gen-flow-meta --check` 门禁保证基线与 flow meta 一致 | 只改基线，flow meta 由投影再生成；**不要**对基线拥有的 meta 跑 `check-deployments.js --write` |
| 其余 flow 合约（手写 meta） | `flow-drift.yml`（每周，源自 gp 上游 `deployments.yml`，检出开/评论 `deployment-drift` issue） | 本地 `--write` 后提 PR |

```bash
pnpm run flow:meta my_contract --rpc-mainnet https://mainnet.ckb.dev/rpc --rpc-testnet https://testnet.ckb.dev/rpc  # 基线 -> flow meta 投影
pnpm run flow:meta --all --check   # CI 漂移检查（只读，不写入）
```

---

## 贡献合约（社区 PR 入口）

想让自己的合约出现在门户上？三条路：

1. **用 AI agent 一键添加（推荐）**——把这句话发给 Cursor / Claude Code / Codex 等：
   > 阅读 <https://raw.githubusercontent.com/RetricSu/community-scripts/master/flow/skills/ckb-contract-flow/SKILL.md> 并按其步骤为 <你的合约仓库 URL> 生成合约 cell 流转 HTML

   可选：安装 skill 后只需说「用 ckb-contract-flow 给 <仓库> 生成合约流转 HTML」：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/RetricSu/community-scripts/master/flow/install.sh | sh
   ```
2. **手动添加**——`node flow/scripts/new-contract.js <id> --kind lock|type` 生成骨架，按 [`flow/docs/ADD_CONTRACT.md`](flow/docs/ADD_CONTRACT.md) 填写。
3. **只提需求**——开 issue 选「新增合约」模板（[issue #new-contract](https://github.com/RetricSu/community-scripts/issues/new/choose)），填部署信息即可。

提交 PR 时会自动加载**合约 PR 模板清单**（来源引用、limit 与源码 `ERROR_*` 逐条核对、双语、检查命令通过等），逐项勾选即可。署名（可选）：`meta.json` 的 `contributors` 填你的 GitHub 用户名。

---

## CI 工作流一览

| 工作流 | 触发 | 干什么 |
| --- | --- | --- |
| `portal.yml` | push master 且门户源数据变更 | 构建门户并发布到 GitHub Pages（构建/部署分两 job，生成器无写权限） |
| `security-monitor.yml` | 每日定时 | 全量多源巡检，P1+ 告警；白名单内升级自动开基线更新 PR |
| `flow-drift.yml` | 每周定时 | 非基线 flow 合约的部署漂移检查，检出开/评论 issue |
| `ci.yml` | PR / push master | 构建 + lint + 测试 + flow 规范校验 + 基线→meta 投影漂移门禁 |

---

## 安全监测机制速览

### 五类多源交叉对比

| 来源 | 适配器 | 采集内容 |
| --- | --- | --- |
| 链上 RPC | `onchain-rpc` | 逐一核验基线 OutPoint、dep group 成员、Data/TypeHash、Type ID Live Cell 状态 |
| 官方文档 | `docs-nervos` | 解析 docs.nervos.org 的 ecosystem-scripts 部署表 |
| Nervos RFC | `rfcs-nervos` | 解析 RFC-0024/0025/0026/0042/0052 部署表 |
| CKB Explorer | `ckb-explorer` | 校验 OutPoint 与死 Cell 标记 |
| CCC SDK | `sdk-ccc` | 跨 SDK 校验核心脚本元数据一致性 |

### P0–P3 风险分级（节选）

- **P0 严重**：代码哈希与链上实际不符（疑似篡改/供应链投毒）；未授权 Type ID 升级；部署 Cell 被销毁且无 successor
- **P1 高**：引用死 Cell；白名单内授权升级（提醒同步基线）
- **P2 中**：CellDep 漂移；基线未记录哈希；单一来源故障
- **P3 低**：格式与缺失字段建议

### Type ID 升级追踪与白名单

升级 Tracker 沿 Type ID 链路多跳溯源，记录升级时间/区块/消费交易/新旧 Lock/签名 Lock；升级交易必须在白名单内（`src/engine/upgrade-tracker.ts` 内置或 `UPGRADE_WHITELIST_FILE` 注入），否则直接 P0。白名单升级可用 `pnpm run monitor:upgrade -- --network mainnet --apply` 回写基线，并由 CI 自动开 PR 交人工审查。

### 多渠道告警

Telegram / 飞书 / Discord / GitHub Issue / 通用 Webhook，未配置的渠道自动跳过；指纹去重（同问题 24h 不重复，风险跃升立即再通知）。各渠道阈值用 `*_MIN_LEVEL` 覆盖。完整配置见 [`docs/SECURITY_MONITORING.md`](docs/SECURITY_MONITORING.md)。

---

## 目录结构

```
src/                    # 安全监测引擎（TypeScript）
├── adapters/           # 五类数据源适配器（docs / rfcs / explorer / onchain / sdk）
├── cli/                # monitor / upgrade 命令行
├── deployments/        # 唯一规范部署基线（24 个 JSON，手写 SSOT）
├── engine/             # 巡检编排、风险分级、升级追踪、多源比对、状态去重
├── notifier/           # Telegram / 飞书 / Discord / GitHub Issue / Webhook
├── discovery/ testing/ validate/   # [附属] SDK 动态发现与测试
└── ...
flow/                   # 合约知识库（vendored，上游已归档，本仓库为 canonical 家）
├── contracts/<id>/     # spec.json（手写规范）+ plugin.js + meta.json + tests.json
├── gen.js lib/         # 零依赖静态生成器（规范页 / tx.html / llms.txt / decode-tx.js）
├── scripts/            # check.js / check-deployments.js / new-contract.js ...
├── skills/             # ckb-contract-flow agent skill（AI 一键添加合约）
└── docs/               # ADD_CONTRACT.md 等贡献文档
scripts/                # 门户接合层
├── flow-lib.js         # 基线 ↔ flow 身份解析（code_hash 校验）
├── gen-flow-meta.js    # 基线 -> flow meta 投影（三种字段策略）
└── serve-portal.js     # 本地预览静态服务器
docs/                   # SECURITY_MONITORING.md（完整监测文档）
.github/workflows/      # portal / security-monitor / flow-drift / ci 四套工作流
```

---

## 附属功能：SDK 动态发现与测试

原 SDK 动态发现与测试能力保留为附属功能：`pnpm run discover`（npm 发现 CKB SDK）、`npm start test <sdk>`、`pnpm run daily`（全量日常验证）。细节见 `src/discovery/`、`src/testing/`、`src/validate/`。

## 贡献与许可证

- 合约知识库贡献：见上文「贡献合约」，PR 模板与 new-contract issue 模板已就位
- 监测引擎 / 基线变更：保持 `src/deployments/*.json` 严谨性，基线变更须附链上交易哈希与官方审计来源；提交前 `pnpm run check && pnpm run build && pnpm test`
- License: ISC

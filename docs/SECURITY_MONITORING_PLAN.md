# CKB 核心合约安全监控与预警系统实施计划

## 一、 项目背景与演进定位

本项目（`community-scripts`）原设计用于测试与校验 CKB 各主流 SDK 中的脚本配置。现将其升级为 **CKB 核心合约链上安全防篡改与升级监测预警系统**。

### 核心定位原则
- **Git 部署基线（Canonical Deployments）为单一可信源**：`src/deployments/*.json` 作为权威资产清单，保持纯粹，不混入爬虫规则、外部 URL 或特定平台专有结构。
- **适配器模式（Adapter Pattern）解耦外部源**：所有外部观测面（文档站、CKB Explorer、SDK、链上 RPC）均通过独立的适配器接入，实现零侵入与即插即用。
- **全链路闭环防篡改与异动捕获**：
  1. **防篡改与投毒**：自动比对文档站与 Explorer 中呈现的部署信息，防止开发者入口被恶意篡改。
  2. **链上异动与升级监控**：实时感知可升级合约（Type ID）的部署 Cell 是否被消费、替换，并在第一时间内警报与分析。

---

## 二、 目标系统架构与模块规划

```
src/
├── deployments/                  # [纯净基线] 官方已收录的标准合约部署 JSON (保持原状)
├── types/                        # 统一数据规范
│   ├── deployment.ts             # 现有的基础部署类型
│   ├── adapter.ts                # 适配器接口与归一化合约信息类型
│   └── report.ts                 # 差异诊断与安全风险评级报告类型
├── adapters/                     # [适配器层] 对接各类异构数据源
│   ├── base.ts                   # 适配器抽象基类
│   ├── onchain/                  # 链上真值源 (通过 RPC 查询)
│   │   └── ckb-rpc-adapter.ts
│   ├── docs/                     # 文档站源 (Markdown / 静态页面解析)
│   │   ├── ckb-docs-adapter.ts
│   │   └── rfcs-adapter.ts
│   ├── explorer/                 # 浏览器源 (CKB Explorer API)
│   │   └── explorer-api-adapter.ts
│   └── sdk/                      # SDK 源 (复用并迁移现有能力)
│       └── ccc-sdk-adapter.ts
├── engine/                       # [核心比对与审计引擎]
│   ├── verifier.ts               # 多源交叉校验与哈希比对器
│   ├── upgrade-tracker.ts        # Type ID 合约升级与交易溯源分析
│   └── risk-evaluator.ts         # 风险等级评估规则引擎
├── notifier/                     # [预警与分发渠道]
│   ├── notifier.ts               # 统一通知接口
│   ├── telegram.ts               # Telegram Bot 告警
│   ├── feishu.ts                 # 飞书 / Lark Webhook 告警
│   ├── discord.ts                # Discord Webhook 告警
│   └── github-issue.ts           # 自动触发 GitHub Security Issue
├── cli/                          # CLI 命令行入口
│   └── monitor.ts                # 单次检查 / 持续守护进程
└── index.ts                      # 主入口导出
```

---

## 三、 核心接口与数据模型

### 1. 归一化合约信息 (`NormalizedScriptInfo`)
```typescript
export interface NormalizedScriptInfo {
  canonicalName: string;            // 映射回的标准名称（如 "secp256k1_blake160_sighash_all"）
  sourceName: string;               // 外部源原生命名（如 "SECP256K1/blake160"）
  network: 'mainnet' | 'testnet';
  codeHash?: string;
  hashType?: 'data' | 'data1' | 'data2' | 'type';
  cellDeps?: Array<{
    depType: 'code' | 'dep_group';
    outPoint: {
      txHash: string;
      index: string;
    };
  }>;
  typeId?: {
    codeHash: string;
    hashType: 'type';
    args: string;
  };
  metadata?: {
    sourceUrl?: string;             // 抓取来源 URL / API 路径
    fetchedAt: number;              // 抓取时间戳
    blockNumber?: number;           // 链上所在区块高度 (链上源)
    isLive?: boolean;               // Cell 是否活跃 (链上源)
    actualDataHash?: string;        // 实时计算得到的 Data Blake2b (链上源)
  };
}
```

### 2. 统一适配器接口 (`ScriptSourceAdapter`)
```typescript
export interface ScriptSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: 'onchain' | 'docs' | 'explorer' | 'sdk';

  /** 抓取并归一化输出合约数据 */
  fetchScripts(network: 'mainnet' | 'testnet'): Promise<NormalizedScriptInfo[]>;
}
```

### 3. 校验诊断差异 (`VerificationMismatch`)
```typescript
export enum RiskLevel {
  P0_CRITICAL = 'P0_CRITICAL',  // 严重安全事件：疑似投毒挂马、非预期链上升级
  P1_HIGH     = 'P1_HIGH',      // 严重功能中断：链上已升级但外部依然指向 Dead Cell
  P2_MEDIUM   = 'P2_MEDIUM',    // 信息脱节：文档站或 SDK 配置滞后
  P3_INFO     = 'P3_INFO',      // 提示信息：巡检正常通过、常规版本更新
}

export interface VerificationMismatch {
  scriptName: string;
  network: 'mainnet' | 'testnet';
  sourceId: string;
  field: 'codeHash' | 'hashType' | 'cellDeps' | 'liveness' | 'dataHash';
  expected: any;
  actual: any;
  riskLevel: RiskLevel;
  description: string;
  actionRequired: string;
}
```

---

## 四、 核心适配器详细设计

### 1. 链上真值适配器 (`OnChainAdapter`)
- **定位**：最高权威，所有外部展示都必须符合链上实时物理事实。
- **核心逻辑**：
  - 基于 `@ckb-ccc/core` 的 `ClientPublicMainnet` / `ClientPublicTestnet`。
  - 读取每个 deployment 配置中记录的 `cellDeps[].outPoint`：
    - 调用 `getCellLive(outPoint, true)`：
      - 若返回 Cell：计算 `ccc.hashCkb(cell.outputData)` 作为实测 `dataHash`；若存在 Type Script，计算 `type.hash()` 得到其实测 `typeHash`。
      - 若返回 null：**标记该 OutPoint 已死亡（Dead）！触发合约升级追踪器**。
  - 对于带有 `typeId` 的合约，按 Type Script 定位当前唯一的 Live Cell，记录最新有效 OutPoint。

### 2. 文档站适配器 (`DocsAdapter`)
- **定位**：检测开发者最常参考的官方文档入口是否存在挂马篡改或配置过期。
- **数据获取策略**：
  - 首选方案：直接通过 GitHub Raw API 读取 `nervosnetwork/docs.nervos.org` 对应部署章节的 Markdown 源文件（相比于网页爬虫更稳定、不受 CDN 样式改版影响）。
  - 备选方案：网页无头解析指定 URL。
- **解析与映射**：
  - 提取 Markdown 表格中的 Code Hash、Tx Hash、Index、Dep Type。
  - 内部内置 `DocAliasMap`，将文档中的别名转换为 `canonicalName`。

### 3. CKB Explorer 适配器 (`ExplorerAdapter`)
- **定位**：检测 CKB 区块浏览器 Scripts 详情与合约聚合接口。
- **核心逻辑**：
  - 定时调用 CKB Explorer OpenAPI 获取官方收录的脚本元数据。
  - 比对 Explorer 当前收录的脚本 `code_hash`、`tx_hash`、部署 Cell 状态。

### 4. SDK 适配器 (`SdkAdapter`)
- **定位**：保持并优化现有 SDK 校验逻辑（如 CCC、Lumos 等）。
- **重构方式**：将原 `CCCValidator` 的提取逻辑收敛为 `CccSdkAdapter`，只产出 `NormalizedScriptInfo[]`，移交给核心校验引擎比对。

---

## 五、 链上可升级合约（Type ID）异动追踪与安全预警

在 CKB 中，支持升级的合约（如 Omnilock、Spore）通常采用 `Type ID` 保护。

### 异动捕获与告警流程：
1. **感知消费**：`OnChainAdapter` 发现基线中登记的 OutPoint 返回为 Dead。
2. **交易溯源 (`UpgradeTracker`)**：
   - 提取该 OutPoint 的 `txHash` 和 `index`。
   - 调用 RPC `getTransaction` 追溯消费该 Cell 的交易。
   - 检查该交易的 Outputs：寻找带有相同 `Type ID` args 的新 Cell。
3. **安全审计分析**：
   - 抓取新 Cell 的字节码哈希（新 DataHash）以及字节大小变化。
   - 抓取触发交易的发起者 Lock、多签签名 Witness。
4. **风险定级与上报**：
   - 若该升级交易未在「白名单计划表」中：触发 **P0 紧急安全警报**，通知安全团队核实是否私钥泄露。
   - 若属于官方公告升级：触发 **P1 升级提醒**，提示文档站、Explorer、SDK 需更新 OutPoint。

---

## 六、 风险定级与告警响应体系

| 风险级别 | 触发条件 | 通知渠道 | 自动化应急响应 |
| :--- | :--- | :--- | :--- |
| **P0 致命** | 1. 链上检测到未报备的 Type ID 升级交易；<br>2. 文档站或 Explorer 展示的 CodeHash 与链上不符（疑似挂马投毒）。 | Telegram 机器人、飞书加急群、Discord @here、短信/电话 Webhook | 立即自动创建 GitHub Security Advisory / Issue，邮件抄送核心维护者。 |
| **P1 严重** | 链上发生正常升级，但文档站/Explorer/SDK 仍展示已死亡的旧 OutPoint（会导致交易报错）。 | Telegram、飞书、Discord | 自动创建“配置同步待办” Issue，并附带升级交易详情与新 OutPoint 建议。 |
| **P2 警告** | 文档站内容缺失部分字段，或外部源接口暂时网络异常。 | 运维日志、飞书低优先级通知 | 重试机制，记录连续失败次数。 |
| **P3 正常** | 自动化巡检全部通过，所有源数据一致。 | 定时日报 / Status Page 绿灯 | 更新 `latest-status.json` 与 CI 状态勋章。 |

---

## 七、 实施里程碑规划（Milestones）

### Milestone 1：架构重构与链上真值适配器（1 ~ 2 天）
- [x] 创建 `src/types/adapter.ts` 与 `src/types/report.ts`。
- [x] 实现 `OnChainAdapter`：基于 `@ckb-ccc/core` 轮询现有 23+ 个合约的 OutPoint 活跃度与 DataHash 校验。
- [x] 实现核心校验引擎 `CrossVerifier`：支持基准库与链上状态的交叉校验。
- [x] 重构现有 `CCCValidator` 为 `CccSdkAdapter`，验证原有 SDK 测试功能不受影响。

### Milestone 2：链上 Type ID 升级追踪器与多渠道告警（2 ~ 3 天）
- [x] 实现 `UpgradeTracker`：当 OutPoint 死亡时，反查消费交易，提取新 Cell 与新旧 DataHash Diff。
- [x] 实现通知器分发框架 `src/notifier/`，支持 Telegram Bot 与飞书 Webhook。
- [x] 配置 GitHub Actions 定时任务（每 30 分钟自动化执行一次）。

### Milestone 3：文档站与 Explorer 适配器对接（2 ~ 3 天）
- [x] 实现 `DocsAdapter`：解析 CKB 文档站关键 Markdown 页面，建立别名转换表。
- [x] 实现 `ExplorerAdapter`：对接 CKB Explorer 数据接口。
- [x] 联调四方交叉比对（基准库 ⟷ 链上 ⟷ 文档站 ⟷ Explorer ⟷ SDK）。

### Milestone 4：自动化运维与报告交付（1 ~ 2 天）
- [x] 编写 CLI 命令：`pnpm run monitor`、`pnpm run monitor:upgrade`。
- [x] 自动化 PR 生成能力：链上升级后，可一键生成基线库更新 PR。
- [x] 完善测试用例与文档，完成整体交付。

## 实现备注（对原计划的必要澄清）

- `dep_group` Cell 的数据是 OutPointVec 而不是合约字节码；实现先解析成员，再定位匹配 DataHash/TypeHash 的代码 Cell，避免对组 Cell 错误做代码哈希比较。
- CKB RPC 没有直接查询“谁消费了某 OutPoint”的接口；实现通过 Indexer 按 Type Script 优先、Lock Script 兜底，并逐笔检查 input，且支持多 hop。
- 外部源可能包含合法的辅助 CellDep（例如 CCC 的 secp256k1 dep group），因此辅助组与直接错误代码 Cell 分开定级，减少误报。
- 通知状态、连续失败次数和白名单均不写入部署基线；白名单可通过 `UPGRADE_WHITELIST_FILE` 注入。
- 非 Type ID Cell 消费后无法可靠证明 successor，系统只报警并要求人工审计，不自动改写基线。

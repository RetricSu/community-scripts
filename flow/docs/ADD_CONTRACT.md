# 添加合约 / Adding a Contract

[中文](#中文) | [English](#english)

典型流程 / Typical flow: **合约仓库 URL → AI 阅读源码 → 生成 `contracts/<id>/`（spec.json、plugin.js、tests.json、meta.json）→ 构建 HTML → （可选）向 `RetricSu/community-scripts` 提 PR**

---

## 中文

### 步骤

1. **收集来源**：合约源码（含 `#include` 的头文件，如 `common.h`、`rce.h`），固定到 commit；部署信息（code_hash / hash_type / 网络）只采用官方 RFC 或官方部署文档 / 官方 SDK 常量。
2. **生成骨架**：`node scripts/new-contract.js <id> --kind lock|type`（`<id>` 只含 `[a-z0-9_]`）。
3. **写 `spec.json`**（静态约束页）：每个状态转换一张卡；所有自然语言文本写成 `{"zh","en"}`；被检查字段用 `{{ }}` 高亮；`limits` 只写源码中真实存在的检查与其**数值**错误码；结构化字节（args / witness / data）用 `layouts`。格式见 README。
4. **写 `plugin.js`**（链上解码插件）：填 `match`（已核实常量）、`parse`、`check`，API 见下文。无法离线校验的（签名、VM 执行、扩展脚本）用 `R.NOT_CHECKED`。
5. **写 `tests.json`**：至少 1 笔真实链上交易（`get_transactions` 按 script 前缀搜索可找到），`expect` 列出必须被识别的插件 id。
5b. **写 `meta.json`**：
   - `tags`：取自 `contracts/tags.json`，≥1 个分类（system / token / nft / defi / identity / channel / btc / proxy / quantum / layer2 / zk）、1 个源码状态（open-source / no-source）、1 个维护方（nervos / cryptape / community）；kind 与 network 自动推导。
   - `contributors`（可选，欢迎）：你的 GitHub 用户名，页面会显示“Contributed by @你”。
   - `source`：`repo`（https://github.com/owner/repo）、`commit`（你阅读的完整 40 位 sha）、`paths`、`commit_note`。
   - 部署与二进制核验：运行 `node scripts/check-deployments.js --write --only <id>`，自动从链上解析 cell_dep、type_id、数据哈希、部署交易，并比对该 commit 的二进制 / checksum 文件（verified / unverified / mismatch / no-source / builtin）。
6. **构建与测试**：
   ```bash
   node gen.js --all out        # 静态页 + tx.html + index.html + 给 AI agent 的 llms.txt / <id>.md / contracts.json / decode-tx.js（从同一份文件自动生成，无需另写）
   node scripts/check.js        # 标签闭合 + 双语覆盖 + meta.json（tags / contributors / source / deployments）+ agent 输出
   node scripts/test-tx.js <id> # 真实交易：识别 + 所有检查不为 ✗ + 双语
   ```
7. **人工核对**：逐条对照源码 `return ERROR_*` / `CHECK2(..., ERROR_*)`，确认无遗漏、无虚构。
8. **（可选）提 PR**：fork → 新分支 `contract/<id>` → 提交 `contracts/<id>/` → 按 PR 模板勾选清单。

### 插件 API

文件：`contracts/<id>/plugin.js`，在浏览器（被 `gen.js` 内联进 `tx.html`）和 Node（`require`）中都会运行，不能有外部依赖。

```js
// @requires other_id            // 可选：依赖的其他插件（先加载）
(function (R) {                   // R = window.CKB / require('../../lib/ckb.js')
  R.register({
    id: 'my_script',              // = 目录名
    kind: 'lock' | 'type',
    name: 'Name' | { zh, en },
    needsInputHeaders: false,     // true：额外拉取输入 cell 所在区块头（ctx.headers[input.blockHash]）
    match: [{ code_hash, hash_type: 'type'|'data'|'data1'|'data2', net?: 'mainnet'|'testnet', src: '来源' }],
    parse(group, ctx) { return { fields?, layouts?, bonus?, ...任意私有数据 }; },
    check(group, ctx, parsed) { return [{ ok: true|false|null, code, zh, en }]; },
  });
})(typeof CKB !== "undefined" ? CKB : require("../../lib/ckb.js"));
```

- `group`：`{ kind, script, hash, inputs: [输入下标], outputs: [输出下标], witnessIndex }`。lock 组只含输入（输出列出同 lock 的找零，仅展示）；type 组含输入和输出。
- `ctx`：`{ tx, status, inputs: [{input, output, data, blockHash}], headers: {blockHash: header}, witnesses: [{raw, args:{lock,input_type,output_type}} | {empty} | {error}], groups, lib }`。
- `parse` 返回：`fields: [[label, value]]`；`layouts: [{label, layout:[{name,size,color,flex}], hex:[[k,v]]}]`；`bonus: BigInt`（该脚本允许的额外输入 capacity，如 DAO 补贴，计入交易级 capacity 检查）。label/value 可为字符串或 `{zh,en}`。
- `check` 返回：`R.check(ok, zh, en, code)` / `R.NOT_CHECKED(zh, en, code)`。`ok:false` 会让 test-tx 失败。
- 可用工具（`R.*`）：`hexToBytes bytesToHex le u64 u128 leToBig blake2b ckbHash blake160 scriptHash serializeScript parseTable parseBytes parseWitnessArgs parseSince parseEpoch fmtEpoch epochCmp occupied check NOT_CHECKED identify`。插件也可把共享逻辑挂到 `R` 上（如 `R.multisig`、`R.udt`），其他插件用 `// @requires` 声明依赖。
- 插件抛异常时，该组显示为一条失败检查“plugin error”，不影响其他组。

### `tests.json`

```json
[{ "tx": "0x…", "net": "mainnet", "name": "描述", "expect": ["my_script"], "allowFail": false }]
```

### AI 提示词

```text
Repo: <合约仓库 URL>  Contract: <文件路径>  Deployment: <code_hash/hash_type 来源>
任务：为 ckb-contract-flow-html 新增 contracts/<id>/。
1. 阅读合约源码及其 include 的头文件，列出所有 return/CHECK 的错误路径及数值错误码（解析 #define / enum）。
2. 输出 spec.json：按 cell 生命周期列出转换卡片；所有自然语言文本为 {"zh","en"}；被检查字段用 {{ }}；
   limits 只写源码真实存在的检查；结构化字节用 layouts；非本合约检查的写进 note 并注明。
3. 输出 plugin.js（遵循 docs/ADD_CONTRACT.md 的插件 API，零依赖）：match 只用已核实常量并在 src 注明来源；
   parse 解析 args / witness / data；check 对能离线判断的约束返回 ok:true/false，签名/VM/扩展返回 ok:null。
4. 输出 tests.json：用 RPC get_transactions（script 前缀搜索）找 1–3 笔真实交易。
5. 运行 node gen.js --all out && node scripts/check.js && node scripts/test-tx.js <id>，修复直到全部通过。
不要编造常量或错误码；不确定的写进 note 并标注“未核实”。
```

### 贡献（CONTRIBUTING）

- 一个 PR 只加/改一个合约（`contracts/<id>/`）；核心改动（`lib/`、`gen.js`、`tx-app.js`）单独 PR。
- 引用来源：源码链接带 commit、部署常量来源（RFC / 官方文档 / 官方 SDK）。
- 必须通过 `node gen.js --all out`、`node scripts/check.js`、`node scripts/test-tx.js <id>`。
- 不提交 `out/`（CI 生成并发布到 Pages）。

---

## English

### Steps

1. **Collect sources**: the contract source (including headers it `#include`s, e.g. `common.h`, `rce.h`), pinned to a commit; deployment info (code_hash / hash_type / network) only from official RFCs, official deployment docs or official SDK constants.
2. **Scaffold**: `node scripts/new-contract.js <id> --kind lock|type` (`<id>` matches `[a-z0-9_]+`).
3. **Write `spec.json`** (static constraint page): one card per state transition; every natural-language string as `{"zh","en"}`; checked fields wrapped in `{{ }}`; `limits` lists only checks that exist in the source with their **numeric** error codes; use `layouts` for structured bytes (args / witness / data). Format: see README.
4. **Write `plugin.js`** (on-chain decoder plugin): fill `match` (verified constants), `parse`, `check` — API below. Use `R.NOT_CHECKED` for anything that cannot be checked offline (signatures, VM execution, extension scripts).
5. **Write `tests.json`**: at least one real on-chain tx (find via `get_transactions` with a script prefix search); `expect` lists plugin ids that must be recognized.
5b. **Write `meta.json`**:
   - `tags`: ids from `contracts/tags.json`: ≥1 category (system / token / nft / defi / identity / channel / btc / proxy / quantum / layer2 / zk), 1 source status (open-source / no-source), 1 maintainer (nervos / cryptape / community). Kind and network are derived.
   - `contributors` (optional, encouraged): your GitHub username; pages show "Contributed by @you".
   - `source`: `repo` (https://github.com/owner/repo), `commit` (the full 40-hex sha you read), `paths`, `commit_note`.
   - Deployments + binary check: run `node scripts/check-deployments.js --write --only <id>`. It resolves the cell_dep, type_id, data hash and deploy tx from chain, then compares them against binaries / checksum files at that commit (verified / unverified / mismatch / no-source / builtin).
6. **Build & test**:
   ```bash
   node gen.js --all out        # static pages + tx.html + index.html + llms.txt / <id>.md / contracts.json / decode-tx.js for AI agents (generated from the same files, nothing extra to write)
   node scripts/check.js        # tag balance + bilingual coverage + meta.json + agent outputs
   node scripts/test-tx.js <id> # real txs: recognized + no ✗ checks + bilingual
   ```
7. **Manual review**: compare every `return ERROR_*` / `CHECK2(..., ERROR_*)` in the source; nothing missing, nothing invented.
8. **(Optional) open a PR**: fork → branch `contract/<id>` → commit `contracts/<id>/` → fill the PR template checklist.

### Plugin API

File `contracts/<id>/plugin.js` runs in the browser (inlined into `tx.html` by `gen.js`) and in Node (`require`); no external dependencies.

- `R.register({ id, kind: 'lock'|'type', name, needsInputHeaders?, match: [{code_hash, hash_type, net?, src}], parse(group, ctx), check(group, ctx, parsed) })`.
- `group`: `{ kind, script, hash, inputs, outputs, witnessIndex }` — lock groups contain inputs (outputs with the same lock are shown only); type groups contain inputs and outputs.
- `ctx`: `{ tx, status, inputs: [{input, output, data, blockHash}], headers, witnesses: [{raw, args} | {empty} | {error}], groups, lib }`.
- `parse` → `{ fields?: [[label, value]], layouts?: [{label, layout, hex}], bonus?: BigInt, ...private }`; labels/values are strings or `{zh,en}`. `bonus` is extra input capacity the script allows (e.g. DAO compensation) and is added to the tx-level capacity check.
- `check` → `[R.check(ok, zh, en, code) | R.NOT_CHECKED(zh, en, code)]`; `ok:false` fails test-tx.
- Helpers on `R`: `hexToBytes bytesToHex le u64 u128 leToBig blake2b ckbHash blake160 scriptHash serializeScript parseTable parseBytes parseWitnessArgs parseSince parseEpoch fmtEpoch epochCmp occupied check NOT_CHECKED identify`. Shared logic can be attached to `R` (e.g. `R.multisig`, `R.udt`); dependants declare `// @requires <id>` on the first lines.
- A throwing plugin shows one failed "plugin error" check for that group only.

### `tests.json`

`[{ "tx": "0x…", "net": "mainnet"|"testnet", "name": "…", "expect": ["<id>"], "allowFail": false }]`

### AI prompt

```text
Repo: <contract repo URL>  Contract: <file path>  Deployment: <source of code_hash/hash_type>
Task: add contracts/<id>/ to ckb-contract-flow-html.
1. Read the contract source and the headers it includes; list every return/CHECK error path with its numeric code (resolve #define / enum).
2. Output spec.json: one card per cell-lifecycle transition; all natural-language text as {"zh","en"}; checked fields in {{ }};
   limits = only checks that exist in the source; layouts for structured bytes; things checked elsewhere go to note, marked as such.
3. Output plugin.js following the plugin API in docs/ADD_CONTRACT.md (zero dependencies): match uses only verified constants with src;
   parse decodes args / witness / data; check returns ok:true/false for offline-checkable constraints, ok:null for signatures/VM/extensions.
4. Output tests.json: find 1–3 real txs via RPC get_transactions (script prefix search).
5. Run node gen.js --all out && node scripts/check.js && node scripts/test-tx.js <id>; fix until everything passes.
Never invent constants or error codes; put uncertain items in note marked "unverified".
```

### Contributing

- One contract (`contracts/<id>/`) per PR; core changes (`lib/`, `gen.js`, `tx-app.js`) in separate PRs.
- Cite sources: source links pinned to a commit, deployment constants from RFC / official docs / official SDK.
- Must pass `node gen.js --all out`, `node scripts/check.js`, `node scripts/test-tx.js <id>`.
- Do not commit `out/` (CI builds and publishes it to Pages).

### 部署漂移检查 / Deployment drift

`node scripts/check-deployments.js` 重新读取链上 cell，在 code cell 移动、type_id 脚本变化、数据哈希变化（合约升级）或上游源码路径在记录的 commit 之后有改动时报告；`.github/workflows/deployments.yml` 每周运行，发现漂移时开 issue。

`node scripts/check-deployments.js` re-reads the on-chain cells and reports when a code cell moved, the type_id script changed, the data hash changed (an upgrade), or upstream source paths changed after the recorded commit. `.github/workflows/deployments.yml` runs it weekly and opens an issue on drift.

### 已审阅的历史版本差异 / Reviewed historical-version differences

`source.commit` always names the source actually described by the plugin, not upstream HEAD.
When official deployment evidence requires retaining that version, an optional
`source.upstream_review` records `repo`, `base_commit` (= `source.commit`), the
reviewed upstream `commit`, the exact tracked `paths`, `disposition` =
`retain-deployed-version`, bilingual `reason`, evidence URLs and `reviewed_at`.
This is a bounded review, not binary verification or a claim that HEAD is deployed.
The drift checker still checks every deployment against chain, displays the retained
pin and rationale, and flags subsequent source-path changes after the reviewed commit.
Changing repo/pin/paths invalidates the review. Failed/diverged/truncated upstream
comparisons fail closed. Unit tests: `node --test tests/source-drift.test.js`.

源码确实属于历史部署时，不应为了消除告警而改成 HEAD；可用上述字段记录有证据的、
仅截至指定提交的差异审阅。检查器仍核对链上部署，显示保留版本及原因；后续源码变化
继续告警，比较失败也告警。这不代表已复现编译，也不代表新源码已部署。

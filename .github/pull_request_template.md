<!-- 合约知识库 PR（新增/修改 flow/contracts/<id>/）请保留下方清单并逐项勾选；
     其他类型的 PR（监控引擎、CI、基线变更等）可删除清单，直接写变更说明。 -->
<!-- Contract-KB PR (adding/editing flow/contracts/<id>/): keep the checklist below.
     Other PRs (monitor engine, CI, baseline changes, ...): delete it and describe your change. -->

## 合约 / Contract

- id: `flow/contracts/<id>/`
- kind: lock / type
- 源码 / Source (pinned commit): <!-- https://github.com/…/blob/<commit>/… -->
- 部署常量来源 / Deployment constants source: <!-- RFC / official docs / official SDK -->

## 清单 / Checklist

- [ ] 来源已引用（源码 commit 链接 + code_hash/hash_type 官方来源） / Sources cited (source at a commit + official code_hash/hash_type source)
- [ ] `spec.json` 的 limits 与源码中的 `return ERROR_*` 逐条核对，无虚构 / `spec.json` limits checked against every `return ERROR_*`, nothing invented
- [ ] 所有自然语言文本为 `{"zh","en"}` / All natural-language text is bilingual `{"zh","en"}`
- [ ] `meta.json`：tags 来自 `flow/contracts/tags.json`；source.repo + 完整 commit + paths；已运行 `node flow/scripts/check-deployments.js --write --only <id>` / tags from `flow/contracts/tags.json`; source.repo + full commit + paths; ran `check-deployments.js --write --only <id>`
- [ ] （可选，欢迎）在 `meta.json` 的 `contributors` 中加上你的 GitHub 用户名 / (optional, encouraged) add your GitHub username to `contributors` in `meta.json`
- [ ] `node flow/gen.js --all out` 成功 / succeeds
- [ ] `node flow/scripts/check.js` 通过 / passes
- [ ] `node flow/scripts/test-tx.js <id>` 通过（`tests.json` 含至少 1 笔真实交易） / passes (`tests.json` has ≥ 1 real tx)
- [ ] 未提交 `out/`、`portal/` 构建产物 / build artifacts (`out/`, `portal/`) not committed

## 说明 / Notes
<!-- 未核实或未检查的项 / unverified or unchecked items -->

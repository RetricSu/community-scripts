# Vendored: ckb-contract-flow-html

This directory vendors the **CKB 合约 Cell 流转可视化规范与纯前端链上交易解码器**
from [`gpBlockchain/ckb-contract-flow-html`](https://github.com/gpBlockchain/ckb-contract-flow-html).

- **Upstream commit**: `69014e7ac38e9fd5c873f1e2fb1cfb3cf7147e24`
  (`Merge pull request #20 from gpBlockchain/sync-issue19-source-drift`)
- **License**: MIT (upstream author's standard license, confirmed by the
  community-scripts maintainer; the upstream repo does not carry a LICENSE file
  yet — see https://github.com/gpBlockchain/ckb-contract-flow-html).
- **Local modifications**: none to the generator itself. This repo adds
  `../scripts/build-portal.js`, which runs after `gen.js --all` and rewrites
  `portal/index.html` into the unified security + flow hub entry point.

## What lives here

| Path | Purpose |
| --- | --- |
| `contracts/<id>/` | 声明式流转规范 `spec.json`、链上解码插件 `plugin.js`、部署元数据 `meta.json`、真实交易测试 `tests.json` |
| `gen.js` | 零依赖静态生成器：`node gen.js --all <outDir>` 生成每个合约的 flow 页面、`tx.html` 解码器、`llms.txt` 等 AI 可读产物 |
| `lib/`, `tx-app.js`, `template.html`, `tx-template.html` | 生成器与解码器内核（Blake2b + Molecule 纯浏览器实现） |
| `scripts/` | `decode-tx.js` / `check-deployments.js` / `test-tx.js` 等 Node 侧工具 |

## How this repo uses it

```bash
# 生成全部合约 flow 页面 + tx.html 解码器，然后构建统一 Portal 入口
pnpm run flow:build
# 本地预览 http://localhost:4173
pnpm run portal:serve
```

Do not edit vendored files when a hook or wrapper will do; prefer extending
`scripts/build-portal.js` or the monitor side instead.

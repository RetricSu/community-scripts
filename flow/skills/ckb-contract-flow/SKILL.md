---
name: ckb-contract-flow
description: >-
  Use when the user wants to view, generate or add a bilingual (zh/en) HTML page
  showing a CKB (Nervos) contract's cell state transitions and enforced
  constraints, or to decode an on-chain CKB transaction locally, with the
  ckb-contract-flow-html generator. Covers building pages locally, opening them,
  the tx decoder, and adding a new contract (spec.json / plugin.js / meta.json /
  tests.json).
---

# CKB contract cell-flow HTML (local)

Generator: https://github.com/gpBlockchain/ckb-contract-flow-html.
Source of truth for formats and the plugin API: `README.md` and `docs/ADD_CONTRACT.md` in that repo. Read them before writing a contract.

Only looking up existing contracts (what is deployed on mainnet / testnet, how to use one) or decoding a transaction? No clone needed: read https://gpblockchain.github.io/ckb-contract-flow-html/llms.txt (every contract by network, a Markdown doc per contract, and the single-file `decode-tx.js`).

## Quick path (do this first, no questions needed)
This file may have been handed to you as a URL together with a contract source: a **repo URL or a local path**. Do everything yourself; never ask the user to clone or install anything.

1. Get the generator into a cache dir (this is the generator, not the contract):
```bash
D="${CKB_FLOW_HOME:-$HOME/.cache/ckb-contract-flow-html}"
if [ -d "$D/.git" ]; then git -C "$D" pull -q --ff-only; else git clone -q --depth 1 https://github.com/gpBlockchain/ckb-contract-flow-html "$D"; fi
cd "$D" && node gen.js --all out
```
2. Locate the contract source:
   - **Local path** (exists on disk): read it in place; never clone, copy or modify it. Record provenance:
     ```bash
     S=/path/to/contract
     git -C "$S" rev-parse HEAD 2>/dev/null || echo uncommitted          # commit, or "uncommitted" if not a git repo
     git -C "$S" status --porcelain 2>/dev/null | head                    # dirty tree => mention it in commit_note
     git -C "$S" remote get-url origin 2>/dev/null                        # GitHub remote, if any
     ```
     In `meta.json`: if it has a GitHub `origin` and HEAD is pushed with a clean tree, use the normal `source.repo` + `commit`. Otherwise use
     `"source": { "local": true, "commit": "<40-hex sha or uncommitted>", "paths": [...], "commit_note": "local working copy; <dirty/uncommitted details>" }`
     (do not write the user's absolute local path into the repo).
   - **Remote URL**: `git clone --depth 1 <url> "$D/.src/<name>"` (or `git -C ... fetch` if present) and record `source.repo` + the full commit.
3. If the contract already exists in `contracts/<id>/`, just open `out/<id>.html`. Otherwise add it (section 5) inside `$D`, rebuild, and open `out/<id>.html`.
4. Report the absolute path of the generated HTML (offer to open it, or `cd "$D/out" && python3 -m http.server 8000`).
5. Afterwards, optionally offer to install this skill for future use (last section); don't install without the user's OK.

## Prerequisites
- Node.js ≥ 16 (zero npm dependencies, no `npm install`) and `git`.
- Network access to a CKB RPC (default `https://mainnet.ckb.dev/rpc`, `https://testnet.ckb.dev/rpc`) for the tx decoder, `test-tx.js` and `check-deployments.js`. Page generation itself is offline.

## 1. Manual clone (optional)
```bash
git clone https://github.com/gpBlockchain/ckb-contract-flow-html
cd ckb-contract-flow-html        # run every command below from the repo root
```

## 2. Generate HTML
```bash
node gen.js --all out                               # every contracts/*/spec.json -> out/<id>.html, plus out/tx.html and out/index.html
node gen.js contracts/sudt/spec.json my.html        # one page from one spec (.json or simple .yaml)
node gen.js contracts/sudt/spec.json                # same, written to out/spec.html (named after the file)
```
`out/` is git-ignored; never commit it.

## 3. Open locally
- Directly: open `out/index.html` (or `out/<id>.html`) in a browser via `file://`.
- Or serve it: `cd out && python3 -m http.server 8000` then visit http://localhost:8000/ (any static server works, e.g. `npx serve out`).

## 4. Decode an on-chain transaction
- Browser: open `out/tx.html`, paste a tx hash, choose mainnet/testnet or a custom RPC. Deep link: `tx.html#tx=0x…&rpc=https://testnet.ckb.dev/rpc`. The public RPCs send `Access-Control-Allow-Origin: *`; a custom node needs CORS enabled.
- CLI, full decode as Markdown (every cell, the contract behind each script group, parsed fields, ✓/✗/○ checks, doc links); `out/decode-tx.js` is the same thing as one file:
  ```bash
  node scripts/decode-tx.js 0x<txhash>                  # mainnet; --testnet, --rpc <url>, --json
  ```
- CLI (same decoder + checks, prints PASS/FAIL):
  ```bash
  node scripts/test-tx.js 0x<txhash>                                   # ad-hoc, mainnet
  RPC=https://testnet.ckb.dev/rpc node scripts/test-tx.js 0x<txhash>   # ad-hoc on testnet / custom RPC
  node scripts/test-tx.js <id>                                          # run contracts/<id>/tests.json
  node scripts/test-tx.js                                               # run all tests
  ```

## 5. Add a new contract
1. Check `docs/CONTRACTS_INVENTORY.md` / `contracts/` so you don't duplicate. Collect the contract source (with included headers) pinned to a commit, and deployment constants (code_hash / hash_type / network) from official sources only.
2. Scaffold: `node scripts/new-contract.js <id> --kind lock|type` (`<id>` = `[a-z0-9_]+`). Creates `contracts/<id>/{plugin.js,spec.json,tests.json,meta.json}` with TODOs.
3. `spec.json`: one card per state transition; all prose as `{"zh","en"}`; checked fields in `{{ }}`; `limits` only for checks that exist in the source, with numeric error codes; `layouts` for structured bytes.
4. `plugin.js`: `match` (verified constants with `src`), `parse`, `check`; signatures / VM-only checks as `R.NOT_CHECKED`.
5. `tests.json`: ≥1 real on-chain tx, `expect` lists plugin ids.
6. `meta.json`: tags from `contracts/tags.json`, `source` (repo, full commit, paths; or `local: true` for a local path, see Quick path), optional `contributors`; then fill deployments from chain:
   `node scripts/check-deployments.js --write --only <id>` (without `--write` it only checks, exit 1 on drift).
7. Build and verify, fix until all pass:
   ```bash
   node gen.js --all out && node scripts/check.js && node scripts/test-tx.js <id>
   ```
8. Manually compare every `return ERROR_*` / `CHECK(..., ERROR_*)` in the source with the page: nothing missing, nothing invented. Unverifiable items go in a note marked unverified.
9. Optional PR: branch `contract/<id>`, commit `contracts/<id>/` (not `out/`), one contract per PR, fill the PR template.

## Troubleshooting
- `node gen.js` with no args only prints usage; pass `--all out` or a spec path.
- `check.js` fails with tag/zh-en span mismatch: some text containing Chinese is a plain string or a `{{ }}`/HTML tag is unbalanced; make it `{"zh","en"}`.
- `test-tx.js` fails `ok:false`: a `check()` returned false; compare with the source, or the `match` constant/hash_type (`data`/`data1`/`data2`/`type`) is wrong — verify on chain with `check-deployments.js --only <id>`.
- RPC / network errors: set `RPC=` / `TESTNET_RPC=` to a reachable node; in the browser make sure the node allows CORS.
- Script shows as "unknown" in tx.html: no plugin `match` for that code_hash + hash_type (+ net); regenerate with `node gen.js --all out` after adding one.
- `new-contract.js` says the directory exists: pick another id or edit the existing contract.

## Install this skill (optional)
One-sentence use needs no install: give your agent
`Read https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/main/skills/ckb-contract-flow/SKILL.md and follow it to generate a cell-flow HTML for <contract repo URL or local path>`

To keep it installed (then just say "use ckb-contract-flow for <repo URL>"), any one of:
```bash
npx skills add gpBlockchain/ckb-contract-flow-html -g -y -a claude-code cursor codex
curl -fsSL https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/main/install.sh | sh
```
Claude Code: `/plugin marketplace add gpBlockchain/ckb-contract-flow-html` then `/plugin install ckb-contract-flow@ckb-contract-flow-html`.

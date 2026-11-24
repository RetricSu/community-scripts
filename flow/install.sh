#!/bin/sh
# One-line install of the ckb-contract-flow agent skill:
#   curl -fsSL https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/main/install.sh | sh
# Copies SKILL.md into ~/.claude/skills, ~/.cursor/skills, ~/.codex/skills and ~/.agents/skills.
set -e
REF="${CKB_FLOW_REF:-main}"
URL="https://raw.githubusercontent.com/gpBlockchain/ckb-contract-flow-html/$REF/skills/ckb-contract-flow/SKILL.md"
TMP="$(mktemp)"
curl -fsSL "$URL" -o "$TMP"
for d in "$HOME/.claude/skills" "$HOME/.cursor/skills" "$HOME/.codex/skills" "$HOME/.agents/skills"; do
  mkdir -p "$d/ckb-contract-flow" && cp "$TMP" "$d/ckb-contract-flow/SKILL.md" && echo "installed -> $d/ckb-contract-flow/SKILL.md"
done
rm -f "$TMP"
echo 'Now tell your agent: "用 ckb-contract-flow 给 <合约仓库 URL> 生成合约流转 HTML"'

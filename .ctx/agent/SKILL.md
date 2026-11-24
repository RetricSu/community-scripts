---
name: use-ctx
description: Use this repository's ctx context graph when working in a repo that contains .ctx/, especially before code changes, after code changes, or when checking whether project claims still hold.
---

# Use ctx

When a repository contains `.ctx/`, treat ctx as the repo-local source of important project claims. It supplements source code; it does not replace reading the relevant code.

## Workflow

1. Before changing files, run `ctx check` to see whether the context graph is valid.
2. For files you expect to touch, run `ctx relevant <path>` and read the returned claims plus their anchored evidence.
3. After changes, run `ctx impact` to find claims whose watched evidence or hard dependencies changed.
4. Resolve every blocking impact before handoff. Update claims when the project meaning changed; otherwise verify reviewed claims with `ctx verify <claim-id...>`.
5. Run `ctx check --ci` before final handoff when the repo can run the ctx CLI.

## Verification Rules

- Do not run `ctx verify` for claims you did not review against current evidence.
- Do not treat a clean ctx graph as proof that the implementation is correct.
- If the ctx CLI is unavailable, inspect `.ctx/claims/*.json` manually and report that automated ctx checks could not run.

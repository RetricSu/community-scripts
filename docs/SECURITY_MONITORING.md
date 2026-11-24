# CKB Core Contract Security Monitoring & Alerting System

Implementation corresponds to `docs/SECURITY_MONITORING_PLAN.md`. `src/deployments/*.json` remains the single canonical deployment baseline; crawler rules, aliases, and whitelists all live in adapters or standalone configs.

## Quick Start

```bash
pnpm install
pnpm run build

# One full patrol (mainnet + testnet, all sources)
pnpm run monitor -- --no-notify

# Mainnet only, selected sources
node dist/src/index.js monitor --network mainnet \
  --sources onchain-rpc,docs-nervos,rfcs-nervos,ckb-explorer,sdk-ccc \
  --no-notify

# Continuous daemon, every 30 minutes
node dist/src/index.js monitor --watch 1800

# On-chain upgrade tracing only; only whitelisted upgrades may write back to the baseline
pnpm run monitor:upgrade -- --network mainnet --apply --no-notify
```

Reports are written to `results/`:

- `monitor-<timestamp>.json`: every patrol (including `monitor upgrade`) writes a timestamped report.
- `latest-report.json`: the most recent **full** multi-source patrol report. `pnpm run monitor:upgrade` only writes timestamped files and does not overwrite it.
- `latest-status.json`: summary for status pages / CI, also updated only by full patrols.
- `monitor-state.json`: per-source consecutive failure counts and notification dedup state.

By default `--fail-on P0` makes the process exit non-zero on P0; use `--fail-on P1`, `P2`, or `none` to adjust. **Findings recorded as known issues (see below) do not participate in failure determination**, which is based on the highest *unresolved* risk. A single source failing during a patrol is recorded as P2 and does not block the other sources.

## Known Issues

The monitor is a stateless patrol: the same unfixed issue shows up as a new finding in every report. `docs/security-known-issues.json` is a **known-issue ledger** versioned with the repo and reviewed via PR (governed the same way as the upgrade whitelist), so confirmed-but-unresolved issues stop re-alerting and stop failing CI every day:

```json
{
  "version": 1,
  "issues": [
    {
      "fingerprint": "ckb-explorer:mainnet:xudt:codeHash:CODE_HASH_MISMATCH",
      "note": "Rationale: official announcement / issue link",
      "recordedAt": "2026-02-20T00:00:00Z",
      "expiresAt": "2026-03-20T00:00:00Z",
      "recordedBy": "optional"
    }
  ]
}
```

- `fingerprint` must **exactly equal** the finding's fingerprint (every report and alert prints it as `fingerprint`). Any change in the fingerprint (e.g. pointing to a new OutPoint) is treated as a new issue and does not inherit the old known record.
- Matched findings stay in the report, annotated `known` + the recorded note (unresolved but known), but **do not trigger alert notifications and do not count toward `--fail-on`**; the console and `latest-status.json` report `knownCount` and `highestUnresolvedRisk` separately.
- `expiresAt` is optional; once expired the entry lapses automatically and the issue resurfaces as a new finding, preventing known records from becoming permanent suppression.
- The file path can be overridden with `--known-issues <file>` or the `KNOWN_ISSUES_FILE` env var; a missing or corrupted file is treated as an empty ledger and does not affect the patrol itself.
- **Never add issues to the ledger without manual audit**; for P0 known issues, set a short `expiresAt` to force re-review.

## Sources & Adapters

| Source | Adapter | What it does |
| --- | --- | --- |
| On-chain RPC | `onchain-rpc` | Checks each baseline OutPoint one by one, dep group members, DataHash, TypeHash, and the current Type ID live cell |
| Official docs | `docs-nervos` | Reads the `ecosystem-scripts` tables from the Markdown/MDX sources of `nervosnetwork/docs.nervos.org` |
| Nervos RFC | `rfcs-nervos` | Reads deployment tables from RFC-0024/0025/0026/0042/0052 |
| CKB Explorer | `ckb-explorer` | `/api/v2/scripts` + `/api/v2/scripts/general_info`, validates OutPoints and dead-cell flags |
| CCC SDK | `sdk-ccc` | Reuses the `@ckb-ccc/core` static script table; the original `CCCValidator` has been delegated to this adapter |

Adding a new source only requires implementing `ScriptSourceAdapter.fetchScripts(network)` returning `NormalizedScriptInfo[]`; no changes to deployment JSONs or the risk engine are needed.

### On-chain upgrade tracking

When a baseline cell dies, `UpgradeTracker`:

1. Reads the creation transaction to obtain the Type ID / lock, old DataHash, and size.
2. Uses the CKB indexer to find the consuming transaction by Type Script (preferred) or Lock Script, confirming each input's `previousOutput` one by one to avoid misjudging from tx lists alone.
3. Follows the successor cell with the same Type ID across multiple hops, recording the new OutPoint, DataHash, size, block, input lock, and witness size.
4. Raises P0 when the consuming transaction is not whitelisted; a whitelisted upgrade raises P1 and can be written back to the baseline with `--apply` for PR review.

The whitelist is built into `src/engine/upgrade-tracker.ts` and can also be provided as a JSON array via `UPGRADE_WHITELIST_FILE`:

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

**Whitelists must be filled in based on official announcements and manual audit — never add unknown upgrades directly.** `--force` is only for emergencies after manual confirmation.

Every upgrade event in the report includes `upgradedAt` (ISO time), `upgradedBlock`, `consumingTxHash`, `oldLock`, `newLock`, and `signerLocks` of the first consuming transaction; the console summary prints these fields briefly as well. Full multi-hop details remain in `hops`.

Nostr mainnet migration, verified against official repo migration records and whitelisted:

- `nostr_binding`: 2026-01-14 05:10:21 UTC (block 18373321), tx `0x86d21ad7…`, migration `2026-01-14-050950.json`.
- `nostr_lock`: 2026-01-14 05:17:51 UTC (block 18373370), tx `0x99b116dd…`, migration `2026-01-14-051715.json`.
- Both official records are files under `deployment/mainnet/*/migrations/` in the `cryptape/nostr-binding` repo; the multisig lock args of the old and new cells are `0xd4ade5100cf112c9cd3e8da12ae5fc6153293087` and `0x269ca034aa160f5265b65318123047bee882f244` respectively.

Omnilock testnet two-hop upgrade, verified against Lumos SDK config records and whitelisted. These are SDK config upgrade records, not contract-author-signed announcements:

- First hop consuming tx `0x7d9c9ccd12f40eebe508bbbf24b0d746c991e055f2f1b61c6fe8ca60467ae750`, new dataHash `0x3f303aa87238dbc34a81a1c42109e07aad9c8e4ab3e8741d87fffca43851b2d7`, recorded at https://github.com/ckb-js/lumos/pull/665 .
- Second hop consuming tx `0xec18bf0d857c981c3d1f4e17999b9b90c484b303378e94de1a57b0872f5d4602`, new dataHash `0x6b29b6f10346b43c540e53806ba88ba0fe3a0c3a29d7448ef555840c8f8318fa`, recorded at https://github.com/ckb-js/lumos/pull/669 .

## Notification Channels

Enabled via environment variables; unconfigured channels are skipped automatically. The same fingerprint is not re-notified within 24 hours by default; a risk-level change re-notifies immediately.

| Channel | Environment variables | Default threshold |
| --- | --- | --- |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | P1 |
| Lark (Feishu) | `FEISHU_WEBHOOK_URL`, optional `FEISHU_SECRET` | P1 |
| Discord | `DISCORD_WEBHOOK_URL` | P1 |
| GitHub Issue | `GITHUB_TOKEN`, `GITHUB_REPOSITORY=owner/repo` | P1 |
| Generic webhook (SMS/call gateway) | `ALERT_WEBHOOK_URL`, optional `ALERT_WEBHOOK_BEARER_TOKEN` | P0 |

Thresholds can be overridden with `TELEGRAM_MIN_LEVEL`, `FEISHU_MIN_LEVEL`, `DISCORD_MIN_LEVEL`, `GITHUB_ISSUE_MIN_LEVEL`, `ALERT_WEBHOOK_MIN_LEVEL`. GitHub Issues are grouped and opened by "network + script + root cause"; the stable fingerprint of each finding is still written into the issue body. Existing open tickets are never modified or closed; as long as any old fingerprint (or the new grouping marker) is still in an open issue, no new ticket is opened for that group.

Root-cause grouping (used for issue opening only; does not change a finding's own fingerprint or risk level):

- `hash-mismatch`: hash / hash_type / dep_type inconsistency
- `celldep-or-record-gap`: dead cells, missing or extra cellDeps, still-live alternate deployments
- `unknown-code`: a live cell pointing to non-matching code (kept separate from plain alternate deployments)
- `upgrade-or-destruction`: Type ID upgrade or consumption without a Type ID successor
- `baseline` / `source`: baseline integrity and source availability

Configurable for RPC and docs sources:

- `CKB_MAINNET_RPC_URL`, `CKB_TESTNET_RPC_URL`
- `CKB_MAINNET_EXPLORER_API`, `CKB_TESTNET_EXPLORER_API`
- `DOCS_REPO`, `DOCS_REF`, `DOCS_PATH`, `RFCS_REPO`, `RFCS_REF`
- `DEPLOYMENTS_DIR`, `UPGRADE_WHITELIST_FILE`, `GITHUB_TOKEN` (raises GitHub Raw/API rate limits)

## Risk Semantics & Known Limits

- If UpgradeTracker finds a live successor along the Type ID, external-source comparison uses the successor's data/type hash instead of the dead baseline cell's old hash. This only corrects comparison polarity; it is not authorization, and hop / old-OutPoint evidence is not discarded. Upgrades not in the whitelist are still reported as `UPGRADE_UNAUTHORIZED`.
- A `code_hash` from an external source that differs from the on-chain hash is still reported as P0. Wording distinguishes "observation" (hash differs) from "inference" (poisoning, stale directory, historical alternate deployment all require confirmation). No automatic downgrade just because an alternate deployment is still alive or the signer lock happens to match.
- `DEPLOYMENT_DESTROYED` without a Type ID successor remains P0, but the wording no longer automatically claims "confirmed security incident / rotate keys immediately". An official no-Type-ID redeployment is one explanation pending confirmation; an identical official lock alone is not proof of authorization or a benign redeployment. Unexplained consumption is still treated as a high-severity unknown change.
- Referencing a dead cell is P1, because the transaction would fail.
- Alternate deployment cells that differ but are still alive are reported separately as drift; a `code` cell pointing directly to non-matching code is P0, extra auxiliary dep groups are P2 — this avoids misreporting CCC's secp256k1 dependency as malicious Omnilock code.
- In the baseline, `dataHash` / `typeHash` of `"0x"` or empty string means not yet recorded; they do not participate in equality checks and only produce completion hints.
- Public RPC, Explorer, and docs repos are all external trust boundaries; high-security environments should use self-hosted nodes / multi-RPC cross-validation and manually review any P0.
- When a non-Type-ID cell is consumed, no reliable "upgrade successor" can be proven; the system reports destruction or untraceability and requires manual audit, and never rewrites the baseline automatically.

## Automation

`.github/workflows/security-monitor.yml` runs once daily at 02:00 UTC, uploads reports, and caches notification state. If `monitor upgrade --apply` produces whitelist-validated baseline changes, the workflow uses `create-pull-request` to open a review PR instead of pushing to master directly.

Unit tests:

```bash
pnpm test
pnpm run build
```

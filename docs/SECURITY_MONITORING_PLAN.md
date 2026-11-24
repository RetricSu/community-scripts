# CKB Core Contract Security Monitoring & Alerting System — Implementation Plan

## 1. Project Background & Evolution

This project (`community-scripts`) was originally designed to test and validate script configurations across mainstream CKB SDKs. It is now being upgraded into a **CKB core-contract on-chain tamper-proofing and upgrade monitoring & alerting system**.

### Core positioning principles
- **The Git deployment baseline (Canonical Deployments) is the single source of truth**: `src/deployments/*.json` serves as the authoritative asset inventory, kept pure — no crawler rules, external URLs, or platform-specific structures mixed in.
- **The Adapter Pattern decouples external sources**: every external observation surface (docs site, CKB Explorer, SDKs, on-chain RPC) is integrated through an independent adapter, achieving zero-intrusion plug-and-play.
- **Closed-loop tamper-proofing and anomaly capture**:
  1. **Tamper & poisoning detection**: automatically compares deployment info presented on docs sites and Explorer to catch malicious tampering of developer entry points.
  2. **On-chain anomaly & upgrade monitoring**: senses in real time whether deployment cells of upgradable contracts (Type ID) have been consumed or replaced, and alerts and analyzes at the first moment.

---

## 2. Target System Architecture & Module Plan

```
src/
├── deployments/                  # [pure baseline] officially catalogued standard contract deployment JSONs (kept as-is)
├── types/                        # unified data specs
│   ├── deployment.ts             # existing base deployment types
│   ├── adapter.ts                # adapter interface and normalized script info types
│   └── report.ts                 # diff diagnosis and security risk rating report types
├── adapters/                     # [adapter layer] integrating heterogeneous data sources
│   ├── base.ts                   # adapter abstract base class
│   ├── onchain/                  # on-chain truth source (via RPC queries)
│   │   └── ckb-rpc-adapter.ts
│   ├── docs/                     # docs-site sources (Markdown / static page parsing)
│   │   ├── ckb-docs-adapter.ts
│   │   └── rfcs-adapter.ts
│   ├── explorer/                 # Explorer source (CKB Explorer API)
│   │   └── explorer-api-adapter.ts
│   └── sdk/                      # SDK sources (reusing and migrating existing capability)
│       └── ccc-sdk-adapter.ts
├── engine/                       # [core comparison & audit engine]
│   ├── verifier.ts               # multi-source cross-check and hash comparator
│   ├── upgrade-tracker.ts        # Type ID contract upgrade and transaction tracing analysis
│   └── risk-evaluator.ts         # risk level evaluation rule engine
├── notifier/                     # [alerting & distribution channels]
│   ├── notifier.ts               # unified notification interface
│   ├── telegram.ts               # Telegram Bot alerts
│   ├── feishu.ts                 # Lark (Feishu) webhook alerts
│   ├── discord.ts                # Discord webhook alerts
│   └── github-issue.ts           # auto-triggered GitHub security issues
├── cli/                          # CLI entry points
│   └── monitor.ts                # one-shot check / continuous daemon
└── index.ts                      # main entry exports
```

---

## 3. Core Interfaces & Data Models

### 1. Normalized script info (`NormalizedScriptInfo`)
```typescript
export interface NormalizedScriptInfo {
  canonicalName: string;            // mapped standard name (e.g. "secp256k1_blake160_sighash_all")
  sourceName: string;               // native name in the external source (e.g. "SECP256K1/blake160")
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
    sourceUrl?: string;             // fetch source URL / API path
    fetchedAt: number;              // fetch timestamp
    blockNumber?: number;           // on-chain block height (on-chain source)
    isLive?: boolean;               // whether the cell is live (on-chain source)
    actualDataHash?: string;        // real-time computed Data Blake2b (on-chain source)
  };
}
```

### 2. Unified adapter interface (`ScriptSourceAdapter`)
```typescript
export interface ScriptSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: 'onchain' | 'docs' | 'explorer' | 'sdk';

  /** Fetch and normalize contract data */
  fetchScripts(network: 'mainnet' | 'testnet'): Promise<NormalizedScriptInfo[]>;
}
```

### 3. Verification mismatch (`VerificationMismatch`)
```typescript
export enum RiskLevel {
  P0_CRITICAL = 'P0_CRITICAL',  // critical security event: suspected poisoning/tampering, unexpected on-chain upgrade
  P1_HIGH     = 'P1_HIGH',      // severe functional breakage: upgraded on-chain but external sources still point to dead cells
  P2_MEDIUM   = 'P2_MEDIUM',    // information lag: docs site or SDK config out of date
  P3_INFO     = 'P3_INFO',      // informational: patrol passed, routine version updates
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

## 4. Detailed Adapter Design

### 1. On-chain truth adapter (`OnChainAdapter`)
- **Positioning**: highest authority; every external presentation must match real-time on-chain physical facts.
- **Core logic**:
  - Based on `@ckb-ccc/core`'s `ClientPublicMainnet` / `ClientPublicTestnet`.
  - Reads `cellDeps[].outPoint` recorded in each deployment config:
    - Calls `getCellLive(outPoint, true)`:
      - If a cell is returned: computes `ccc.hashCkb(cell.outputData)` as the measured `dataHash`; if a Type Script exists, computes `type.hash()` as the measured `typeHash`.
      - If null is returned: **marks the OutPoint as dead! Triggers the contract upgrade tracker**.
  - For contracts with a `typeId`, locates the current unique live cell by Type Script and records the latest valid OutPoint.

### 2. Docs-site adapter (`DocsAdapter`)
- **Positioning**: detects tampering/stale config in the official docs entry points most referenced by developers.
- **Data acquisition strategy**:
  - Preferred: read the Markdown sources of the deployment chapters of `nervosnetwork/docs.nervos.org` directly via the GitHub Raw API (more stable than web scraping, immune to CDN restyling).
  - Fallback: headless parsing of designated URLs.
- **Parsing & mapping**:
  - Extracts Code Hash, Tx Hash, Index, Dep Type from Markdown tables.
  - Ships an internal `DocAliasMap` converting aliases in docs to `canonicalName`.

### 3. CKB Explorer adapter (`ExplorerAdapter`)
- **Positioning**: detects the CKB Explorer script detail pages and contract aggregation APIs.
- **Core logic**:
  - Periodically calls the CKB Explorer OpenAPI for officially catalogued script metadata.
  - Compares the script `code_hash`, `tx_hash`, and deployment cell status currently catalogued by Explorer.

### 4. SDK adapter (`SdkAdapter`)
- **Positioning**: keeps and improves existing SDK validation logic (CCC, Lumos, etc.).
- **Refactoring approach**: consolidates the original `CCCValidator` extraction logic into `CccSdkAdapter`, which only produces `NormalizedScriptInfo[]` and hands comparison to the core verification engine.

---

## 5. On-Chain Upgradable Contract (Type ID) Anomaly Tracking & Security Alerting

In CKB, upgradable contracts (e.g. Omnilock, Spore) are usually protected by a `Type ID`.

### Anomaly capture & alerting flow:
1. **Consumption sensing**: `OnChainAdapter` finds that an OutPoint recorded in the baseline returns dead.
2. **Transaction tracing (`UpgradeTracker`)**:
   - Extracts the `txHash` and `index` of that OutPoint.
   - Calls RPC `getTransaction` to trace the transaction consuming the cell.
   - Inspects the transaction's outputs: looking for a new cell carrying the same `Type ID` args.
3. **Security audit analysis**:
   - Captures the bytecode hash of the new cell (new DataHash) and byte-size change.
   - Captures the initiator lock of the triggering transaction and multisig witness.
4. **Risk grading & reporting**:
   - If the upgrade transaction is not in the "whitelist plan": trigger a **P0 emergency security alert** and notify the security team to verify possible key leakage.
   - If it is an officially announced upgrade: trigger a **P1 upgrade reminder**, prompting docs site, Explorer, and SDKs to update their OutPoints.

---

## 6. Risk Grading & Alert Response System

| Risk level | Trigger conditions | Notification channels | Automated emergency response |
| :--- | :--- | :--- | :--- |
| **P0 fatal** | 1. Unreported Type ID upgrade tx detected on-chain;<br>2. CodeHash presented on docs site or Explorer differs from on-chain (suspected tampering/poisoning). | Telegram bot, Lark urgent group, Discord @here, SMS/call webhook | Immediately auto-create GitHub Security Advisory / Issue and email core maintainers. |
| **P1 severe** | A normal upgrade happened on-chain, but docs/Explorer/SDK still show the dead old OutPoint (transactions would fail). | Telegram, Lark, Discord | Auto-create a "config sync todo" issue with upgrade tx details and suggested new OutPoint. |
| **P2 warning** | Docs site missing some fields, or a transient external-source network failure. | Ops logs, low-priority Lark notice | Retry mechanism, consecutive failure counters. |
| **P3 normal** | Automated patrol fully passed, all sources consistent. | Scheduled daily report / status page green | Update `latest-status.json` and CI status badge. |

---

## 7. Implementation Milestones

### Milestone 1: Architecture refactoring & on-chain truth adapter (1–2 days)
- [x] Create `src/types/adapter.ts` and `src/types/report.ts`.
- [x] Implement `OnChainAdapter`: poll OutPoint liveness and DataHash validation for the existing 23+ contracts based on `@ckb-ccc/core`.
- [x] Implement the core verification engine `CrossVerifier`: cross-check baseline against on-chain state.
- [x] Refactor the existing `CCCValidator` into `CccSdkAdapter` and verify the original SDK test functionality is unaffected.

### Milestone 2: On-chain Type ID upgrade tracker & multi-channel alerting (2–3 days)
- [x] Implement `UpgradeTracker`: when an OutPoint dies, trace the consuming transaction and extract the new cell plus old/new DataHash diff.
- [x] Implement the notifier dispatch framework `src/notifier/` supporting Telegram Bot and Lark webhooks.
- [x] Configure a GitHub Actions scheduled job (run once daily).

### Milestone 3: Docs-site & Explorer adapter integration (2–3 days)
- [x] Implement `DocsAdapter`: parse key CKB docs-site Markdown pages and build the alias mapping table.
- [x] Implement `ExplorerAdapter`: integrate the CKB Explorer data API.
- [x] Joint debugging of the four-way cross-comparison (baseline ⟷ on-chain ⟷ docs site ⟷ Explorer ⟷ SDK).

### Milestone 4: Automation ops & report delivery (1–2 days)
- [x] Write CLI commands: `pnpm run monitor`, `pnpm run monitor:upgrade`.
- [x] Automated PR generation: after an on-chain upgrade, generate a baseline-update PR in one step.
- [x] Complete test cases and documentation for overall delivery.

## Implementation Notes (necessary clarifications to the original plan)

- A `dep_group` cell's data is an OutPointVec, not contract bytecode; the implementation parses members first, then locates the code cell matching DataHash/TypeHash, avoiding incorrect code-hash comparison against group cells.
- CKB RPC has no direct "who consumed this OutPoint" query; the implementation uses the indexer by Type Script first, Lock Script as fallback, checks inputs tx-by-tx, and supports multiple hops.
- External sources may legitimately include auxiliary cellDeps (e.g. CCC's secp256k1 dep group), so auxiliary groups are graded separately from direct wrong-code cells to reduce false positives.
- Notification state, consecutive failure counts, and whitelists are never written into the deployment baseline; whitelists can be injected via `UPGRADE_WHITELIST_FILE`.
- After a non-Type-ID cell is consumed, no successor can be reliably proven; the system only alerts and requires manual audit, and never rewrites the baseline automatically.

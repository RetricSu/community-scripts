import type {
  AdapterType,
  Network,
  NormalizedOutPoint,
  NormalizedScript,
} from './adapter';

export enum RiskLevel {
  /** Security incident: suspected poisoning, unexpected on-chain upgrade */
  P0_CRITICAL = 'P0_CRITICAL',
  /** Functional outage: upgraded on chain but sources still point to a dead cell */
  P1_HIGH = 'P1_HIGH',
  /** Information drift: docs / SDK lagging, missing fields, source unavailable */
  P2_MEDIUM = 'P2_MEDIUM',
  /** Informational: checks passed, routine notes */
  P3_INFO = 'P3_INFO',
}

export const RISK_ORDER: readonly RiskLevel[] = [
  RiskLevel.P0_CRITICAL,
  RiskLevel.P1_HIGH,
  RiskLevel.P2_MEDIUM,
  RiskLevel.P3_INFO,
];

/** Lower number = more severe. */
export function riskRank(level: RiskLevel): number {
  return RISK_ORDER.indexOf(level);
}

export function isAtLeast(level: RiskLevel, threshold: RiskLevel): boolean {
  return riskRank(level) <= riskRank(threshold);
}

export function parseRiskLevel(value: string): RiskLevel {
  const v = value.trim().toUpperCase();
  const found = RISK_ORDER.find((l) => l === v || l.startsWith(`${v}_`));
  if (!found) {
    throw new Error(`Unknown risk level "${value}" (expected P0..P3)`);
  }
  return found;
}

/** Machine-readable reason of a finding; the risk evaluator maps it to a level. */
export type FindingKind =
  | 'CODE_HASH_MISMATCH'
  | 'HASH_TYPE_UNVERIFIABLE'
  | 'DEP_TYPE_MISMATCH'
  | 'CELLDEP_DEAD'
  | 'CELLDEP_NOT_FOUND'
  | 'CELLDEP_UNKNOWN_CODE'
  | 'CELLDEP_ALTERNATIVE'
  | 'CELLDEP_EXTRA'
  | 'FIELD_MISSING'
  | 'TRUTH_UNKNOWN'
  | 'BASELINE_INTEGRITY'
  | 'BASELINE_HASH_UNKNOWN'
  | 'BASELINE_CELLDEP_NOT_FOUND'
  | 'DEP_GROUP_CODE_MISSING'
  | 'UPGRADE_UNAUTHORIZED'
  | 'UPGRADE_AUTHORIZED'
  | 'DEPLOYMENT_DESTROYED'
  | 'SOURCE_UNAVAILABLE'
  | 'SCRIPT_UNMAPPED';

export type MismatchField =
  | 'codeHash'
  | 'hashType'
  | 'cellDeps'
  | 'depType'
  | 'liveness'
  | 'dataHash'
  | 'typeHash'
  | 'source';

export interface VerificationMismatch {
  scriptName: string;
  network: Network;
  sourceId: string;
  field: MismatchField;
  kind: FindingKind;
  // biome-ignore lint/suspicious/noExplicitAny: values are heterogeneous by design
  expected: any;
  // biome-ignore lint/suspicious/noExplicitAny: values are heterogeneous by design
  actual: any;
  riskLevel: RiskLevel;
  description: string;
  actionRequired: string;
  /** stable id used to de-duplicate alerts across runs */
  fingerprint: string;
}

export interface UpgradeHop {
  consumedOutPoint: NormalizedOutPoint;
  consumingTxHash?: string;
  blockNumber?: number;
  timestamp?: number;
  newOutPoint?: NormalizedOutPoint;
  oldDataHash?: string;
  newDataHash?: string;
  oldSize?: number;
  newSize?: number;
  /** lock on the consumed deployment cell */
  oldLock?: NormalizedScript;
  /** lock on the successor deployment cell, if one was found */
  newLock?: NormalizedScript;
  /** distinct lock scripts of the consuming transaction's inputs (who signed) */
  signerLocks?: NormalizedScript[];
  /** witness sizes (bytes) of the consuming transaction, a cheap multisig hint */
  witnessSizes?: number[];
}

export type UpgradeStatus = 'upgraded' | 'destroyed' | 'untraceable';

export interface UpgradeEvent {
  scriptName: string;
  network: Network;
  oldOutPoint: NormalizedOutPoint;
  status: UpgradeStatus;
  hops: UpgradeHop[];
  /** convenient first-hop summary for reports and alert channels */
  upgradedAt?: string;
  upgradedBlock?: number;
  consumingTxHash?: string;
  oldLock?: NormalizedScript;
  newLock?: NormalizedScript;
  signerLocks?: NormalizedScript[];
  latestOutPoint?: NormalizedOutPoint;
  latestDataHash?: string;
  latestTypeHash?: string;
  authorized: boolean;
  whitelistNote?: string;
  error?: string;
}

export interface SourceStatus {
  id: string;
  name: string;
  type: AdapterType;
  network: Network;
  ok: boolean;
  count: number;
  durationMs: number;
  error?: string;
  consecutiveFailures?: number;
}

export interface MonitorReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  networks: Network[];
  baselineScripts: number;
  sources: SourceStatus[];
  mismatches: VerificationMismatch[];
  upgrades: UpgradeEvent[];
  counts: Record<RiskLevel, number>;
  highestRisk: RiskLevel;
}

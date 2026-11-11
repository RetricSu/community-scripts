import type { Network } from '../types/adapter';
import {
  type FindingKind,
  type MismatchField,
  RISK_ORDER,
  RiskLevel,
  riskRank,
  type VerificationMismatch,
} from '../types/report';

/** Default severity for every finding kind (see section 6 of the plan). */
export const KIND_RISK_MAP: Record<FindingKind, RiskLevel> = {
  // P0: active tampering / unauthorized upgrade / baseline compromised
  CODE_HASH_MISMATCH: RiskLevel.P0_CRITICAL,
  CELLDEP_UNKNOWN_CODE: RiskLevel.P0_CRITICAL,
  BASELINE_INTEGRITY: RiskLevel.P0_CRITICAL,
  UPGRADE_UNAUTHORIZED: RiskLevel.P0_CRITICAL,
  DEPLOYMENT_DESTROYED: RiskLevel.P0_CRITICAL,

  // P1: users following the config will build failing transactions
  CELLDEP_DEAD: RiskLevel.P1_HIGH,
  CELLDEP_NOT_FOUND: RiskLevel.P1_HIGH,
  DEP_TYPE_MISMATCH: RiskLevel.P1_HIGH,
  BASELINE_CELLDEP_NOT_FOUND: RiskLevel.P1_HIGH,
  DEP_GROUP_CODE_MISSING: RiskLevel.P1_HIGH,
  UPGRADE_AUTHORIZED: RiskLevel.P1_HIGH,

  // P2: drift, incomplete records, or transient source failure
  HASH_TYPE_UNVERIFIABLE: RiskLevel.P2_MEDIUM,
  CELLDEP_ALTERNATIVE: RiskLevel.P2_MEDIUM,
  CELLDEP_EXTRA: RiskLevel.P2_MEDIUM,
  FIELD_MISSING: RiskLevel.P2_MEDIUM,
  TRUTH_UNKNOWN: RiskLevel.P2_MEDIUM,
  BASELINE_HASH_UNKNOWN: RiskLevel.P2_MEDIUM,
  SOURCE_UNAVAILABLE: RiskLevel.P2_MEDIUM,

  // P3: informational notes (e.g. external source lists a non-baseline script)
  SCRIPT_UNMAPPED: RiskLevel.P3_INFO,
};

export interface FindingInput {
  scriptName: string;
  network: Network;
  sourceId: string;
  field: MismatchField;
  kind: FindingKind;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous values
  expected: any;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous values
  actual: any;
  description: string;
  actionRequired: string;
  riskLevel?: RiskLevel;
  fingerprintSuffix?: string;
}

export class RiskEvaluator {
  createMismatch(input: FindingInput): VerificationMismatch {
    const riskLevel = input.riskLevel ?? KIND_RISK_MAP[input.kind];
    const suffix = input.fingerprintSuffix ? `:${input.fingerprintSuffix}` : '';
    const fingerprint = `${input.sourceId}:${input.network}:${input.scriptName}:${input.field}:${input.kind}${suffix}`;
    return {
      scriptName: input.scriptName,
      network: input.network,
      sourceId: input.sourceId,
      field: input.field,
      kind: input.kind,
      expected: input.expected,
      actual: input.actual,
      riskLevel,
      description: input.description,
      actionRequired: input.actionRequired,
      fingerprint,
    };
  }

  sort(mismatches: VerificationMismatch[]): VerificationMismatch[] {
    return [...mismatches].sort((a, b) => {
      const r = riskRank(a.riskLevel) - riskRank(b.riskLevel);
      if (r !== 0) return r;
      return a.fingerprint.localeCompare(b.fingerprint);
    });
  }

  summarize(mismatches: VerificationMismatch[]): {
    counts: Record<RiskLevel, number>;
    highestRisk: RiskLevel;
  } {
    const counts: Record<RiskLevel, number> = {
      [RiskLevel.P0_CRITICAL]: 0,
      [RiskLevel.P1_HIGH]: 0,
      [RiskLevel.P2_MEDIUM]: 0,
      [RiskLevel.P3_INFO]: 0,
    };
    for (const m of mismatches) counts[m.riskLevel]++;
    const highestRisk =
      RISK_ORDER.find((level) => counts[level] > 0) ?? RiskLevel.P3_INFO;
    return { counts, highestRisk };
  }
}

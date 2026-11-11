import { isAtLeast, riskRank } from '../types/report';
import type {
  FindingKind,
  MonitorReport,
  RiskLevel,
  VerificationMismatch,
} from '../types/report';

/**
 * Stable issue-group key: network + script + root cause.
 * Field-level and multi-source findings that share a root are filed together.
 * Per-finding fingerprints are unchanged so existing open issues still cover
 * a group and are never mutated.
 */
export type RootCauseId =
  | 'hash-mismatch'
  | 'celldep-or-record-gap'
  | 'unknown-code'
  | 'upgrade-or-destruction'
  | 'baseline'
  | 'source'
  | 'other';

export interface FindingGroup {
  key: string;
  network: VerificationMismatch['network'];
  scriptName: string;
  rootCause: RootCauseId;
  items: VerificationMismatch[];
  highestRisk: RiskLevel;
  primary: VerificationMismatch;
}

export function rootCauseId(mismatch: VerificationMismatch): RootCauseId {
  return rootCauseIdFor(mismatch.kind, mismatch.field);
}

export function rootCauseIdFor(
  kind: FindingKind,
  field?: VerificationMismatch['field']
): RootCauseId {
  switch (kind) {
    case 'CODE_HASH_MISMATCH':
    case 'HASH_TYPE_UNVERIFIABLE':
    case 'DEP_TYPE_MISMATCH':
      return 'hash-mismatch';
    case 'FIELD_MISSING':
      return field === 'codeHash' ||
        field === 'dataHash' ||
        field === 'typeHash' ||
        field === 'hashType'
        ? 'hash-mismatch'
        : 'celldep-or-record-gap';
    case 'CELLDEP_DEAD':
    case 'CELLDEP_NOT_FOUND':
    case 'CELLDEP_ALTERNATIVE':
    case 'CELLDEP_EXTRA':
      return 'celldep-or-record-gap';
    case 'CELLDEP_UNKNOWN_CODE':
      // Keep unknown live code distinct from mere alternatives or dead refs.
      return 'unknown-code';
    case 'UPGRADE_UNAUTHORIZED':
    case 'UPGRADE_AUTHORIZED':
    case 'DEPLOYMENT_DESTROYED':
      return 'upgrade-or-destruction';
    case 'BASELINE_INTEGRITY':
    case 'BASELINE_HASH_UNKNOWN':
    case 'BASELINE_CELLDEP_NOT_FOUND':
    case 'DEP_GROUP_CODE_MISSING':
      return 'baseline';
    case 'SOURCE_UNAVAILABLE':
    case 'SCRIPT_UNMAPPED':
    case 'TRUTH_UNKNOWN':
      return 'source';
    default:
      return 'other';
  }
}

export function groupKey(mismatch: VerificationMismatch): string {
  return `${mismatch.network}:${mismatch.scriptName}:${rootCauseId(mismatch)}`;
}

export function findingMarker(fingerprint: string): string {
  return `<!-- ckb-monitor:${fingerprint} -->`;
}

export function groupMarker(key: string): string {
  return `<!-- ckb-monitor-group:${key} -->`;
}

export function groupFindings(
  mismatches: VerificationMismatch[]
): FindingGroup[] {
  const map = new Map<string, VerificationMismatch[]>();
  for (const mismatch of mismatches) {
    const key = groupKey(mismatch);
    const list = map.get(key);
    if (list) list.push(mismatch);
    else map.set(key, [mismatch]);
  }
  return [...map.entries()].map(([key, items]) => {
    const sorted = [...items].sort((a, b) => {
      const risk = riskRank(a.riskLevel) - riskRank(b.riskLevel);
      if (risk !== 0) return risk;
      return a.fingerprint.localeCompare(b.fingerprint);
    });
    const primary = sorted[0];
    return {
      key,
      network: primary.network,
      scriptName: primary.scriptName,
      rootCause: rootCauseId(primary),
      items: sorted,
      highestRisk: primary.riskLevel,
      primary,
    };
  });
}

/** True if an existing open issue already represents this group. */
export function isGroupCovered(
  openBodies: string[],
  group: FindingGroup
): boolean {
  const needles = [
    groupMarker(group.key),
    ...group.items.map((item) => findingMarker(item.fingerprint)),
  ];
  return openBodies.some((body) =>
    needles.some((needle) => body.includes(needle))
  );
}

/**
 * Groups that should be considered for a new GitHub issue: at least one
 * selected (new/changed) finding, and no existing open ticket already
 * covering the group via a legacy fingerprint or a group marker.
 */
export function groupsToOpen(
  report: MonitorReport,
  selected: VerificationMismatch[],
  openBodies: string[],
  minLevel: RiskLevel
): FindingGroup[] {
  const selectedKeys = new Set(selected.map((m) => m.fingerprint));
  const candidates = report.mismatches.filter((m) =>
    isAtLeast(m.riskLevel, minLevel)
  );
  return groupFindings(candidates).filter(
    (group) =>
      group.items.some((item) => selectedKeys.has(item.fingerprint)) &&
      !isGroupCovered(openBodies, group)
  );
}

export function issueTitle(group: FindingGroup): string {
  const extra =
    group.items.length > 1 ? ` (${group.items.length} findings)` : '';
  return `[${group.highestRisk}] ${group.network}/${group.scriptName}: ${group.primary.kind}${extra}`;
}

export function issueBody(report: MonitorReport, group: FindingGroup): string {
  const lines = [
    groupMarker(group.key),
    ...group.items.map((item) => findingMarker(item.fingerprint)),
    '## CKB contract security monitor finding',
    '',
    `- **Network:** ${group.network}`,
    `- **Script:** ${group.scriptName}`,
    `- **Root cause:** ${group.rootCause}`,
    `- **Risk:** ${group.highestRisk}`,
    `- **Group:** \`${group.key}\``,
    `- **Findings:** ${group.items.length}`,
    '',
    'Evidence from every source and field in this group is included below.',
    'Existing open issues are not edited; fingerprints stay stable so older',
    'tickets continue to cover the group.',
    '',
  ];
  for (const [index, item] of group.items.entries()) {
    lines.push(
      `### ${index + 1}. ${item.kind} (${item.sourceId} / ${item.field})`,
      '',
      `- **Source:** ${item.sourceId}`,
      `- **Field:** ${item.field}`,
      `- **Risk:** ${item.riskLevel}`,
      `- **Fingerprint:** \`${item.fingerprint}\``,
      '',
      item.description,
      '',
      '#### Action required',
      item.actionRequired,
      '',
      '#### Expected',
      '```json',
      JSON.stringify(item.expected, null, 2)?.slice(0, 4000) ?? 'null',
      '```',
      '#### Actual',
      '```json',
      JSON.stringify(item.actual, null, 2)?.slice(0, 6000) ?? 'null',
      '```',
      ''
    );
  }
  lines.push(`Report generated at ${report.finishedAt}.`);
  return lines.join('\n');
}

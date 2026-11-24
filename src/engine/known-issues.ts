import * as fs from 'node:fs';
import type { VerificationMismatch } from '../types/report';

/**
 * Persistent registry of known-but-unresolved findings.
 *
 * The registry is versioned JSON stored in the repository (like the upgrade
 * whitelist), so acknowledgement state survives across CI runs instead of
 * living only in the cached monitor-state.json. Entries match findings by
 * exact fingerprint and stop matching once `expiresAt` passes, which makes
 * the finding resurface instead of being silently suppressed forever.
 */
export interface KnownIssue {
  /** exact VerificationMismatch.fingerprint to acknowledge */
  fingerprint: string;
  /** human-readable reason, shown in reports */
  note: string;
  /** ISO timestamp of acknowledgement */
  recordedAt: string;
  /** optional ISO timestamp; expired entries no longer match */
  expiresAt?: string;
  /** optional author / reference link for auditability */
  recordedBy?: string;
}

export interface KnownIssuesData {
  version: 1;
  issues: KnownIssue[];
}

export function emptyKnownIssues(): KnownIssuesData {
  return { version: 1, issues: [] };
}

function isValidIssue(entry: unknown): entry is KnownIssue {
  if (!entry || typeof entry !== 'object') return false;
  const issue = entry as Partial<KnownIssue>;
  return (
    typeof issue.fingerprint === 'string' &&
    issue.fingerprint.length > 0 &&
    typeof issue.note === 'string' &&
    typeof issue.recordedAt === 'string' &&
    (issue.expiresAt === undefined ||
      !Number.isNaN(Date.parse(issue.expiresAt)))
  );
}

export class KnownIssuesRegistry {
  private constructor(
    readonly data: KnownIssuesData,
    readonly file?: string
  ) {}

  /**
   * Loads the registry; a missing or corrupt file yields an empty registry
   * so known-issue bookkeeping can never disable monitoring itself.
   */
  static load(file: string): KnownIssuesRegistry {
    try {
      if (!fs.existsSync(file)) {
        return new KnownIssuesRegistry(emptyKnownIssues(), file);
      }
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const raw = Array.isArray(parsed?.issues) ? parsed.issues : [];
      const issues = raw.filter(isValidIssue);
      if (issues.length !== raw.length) {
        console.warn(
          `Known-issues file ${file}: dropped ${raw.length - issues.length} invalid entr(y/ies)`
        );
      }
      return new KnownIssuesRegistry({ version: 1, issues }, file);
    } catch (error) {
      console.warn(
        `Known-issues file ${file} unreadable (${error}); treating as empty.`
      );
      return new KnownIssuesRegistry(emptyKnownIssues(), file);
    }
  }

  /** Non-expired entry exactly matching the finding fingerprint, if any. */
  find(
    mismatch: VerificationMismatch,
    now = Date.now()
  ): KnownIssue | undefined {
    return this.data.issues.find(
      (issue) =>
        issue.fingerprint === mismatch.fingerprint &&
        (!issue.expiresAt || Date.parse(issue.expiresAt) > now)
    );
  }

  /**
   * Marks every matching mismatch as known-but-unresolved in place.
   * Returns the number of findings acknowledged.
   */
  annotate(mismatches: VerificationMismatch[], now = Date.now()): number {
    let known = 0;
    for (const mismatch of mismatches) {
      const issue = this.find(mismatch, now);
      if (issue) {
        mismatch.known = true;
        mismatch.knownNote = issue.note;
        mismatch.knownExpiresAt = issue.expiresAt;
        known++;
      }
    }
    return known;
  }

  get size(): number {
    return this.data.issues.length;
  }
}

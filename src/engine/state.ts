import * as fs from 'fs';
import * as path from 'path';
import type {
  RiskLevel,
  SourceStatus,
  VerificationMismatch,
} from '../types/report';

export interface AlertState {
  firstSeenAt: string;
  lastNotifiedAt?: string;
  lastLevel: RiskLevel;
}

export interface MonitorStateData {
  version: 1;
  sources: Record<
    string,
    { consecutiveFailures: number; lastError?: string; lastSuccessAt?: string }
  >;
  alerts: Record<string, AlertState>;
}

export function emptyMonitorState(): MonitorStateData {
  return { version: 1, sources: {}, alerts: {} };
}

export class MonitorState {
  data: MonitorStateData;

  constructor(readonly file: string) {
    this.data = emptyMonitorState();
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
        this.data = {
          ...emptyMonitorState(),
          ...parsed,
          sources: parsed.sources ?? {},
          alerts: parsed.alerts ?? {},
        };
      }
    } catch {
      // A corrupt state file must never disable monitoring itself.
      this.data = emptyMonitorState();
    }
  }

  updateSource(status: SourceStatus): void {
    const key = `${status.id}:${status.network}`;
    const previous = this.data.sources[key]?.consecutiveFailures ?? 0;
    status.consecutiveFailures = status.ok ? 0 : previous + 1;
    this.data.sources[key] = {
      consecutiveFailures: status.consecutiveFailures,
      lastError: status.ok ? undefined : status.error,
      lastSuccessAt: status.ok
        ? new Date().toISOString()
        : this.data.sources[key]?.lastSuccessAt,
    };
  }

  /** Alert once per channel/fingerprint, then at most once per 24 hours. */
  shouldNotify(
    channelId: string,
    mismatch: VerificationMismatch,
    now = Date.now()
  ): boolean {
    const key = `${channelId}:${mismatch.fingerprint}`;
    const previous = this.data.alerts[key];
    if (!previous?.lastNotifiedAt) return true;
    const elapsed = now - Date.parse(previous.lastNotifiedAt);
    return (
      elapsed >= 24 * 60 * 60 * 1000 ||
      previous.lastLevel !== mismatch.riskLevel
    );
  }

  markNotified(
    channelId: string,
    mismatch: VerificationMismatch,
    now = Date.now()
  ): void {
    const key = `${channelId}:${mismatch.fingerprint}`;
    const previous = this.data.alerts[key];
    this.data.alerts[key] = {
      firstSeenAt: previous?.firstSeenAt ?? new Date(now).toISOString(),
      lastNotifiedAt: new Date(now).toISOString(),
      lastLevel: mismatch.riskLevel,
    };
  }

  save(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2) + '\n');
  }
}

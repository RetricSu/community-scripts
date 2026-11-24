import type { MonitorState } from '../engine/state';
import type {
  MonitorReport,
  RiskLevel,
  VerificationMismatch,
} from '../types/report';
import { isAtLeast, parseRiskLevel } from '../types/report';
import { errorMessage } from '../utils/normalize';

export interface NotificationChannel {
  readonly id: string;
  readonly minLevel: RiskLevel;
  send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void>;
}

export function formatAlertText(
  report: MonitorReport,
  mismatches: VerificationMismatch[]
): string {
  const lines = [
    `CKB contract security monitor alert (${report.highestRisk})`,
    `Time: ${report.finishedAt}`,
    `Networks: ${report.networks.join(', ')}`,
    `P0=${report.counts.P0_CRITICAL} P1=${report.counts.P1_HIGH} P2=${report.counts.P2_MEDIUM} P3=${report.counts.P3_INFO}`,
    '',
  ];
  for (const m of mismatches.slice(0, 20)) {
    lines.push(
      `[${m.riskLevel}] ${m.network}/${m.scriptName} ${m.kind}`,
      `Source: ${m.sourceId} Field: ${m.field}`,
      m.description,
      `Action: ${m.actionRequired}`,
      `Fingerprint: ${m.fingerprint}`,
      ''
    );
  }
  if (mismatches.length > 20) {
    lines.push(`... ${mismatches.length - 20} more in the JSON report`);
  }
  return lines.join('\n');
}

export function truncate(text: string, max: number): string {
  return text.length <= max
    ? text
    : `${text.slice(0, max - 20)}\n...(truncated)`;
}

/** Dispatches only new/changed findings and records delivery in MonitorState. */
export class Notifier {
  constructor(readonly channels: NotificationChannel[] = []) {}

  async notify(report: MonitorReport, state?: MonitorState): Promise<void> {
    await Promise.all(
      this.channels.map(async (channel) => {
        const selected = report.mismatches.filter(
          (m) =>
            !m.known &&
            isAtLeast(m.riskLevel, channel.minLevel) &&
            (!state || state.shouldNotify(channel.id, m))
        );
        if (selected.length === 0) return;
        try {
          await channel.send(report, selected);
          if (state) {
            for (const mismatch of selected) {
              state.markNotified(channel.id, mismatch);
            }
          }
        } catch (error) {
          // A broken alert channel must not hide the report or stop other channels.
          console.error(
            `Notification channel ${channel.id} failed: ${errorMessage(error)}`
          );
        }
      })
    );
  }
}

export function minLevelFromEnv(
  value: string | undefined,
  fallback: RiskLevel
): RiskLevel {
  return value ? parseRiskLevel(value) : fallback;
}

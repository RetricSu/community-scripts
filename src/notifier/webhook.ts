import {
  type MonitorReport,
  RiskLevel,
  type VerificationMismatch,
} from '../types/report';
import { fetchJson } from '../utils/http';
import {
  formatAlertText,
  minLevelFromEnv,
  type NotificationChannel,
  truncate,
} from './notifier';

/**
 * Generic JSON webhook for SMS/phone gateways or an internal incident system.
 * The endpoint receives `{ text, report, findings }`; authentication headers
 * can be supplied with ALERT_WEBHOOK_BEARER_TOKEN.
 */
export class WebhookNotifier implements NotificationChannel {
  readonly id = 'webhook';
  readonly minLevel: RiskLevel;

  constructor(
    private readonly url: string,
    private readonly bearerToken?: string,
    minLevel: RiskLevel = RiskLevel.P0_CRITICAL
  ) {
    this.minLevel = minLevel;
  }

  static fromEnv(): WebhookNotifier | undefined {
    const url = process.env.ALERT_WEBHOOK_URL;
    return url
      ? new WebhookNotifier(
          url,
          process.env.ALERT_WEBHOOK_BEARER_TOKEN,
          minLevelFromEnv(
            process.env.ALERT_WEBHOOK_MIN_LEVEL,
            RiskLevel.P0_CRITICAL
          )
        )
      : undefined;
  }

  async send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`;
    }
    await fetchJson(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: truncate(formatAlertText(report, mismatches), 20_000),
        report,
        findings: mismatches,
      }),
    });
  }
}

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

export class DiscordNotifier implements NotificationChannel {
  readonly id = 'discord';
  readonly minLevel: RiskLevel;

  constructor(
    private readonly webhookUrl: string,
    minLevel: RiskLevel = RiskLevel.P1_HIGH
  ) {
    this.minLevel = minLevel;
  }

  static fromEnv(): DiscordNotifier | undefined {
    const url = process.env.DISCORD_WEBHOOK_URL;
    return url
      ? new DiscordNotifier(
          url,
          minLevelFromEnv(process.env.DISCORD_MIN_LEVEL, RiskLevel.P1_HIGH)
        )
      : undefined;
  }

  async send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    const prefix = mismatches.some((m) => m.riskLevel === RiskLevel.P0_CRITICAL)
      ? '@here '
      : '';
    await fetchJson(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: truncate(
          `${prefix}${formatAlertText(report, mismatches)}`,
          1900
        ),
        username: 'CKB Script Monitor',
      }),
    });
  }
}

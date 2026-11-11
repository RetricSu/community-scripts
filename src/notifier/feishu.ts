import { createHmac } from 'crypto';
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

/** Feishu/Lark custom bot webhook, optionally with signed requests. */
export class FeishuNotifier implements NotificationChannel {
  readonly id = 'feishu';
  readonly minLevel: RiskLevel;

  constructor(
    private readonly webhookUrl: string,
    private readonly secret?: string,
    minLevel: RiskLevel = RiskLevel.P1_HIGH
  ) {
    this.minLevel = minLevel;
  }

  static fromEnv(): FeishuNotifier | undefined {
    const url = process.env.FEISHU_WEBHOOK_URL;
    return url
      ? new FeishuNotifier(
          url,
          process.env.FEISHU_SECRET,
          minLevelFromEnv(process.env.FEISHU_MIN_LEVEL, RiskLevel.P1_HIGH)
        )
      : undefined;
  }

  async send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    const body: Record<string, unknown> = {
      msg_type: 'text',
      content: { text: truncate(formatAlertText(report, mismatches), 20_000) },
    };
    if (this.secret) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const sign = createHmac('sha256', `${timestamp}\n${this.secret}`)
        .update('')
        .digest('base64');
      body.timestamp = timestamp;
      body.sign = sign;
    }
    await fetchJson(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

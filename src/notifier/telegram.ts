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

export class TelegramNotifier implements NotificationChannel {
  readonly id = 'telegram';
  readonly minLevel: RiskLevel;

  constructor(
    private readonly token: string,
    private readonly chatId: string,
    minLevel: RiskLevel = RiskLevel.P1_HIGH
  ) {
    this.minLevel = minLevel;
  }

  static fromEnv(): TelegramNotifier | undefined {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    return token && chatId
      ? new TelegramNotifier(
          token,
          chatId,
          minLevelFromEnv(process.env.TELEGRAM_MIN_LEVEL, RiskLevel.P1_HIGH)
        )
      : undefined;
  }

  async send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    await fetchJson(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text: truncate(formatAlertText(report, mismatches), 4000),
        disable_web_page_preview: true,
      }),
    });
  }
}

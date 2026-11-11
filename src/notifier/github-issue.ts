import {
  type MonitorReport,
  RiskLevel,
  type VerificationMismatch,
} from '../types/report';
import { fetchJson } from '../utils/http';
import { minLevelFromEnv, type NotificationChannel } from './notifier';

interface GithubIssue {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
}

/** Opens deduplicated public issues for P0/P1 findings. */
export class GithubIssueNotifier implements NotificationChannel {
  readonly id = 'github-issue';
  readonly minLevel: RiskLevel;

  constructor(
    private readonly token: string,
    private readonly repository: string,
    minLevel: RiskLevel = RiskLevel.P1_HIGH
  ) {
    this.minLevel = minLevel;
  }

  static fromEnv(): GithubIssueNotifier | undefined {
    const token = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY;
    return token && repository
      ? new GithubIssueNotifier(
          token,
          repository,
          minLevelFromEnv(process.env.GITHUB_ISSUE_MIN_LEVEL, RiskLevel.P1_HIGH)
        )
      : undefined;
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ckb-community-scripts-monitor',
      'Content-Type': 'application/json',
    };
  }

  async send(
    report: MonitorReport,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    const existing = await fetchJson<GithubIssue[]>(
      `https://api.github.com/repos/${this.repository}/issues?state=open&labels=ckb-monitor&per_page=100`,
      { headers: this.headers() }
    );
    const openBodies = existing.map((i) => i.body ?? '');

    for (const mismatch of mismatches) {
      const marker = `<!-- ckb-monitor:${mismatch.fingerprint} -->`;
      if (openBodies.some((body) => body.includes(marker))) continue;
      const title = `[${mismatch.riskLevel}] ${mismatch.network}/${mismatch.scriptName}: ${mismatch.kind}`;
      const body = [
        marker,
        '## CKB contract security monitor finding',
        '',
        `- **Network:** ${mismatch.network}`,
        `- **Script:** ${mismatch.scriptName}`,
        `- **Source:** ${mismatch.sourceId}`,
        `- **Field:** ${mismatch.field}`,
        `- **Risk:** ${mismatch.riskLevel}`,
        `- **Fingerprint:** \`${mismatch.fingerprint}\``,
        '',
        mismatch.description,
        '',
        '### Action required',
        mismatch.actionRequired,
        '',
        '### Expected',
        '```json',
        JSON.stringify(mismatch.expected, null, 2)?.slice(0, 4000),
        '```',
        '### Actual',
        '```json',
        JSON.stringify(mismatch.actual, null, 2)?.slice(0, 6000),
        '```',
        '',
        `Report generated at ${report.finishedAt}.`,
      ].join('\n');
      await fetchJson<GithubIssue>(
        `https://api.github.com/repos/${this.repository}/issues`,
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            title,
            body,
            labels: ['ckb-monitor', mismatch.riskLevel.toLowerCase()],
          }),
        }
      );
    }
  }
}

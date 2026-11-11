import {
  type MonitorReport,
  RiskLevel,
  type VerificationMismatch,
} from '../types/report';
import { fetchJson } from '../utils/http';
import { groupsToOpen, issueBody, issueTitle } from './issue-grouping';
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
    const groups = groupsToOpen(report, mismatches, openBodies, this.minLevel);

    for (const group of groups) {
      await fetchJson<GithubIssue>(
        `https://api.github.com/repos/${this.repository}/issues`,
        {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            title: issueTitle(group),
            body: issueBody(report, group),
            labels: ['ckb-monitor', group.highestRisk.toLowerCase()],
          }),
        }
      );
    }
  }
}

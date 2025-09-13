import * as fs from 'fs';
import * as path from 'path';
import { NPMSDKDiscoverer } from '../discovery/npm-sdk-discoverer';
import {
  DynamicSDKTester,
  type TestReport,
} from '../testing/dynamic-sdk-tester';

export interface ValidationSummary {
  totalSDKs: number;
  successfulSDKs: number;
  failedSDKs: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  timestamp: string;
  duration: number;
}

export class DailyTestRunner {
  private resultsDir: string;

  constructor(resultsDir: string = './results') {
    this.resultsDir = resultsDir;
    this.ensureResultsDir();
  }

  async runDailyTests(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting daily SDK validation...');
    console.log('='.repeat(50));

    try {
      // Step 1: Discover SDKs
      const discoverer = new NPMSDKDiscoverer();
      const sdkNames = await discoverer.discoverSDKs();

      if (sdkNames.length === 0) {
        console.log('❌ No SDKs found to test');
        return;
      }

      // Step 2: Test all SDKs
      const tester = new DynamicSDKTester();
      const reports = await tester.testAllSDKs(sdkNames);

      // Step 3: Generate summary
      const summary = this.generateSummary(reports, Date.now() - startTime);

      // Step 4: Save results
      await this.saveResults(reports, summary);

      // Step 5: Print summary
      this.printSummary(summary, reports);

      // Step 6: Handle failures
      const failures = reports.filter((r) => !r.success);
      if (failures.length > 0) {
        await this.handleFailures(failures);
      }

      console.log('\n✅ Daily SDK validation completed successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('💥 Daily SDK validation failed:', errorMessage);
      throw error;
    }
  }

  private generateSummary(
    reports: TestReport[],
    duration: number
  ): ValidationSummary {
    const totalSDKs = reports.length;
    const successfulSDKs = reports.filter((r) => r.success).length;
    const failedSDKs = totalSDKs - successfulSDKs;

    const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
    const passedTests = reports.reduce((sum, r) => sum + r.passedTests, 0);
    const failedTests = reports.reduce((sum, r) => sum + r.failedTests, 0);

    const successRate = totalSDKs > 0 ? (successfulSDKs / totalSDKs) * 100 : 0;

    return {
      totalSDKs,
      successfulSDKs,
      failedSDKs,
      totalTests,
      passedTests,
      failedTests,
      successRate,
      timestamp: new Date().toISOString(),
      duration,
    };
  }

  private printSummary(
    summary: ValidationSummary,
    reports: TestReport[]
  ): void {
    console.log('\n📊 Validation Summary');
    console.log('='.repeat(50));
    console.log(`Total SDKs tested: ${summary.totalSDKs}`);
    console.log(`Successful: ${summary.successfulSDKs}`);
    console.log(`Failed: ${summary.failedSDKs}`);
    console.log(`Success rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total tests: ${summary.totalTests}`);
    console.log(`Passed tests: ${summary.passedTests}`);
    console.log(`Failed tests: ${summary.failedTests}`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(1)}s`);

    // Print detailed results for failed SDKs
    const failures = reports.filter((r) => !r.success);
    if (failures.length > 0) {
      console.log('\n❌ Failed SDKs:');
      failures.forEach((report) => {
        console.log(`  - ${report.sdkName}: ${report.error}`);
      });
    }

    // Print SDKs with test failures
    const sdkWithTestFailures = reports.filter(
      (r) => r.success && r.failedTests > 0
    );
    if (sdkWithTestFailures.length > 0) {
      console.log('\n⚠️  SDKs with test failures:');
      sdkWithTestFailures.forEach((report) => {
        console.log(
          `  - ${report.sdkName}: ${report.failedTests}/${report.totalTests} tests failed`
        );
      });
    }
  }

  private async saveResults(
    reports: TestReport[],
    summary: ValidationSummary
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(
      this.resultsDir,
      `validation-results-${timestamp}.json`
    );
    const summaryFile = path.join(
      this.resultsDir,
      `validation-summary-${timestamp}.json`
    );

    // Save detailed results
    const resultsData = {
      summary,
      reports,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
    console.log(`📁 Detailed results saved to: ${resultsFile}`);

    // Save summary
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📁 Summary saved to: ${summaryFile}`);

    // Update latest results
    fs.writeFileSync(
      path.join(this.resultsDir, 'latest-results.json'),
      JSON.stringify(resultsData, null, 2)
    );
    fs.writeFileSync(
      path.join(this.resultsDir, 'latest-summary.json'),
      JSON.stringify(summary, null, 2)
    );
  }

  private async handleFailures(failures: TestReport[]): Promise<void> {
    console.log(`\n🚨 Found ${failures.length} SDK failures`);

    // Here you could add notification logic:
    // - Send email notifications
    // - Post to Slack/Discord
    // - Create GitHub issues
    // - Send webhook notifications

    // For now, just log the failures
    failures.forEach((failure) => {
      console.log(`  - ${failure.sdkName}: ${failure.error}`);
    });
  }

  private ensureResultsDir(): void {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async getLatestResults(): Promise<{
    summary: ValidationSummary;
    reports: TestReport[];
  } | null> {
    const latestFile = path.join(this.resultsDir, 'latest-results.json');
    if (fs.existsSync(latestFile)) {
      const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
      return {
        summary: data.summary,
        reports: data.reports,
      };
    }
    return null;
  }
}

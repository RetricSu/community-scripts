#!/usr/bin/env node

import { Command } from 'commander';
import { DailyTestRunner } from './testing/daily-test-runner';
import { NPMSDKDiscoverer } from './discovery/npm-sdk-discoverer';
import { DynamicSDKTester } from './testing/dynamic-sdk-tester';
import { writeFileSync } from 'fs';
import { version } from '../package.json';
import { SDK_PACKAGE_NAMES } from './validate';

const program = new Command();

program
  .name('community-scripts')
  .description(
    'CKB Script validation tool for testing SDKs against deployment configurations'
  )
  .version(version);

program
  .command('discover')
  .description('Discover available CKB SDKs on npm')
  .action(async () => {
    await runDiscovery();
  });

program
  .command('test')
  .description('Test all SDKs')
  .action(async () => {
    await runTests();
  });

program
  .command('daily')
  .description('Run full daily validation of all discovered SDKs')
  .action(async () => {
    await runDailyTests();
  });

// Add default action to avoid exit code 1 when no command is provided
program.action(() => {
  program.help();
});

program.parse();

async function runDiscovery() {
  console.log('🔍 Running SDK discovery...');
  const discoverer = new NPMSDKDiscoverer();
  const sdkNames = await discoverer.discoverSDKs();

  console.log('\n📦 Discovered SDKs:');
  sdkNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
}

export async function runTests() {
  for (const packageName of SDK_PACKAGE_NAMES) {
    await runTest(packageName);
  }
}

async function runTest(packageName: string) {
  console.log(`🧪 Testing SDK: ${packageName}`);
  const tester = new DynamicSDKTester();
  const report = await tester.testSDK(packageName);

  // Output report to a local file
  const outputPath = './sdk-test-report.json';
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📝 Report saved to ${outputPath}`);
}

async function runDailyTests() {
  console.log('🚀 Running daily SDK validation...');
  const runner = new DailyTestRunner();
  await runner.runDailyTests();
}

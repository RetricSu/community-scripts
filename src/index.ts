#!/usr/bin/env node

import { Command } from 'commander';
import { DailyTestRunner } from './ci/daily-test-runner';
import { NPMSDKDiscoverer } from './discovery/npm-sdk-discoverer';
import { DynamicSDKTester } from './testing/dynamic-sdk-tester';
import { CCCValidator } from './validate/ccc';

const program = new Command();

program
	.name('community-scripts')
	.description(
		'CKB Script validation tool for testing SDKs against deployment configurations'
	)
	.version('1.0.0');

program
	.command('discover')
	.description('Discover available CKB SDKs on npm')
	.action(async () => {
		await runDiscovery();
	});

program
	.command('test')
	.description('Test a specific SDK')
	.action(async () => {
		await runTest();
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

async function runTest() {
	const sdkName = 'ccc';
	const validator = new CCCValidator(require('@@ckb-ccc/core'));

	console.log(`🧪 Testing SDK: ${sdkName}`);
	const tester = new DynamicSDKTester();
	await tester.testSDK(sdkName, validator);
}

async function runDailyTests() {
	console.log('🚀 Running daily SDK validation...');
	const runner = new DailyTestRunner();
	await runner.runDailyTests();
}

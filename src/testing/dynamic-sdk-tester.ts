import { exec } from 'child_process';
import { promisify } from 'util';
import { SDKValidator, ValidationResult } from '../validate/base';

const execAsync = promisify(exec);

export interface TestResult {
	scriptName: string;
	network: 'mainnet' | 'testnet';
	result: ValidationResult;
}

export interface TestReport {
	sdkName: string;
	sdkVersion?: string;
	success: boolean;
	error?: string;
	tests: TestResult[];
	timestamp: string;
	totalTests: number;
	passedTests: number;
	failedTests: number;
}

export class DynamicSDKTester {
	constructor() {}

	async testSDK(
		packageName: string,
		validator: SDKValidator
	): Promise<TestReport> {
		const startTime = Date.now();

		try {
			// Install latest version
			console.log(`  📥 Installing ${packageName}@latest...`);
			await execAsync(`pnpm add ${packageName}@latest`);

			// Try to load the SDK
			console.log(`  🔧 Loading SDK module...`);
			const sdk = require(packageName);

			// Get SDK version if possible
			let sdkVersion: string | undefined;
			try {
				const packageJson = require(`${packageName}/package.json`);
				sdkVersion = packageJson.version;
			} catch (error) {
				// Version info not available
			}

			const scriptLength = await validator.getSDKScriptInfo();

			console.log(
				`  🧪 Testing against ${scriptLength.length} known scripts...`
			);

			// Test against our known scripts
			const result = await validator.validate();

			const tests: TestResult[] = [];
			let passedTests = 0;
			let failedTests = 0;

			for (const res of result) {
				const isValid = res.isValid;
				if (isValid) {
					passedTests++;
				} else {
					failedTests++;
				}
				tests.push({
					scriptName: res.scriptName,
					network: res.network,
					result: res,
				});
			}

			const endTime = Date.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			console.log(
				`  ✅ Testing completed in ${duration}s: ${passedTests}/${tests.length} tests passed.`
			);

			const totalTests = tests.length;

			return {
				sdkName: packageName,
				sdkVersion,
				success: true,
				tests,
				timestamp: new Date().toISOString(),
				totalTests,
				passedTests,
				failedTests,
			};
		} catch (error) {
			return {
				sdkName: packageName,
				success: false,
				error: error instanceof Error ? error.message : String(error),
				tests: [],
				timestamp: new Date().toISOString(),
				totalTests: 0,
				passedTests: 0,
				failedTests: 0,
			};
		}
	}
}

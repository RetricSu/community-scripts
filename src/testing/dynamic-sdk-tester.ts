import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { SDKValidator, ValidationResult } from '../validate/base';
import { validators } from '../validate';

const execAsync = promisify(exec);

export interface TestResult {
  scriptName: string;
  network: 'mainnet' | 'testnet';
  result: Omit<ValidationResult, 'scriptName' | 'network'>;
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

  async testSDK(packageName: string): Promise<TestReport> {
    const startTime = Date.now();
    // 1. Create temp dir
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-test-'));
    try {
      // 2. Init new package.json
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'sdk-test', version: '1.0.0' })
      );

      // 3. Install SDK in temp dir
      const { module: sdk, version: sdkVersion } = await this.installPackage(
        packageName,
        undefined,
        undefined,
        tempDir
      );

      // 4. Find validator
      const validatorClass = validators.find(
        (v) => v.packageName === packageName
      )?.validatorClass;
      if (!validatorClass) {
        throw new Error(`No validator found for package ${packageName}`);
      }
      const validator: SDKValidator = new validatorClass(sdk);

      const scriptLength = await validator.getSDKScriptInfo();
      console.log(
        `  🧪 Testing against ${scriptLength.length} known scripts...`
      );

      // 5. Run validation
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
          result: {
            isValid: res.isValid,
            errors: res.errors,
            warnings: res.warnings,
          },
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
    } finally {
      // 6. Clean up temp dir
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
    }
  }

  private async installPackage(
    packageName: string,
    version?: string,
    exportSDKName?: string,
    cwd?: string
  ): Promise<{ module: any; version?: string }> {
    const versionFlag = version ? `@${version}` : '@latest';
    console.log(`  📥 Installing ${packageName}${versionFlag} at ${cwd}...`);

    // Use spawn for real-time logging
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['add', `${packageName}${versionFlag}`], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pnpm add exited with code ${code}`));
      });
      child.on('error', reject);
    });
    try {
      console.log(`  🔧 Loading SDK module...`);
      // Dynamically require from temp dir
      const sdkPath = path.join(
        cwd || process.cwd(),
        'node_modules',
        packageName
      );
      const sdk = require(sdkPath);
      // Get SDK version if possible
      let sdkVersion: string | undefined;
      try {
        const packageJson = require(path.join(sdkPath, 'package.json'));
        sdkVersion = packageJson.version;
      } catch (error) {
        // Version info not available
      }
      console.log(
        `  📦 Loaded ${packageName} version ${sdkVersion || 'unknown'}`
      );
      if (exportSDKName) {
        if (!(exportSDKName in sdk)) {
          throw new Error(
            `Package ${packageName} does not export ${exportSDKName}`
          );
        }
        return {
          module: sdk[exportSDKName],
          version: sdkVersion,
        };
      }
      return {
        module: sdk,
        version: sdkVersion,
      };
    } catch (error) {
      throw new Error(
        `Failed to load package ${packageName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // uninstallPackage is no longer needed, as temp dir is deleted
}

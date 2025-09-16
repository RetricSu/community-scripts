import {
  HashType,
  type ScriptDeployment,
  type ScriptInfo,
} from '../type/deployment';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  scriptName: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  network: 'mainnet' | 'testnet';
}

export interface SDKScriptInfo {
  name: string;
  network: 'mainnet' | 'testnet';
  scriptInfo: ScriptInfo;
}

export abstract class SDKValidator {
  private deployments: Map<string, ScriptDeployment> = new Map();

  constructor(deploymentsDir?: string) {
    // When running from dist/, we need to go up to the root and then to src/deployments
    const defaultPath = path.join(process.cwd(), 'src', 'deployments');
    this.loadDeployments(deploymentsDir || defaultPath);
  }

  private loadDeployments(deploymentsDir: string): void {
    const deploymentsPath = deploymentsDir;
    const files = fs.readdirSync(deploymentsPath);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(deploymentsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const deployment: ScriptDeployment = JSON.parse(content);
        this.deployments.set(deployment.name, deployment);
      }
    }
  }

  private validateSDKScript(
    scriptName: string,
    network: 'mainnet' | 'testnet',
    sdkScriptInfo: ScriptInfo
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      scriptName,
      network,
    };

    const deployment = this.deployments.get(scriptName);
    if (!deployment) {
      result.isValid = false;
      result.errors.push(`Script '${scriptName}' not found in deployments`);
      return result;
    }

    const deploymentInfo =
      network === 'mainnet' ? deployment.mainnet : deployment.testnet;
    if (!deploymentInfo) {
      result.isValid = false;
      result.errors.push(
        `No ${network} configuration found for script '${scriptName}'`
      );
      return result;
    }

    // Ensure required fields are present
    if (deploymentInfo.dataHash == null || deploymentInfo.typeHash == null) {
      result.isValid = false;
      result.errors.push(
        `Missing required hash fields in ${network} configuration for script '${scriptName}'`
      );
      return result;
    }

    const expectedScript: ScriptInfo =
      sdkScriptInfo.hashType === HashType.Type
        ? {
            codeHash: deploymentInfo.typeHash || '',
            hashType: HashType.Type,
            cellDeps: deploymentInfo.cellDeps,
          }
        : {
            codeHash: deploymentInfo.dataHash || '',
            hashType: sdkScriptInfo.hashType,
            cellDeps: deploymentInfo.cellDeps,
          };

    // Validate codeHash
    const sdkCodeHash = sdkScriptInfo.codeHash || '';
    const expectedCodeHash = expectedScript.codeHash || '';
    if (sdkCodeHash.toLowerCase() !== expectedCodeHash.toLowerCase()) {
      result.isValid = false;
      result.errors.push(
        `CodeHash mismatch: expected ${expectedCodeHash}, got ${sdkCodeHash}`
      );
    }

    // Validate hashType
    if (sdkScriptInfo.hashType !== expectedScript.hashType) {
      result.isValid = false;
      result.errors.push(
        `HashType mismatch: expected ${expectedScript.hashType}, got ${sdkScriptInfo.hashType}`
      );
    }

    // Validate cellDeps if provided
    if (sdkScriptInfo.cellDeps && expectedScript.cellDeps) {
      if (sdkScriptInfo.cellDeps.length !== expectedScript.cellDeps.length) {
        result.isValid = false;
        result.errors.push(
          `CellDeps count mismatch: expected ${expectedScript.cellDeps.length}, got ${sdkScriptInfo.cellDeps.length}`
        );
      } else {
        for (let i = 0; i < expectedScript.cellDeps.length; i++) {
          const expected = expectedScript.cellDeps[i];
          const actual = sdkScriptInfo.cellDeps[i];

          if (!expected.outPoint || !actual.outPoint) {
            result.isValid = false;
            result.errors.push(`CellDep ${i} is missing outPoint`);
            continue;
          }

          if (
            (actual.outPoint.txHash || '').toLowerCase() !==
            (expected.outPoint.txHash || '').toLowerCase()
          ) {
            result.isValid = false;
            result.errors.push(
              `CellDep ${i} txHash mismatch: expected ${expected.outPoint.txHash}, got ${actual.outPoint.txHash}`
            );
          }

          if (
            +(actual.outPoint.index || '0') !==
            +(expected.outPoint.index || '0')
          ) {
            result.isValid = false;
            result.errors.push(
              `CellDep ${i} index mismatch: expected ${+expected.outPoint.index}, got ${+actual.outPoint.index}`
            );
          }
        }
      }
    }

    // todo validate type-id info if applicable

    return result;
  }

  abstract getSDKScriptInfo(): Promise<SDKScriptInfo[]>;

  public async validate() {
    const results: ValidationResult[] = [];
    const sdkScripts = await this.getSDKScriptInfo();
    for (const script of sdkScripts) {
      const result = this.validateSDKScript(
        script.name,
        script.network,
        script.scriptInfo
      );
      results.push(result);
      if (!result.isValid) {
        console.error(`Validation failed for ${script.name}:`);
        result.errors.forEach((error) => console.error(` - ${error}`));
      }
    }
    return results;
  }
}

import * as fs from 'fs';
import * as path from 'path';
import type { Network } from '../types/adapter';
import type { DeploymentInfo, ScriptDeployment } from '../types/deployment';

/**
 * Locates `src/deployments` whether running via ts-node (src/) or from dist/.
 * `DEPLOYMENTS_DIR` overrides everything.
 */
export function resolveDeploymentsDir(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.DEPLOYMENTS_DIR,
    path.join(process.cwd(), 'src', 'deployments'),
    path.resolve(__dirname, '..', 'deployments'),
    path.resolve(__dirname, '..', '..', '..', 'src', 'deployments'),
  ].filter((p): p is string => !!p);
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
  }
  throw new Error(
    `Deployments directory not found (tried: ${candidates.join(', ')})`
  );
}

export interface BaselineEntry {
  name: string;
  network: Network;
  deployment: ScriptDeployment;
  info: DeploymentInfo;
  file: string;
}

/**
 * Read-only view over the canonical deployment JSON files.
 * The JSON files remain the single source of truth and are never enriched with
 * adapter-specific data.
 */
export class Baseline {
  readonly deployments = new Map<string, ScriptDeployment>();
  readonly files = new Map<string, string>();

  constructor(readonly dir: string = resolveDeploymentsDir()) {
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(dir, file);
      let deployment: ScriptDeployment;
      try {
        deployment = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (error) {
        throw new Error(
          `Invalid deployment JSON ${filePath}: ${(error as Error).message}`
        );
      }
      if (!deployment.name) {
        throw new Error(`Deployment ${filePath} has no "name"`);
      }
      this.deployments.set(deployment.name, deployment);
      this.files.set(deployment.name, filePath);
    }
  }

  get size(): number {
    return this.deployments.size;
  }

  get(name: string, network: Network): BaselineEntry | undefined {
    const deployment = this.deployments.get(name);
    const info = deployment?.[network];
    if (!deployment || !info) return undefined;
    return {
      name,
      network,
      deployment,
      info,
      file: this.files.get(name) as string,
    };
  }

  has(name: string): boolean {
    return this.deployments.has(name);
  }

  entries(network: Network): BaselineEntry[] {
    return [...this.deployments.keys()]
      .map((name) => this.get(name, network))
      .filter((e): e is BaselineEntry => !!e);
  }
}

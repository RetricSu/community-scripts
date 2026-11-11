import { CccSdkAdapter } from '../adapters/sdk/ccc-sdk-adapter';
import type { DepType, HashType, ScriptInfo } from '../types/deployment';
import { type SDKScriptInfo, SDKValidator } from './base';

export class CCCValidator extends SDKValidator {
  private adapter: CccSdkAdapter;

  // biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded SDK module
  constructor(sdk?: any, deploymentsDir?: string) {
    super(deploymentsDir);
    this.adapter = new CccSdkAdapter(sdk);
  }

  async getSDKScriptInfo(): Promise<SDKScriptInfo[]> {
    const [mainnet, testnet] = await Promise.all([
      this.adapter.fetchScripts('mainnet'),
      this.adapter.fetchScripts('testnet'),
    ]);
    return [...mainnet, ...testnet]
      .filter((s) => s.codeHash && s.hashType && s.cellDeps)
      .map((s) => ({
        name: s.canonicalName,
        network: s.network,
        scriptInfo: {
          codeHash: s.codeHash as string,
          hashType: s.hashType as HashType,
          cellDeps: (s.cellDeps ?? []).map((d) => ({
            depType: d.depType as DepType,
            outPoint: d.outPoint,
          })),
        } satisfies ScriptInfo,
      }));
  }
}

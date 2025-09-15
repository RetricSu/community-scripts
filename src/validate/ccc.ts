import type { DepType, HashType, ScriptInfo } from '../type/deployment';
import { type SDKScriptInfo, SDKValidator } from './base';
import {
  type ccc as CCC,
  hashTypeFrom,
  hexFrom,
  numToHex,
} from '@ckb-ccc/core';

export class CCCValidator extends SDKValidator {
  private sdk: any;
  constructor(sdk: any, deploymentsDir?: string) {
    super(deploymentsDir);
    this.sdk = sdk;
  }

  async getSDKScriptInfo(): Promise<SDKScriptInfo[]> {
    const ccc: typeof CCC = this.sdk.ccc;
    const mainnetClient = new ccc.ClientPublicMainnet();
    const testnetClient = new ccc.ClientPublicTestnet();

    const mainnet = Object.entries(mainnetClient.scripts)
      .filter(
        ([_name, scriptInfo]) =>
          scriptInfo && scriptInfo.codeHash && scriptInfo.cellDeps
      )
      .map(([name, scriptInfo]) => ({
        name: this.toName(name),
        network: 'mainnet' as const,
        scriptInfo: this.toScriptInfo(scriptInfo!),
      }));
    const testnet = Object.entries(testnetClient.scripts)
      .filter(
        ([_name, scriptInfo]) =>
          scriptInfo && scriptInfo.codeHash && scriptInfo.cellDeps
      )
      .map(([name, scriptInfo]: [string, any]) => ({
        name: this.toName(name),
        network: 'testnet' as const,
        scriptInfo: this.toScriptInfo(scriptInfo),
      }));

    return [...mainnet, ...testnet];
  }

  private toName(name: string): string {
    switch (name) {
      case 'NervosDao':
        return 'nervos_dao';
      case 'Secp256k1Blake160':
        return 'secp256k1_blake160_sighash_all';
      case 'Secp256k1Multisig':
        return 'secp256k1_blake160_multisig_all';
      case 'Secp256k1MultisigV2':
        return 'secp256k1_multisig_v2';
      case 'AnyoneCanPay':
        return 'anyone_can_pay';
      case 'TypeId':
        return 'type_id';
      case 'XUdt':
        return 'xudt';
      case 'JoyId':
        return 'joy_id';
      case 'COTA':
        return 'cota';
      case 'PWLock':
        return 'pw_lock';
      case 'OmniLock':
        return 'omnilock';
      case 'NostrLock':
        return 'nostr_lock';
      case 'UniqueType':
        return 'unique_type';
      case 'AlwaysSuccess':
        return 'always_success';
      case 'InputTypeProxyLock':
        return 'input_type_proxy_lock';
      case 'OutputTypeProxyLock':
        return 'output_type_proxy_lock';
      case 'LockProxyLock':
        return 'lock_proxy_lock';
      case 'SingleUseLock':
        return 'single_use_lock';
      case 'TypeBurnLock':
        return 'type_burn_lock';
      case 'EasyToDiscoverType':
        return 'easy_to_discover_type';
      case 'TimeLock':
        return 'time_lock';

      default:
        return name;
    }
  }

  private toScriptInfo(script: CCC.ScriptInfoLike): ScriptInfo {
    if (!script || !script.codeHash || !script.cellDeps) {
      throw new Error('Invalid script info: missing required fields');
    }
    const scriptInfo: ScriptInfo = {
      codeHash: hexFrom(script.codeHash),
      hashType: hashTypeFrom(script.hashType) as HashType,
      cellDeps: script.cellDeps.map((dep) => ({
        outPoint: {
          txHash: hexFrom(dep.cellDep.outPoint.txHash),
          index: numToHex(dep.cellDep.outPoint.index),
        },
        depType: (dep.cellDep.depType === 'code'
          ? 'code'
          : 'dep_group') as DepType,
      })),
    };

    return scriptInfo;
  }
}

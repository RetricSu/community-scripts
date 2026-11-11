import * as cccPkg from '@ckb-ccc/core';
import type { Network, NormalizedScriptInfo } from '../../types/adapter';
import { normalizeCellDep, normalizeHashType } from '../../utils/normalize';
import { BaseAdapter } from '../base';

/**
 * Maps `@ckb-ccc/core` KnownScript enum names onto canonical deployment names.
 */
export const CCC_NAME_MAP: Record<string, string> = {
  NervosDao: 'nervos_dao',
  SUdt: 'sudt',
  Secp256k1Blake160: 'secp256k1_blake160_sighash_all',
  Secp256k1Multisig: 'secp256k1_blake160_multisig_all',
  Secp256k1MultisigV2: 'secp256k1_multisig_v2',
  AnyoneCanPay: 'anyone_can_pay',
  TypeId: 'type_id',
  XUdt: 'xudt',
  JoyId: 'joy_id',
  COTA: 'cota',
  PWLock: 'pw_lock',
  OmniLock: 'omnilock',
  NostrLock: 'nostr_lock',
  UniqueType: 'unique_type',
  AlwaysSuccess: 'always_success',
  InputTypeProxyLock: 'input_type_proxy_lock',
  OutputTypeProxyLock: 'output_type_proxy_lock',
  LockProxyLock: 'lock_proxy_lock',
  SingleUseLock: 'single_use_lock',
  TypeBurnLock: 'type_burn_lock',
  EasyToDiscoverType: 'easy_to_discover_type',
  TimeLock: 'time_lock',
};

export function toCanonicalCccName(name: string): string {
  return CCC_NAME_MAP[name] ?? name;
}

/**
 * Extracts the static script table embedded in `@ckb-ccc/core`.
 * Accepts an injected module so `DynamicSDKTester` can pass a freshly-installed
 * `@ckb-ccc/core@latest` copy.
 */
export class CccSdkAdapter extends BaseAdapter {
  readonly id = 'sdk-ccc';
  readonly name = '@ckb-ccc/core';
  readonly type = 'sdk' as const;

  constructor(private readonly sdk: typeof cccPkg = cccPkg) {
    super();
  }

  async fetchScripts(network: Network): Promise<NormalizedScriptInfo[]> {
    const { ccc, hashTypeFrom, hexFrom, numToHex } = this.sdk;
    const dummyUrl = 'http://127.0.0.1:0'; // scripts table is purely static
    const client =
      network === 'mainnet'
        ? new ccc.ClientPublicMainnet({ url: dummyUrl, fallbacks: [dummyUrl] })
        : new ccc.ClientPublicTestnet({ url: dummyUrl, fallbacks: [dummyUrl] });

    const out: NormalizedScriptInfo[] = [];
    for (const [rawName, info] of Object.entries(client.scripts)) {
      if (!info || !info.codeHash || !info.cellDeps?.length) continue;
      // TypeId is a built-in system script with no deployment cell
      if (rawName === 'TypeId') continue;
      out.push({
        canonicalName: toCanonicalCccName(rawName),
        sourceName: rawName,
        network,
        codeHash: hexFrom(info.codeHash).toLowerCase(),
        hashType: normalizeHashType(hashTypeFrom(info.hashType)),
        cellDeps: info.cellDeps.map((dep) =>
          normalizeCellDep({
            depType: dep.cellDep.depType === 'code' ? 'code' : 'dep_group',
            outPoint: {
              txHash: hexFrom(dep.cellDep.outPoint.txHash),
              index: numToHex(dep.cellDep.outPoint.index),
            },
          })
        ),
        metadata: {
          sourceUrl: 'https://www.npmjs.com/package/@ckb-ccc/core',
          fetchedAt: Date.now(),
        },
      });
    }
    return out;
  }
}

import type {
  Network,
  NormalizedCellDep,
  NormalizedOutPoint,
  NormalizedScriptInfo,
} from '../../types/adapter';
import { fetchJson } from '../../utils/http';
import {
  mapLimit,
  normalizeDepType,
  normalizeHash,
  normalizeHashType,
  normalizeOutPoint,
} from '../../utils/normalize';
import { BaseAdapter, resolveAlias } from '../base';

const EXPLORER_API: Record<Network, string> = {
  mainnet: 'https://mainnet-api.explorer.nervos.org',
  testnet: 'https://testnet-api.explorer.nervos.org',
};

const HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  'User-Agent': 'ckb-community-scripts-monitor',
};

/**
 * Maps CKB Explorer script names onto canonical names in `src/deployments`.
 * Note: Explorer lists many third-party dApp scripts (Godwoken, Stable++, JoyID,
 * CKBFS, OMNI Lock V1, Spore v1, etc.); only scripts that correspond to our
 * canonical deployments are mapped here.
 */
export const EXPLORER_NAME_MAP: Record<string, string> = {
  'SECP256K1/blake160': 'secp256k1_blake160_sighash_all',
  'SECP256k1/Multisig(@5c5069eb)': 'secp256k1_blake160_multisig_all',
  'Nervos DAO': 'nervos_dao',
  'Simple UDT': 'sudt',
  'Anyone-Can-Pay Lock': 'anyone_can_pay',
  xUDT: 'xudt',
  'xUDT(final_rls)': 'xudt',
  'OMNI Lock V2': 'omnilock',
  Spore: 'spore',
  'Spore(v2 preview)': 'spore',
  'Spore Cluster': 'spore_cluster',
  'Spore Cluster(v2 preview)': 'spore_cluster',
  'Single Use Lock': 'single_use_lock',
  Nostr: 'nostr_lock',
};

export interface ExplorerScriptRow {
  name: string;
  type_hash: string | null;
  data_hash: string | null;
  hash_type: string | null;
  dep_type: string | null;
  deprecated: boolean | null;
}

export interface ExplorerGeneralInfoRow {
  name: string;
  type_hash: string | null;
  data_hash: string | null;
  hash_type: string | null;
  dep_type: string | null;
  script_out_point: string | null;
  is_deployed_cell_dead: boolean | null;
}

/** Parses Explorer's `"0xtxhash-0"` outPoint notation. */
export function parseExplorerOutPoint(
  raw: string | null | undefined
): NormalizedOutPoint | undefined {
  if (!raw) return undefined;
  const m = raw.trim().match(/^(0x[0-9a-fA-F]{64})-(\d+|0x[0-9a-fA-F]+)$/);
  if (!m) return undefined;
  return normalizeOutPoint({ txHash: m[1], index: m[2] });
}

export class ExplorerApiAdapter extends BaseAdapter {
  readonly id = 'ckb-explorer';
  readonly name = 'CKB Explorer API';
  readonly type = 'explorer' as const;

  constructor(private readonly concurrency = 4) {
    super();
  }

  private baseUrl(network: Network): string {
    return (
      (network === 'mainnet'
        ? process.env.CKB_MAINNET_EXPLORER_API
        : process.env.CKB_TESTNET_EXPLORER_API) || EXPLORER_API[network]
    );
  }

  async fetchScripts(network: Network): Promise<NormalizedScriptInfo[]> {
    const base = this.baseUrl(network);
    const listUrl = `${base}/api/v2/scripts?page=1&page_size=100`;
    const list = await fetchJson<{ data: ExplorerScriptRow[] }>(listUrl, {
      headers: HEADERS,
    });
    if (!Array.isArray(list.data) || list.data.length === 0) {
      throw new Error(`Explorer returned no scripts for ${network}`);
    }
    const matched = (list.data ?? [])
      .map((row) => ({
        row,
        canonical: resolveAlias(EXPLORER_NAME_MAP, row.name),
      }))
      .filter(
        (x): x is { row: ExplorerScriptRow; canonical: string } =>
          !!x.canonical && !x.row.deprecated
      );

    if (matched.length === 0) {
      throw new Error(
        `Explorer returned no canonical baseline scripts for ${network}`
      );
    }

    return mapLimit(matched, this.concurrency, ({ row, canonical }) =>
      this.enrichRow(base, network, canonical, row)
    );
  }

  private async enrichRow(
    base: string,
    network: Network,
    canonicalName: string,
    row: ExplorerScriptRow
  ): Promise<NormalizedScriptInfo> {
    const typeHash = normalizeHash(row.type_hash);
    const dataHash = normalizeHash(row.data_hash);
    // Explorer sets hash_type = null when a script is referenced by type hash.
    const hashType =
      normalizeHashType(row.hash_type) ?? (typeHash ? 'type' : 'data1');
    const codeHash = hashType === 'type' ? typeHash : dataHash;

    let cellDeps: NormalizedCellDep[] | undefined;
    let deadOutPoints: NormalizedOutPoint[] | undefined;
    const detailUrl = codeHash
      ? `${base}/api/v2/scripts/general_info?code_hash=${codeHash}&hash_type=${hashType}`
      : undefined;

    if (detailUrl) {
      try {
        const detail = await fetchJson<{ data: ExplorerGeneralInfoRow[] }>(
          detailUrl,
          { headers: HEADERS, retries: 1 }
        );
        const allRows = detail.data ?? [];
        const namedRows = allRows.filter((r) => r.name === row.name);
        const rows = namedRows.length > 0 ? namedRows : allRows;
        const live = rows
          .filter((r) => r.is_deployed_cell_dead === false)
          .map((r) => ({
            depType: normalizeDepType(r.dep_type ?? row.dep_type) ?? 'code',
            outPoint: parseExplorerOutPoint(r.script_out_point),
          }))
          .filter((d): d is NormalizedCellDep => !!d.outPoint);
        if (live.length > 0) cellDeps = live;

        const dead = rows
          .filter((r) => r.is_deployed_cell_dead === true)
          .map((r) => parseExplorerOutPoint(r.script_out_point))
          .filter((op): op is NormalizedOutPoint => !!op);
        if (dead.length > 0) deadOutPoints = dead;
      } catch {
        // general_info is optional enrichment; keep the list row if it fails
      }
    }

    return {
      canonicalName,
      sourceName: row.name,
      network,
      codeHash,
      hashType,
      cellDeps,
      metadata: {
        sourceUrl: detailUrl ?? `${base}/api/v2/scripts`,
        fetchedAt: Date.now(),
        declaredDataHash: dataHash,
        declaredTypeHash: typeHash,
        deadOutPoints,
      },
    };
  }
}

/** Short name retained for consumers following the implementation plan. */
export { ExplorerApiAdapter as ExplorerAdapter };

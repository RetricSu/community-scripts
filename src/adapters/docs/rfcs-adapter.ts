import type { Network, NormalizedScriptInfo } from '../../types/adapter';
import { fetchText } from '../../utils/http';
import { mapLimit } from '../../utils/normalize';
import { BaseAdapter, resolveAlias } from '../base';
import {
  parseDeploymentTables,
  tableToScriptInfo,
} from './markdown-table-parser';

export interface RfcSource {
  path: string;
  /** section heading -> canonical name (or `null` for scripts not in baseline) */
  sections: Record<string, string | null>;
  defaultCanonical?: string;
}

export const RFC_SOURCES: readonly RfcSource[] = [
  {
    path: 'rfcs/0024-ckb-genesis-script-list/0024-ckb-genesis-script-list.md',
    sections: {
      'SECP256K1/blake160': 'secp256k1_blake160_sighash_all',
      'SECP256K1/multisig': 'secp256k1_blake160_multisig_all',
      'Nervos DAO': 'nervos_dao',
      'Type ID': null, // built-in system script, not a deployed cell
    },
  },
  {
    path: 'rfcs/0025-simple-udt/0025-simple-udt.md',
    sections: {},
    defaultCanonical: 'sudt',
  },
  {
    path: 'rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md',
    sections: {},
    defaultCanonical: 'anyone_can_pay',
  },
  {
    path: 'rfcs/0042-omnilock/0042-omnilock.md',
    sections: {},
    defaultCanonical: 'omnilock',
  },
  {
    path: 'rfcs/0052-extensible-udt/0052-extensible-udt.md',
    sections: {},
    defaultCanonical: 'xudt',
  },
];

export function parseRfcDocument(
  markdown: string,
  source: RfcSource,
  pageUrl: string
): NormalizedScriptInfo[] {
  const results: NormalizedScriptInfo[] = [];
  for (const table of parseDeploymentTables(markdown)) {
    const mapped =
      Object.keys(source.sections).length > 0
        ? resolveAlias(source.sections as Record<string, string>, table.section)
        : source.defaultCanonical;
    if (!mapped) continue;
    const label = table.section || mapped;
    const info = tableToScriptInfo(table, mapped, label, pageUrl);
    if (info) results.push(info);
  }
  return results;
}

/**
 * Reads deployment tables from the official `nervosnetwork/rfcs` repository.
 * Note: an RFC may list both the `data1` and `type` entries of the same
 * deployment cell (e.g. RFC-0052 xUDT on Pudge); the verifier evaluates each.
 */
export class RfcsAdapter extends BaseAdapter {
  readonly id = 'rfcs-nervos';
  readonly name = 'Nervos RFCs';
  readonly type = 'docs' as const;

  private docs?: Promise<Array<{ source: RfcSource; markdown: string }>>;

  constructor(
    private readonly repo = process.env.RFCS_REPO || 'nervosnetwork/rfcs',
    private readonly ref = process.env.RFCS_REF || 'master',
    private readonly sources: readonly RfcSource[] = RFC_SOURCES
  ) {
    super();
  }

  private loadDocs() {
    if (!this.docs) {
      this.docs = mapLimit(this.sources, 4, async (source) => ({
        source,
        markdown: await fetchText(
          `https://raw.githubusercontent.com/${this.repo}/${this.ref}/${source.path}`
        ),
      }));
      this.docs.catch(() => {
        this.docs = undefined;
      });
    }
    return this.docs;
  }

  async fetchScripts(network: Network): Promise<NormalizedScriptInfo[]> {
    const docs = await this.loadDocs();
    const result = docs
      .flatMap(({ source, markdown }) =>
        parseRfcDocument(
          markdown,
          source,
          `https://github.com/${this.repo}/blob/${this.ref}/${source.path}`
        )
      )
      .filter((s) => s.network === network);
    if (result.length === 0) {
      throw new Error(
        `No ${network} deployment tables parsed from RFC sources`
      );
    }
    return result;
  }
}

import type { Network, NormalizedScriptInfo } from '../../types/adapter';
import { fetchJson, fetchText } from '../../utils/http';
import { errorMessage, mapLimit } from '../../utils/normalize';
import { BaseAdapter } from '../base';
import {
  parseDeploymentTables,
  parseFrontMatterId,
  tableToScriptInfo,
} from './markdown-table-parser';

/**
 * docs.nervos.org page id (front matter `id`) -> canonical deployment name.
 * A nested map selects by section heading for pages that describe several
 * scripts. Ids not listed fall back to `id.replace(/-/g, '_')`.
 */
export const DOC_ALIAS_MAP: Record<string, string | Record<string, string>> = {
  secp256k1_blake160_sighash_all: 'secp256k1_blake160_sighash_all',
  secp256k1_blake160_multisig_all: 'secp256k1_blake160_multisig_all',
  'nervos-dao': 'nervos_dao',
  'lock-proxy-lock': 'lock_proxy_lock',
  'input-type-proxy-lock': 'input_type_proxy_lock',
  'output-type-proxy-lock': 'output_type_proxy_lock',
  'single-use-lock': 'single_use_lock',
  'time-lock': 'time_lock',
  'type-burn-lock': 'type_burn_lock',
  'easy-to-discover-type': 'easy_to_discover_type',
  xudt: 'xudt',
  omnilock: 'omnilock',
  'anyone-can-pay': 'anyone_can_pay',
  'nostr-lock': 'nostr_lock',
  'nostr-binding': 'nostr_binding',
  'ccc-btc-lock': 'ccc_btc_lock',
  'ccc-eth-lock': 'ccc_eth_lock',
  'ccc-sol-lock': 'ccc_sol_lock',
  'spore-dob-0': 'dob_0',
  'spore-protocol': { Spore: 'spore', Cluster: 'spore_cluster' },
};

/** Used only if the GitHub contents API is unavailable (rate limit etc.). */
const FALLBACK_FILES = [
  '01-secp256k1_blake160_sighash_all.mdx',
  '02-secp256k1_blake160_multisig_all.mdx',
  '03-nervos-dao.mdx',
  '04-lock-proxy-lock.mdx',
  '05-input-type-proxy-lock.mdx',
  '06-output-type-proxy-lock.mdx',
  '07-single-use-lock.mdx',
  '08-time-lock.mdx',
  '09-type-burn-lock.mdx',
  '10-easy-to-discover-type.mdx',
  '11-xudt.mdx',
  '12-omnilock.mdx',
  '13-anyone-can-pay.mdx',
  '14-nostr-lock.mdx',
  '15-nostr-binding.mdx',
  '16-ccc-btc-lock.mdx',
  '17-ccc-eth-lock.mdx',
  '18-ccc-sol-lock.mdx',
  '19-spore-dob-0.mdx',
  '20-spore-protocol.mdx',
];

export function resolveDocAlias(
  docId: string,
  section: string
): string | undefined {
  const alias = DOC_ALIAS_MAP[docId];
  if (typeof alias === 'string') return alias;
  if (alias) {
    const key = Object.keys(alias).find(
      (k) => k.toLowerCase() === section.toLowerCase()
    );
    return key ? alias[key] : undefined;
  }
  return docId.replace(/-/g, '_');
}

export function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ckb-community-scripts-monitor',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/** Parses a single docs page; exported for tests. */
export function parseDocsPage(
  markdown: string,
  fileName: string,
  pageUrl: string
): NormalizedScriptInfo[] {
  const docId =
    parseFrontMatterId(markdown) ?? fileName.replace(/^\d+-|\.mdx?$/g, '');
  const result: NormalizedScriptInfo[] = [];
  for (const table of parseDeploymentTables(markdown)) {
    const canonical = resolveDocAlias(docId, table.section);
    const sourceName = table.section ? `${docId}/${table.section}` : docId;
    const info = tableToScriptInfo(table, canonical ?? '', sourceName, pageUrl);
    if (info) result.push(info);
  }
  return result;
}

/**
 * Reads the Markdown sources of https://docs.nervos.org/docs/ecosystem-scripts
 * straight from GitHub (stable against site re-styling / CDN changes).
 */
export class CkbDocsAdapter extends BaseAdapter {
  readonly id = 'docs-nervos';
  readonly name = 'docs.nervos.org (ecosystem-scripts)';
  readonly type = 'docs' as const;

  private pages?: Promise<Array<{ file: string; markdown: string }>>;

  constructor(
    private readonly repo = process.env.DOCS_REPO ||
      'nervosnetwork/docs.nervos.org',
    private readonly ref = process.env.DOCS_REF || 'develop',
    private readonly dir = process.env.DOCS_PATH ||
      'website/docs/ecosystem-scripts'
  ) {
    super();
  }

  private rawUrl(file: string) {
    return `https://raw.githubusercontent.com/${this.repo}/${this.ref}/${this.dir}/${file}`;
  }

  private async listFiles(): Promise<string[]> {
    try {
      const items = await fetchJson<Array<{ name: string; type: string }>>(
        `https://api.github.com/repos/${this.repo}/contents/${this.dir}?ref=${this.ref}`,
        { headers: githubHeaders(), retries: 1 }
      );
      return items
        .filter((i) => i.type === 'file' && /\.mdx?$/.test(i.name))
        .map((i) => i.name);
    } catch (error) {
      console.warn(
        `  ⚠️  docs: GitHub contents API failed (${errorMessage(error)}), using built-in page list`
      );
      return FALLBACK_FILES;
    }
  }

  /** Pages are network-independent, so fetch once and reuse for both networks. */
  private loadPages() {
    if (!this.pages) {
      this.pages = (async () => {
        const files = await this.listFiles();
        return mapLimit(files, 6, async (file) => ({
          file,
          markdown: await fetchText(this.rawUrl(file)),
        }));
      })();
      this.pages.catch(() => {
        this.pages = undefined;
      });
    }
    return this.pages;
  }

  async fetchScripts(network: Network): Promise<NormalizedScriptInfo[]> {
    const pages = await this.loadPages();
    const result = pages
      .flatMap(({ file, markdown }) =>
        parseDocsPage(
          markdown,
          file,
          `https://github.com/${this.repo}/blob/${this.ref}/${this.dir}/${file}`
        )
      )
      .filter((s) => s.network === network);
    if (result.length === 0) {
      throw new Error(
        `No ${network} deployment tables parsed from ${this.repo}/${this.dir}`
      );
    }
    return result;
  }
}

/** Short name retained for consumers following the implementation plan. */
export { CkbDocsAdapter as DocsAdapter };

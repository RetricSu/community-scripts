import type { Network, NormalizedScriptInfo } from '../../types/adapter';
import {
  normalizeDepType,
  normalizeHash,
  normalizeHashType,
  normalizeOutPoint,
} from '../../utils/normalize';

export interface ParsedDeploymentTable {
  /** nearest heading that is not itself a network label */
  section: string;
  network?: Network;
  networkLabel?: string;
  /** lower-cased parameter -> raw value (backticks stripped) */
  fields: Record<string, string>;
  /** 1-based line number of the table header */
  line: number;
}

const MAINNET_RE = /\b(mainnet|lina|mirana|meepo)\b/i;
const TESTNET_RE = /\b(testnet|aggron|pudge)\b/i;

/** Returns the network named by a short label such as "- Lina" or "### Testnet". */
export function detectNetwork(text: string): Network | undefined {
  const main = MAINNET_RE.test(text);
  const test = TESTNET_RE.test(text);
  if (main && !test) return 'mainnet';
  if (test && !main) return 'testnet';
  return undefined; // none, or ambiguous ("Lina & Aggron")
}

function stripMarkup(text: string): string {
  return text.replace(/[`*]/g, '').trim();
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => stripMarkup(c));
}

const NETWORK_LABEL_MAX = 40;

/**
 * Extracts `| parameter | value |` deployment tables from Markdown/MDX.
 * Works for both docs.nervos.org (`ecosystem-scripts/*.mdx`) and RFC files.
 */
export function parseDeploymentTables(
  markdown: string
): ParsedDeploymentTable[] {
  const lines = markdown.split(/\r?\n/);
  const tables: ParsedDeploymentTable[] = [];
  let section = '';
  let network: Network | undefined;
  let networkLabel: string | undefined;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const text = stripMarkup(heading[2]);
      const net = detectNetwork(text);
      if (net && text.length <= NETWORK_LABEL_MAX) {
        network = net;
        networkLabel = text;
      } else {
        section = text;
        network = undefined;
        networkLabel = undefined;
      }
      continue;
    }

    if (line.trim().startsWith('|')) {
      const start = i;
      const fields: Record<string, string> = {};
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = splitRow(lines[i]);
        if (cells.length >= 2 && !/^:?-{2,}:?$/.test(cells[0])) {
          fields[cells[0].toLowerCase()] = cells[1];
        }
        i++;
      }
      i--; // for-loop increments
      if (fields.code_hash || fields.tx_hash) {
        tables.push({
          section,
          network,
          networkLabel,
          fields,
          line: start + 1,
        });
      }
      continue;
    }

    // Short non-table lines like "- Mainnet", "**Testnet**", "- Pudge(testnet)"
    const label = stripMarkup(line.replace(/^\s*[-*+]\s+/, ''));
    if (label && label.length <= NETWORK_LABEL_MAX) {
      const net = detectNetwork(label);
      if (net) {
        network = net;
        networkLabel = label;
      }
    }
  }
  return tables;
}

/** Parses the `id:` field of MDX front matter. */
export function parseFrontMatterId(markdown: string): string | undefined {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return undefined;
  const id = fm[1].match(/^id:\s*["']?([^"'\r\n]+)["']?\s*$/m);
  return id?.[1].trim();
}

export function tableToScriptInfo(
  table: ParsedDeploymentTable,
  canonicalName: string,
  sourceName: string,
  sourceUrl: string
): NormalizedScriptInfo | undefined {
  if (!table.network) return undefined;
  const f = table.fields;
  const txHash = normalizeHash(f.tx_hash);
  const depType = normalizeDepType(f.dep_type);
  let cellDeps: NormalizedScriptInfo['cellDeps'];
  if (txHash && f.index !== undefined && depType) {
    try {
      const outPoint = normalizeOutPoint({ txHash, index: f.index || '0x0' });
      cellDeps = [{ depType, outPoint }];
    } catch {
      cellDeps = undefined; // malformed index -> reported as missing field
    }
  }
  return {
    canonicalName,
    sourceName,
    network: table.network,
    codeHash: normalizeHash(f.code_hash) ?? f.code_hash,
    hashType: normalizeHashType(f.hash_type),
    cellDeps,
    metadata: {
      sourceUrl: `${sourceUrl}#L${table.line}`,
      fetchedAt: Date.now(),
    },
  };
}

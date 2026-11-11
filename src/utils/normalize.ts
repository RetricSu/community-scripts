import type {
  DepTypeLiteral,
  HashTypeLiteral,
  NormalizedCellDep,
  NormalizedOutPoint,
} from '../types/adapter';

/** `""`, `"0x"` and missing values mean "not recorded" in the baseline JSON. */
export function isKnownHash(value: string | undefined | null): value is string {
  return !!value && /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

export function normalizeHash(value: string | undefined | null) {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  return isKnownHash(v) ? v : undefined;
}

export function sameHash(a?: string | null, b?: string | null): boolean {
  const na = normalizeHash(a);
  const nb = normalizeHash(b);
  return !!na && na === nb;
}

/** Normalizes "0x0", "0", 0, "0x00" to "0x0". */
export function normalizeIndex(value: string | number | bigint): string {
  const n =
    typeof value === 'string'
      ? BigInt(value.trim() === '' ? '0' : value.trim())
      : BigInt(value);
  return `0x${n.toString(16)}`;
}

export function normalizeOutPoint(op: {
  txHash: string;
  index: string | number | bigint;
}): NormalizedOutPoint {
  return {
    txHash: op.txHash.trim().toLowerCase(),
    index: normalizeIndex(op.index),
  };
}

export function outPointKey(op: {
  txHash: string;
  index: string | number | bigint;
}): string {
  const n = normalizeOutPoint(op);
  return `${n.txHash}:${n.index}`;
}

export function formatOutPoint(op?: NormalizedOutPoint): string {
  return op ? `${op.txHash}#${Number(BigInt(op.index))}` : '(none)';
}

export function normalizeHashType(
  value: string | undefined | null
): HashTypeLiteral | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === 'data' || v === 'data1' || v === 'data2' || v === 'type') return v;
  return undefined;
}

export function normalizeDepType(
  value: string | undefined | null
): DepTypeLiteral | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase().replace(/[-\s]/g, '_');
  if (v === 'code') return 'code';
  if (v === 'dep_group' || v === 'depgroup') return 'dep_group';
  return undefined;
}

export function normalizeCellDep(dep: {
  depType: string;
  outPoint: { txHash: string; index: string | number | bigint };
}): NormalizedCellDep {
  return {
    depType: normalizeDepType(dep.depType) ?? 'code',
    outPoint: normalizeOutPoint(dep.outPoint),
  };
}

/** Run `fn` over `items` with at most `limit` concurrent promises. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

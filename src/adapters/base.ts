import type {
  AdapterType,
  Network,
  NormalizedScriptInfo,
  ScriptSourceAdapter,
} from '../types/adapter';

/**
 * Base class for all external source adapters. Adapters only translate a
 * source into `NormalizedScriptInfo[]`; all judgement lives in the engine.
 */
export abstract class BaseAdapter implements ScriptSourceAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: AdapterType;

  abstract fetchScripts(network: Network): Promise<NormalizedScriptInfo[]>;

  /** Networks the source can describe; others are skipped by the runner. */
  supports(_network: Network): boolean {
    return true;
  }
}

/** Generic alias lookup used by docs / explorer / sdk adapters. */
export function resolveAlias(
  aliases: Record<string, string>,
  name: string
): string | undefined {
  if (name in aliases) return aliases[name];
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(aliases)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

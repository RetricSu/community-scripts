import * as fs from 'fs';
import type { UpgradeEvent } from '../types/report';
import { outPointKey } from '../utils/normalize';
import type { Baseline } from './baseline';

export interface AppliedUpgrade {
  file: string;
  scriptName: string;
  network: string;
  oldOutPoint: string;
  newOutPoint: string;
}

/**
 * Applies only whitelisted upgrades to the canonical JSON. The caller can turn
 * the resulting diff into a reviewable PR; nothing is committed automatically.
 */
export function applyAuthorizedUpgrades(
  baseline: Baseline,
  events: UpgradeEvent[],
  { force = false }: { force?: boolean } = {}
): AppliedUpgrade[] {
  const applied: AppliedUpgrade[] = [];
  for (const event of events) {
    if (
      event.status !== 'upgraded' ||
      !event.latestOutPoint ||
      (!event.authorized && !force)
    ) {
      continue;
    }
    const entry = baseline.get(event.scriptName, event.network);
    if (!entry) continue;
    const oldKey = outPointKey(event.oldOutPoint);
    let changed = false;
    for (const dep of entry.info.cellDeps) {
      if (outPointKey(dep.outPoint) !== oldKey) continue;
      dep.outPoint.txHash = event.latestOutPoint.txHash;
      dep.outPoint.index = event.latestOutPoint.index;
      changed = true;
    }
    if (!changed) continue;
    if (event.latestDataHash) entry.info.dataHash = event.latestDataHash;
    if (event.latestTypeHash) entry.info.typeHash = event.latestTypeHash;
    fs.writeFileSync(
      entry.file,
      `${JSON.stringify(entry.deployment, null, 2)}\n`
    );
    applied.push({
      file: entry.file,
      scriptName: event.scriptName,
      network: event.network,
      oldOutPoint: oldKey,
      newOutPoint: outPointKey(event.latestOutPoint),
    });
  }
  return applied;
}

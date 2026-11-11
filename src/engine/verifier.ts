import { findCodeCell } from '../adapters/onchain/ckb-rpc-adapter';
import type {
  CellDepStatus,
  Network,
  NormalizedCellDep,
  NormalizedScriptInfo,
} from '../types/adapter';
import type { UpgradeEvent, VerificationMismatch } from '../types/report';
import {
  formatOutPoint,
  isKnownHash,
  normalizeCellDep,
  normalizeHash,
  outPointKey,
  sameHash,
} from '../utils/normalize';
import type { Baseline, BaselineEntry } from './baseline';
import { RiskEvaluator } from './risk-evaluator';
import type { UpgradeTracker } from './upgrade-tracker';

export interface VerificationResult {
  mismatches: VerificationMismatch[];
  upgrades: UpgradeEvent[];
}

function truthKey(name: string, network: Network): string {
  return `${network}:${name}`;
}

function allMembers(status: CellDepStatus): CellDepStatus[] {
  return status.cellDep.depType === 'dep_group'
    ? (status.members ?? [])
    : [status];
}

function cellIsUsable(status: CellDepStatus): boolean {
  return (
    status.exists &&
    status.isLive &&
    (status.cellDep.depType !== 'dep_group' ||
      (status.members ?? []).every((m) => m.isLive))
  );
}

function statusMatchesHash(
  status: CellDepStatus,
  dataHash?: string,
  typeHash?: string
): boolean {
  return (
    sameHash(status.dataHash, dataHash) || sameHash(status.typeHash, typeHash)
  );
}

/**
 * Compares every external observation against the canonical baseline and the
 * live on-chain truth. This class deliberately contains no network calls of
 * its own except cached cell inspections supplied by `OnChainAdapter`.
 */
export class CrossVerifier {
  constructor(
    private readonly baseline: Baseline,
    private readonly onchain: import('../adapters/onchain/ckb-rpc-adapter').OnChainAdapter,
    private readonly tracker?: UpgradeTracker,
    private readonly risk = new RiskEvaluator()
  ) {}

  async verifyBaseline(
    truths: NormalizedScriptInfo[]
  ): Promise<VerificationResult> {
    const mismatches: VerificationMismatch[] = [];
    const upgrades: UpgradeEvent[] = [];
    const seenUpgrades = new Set<string>();

    for (const truth of truths) {
      const entry = this.baseline.get(truth.canonicalName, truth.network);
      if (!entry) continue;
      const statuses = truth.metadata?.cellDepStatus ?? [];
      const code = findCodeCell(
        statuses,
        entry.info.dataHash,
        entry.info.typeHash
      );

      this.auditHashes(entry, code, mismatches);
      this.auditDepGroup(entry, statuses, mismatches);

      const dead = statuses.flatMap((status) => {
        const targets: CellDepStatus[] = [];
        if (!status.isLive) targets.push(status);
        if (status.cellDep.depType === 'dep_group') {
          targets.push(
            ...(status.members ?? []).filter(
              (member) => member.exists && !member.isLive
            )
          );
        }
        return targets;
      });
      for (const target of dead) {
        const key = `${truth.network}:${truth.canonicalName}:${outPointKey(target.cellDep.outPoint)}`;
        if (seenUpgrades.has(key)) continue;
        seenUpgrades.add(key);

        if (!target.exists) {
          mismatches.push(
            this.risk.createMismatch({
              scriptName: truth.canonicalName,
              network: truth.network,
              sourceId: 'onchain-rpc',
              field: 'cellDeps',
              kind: 'BASELINE_CELLDEP_NOT_FOUND',
              expected: target.cellDep,
              actual: null,
              description: `Baseline OutPoint ${formatOutPoint(target.cellDep.outPoint)} is not present on chain`,
              actionRequired:
                'Verify the canonical deployment JSON and the RPC endpoint before using this script.',
            })
          );
          continue;
        }

        const event = this.tracker
          ? await this.tracker.trace(
              truth.canonicalName,
              truth.network,
              target.cellDep.outPoint
            )
          : ({
              scriptName: truth.canonicalName,
              network: truth.network,
              oldOutPoint: target.cellDep.outPoint,
              status: 'untraceable',
              hops: [],
              authorized: false,
              error: 'UpgradeTracker is not configured',
            } satisfies UpgradeEvent);
        upgrades.push(event);
        mismatches.push(this.upgradeMismatch(event));
      }
    }
    return { mismatches, upgrades };
  }

  private auditHashes(
    entry: BaselineEntry,
    code: CellDepStatus | undefined,
    mismatches: VerificationMismatch[]
  ): void {
    if (!code?.exists || !code.isLive) return;
    const expectedData = normalizeHash(entry.info.dataHash);
    const expectedType = normalizeHash(entry.info.typeHash);
    if (expectedData && !sameHash(expectedData, code.dataHash)) {
      mismatches.push(
        this.risk.createMismatch({
          scriptName: entry.name,
          network: entry.network,
          sourceId: 'onchain-rpc',
          field: 'dataHash',
          kind: 'BASELINE_INTEGRITY',
          expected: expectedData,
          actual: code.dataHash,
          description: `Live deployment cell data hash differs from canonical dataHash for ${entry.name}`,
          actionRequired:
            'Stop using the affected configuration and investigate a possible baseline or deployment tampering incident.',
        })
      );
    }
    if (expectedType && !sameHash(expectedType, code.typeHash)) {
      mismatches.push(
        this.risk.createMismatch({
          scriptName: entry.name,
          network: entry.network,
          sourceId: 'onchain-rpc',
          field: 'typeHash',
          kind: 'BASELINE_INTEGRITY',
          expected: expectedType,
          actual: code.typeHash,
          description: `Live deployment cell type hash differs from canonical typeHash for ${entry.name}`,
          actionRequired:
            'Verify the Type ID script and investigate an unexpected contract replacement.',
        })
      );
    }
    if (!expectedData && code.dataHash) {
      mismatches.push(
        this.unknownBaselineHash(entry, 'dataHash', code.dataHash)
      );
    }
    if (!expectedType && code.typeHash) {
      mismatches.push(
        this.unknownBaselineHash(entry, 'typeHash', code.typeHash)
      );
    }
  }

  private unknownBaselineHash(
    entry: BaselineEntry,
    field: 'dataHash' | 'typeHash',
    actual: string
  ): VerificationMismatch {
    return this.risk.createMismatch({
      scriptName: entry.name,
      network: entry.network,
      sourceId: 'onchain-rpc',
      field,
      kind: 'BASELINE_HASH_UNKNOWN',
      expected: entry.info[field],
      actual,
      description: `Canonical ${field} is empty; on-chain value is available`,
      actionRequired:
        'Consider recording the observed hash in the canonical deployment JSON after review.',
    });
  }

  private auditDepGroup(
    entry: BaselineEntry,
    statuses: CellDepStatus[],
    mismatches: VerificationMismatch[]
  ): void {
    const expectedData = normalizeHash(entry.info.dataHash);
    const expectedType = normalizeHash(entry.info.typeHash);
    if (!expectedData && !expectedType) return;
    for (const status of statuses) {
      if (status.cellDep.depType !== 'dep_group' || !status.isLive) continue;
      const members = status.members ?? [];
      if (
        !members.some((m) => statusMatchesHash(m, expectedData, expectedType))
      ) {
        mismatches.push(
          this.risk.createMismatch({
            scriptName: entry.name,
            network: entry.network,
            sourceId: 'onchain-rpc',
            field: 'cellDeps',
            kind: 'DEP_GROUP_CODE_MISSING',
            expected: { dataHash: expectedData, typeHash: expectedType },
            actual: members.map((m) => ({
              outPoint: m.cellDep.outPoint,
              dataHash: m.dataHash,
              typeHash: m.typeHash,
            })),
            description: `No member of dep group ${formatOutPoint(status.cellDep.outPoint)} matches the canonical code hash`,
            actionRequired:
              'Resolve the dep group and update the canonical deployment only after verifying the code cell.',
          })
        );
      }
    }
  }

  private upgradeMismatch(event: UpgradeEvent): VerificationMismatch {
    const kind =
      event.status === 'destroyed'
        ? 'DEPLOYMENT_DESTROYED'
        : event.status === 'upgraded' && event.authorized
          ? 'UPGRADE_AUTHORIZED'
          : 'UPGRADE_UNAUTHORIZED';
    const latest = event.latestOutPoint
      ? formatOutPoint(event.latestOutPoint)
      : 'no successor cell';
    const description =
      event.status === 'upgraded'
        ? `${event.authorized ? 'Whitelisted' : 'Unregistered'} upgrade of ${event.scriptName}: ${formatOutPoint(event.oldOutPoint)} -> ${latest}`
        : event.status === 'destroyed'
          ? `Deployment cell ${formatOutPoint(event.oldOutPoint)} was consumed without a successor carrying the same Type ID`
          : `Deployment cell ${formatOutPoint(event.oldOutPoint)} is dead and its spending transaction could not be traced`;
    return this.risk.createMismatch({
      scriptName: event.scriptName,
      network: event.network,
      sourceId: 'upgrade-tracker',
      field: 'liveness',
      kind,
      expected: event.oldOutPoint,
      actual: event,
      description: `${description}${event.error ? ` (${event.error})` : ''}`,
      actionRequired:
        kind === 'UPGRADE_AUTHORIZED'
          ? `Update baseline, docs, Explorer and SDK references to ${latest}; review the upgrade transaction.`
          : 'Treat as a security incident: verify the consuming transaction, signer locks and witnesses, and rotate keys if unauthorized.',
      fingerprintSuffix: outPointKey(event.oldOutPoint),
    });
  }

  async verifySource(
    sourceId: string,
    infos: NormalizedScriptInfo[],
    truths: Map<string, NormalizedScriptInfo>
  ): Promise<VerificationMismatch[]> {
    const mismatches: VerificationMismatch[] = [];
    for (const info of infos) {
      const entry = this.baseline.get(info.canonicalName, info.network);
      if (!entry) {
        mismatches.push(
          this.risk.createMismatch({
            scriptName: info.canonicalName || info.sourceName,
            network: info.network,
            sourceId,
            field: 'source',
            kind: 'SCRIPT_UNMAPPED',
            expected: 'a canonical deployment',
            actual: info.sourceName,
            description: `${sourceId} reports ${info.sourceName}, which is not a canonical ${info.network} deployment`,
            actionRequired:
              'Review the alias map or add the script to the canonical baseline if it is officially supported.',
          })
        );
        continue;
      }

      const truth = truths.get(truthKey(info.canonicalName, info.network));
      if (!truth) {
        mismatches.push(
          this.risk.createMismatch({
            scriptName: info.canonicalName,
            network: info.network,
            sourceId,
            field: 'source',
            kind: 'TRUTH_UNKNOWN',
            expected: 'live on-chain observation',
            actual: null,
            description: `No on-chain truth is available for ${info.canonicalName}; source cannot be fully verified`,
            actionRequired: 'Restore the RPC source and rerun the monitor.',
          })
        );
      }

      const expectedData =
        truth?.metadata?.actualDataHash ?? normalizeHash(entry.info.dataHash);
      const expectedType =
        truth?.metadata?.actualTypeHash ?? normalizeHash(entry.info.typeHash);
      this.verifyHashFields(
        sourceId,
        info,
        expectedData,
        expectedType,
        mismatches
      );
      await this.verifyCellDeps(
        sourceId,
        info,
        entry,
        truth,
        expectedData,
        expectedType,
        mismatches
      );
    }
    return mismatches;
  }

  private verifyHashFields(
    sourceId: string,
    info: NormalizedScriptInfo,
    expectedData?: string,
    expectedType?: string,
    mismatches: VerificationMismatch[] = []
  ): void {
    const base = {
      scriptName: info.canonicalName,
      network: info.network,
      sourceId,
    };
    if (!info.hashType) {
      mismatches.push(
        this.risk.createMismatch({
          ...base,
          field: 'hashType',
          kind: 'FIELD_MISSING',
          expected: 'data | data1 | data2 | type',
          actual: info.hashType,
          description: `${sourceId} did not provide hash_type for ${info.canonicalName}`,
          actionRequired: 'Ask the source to publish a complete script record.',
        })
      );
    }
    const expected = info.hashType === 'type' ? expectedType : expectedData;
    if (!isKnownHash(info.codeHash)) {
      mismatches.push(
        this.risk.createMismatch({
          ...base,
          field: 'codeHash',
          kind: 'FIELD_MISSING',
          expected,
          actual: info.codeHash,
          description: `${sourceId} did not provide a valid code_hash for ${info.canonicalName}`,
          actionRequired:
            'Repair the source record or its parser before relying on it.',
        })
      );
    } else if (!expected) {
      mismatches.push(
        this.risk.createMismatch({
          ...base,
          field: 'codeHash',
          kind: 'HASH_TYPE_UNVERIFIABLE',
          expected: info.hashType,
          actual: info.codeHash,
          description: `Cannot verify ${info.canonicalName}: no ${info.hashType} hash is known on chain`,
          actionRequired:
            'Record the missing hash in the baseline and verify the deployment cell manually.',
        })
      );
    } else if (!sameHash(info.codeHash, expected)) {
      mismatches.push(
        this.risk.createMismatch({
          ...base,
          field: 'codeHash',
          kind: 'CODE_HASH_MISMATCH',
          expected,
          actual: info.codeHash,
          description: `${sourceId} code_hash for ${info.canonicalName} differs from live on-chain ${info.hashType} hash`,
          actionRequired:
            'Potential developer-entry poisoning: do not use this configuration; investigate the source immediately.',
        })
      );
    }

    const declared: Array<
      ['dataHash' | 'typeHash', string | undefined, string | undefined]
    > = [
      ['dataHash', info.metadata?.declaredDataHash, expectedData],
      ['typeHash', info.metadata?.declaredTypeHash, expectedType],
    ];
    for (const [field, actual, expectedValue] of declared) {
      if (
        isKnownHash(actual) &&
        expectedValue &&
        !sameHash(actual, expectedValue)
      ) {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field,
            kind: 'CODE_HASH_MISMATCH',
            expected: expectedValue,
            actual,
            description: `${sourceId} declared ${field} differs from the on-chain value`,
            actionRequired:
              'Investigate the Explorer record and its source of truth.',
          })
        );
      }
    }
  }

  private async verifyCellDeps(
    sourceId: string,
    info: NormalizedScriptInfo,
    entry: BaselineEntry,
    truth: NormalizedScriptInfo | undefined,
    expectedData: string | undefined,
    expectedType: string | undefined,
    mismatches: VerificationMismatch[]
  ): Promise<void> {
    const base = {
      scriptName: info.canonicalName,
      network: info.network,
      sourceId,
    };
    const baselineDeps = entry.info.cellDeps.map(normalizeCellDep);
    const externalDeps = info.cellDeps ?? [];
    if (externalDeps.length === 0) {
      mismatches.push(
        this.risk.createMismatch({
          ...base,
          field: 'cellDeps',
          kind: sourceId === 'ckb-explorer' ? 'TRUTH_UNKNOWN' : 'FIELD_MISSING',
          expected: baselineDeps,
          actual: externalDeps,
          description: `${sourceId} has no live cellDeps for ${info.canonicalName}`,
          actionRequired:
            'Check whether the source API omitted the deployment or whether the contract was upgraded.',
        })
      );
      return;
    }

    const baselineByOutPoint = new Map(
      baselineDeps.map((dep) => [outPointKey(dep.outPoint), dep])
    );
    const externalKeys = new Set<string>();
    const truthStatuses = new Map(
      (truth?.metadata?.cellDepStatus ?? []).map((s) => [
        outPointKey(s.cellDep.outPoint),
        s,
      ])
    );

    for (const dep of externalDeps) {
      const key = outPointKey(dep.outPoint);
      externalKeys.add(key);
      const baselineDep = baselineByOutPoint.get(key);
      if (baselineDep) {
        if (baselineDep.depType !== dep.depType) {
          mismatches.push(
            this.risk.createMismatch({
              ...base,
              field: 'depType',
              kind: 'DEP_TYPE_MISMATCH',
              expected: baselineDep.depType,
              actual: dep.depType,
              description: `${sourceId} uses a different dep_type for ${formatOutPoint(dep.outPoint)}`,
              actionRequired: 'Align the source with the canonical dep_type.',
            })
          );
        }
        const status = truthStatuses.get(key);
        if (status && !cellIsUsable(status)) {
          mismatches.push(this.deadCellMismatch(base, dep, status));
        }
        continue;
      }

      // An external source may know a newer deployment. Verify that cell live
      // on chain instead of blindly trusting its code_hash / outPoint.
      const status = await this.onchain.inspectCellDep(info.network, dep);
      if (!status.exists) {
        mismatches.push(
          this.deadCellMismatch(base, dep, status, 'CELLDEP_NOT_FOUND')
        );
        continue;
      }
      if (!cellIsUsable(status)) {
        mismatches.push(this.deadCellMismatch(base, dep, status));
        continue;
      }
      const candidates = allMembers(status);
      const matches = candidates.some((candidate) => {
        if (info.hashType === 'type') {
          return sameHash(candidate.typeHash, expectedType);
        }
        return sameHash(candidate.dataHash, expectedData);
      });
      if (
        !matches &&
        expectedData === undefined &&
        expectedType === undefined
      ) {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field: 'cellDeps',
            kind: 'TRUTH_UNKNOWN',
            expected: baselineDeps,
            actual: dep,
            description: `Cannot prove the alternate deployment ${formatOutPoint(dep.outPoint)} without a known code hash`,
            actionRequired:
              'Record the canonical code hash and review the alternate cell.',
          })
        );
      } else if (!matches && dep.depType === 'dep_group') {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field: 'cellDeps',
            kind: 'CELLDEP_EXTRA',
            expected: baselineDeps,
            actual: dep,
            description: `${sourceId} includes an auxiliary or unrecognized dep group ${formatOutPoint(dep.outPoint)} for ${info.canonicalName}`,
            actionRequired:
              'Review this additional dependency; it may be a legitimate auxiliary lock group rather than the script code cell.',
          })
        );
      } else if (!matches) {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field: 'cellDeps',
            kind: 'CELLDEP_UNKNOWN_CODE',
            expected: { dataHash: expectedData, typeHash: expectedType },
            actual: {
              cellDep: dep,
              dataHash: status.dataHash,
              typeHash: status.typeHash,
            },
            description: `${sourceId} points to a live cell whose code does not match ${info.canonicalName}`,
            actionRequired:
              'Possible malicious or incorrect deployment reference; block use until manually verified.',
          })
        );
      } else {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field: 'cellDeps',
            kind: 'CELLDEP_ALTERNATIVE',
            expected: baselineDeps,
            actual: dep,
            description: `${sourceId} uses a different but live deployment cell for ${info.canonicalName}`,
            actionRequired:
              'Review whether this is an official upgrade; synchronize the canonical baseline if approved.',
          })
        );
      }
    }

    for (const dep of baselineDeps) {
      if (!externalKeys.has(outPointKey(dep.outPoint))) {
        mismatches.push(
          this.risk.createMismatch({
            ...base,
            field: 'cellDeps',
            kind: 'FIELD_MISSING',
            expected: dep,
            actual: null,
            description: `${sourceId} omits the canonical cellDep ${formatOutPoint(dep.outPoint)}`,
            actionRequired:
              'Check for an incomplete source record or an unreported upgrade.',
          })
        );
      }
    }
  }

  private deadCellMismatch(
    base: { scriptName: string; network: Network; sourceId: string },
    dep: NormalizedCellDep,
    status: CellDepStatus,
    kind: 'CELLDEP_DEAD' | 'CELLDEP_NOT_FOUND' = 'CELLDEP_DEAD'
  ): VerificationMismatch {
    return this.risk.createMismatch({
      ...base,
      field: 'liveness',
      kind,
      expected: 'live deployment cell',
      actual: { cellDep: dep, exists: status.exists, isLive: status.isLive },
      description: `${base.sourceId} references ${kind === 'CELLDEP_NOT_FOUND' ? 'a nonexistent' : 'a dead'} cell ${formatOutPoint(dep.outPoint)}`,
      actionRequired:
        'Update the source to the latest live OutPoint; transactions using this cellDep will fail.',
      fingerprintSuffix: outPointKey(dep.outPoint),
    });
  }
}

export function makeTruthMap(
  truths: NormalizedScriptInfo[]
): Map<string, NormalizedScriptInfo> {
  return new Map(truths.map((t) => [truthKey(t.canonicalName, t.network), t]));
}

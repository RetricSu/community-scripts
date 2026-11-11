import { ccc } from '@ckb-ccc/core';
import * as fs from 'fs';
import {
  type OnChainAdapter,
  toNormalizedScript,
} from '../adapters/onchain/ckb-rpc-adapter';
import type {
  Network,
  NormalizedOutPoint,
  NormalizedScript,
} from '../types/adapter';
import type { UpgradeEvent, UpgradeHop } from '../types/report';
import { withRetry } from '../utils/http';
import {
  errorMessage,
  normalizeHash,
  normalizeOutPoint,
  outPointKey,
  sameHash,
} from '../utils/normalize';

export interface PlannedUpgrade {
  scriptName: string;
  network: Network;
  /** consuming (upgrade) transaction hash */
  txHash: string;
  newDataHash?: string;
  note?: string;
}

/**
 * Known, audited upgrade transactions. Additional entries can be supplied via
 * `UPGRADE_WHITELIST_FILE` (JSON array of `PlannedUpgrade`) without touching code.
 */
export const DEFAULT_UPGRADE_WHITELIST: readonly PlannedUpgrade[] = [
  {
    scriptName: 'omnilock',
    network: 'mainnet',
    txHash:
      '0xc76edf469816aa22f416503c38d0b533d2a018e253e379f134c3985b3472c842',
    newDataHash:
      '0x768f306681da232ceb0b94f436c5f813377179762a831c5ad8797bd4fd2d118d',
    note: 'Official Omnilock mainnet upgrade (block 12017064)',
  },
  {
    scriptName: 'nostr_binding',
    network: 'mainnet',
    txHash:
      '0x86d21ad7d41c5b16e18f6e74a1a603ec398ca03b9d604d46e406f9acca88e7bd',
    newDataHash:
      '0xee39c944c5bea6857d1b55fc1d4ff9fc1e22e59fd89d1a0fed8e6eabc08dda66',
    note: 'Official migration 2026-01-14: https://github.com/cryptape/nostr-binding/blob/main/deployment/mainnet/nostr-binding-type-script/migrations/2026-01-14-050950.json',
  },
  {
    scriptName: 'nostr_lock',
    network: 'mainnet',
    txHash:
      '0x99b116dd1e4f1fa903b70112ae672c18bb34241d3d03a9ad555cd2a611be7327',
    newDataHash:
      '0x2effea19ff3024b5b0fb4c0c59c379e7610110e7e3fe7ae003247b1115e59795',
    note: 'Official migration 2026-01-14: https://github.com/cryptape/nostr-binding/blob/main/deployment/mainnet/nostr-lock-script/migrations/2026-01-14-051715.json',
  },
];

export function loadUpgradeWhitelist(
  extraFile = process.env.UPGRADE_WHITELIST_FILE
): PlannedUpgrade[] {
  const list = [...DEFAULT_UPGRADE_WHITELIST];
  if (extraFile && fs.existsSync(extraFile)) {
    const extra = JSON.parse(
      fs.readFileSync(extraFile, 'utf-8')
    ) as PlannedUpgrade[];
    list.push(...extra);
  }
  return list;
}

function sameScript(a?: NormalizedScript, b?: NormalizedScript): boolean {
  return (
    !!a &&
    !!b &&
    a.codeHash === b.codeHash &&
    a.hashType === b.hashType &&
    a.args === b.args
  );
}

/**
 * Traces the spend chain of a consumed deployment cell across transactions.
 * Because CKB RPC has no direct `getConsumer(outPoint)` call, we query the
 * built-in indexer by the cell's Type ID script (1 cell per tx, exact match)
 * and fall back to its lock script if needed.
 */
export class UpgradeTracker {
  private readonly whitelist: PlannedUpgrade[];

  constructor(
    private readonly onchain: OnChainAdapter,
    whitelist?: PlannedUpgrade[],
    private readonly maxHops = 10
  ) {
    this.whitelist = whitelist ?? loadUpgradeWhitelist();
  }

  isWhitelisted(
    scriptName: string,
    network: Network,
    txHash: string,
    newDataHash?: string
  ): PlannedUpgrade | undefined {
    return this.whitelist.find(
      (w) =>
        w.scriptName === scriptName &&
        w.network === network &&
        sameHash(w.txHash, txHash) &&
        (!w.newDataHash || !newDataHash || sameHash(w.newDataHash, newDataHash))
    );
  }

  async trace(
    scriptName: string,
    network: Network,
    deadOutPoint: NormalizedOutPoint
  ): Promise<UpgradeEvent> {
    const event = await this.traceInternal(scriptName, network, deadOutPoint);
    const first = event.hops.find((hop) => hop.consumingTxHash);
    const lastWithSuccessor = [...event.hops]
      .reverse()
      .find((hop) => hop.newOutPoint);
    return {
      ...event,
      upgradedAt:
        first?.timestamp !== undefined
          ? new Date(first.timestamp).toISOString()
          : undefined,
      upgradedBlock: first?.blockNumber,
      consumingTxHash: first?.consumingTxHash,
      oldLock: first?.oldLock,
      newLock: lastWithSuccessor?.newLock,
      signerLocks: first?.signerLocks,
    };
  }

  private async traceInternal(
    scriptName: string,
    network: Network,
    deadOutPoint: NormalizedOutPoint
  ): Promise<UpgradeEvent> {
    const start = normalizeOutPoint(deadOutPoint);
    const hops: UpgradeHop[] = [];
    let current: NormalizedOutPoint | undefined = start;

    try {
      for (let i = 0; i < this.maxHops && current; i++) {
        const live = await this.onchain.inspectCellDep(network, {
          depType: 'code',
          outPoint: current,
        });
        if (!live.exists) {
          return {
            scriptName,
            network,
            oldOutPoint: start,
            status: 'untraceable',
            hops,
            authorized: false,
            error: `OutPoint ${outPointKey(current)} does not exist on ${network}`,
          };
        }
        if (live.isLive) break; // reached the live tip of the chain

        const hop = await this.traceOneHop(network, current);
        hops.push(hop);
        if (!hop.consumingTxHash || !hop.newOutPoint) break;
        current = hop.newOutPoint;
      }

      const last = hops[hops.length - 1];
      if (!last?.consumingTxHash) {
        return {
          scriptName,
          network,
          oldOutPoint: start,
          status: 'untraceable',
          hops,
          authorized: false,
          error:
            last?.consumedOutPoint &&
            `Could not locate transaction spending ${outPointKey(last.consumedOutPoint)}`,
        };
      }

      if (!last.newOutPoint) {
        return {
          scriptName,
          network,
          oldOutPoint: start,
          status: 'destroyed',
          hops,
          authorized: false,
        };
      }

      const tip = await this.onchain.inspectCellDep(network, {
        depType: 'code',
        outPoint: last.newOutPoint,
      });
      const whitelistHits = hops.map((h) =>
        h.consumingTxHash
          ? this.isWhitelisted(
              scriptName,
              network,
              h.consumingTxHash,
              h.newDataHash
            )
          : undefined
      );
      const authorized =
        hops.length > 0 && whitelistHits.every((w) => w !== undefined);
      const notes = whitelistHits
        .map((w) => w?.note)
        .filter((n): n is string => !!n);

      return {
        scriptName,
        network,
        oldOutPoint: start,
        status: 'upgraded',
        hops,
        latestOutPoint: last.newOutPoint,
        latestDataHash: tip.dataHash ?? last.newDataHash,
        latestTypeHash: tip.typeHash,
        authorized,
        whitelistNote: notes.length ? notes.join('; ') : undefined,
      };
    } catch (error) {
      return {
        scriptName,
        network,
        oldOutPoint: start,
        status: 'untraceable',
        hops,
        authorized: false,
        error: errorMessage(error),
      };
    }
  }

  private async traceOneHop(
    network: Network,
    consumed: NormalizedOutPoint
  ): Promise<UpgradeHop> {
    const client = this.onchain.client(network);
    const cellStatus = await this.onchain.inspectCellDep(network, {
      depType: 'code',
      outPoint: consumed,
    });
    const hop: UpgradeHop = {
      consumedOutPoint: consumed,
      oldDataHash: cellStatus.dataHash,
      oldSize: cellStatus.dataSize,
      oldLock: cellStatus.lock,
    };

    const spendTx = await this.findConsumingTransaction(
      client,
      consumed,
      cellStatus.typeScript,
      cellStatus.lock,
      cellStatus.blockNumber
    );
    if (!spendTx) return hop;

    hop.consumingTxHash = spendTx.transaction.hash().toLowerCase();
    if (spendTx.blockNumber !== undefined) {
      hop.blockNumber = Number(spendTx.blockNumber);
    }
    if (spendTx.blockHash) {
      const header = await withRetry(() =>
        client.getHeaderByHash(spendTx.blockHash as ccc.Hex)
      );
      if (header) hop.timestamp = Number(header.timestamp);
    }

    hop.witnessSizes = spendTx.transaction.witnesses.map(
      (w) => (w.length - 2) / 2
    );
    hop.signerLocks = await this.resolveInputLocks(client, spendTx.transaction);

    const outputs = spendTx.transaction.outputs;
    const outputsData = spendTx.transaction.outputsData;
    let matchIndex = -1;
    if (cellStatus.typeScript) {
      matchIndex = outputs.findIndex(
        (o) =>
          o.type &&
          sameScript(toNormalizedScript(o.type), cellStatus.typeScript)
      );
    }
    if (matchIndex >= 0) {
      const data = outputsData[matchIndex] ?? '0x';
      hop.newOutPoint = normalizeOutPoint({
        txHash: hop.consumingTxHash,
        index: matchIndex,
      });
      hop.newDataHash = ccc.hashCkb(data).toLowerCase();
      hop.newSize = (data.length - 2) / 2;
      hop.newLock = toNormalizedScript(outputs[matchIndex].lock);
    }
    return hop;
  }

  private async findConsumingTransaction(
    client: ccc.Client,
    consumed: NormalizedOutPoint,
    typeScript?: NormalizedScript,
    lock?: NormalizedScript,
    fromBlock?: number
  ): Promise<ccc.ClientTransactionResponse | undefined> {
    const targetKey = outPointKey(consumed);
    const scripts: Array<{ script: NormalizedScript; type: 'type' | 'lock' }> =
      [];
    if (typeScript) scripts.push({ script: typeScript, type: 'type' });
    if (lock) scripts.push({ script: lock, type: 'lock' });

    for (const { script, type } of scripts) {
      const filter =
        fromBlock !== undefined
          ? {
              blockRange: [
                BigInt(fromBlock),
                BigInt(Number.MAX_SAFE_INTEGER),
              ] as [bigint, bigint],
            }
          : undefined;
      const iter = client.findTransactions(
        {
          script,
          scriptType: type,
          scriptSearchMode: 'exact',
          filter,
          groupByTransaction: true,
        },
        'asc',
        100
      );
      let checked = 0;
      for await (const item of iter) {
        if (!item.cells.some((c) => c.isInput)) continue;
        if (sameHash(item.txHash, consumed.txHash)) continue;
        const tx = await withRetry(() =>
          client.getTransactionNoCache(item.txHash)
        );
        if (!tx) continue;
        const spendsTarget = tx.transaction.inputs.some(
          (inp) => outPointKey(inp.previousOutput) === targetKey
        );
        if (spendsTarget) return tx;
        if (++checked >= 200) break; // guard against hot lock scripts
      }
    }
    return undefined;
  }

  private async resolveInputLocks(
    client: ccc.Client,
    tx: ccc.Transaction
  ): Promise<NormalizedScript[]> {
    const seen = new Set<string>();
    const locks: NormalizedScript[] = [];
    for (const input of tx.inputs.slice(0, 8)) {
      const prevTxHash = normalizeHash(input.previousOutput.txHash);
      if (!prevTxHash) continue;
      const prevTx = await withRetry(() =>
        client.getTransactionNoCache(prevTxHash)
      );
      const out =
        prevTx?.transaction.outputs[Number(input.previousOutput.index)];
      if (!out) continue;
      const norm = toNormalizedScript(out.lock);
      const key = `${norm.codeHash}:${norm.hashType}:${norm.args}`;
      if (!seen.has(key)) {
        seen.add(key);
        locks.push(norm);
      }
    }
    return locks;
  }
}

import { ccc } from '@ckb-ccc/core';
import { Baseline, type BaselineEntry } from '../../engine/baseline';
import type {
  CellDepStatus,
  Network,
  NormalizedCellDep,
  NormalizedOutPoint,
  NormalizedScript,
  NormalizedScriptInfo,
} from '../../types/adapter';
import { withRetry } from '../../utils/http';
import {
  mapLimit,
  normalizeCellDep,
  normalizeHashType,
  normalizeOutPoint,
  outPointKey,
  sameHash,
} from '../../utils/normalize';
import { BaseAdapter } from '../base';

export const TYPE_ID_CODE_HASH =
  '0x00000000000000000000000000000000000000000000000000545950455f4944';
const ZERO_HASH = `0x${'0'.repeat(64)}`;

const DEFAULT_RPC: Record<Network, string> = {
  mainnet: 'https://mainnet.ckb.dev/',
  testnet: 'https://testnet.ckb.dev/',
};

export function rpcUrl(network: Network): string {
  return (
    (network === 'mainnet'
      ? process.env.CKB_MAINNET_RPC_URL
      : process.env.CKB_TESTNET_RPC_URL) || DEFAULT_RPC[network]
  );
}

/** HTTP-only clients (no websocket) so a one-shot CLI run can exit cleanly. */
export function createClient(network: Network): ccc.Client {
  const url = rpcUrl(network);
  return network === 'mainnet'
    ? new ccc.ClientPublicMainnet({ url, fallbacks: [url] })
    : new ccc.ClientPublicTestnet({ url, fallbacks: [url] });
}

export function toNormalizedScript(script: ccc.ScriptLike): NormalizedScript {
  const s = ccc.Script.from(script);
  return {
    codeHash: s.codeHash.toLowerCase(),
    hashType: normalizeHashType(s.hashType) ?? 'type',
    args: s.args.toLowerCase(),
  };
}

export function isTypeIdScript(script?: NormalizedScript): boolean {
  return (
    !!script &&
    script.codeHash === TYPE_ID_CODE_HASH &&
    script.hashType === 'type'
  );
}

/** A lock nobody can ever unlock: all-zero code hash with empty args. */
export function isZeroLock(script?: NormalizedScript): boolean {
  return (
    !!script &&
    script.codeHash === ZERO_HASH &&
    script.hashType === 'data' &&
    (script.args === '0x' || /^0x0*$/.test(script.args))
  );
}

/** Decodes a dep group cell's data (molecule OutPointVec). */
export function decodeOutPointVec(dataHex: string): NormalizedOutPoint[] {
  const bytes = ccc.bytesFrom(dataHex);
  if (bytes.length < 4) return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true);
  if (bytes.length !== 4 + count * 36) {
    throw new Error(
      `Invalid OutPointVec: ${bytes.length} bytes for ${count} items`
    );
  }
  const result: NormalizedOutPoint[] = [];
  for (let i = 0; i < count; i++) {
    const offset = 4 + i * 36;
    const txHash = ccc.hexFrom(bytes.slice(offset, offset + 32));
    const index = view.getUint32(offset + 32, true);
    result.push(normalizeOutPoint({ txHash, index }));
  }
  return result;
}

/** Picks the dep (or dep group member) that actually carries the script code. */
export function findCodeCell(
  statuses: CellDepStatus[],
  dataHash?: string,
  typeHash?: string
): CellDepStatus | undefined {
  const candidates = statuses.flatMap((s) =>
    s.cellDep.depType === 'dep_group' ? (s.members ?? []) : [s]
  );
  const matched = candidates.find(
    (c) => sameHash(c.dataHash, dataHash) || sameHash(c.typeHash, typeHash)
  );
  if (matched) return matched;
  // Conventionally the code cell is the last member of a dep group
  // (secp256k1_data comes first).
  return candidates[candidates.length - 1];
}

/**
 * On-chain truth source. For every baseline deployment it measures cell
 * liveness, data hash and type hash, resolves dep groups and locates the
 * current live cell of Type ID protected deployments.
 */
export class OnChainAdapter extends BaseAdapter {
  readonly id = 'onchain-rpc';
  readonly name = 'CKB RPC (on-chain)';
  readonly type = 'onchain' as const;

  private clients = new Map<Network, ccc.Client>();
  private cache = new Map<string, Promise<CellDepStatus>>();

  constructor(
    private readonly baseline: Baseline = new Baseline(),
    private readonly concurrency = 4
  ) {
    super();
  }

  client(network: Network): ccc.Client {
    let client = this.clients.get(network);
    if (!client) {
      client = createClient(network);
      this.clients.set(network, client);
    }
    return client;
  }

  async fetchScripts(network: Network): Promise<NormalizedScriptInfo[]> {
    const entries = this.baseline.entries(network);
    return mapLimit(entries, this.concurrency, (entry) =>
      this.inspectEntry(entry)
    );
  }

  async inspectEntry(entry: BaselineEntry): Promise<NormalizedScriptInfo> {
    const { network, info } = entry;
    const cellDeps = info.cellDeps.map(normalizeCellDep);
    const statuses = await Promise.all(
      cellDeps.map((dep) => this.inspectCellDep(network, dep))
    );
    const code = findCodeCell(statuses, info.dataHash, info.typeHash);
    const allLive = statuses.every(
      (s) =>
        s.isLive &&
        (s.cellDep.depType !== 'dep_group' ||
          (s.members ?? []).every((m) => m.isLive))
    );

    const typeId = isTypeIdScript(code?.typeScript)
      ? {
          codeHash: TYPE_ID_CODE_HASH,
          hashType: 'type' as const,
          args: code?.typeScript?.args as string,
        }
      : undefined;

    let latestOutPoint: NormalizedOutPoint | undefined;
    if (code?.isLive) {
      latestOutPoint = code.cellDep.outPoint;
    } else if (typeId) {
      const live = await withRetry(() =>
        this.client(network).findSingletonCellByType(typeId, false)
      );
      if (live) latestOutPoint = normalizeOutPoint(live.outPoint);
    }

    const upgradeable = isZeroLock(code?.lock)
      ? false
      : typeId
        ? true
        : undefined;

    const useType = !!code?.typeHash && !!info.typeHash?.match(/^0x.{64}$/);
    return {
      canonicalName: entry.name,
      sourceName: entry.name,
      network,
      codeHash: useType ? code?.typeHash : code?.dataHash,
      hashType: useType ? 'type' : undefined,
      cellDeps,
      typeId,
      metadata: {
        sourceUrl: rpcUrl(network),
        fetchedAt: Date.now(),
        blockNumber: code?.blockNumber,
        isLive: allLive,
        actualDataHash: code?.dataHash,
        actualTypeHash: code?.typeHash,
        cellDepStatus: statuses,
        latestOutPoint,
        upgradeable,
      },
    };
  }

  /** Cached, so verifying many sources that cite the same OutPoint is cheap. */
  inspectCellDep(
    network: Network,
    cellDep: NormalizedCellDep
  ): Promise<CellDepStatus> {
    const key = `${network}:${cellDep.depType}:${outPointKey(cellDep.outPoint)}`;
    let pending = this.cache.get(key);
    if (!pending) {
      pending = this.loadCellDep(network, cellDep);
      this.cache.set(key, pending);
      pending.catch(() => this.cache.delete(key));
    }
    return pending;
  }

  private async loadCellDep(
    network: Network,
    cellDep: NormalizedCellDep
  ): Promise<CellDepStatus> {
    const client = this.client(network);
    const { outPoint } = cellDep;
    const index = Number(BigInt(outPoint.index));
    const tx = await withRetry(() =>
      client.getTransactionNoCache(outPoint.txHash)
    );
    const output = tx?.transaction.outputs[index];
    if (!tx || tx.status !== 'committed' || !output) {
      return { cellDep, exists: false, isLive: false };
    }
    const data = tx.transaction.outputsData[index] ?? '0x';
    const live = await withRetry(() =>
      client.getCellLiveNoCache(outPoint, false, false)
    );
    const status: CellDepStatus = {
      cellDep,
      exists: true,
      isLive: !!live,
      dataHash: ccc.hashCkb(data).toLowerCase(),
      typeHash: output.type ? output.type.hash().toLowerCase() : undefined,
      typeScript: output.type ? toNormalizedScript(output.type) : undefined,
      lock: toNormalizedScript(output.lock),
      dataSize: (data.length - 2) / 2,
      blockNumber:
        tx.blockNumber !== undefined ? Number(tx.blockNumber) : undefined,
    };
    if (cellDep.depType === 'dep_group') {
      let memberOutPoints: NormalizedOutPoint[] = [];
      try {
        memberOutPoints = decodeOutPointVec(data);
      } catch {
        memberOutPoints = [];
      }
      status.members = await Promise.all(
        memberOutPoints.map((op) =>
          this.inspectCellDep(network, { depType: 'code', outPoint: op })
        )
      );
    }
    return status;
  }
}

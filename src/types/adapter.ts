export type Network = 'mainnet' | 'testnet';

export const NETWORKS: readonly Network[] = ['mainnet', 'testnet'];

export type HashTypeLiteral = 'data' | 'data1' | 'data2' | 'type';

export type DepTypeLiteral = 'code' | 'dep_group';

export type AdapterType = 'onchain' | 'docs' | 'explorer' | 'sdk';

export interface NormalizedOutPoint {
  txHash: string;
  index: string;
}

export interface NormalizedCellDep {
  depType: DepTypeLiteral;
  outPoint: NormalizedOutPoint;
}

export interface NormalizedScript {
  codeHash: string;
  hashType: HashTypeLiteral;
  args: string;
}

/** Observed on-chain state of a single deployment cell (filled by the on-chain adapter). */
export interface CellDepStatus {
  cellDep: NormalizedCellDep;
  /** false when the transaction / output index does not exist at all */
  exists: boolean;
  isLive: boolean;
  dataHash?: string;
  /** hash of the cell's type script, i.e. the code hash usable with hash_type = type */
  typeHash?: string;
  typeScript?: NormalizedScript;
  lock?: NormalizedScript;
  dataSize?: number;
  blockNumber?: number;
  /** member cells when depType = dep_group */
  members?: CellDepStatus[];
}

export interface NormalizedScriptInfo {
  /** canonical name in src/deployments (e.g. "secp256k1_blake160_sighash_all") */
  canonicalName: string;
  /** name as used by the external source (e.g. "SECP256K1/blake160") */
  sourceName: string;
  network: Network;
  codeHash?: string;
  hashType?: HashTypeLiteral;
  cellDeps?: NormalizedCellDep[];
  typeId?: {
    codeHash: string;
    hashType: 'type';
    args: string;
  };
  metadata?: {
    sourceUrl?: string;
    fetchedAt: number;
    /** block number of the deployment cell (on-chain source) */
    blockNumber?: number;
    /** whether every referenced deployment cell is live (on-chain source) */
    isLive?: boolean;
    /** blake2b of the code cell data, measured live (on-chain source) */
    actualDataHash?: string;
    /** type script hash of the code cell, measured live (on-chain source) */
    actualTypeHash?: string;
    /** per cell dep observations (on-chain source) */
    cellDepStatus?: CellDepStatus[];
    /** current live OutPoint of a Type ID protected code cell (on-chain source) */
    latestOutPoint?: NormalizedOutPoint;
    /** false if the code cell can never be consumed (zero lock), true if Type ID protected */
    upgradeable?: boolean;
    /** both hashes as declared by the source (explorer) */
    declaredDataHash?: string;
    declaredTypeHash?: string;
    /** historical deployments the source itself flags as dead (explorer) */
    deadOutPoints?: NormalizedOutPoint[];
    note?: string;
  };
}

export interface ScriptSourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: AdapterType;

  /** Fetch and normalize script information for one network. */
  fetchScripts(network: Network): Promise<NormalizedScriptInfo[]>;
}

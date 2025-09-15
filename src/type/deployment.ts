export type HexNumber = string;

export type HexString = string;

export enum ScriptType {
  Lock = 'lock',
  Type = 'type',
  Both = 'both',
  Library = 'library',
}

export enum DepType {
  Code = 'code',
  DepGroup = 'dep_group',
}

export enum HashType {
  Data = 'data',
  Data1 = 'data1',
  Data2 = 'data2',
  Type = 'type',
}

export interface OutPoint {
  txHash: HexString;
  index: HexNumber;
}

export interface CellDep {
  depType: DepType;
  outPoint: OutPoint;
}

export interface ScriptInfo {
  codeHash: HexString;
  hashType: HashType;
  cellDeps: CellDep[];
}

export interface DeploymentInfo {
  data: Pick<ScriptInfo, 'codeHash' | 'hashType'>;
  type: Pick<ScriptInfo, 'codeHash' | 'hashType'>;
  cellDeps: CellDep[];
  typeId?: {
    codeHash: HexString;
    hashType: HashType.Type;
    args: HexString;
  };
}

export interface ScriptDeployment {
  name: string;
  description: string;
  sourceUrl?: string;
  scriptType: ScriptType;
  mainnet?: DeploymentInfo;
  testnet?: DeploymentInfo;
}

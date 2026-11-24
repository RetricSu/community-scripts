import { OnChainAdapter } from "../src/adapters/onchain/ckb-rpc-adapter";
import { Baseline } from "../src/engine/baseline";

const b = new Baseline();
const entry = b.entries("testnet").find((e) => e.name === "anyone_can_pay")!;
const a = new OnChainAdapter(b);
a.inspectEntry(entry).then((r) => {
  console.log(JSON.stringify(r, null, 1));
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });

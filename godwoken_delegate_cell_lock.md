# Godwoken delegate-cell lock Constraints

> Source: godwokenrises/godwoken @c2b1f85 / gwos/contracts/delegate-cell-lock/src/entry.rs　·　no official deployment found

- id: `godwoken_delegate_cell_lock` · lock script · no on-chain deployment · tags: layer2, open-source, nervos, p-godwoken
- links: page https://retricsu.github.io/community-scripts/godwoken_delegate_cell_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [godwokenrises/godwoken@c2b1f850](https://github.com/godwokenrises/godwoken/tree/c2b1f8501de16ef93a4d659f384041bcb1f7bd92) · [gwos/contracts/delegate-cell-lock/src](https://github.com/godwokenrises/godwoken/blob/c2b1f8501de16ef93a4d659f384041bcb1f7bd92/gwos/contracts/delegate-cell-lock/src) (exact commit read (default-branch HEAD, 2024-01-12). Deployment constants from godwokenrises/godwoken-info @8ce6390133ddfffe9d40d51b7be191418b54958c (mainnet_v1, testnet_v1_1 scripts-deploy-result.json).)
- binary vs source: unverified (deployed binary not matched to the source) — no deployment resolved on chain
- on-chain data checked: 2026-10-21
- contributors: [@blckngm](https://github.com/blckngm)

## Deployments

No on-chain deployment recorded.

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock

**Input** · input[0] protected cell (e.g. rollup cell)

```
Cell{
  capacity: any,
  lock: { DELEGATE_CELL_LOCK, args: {{delegate cell type hash 32B}} },
  type: any,
  data: any
}
```

**Input** · input[k] current authorized cell

```
Cell{
  capacity: any,
  lock: {{lock hash[0..20] == delegate cell data}},
  type: any,
  data: any
}
```

**Output** · outputs

```
any
```

#### cell_deps

cell_dep: delegate cell

```
Cell{
  capacity: any,
  lock: e.g. multisig (to rotate the key),
  type: {{type hash == args}} (usually type_id),
  data: {{20B: lock hash[0..20] of the authorized lock}}
}
```

#### witnesses (WitnessArgs)

witnesses[first group input]

```
{ lock: {{none}} }  // must be empty, else 9
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness.lock | must be empty | 9 |
| args | exactly 32 bytes | 5 |
| cell_deps | a cell with type hash = args | 6 |
| its data | exactly 20 bytes | 7 |
| inputs | an input whose lock hash[0..20] = that data | 8 |

## Notes

- ⚠ Status: Godwoken was officially sunset (from 2025-06-01, Nervos Talk “Sunset of Force Bridge and Godwoken”); the freeze deadline was extended to 2026-01-01 23:59:59 UTC, after which the network froze, the bridge UI went offline and v0/v1 RPC nodes were shut down. This page is for historical / audit reference.
- Error codes (delegate-cell-lock/src/error.rs): 1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 InvalidArgs, 6 CellDepNotFound, 7 CellDepDataInvalid, 8 InputNotFound, 9 InvalidWitnessArgs
- Not in godwoken-info deploy results; the mainnet v1 rollup cell uses the omni_lock deployment. Static page only: no deployment, no test tx.

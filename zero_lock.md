# Zero Lock (all-zero code hash, not a contract)

> Source: CKB node nervosnetwork/ckb script/src/types.rs (TxData::extract_script)　·　code_hash 0x00…00, hash_type data (same on mainnet and testnet, CKB Explorer registry)

- id: `zero_lock` · lock script · networks: mainnet, testnet · tags: system, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/zero_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb@426736a4](https://github.com/nervosnetwork/ckb/tree/426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9) · [script/src/types.rs](https://github.com/nervosnetwork/ckb/blob/426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9/script/src/types.rs) · [script/src/error.rs](https://github.com/nervosnetwork/ckb/blob/426736a4816e4cda0dfa4ebdf7ba3b4f46e3ecb9/script/src/error.rs) (no contract code exists; behaviour comes from CKB script resolution (TxData::extract_script → ScriptError::ScriptNotFound) at this ckb commit)
- binary vs source: built into CKB — no code cell: nothing hashes to the all-zero data hash; behaviour defined by the CKB node
- on-chain data checked: 2026-11-06
- contributors: [@mohanson](https://github.com/mohanson)

## Deployments

No on-chain deployment recorded.
- recognized on mainnet by code_hash `0x0000000000000000000000000000000000000000000000000000000000000000` · hash_type `data`
- recognized on testnet by code_hash `0x0000000000000000000000000000000000000000000000000000000000000000` · hash_type `data`

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Create: anyone can put a cell under the Zero Lock

**Input** · any input

```
Cell{ lock: any (authorised by its own lock) }
```

**Output** · output

```
Cell{
  lock: { codeHash: {{0x0000…0000}},
          hashType: {{data}},
          args: any }
}
```

**Also**

- Locks only run for inputs, so no Zero Lock code runs and nothing is checked when it is created.

### 2. `1 → ✗` Spend: always fails

**Input** · input

```
Cell{
  lock: { codeHash: {{0x0000…0000}}, hashType: {{data}} }
}
```

**Output** · cannot be committed

```
the node rejects the tx
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| code_hash | for hash_type data/data1/data2 the node looks in cell_deps for a cell with blake2b(data) = code_hash; no data hashes to all zeros, so none is found | ScriptNotFound |

## Notes

- This is not a closed-source contract: no code exists on chain; its behaviour is defined entirely by the CKB node's script resolution, so it is listed separately.
- Use: a common burn / lock-forever output lock (e.g. the UTXOSwap docs give the LP Token Info cell an all-zero lock). On 2026-11-06 the CKB Explorer registry showed about 8.403 billion CKB under this lock on mainnet.
- No spending test tx exists: it only ever appears in outputs, and the decoder only groups locks found in inputs.

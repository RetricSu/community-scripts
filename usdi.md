# USDI Asset Constraints (mainnet = xUDT binary)

> Source: mainnet code cell data hash = xUDT 0x50bd…1b95 → ckb-production-scripts/c/xudt_rce.c　·　mainnet 0xbfa3…6bfc / testnet 0xcc9d…7037, hash_type type (CKB Explorer registry)

- id: `usdi` · type script · networks: mainnet, testnet · tags: token, open-source, community
- links: page https://retricsu.github.io/community-scripts/usdi.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-production-scripts@26b0b4f1](https://github.com/nervosnetwork/ckb-production-scripts/tree/26b0b4f15bb6eeb268b70d7ae006e244b7c06649) · [c/xudt_rce.c](https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/c/xudt_rce.c) · [c/rce.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/c/rce.h) · [build.rs](https://github.com/nervosnetwork/ckb-production-scripts/blob/26b0b4f15bb6eeb268b70d7ae006e244b7c06649/build.rs) (xUDT source; build.rs at this commit pins the xudt_rce binary hash 0x50bd8d66…1b95, which equals the mainnet USDI code cell data hash (pinned since abdcb117, 2023-03-01). Testnet USDI binary not matched.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-06
- contributors: [@jjyr](https://github.com/jjyr), [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — CKB Explorer registry API /api/v2/scripts "USDI Asset" (mainnet); code cell data hash = xUDT 0x50bd…1b95

- code_hash: `0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc` · hash_type: `type`
- deployed in tx [`0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d`](https://explorer.nervos.org/transaction/0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d) (block 14861099) · data_hash `0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95` · type_id args `0x9105ea69838511ca609518d27855c53fed1b5ffaff4cfb334f58b40627d211c4`

```json
{
  "script": { "code_hash": "0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — nervosnetwork/ckb-explorer fill_contracts_info.rake "USDI Asset" (testnet); code cell data hash 0x28a7…94d8 (not xUDT)

- code_hash: `0xcc9dc33ef234e14bc788c43a4848556a5fb16401a04662fc55db9bb201987037` · hash_type: `type`
- deployed in tx [`0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee`](https://testnet.explorer.nervos.org/transaction/0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee) (block 15880637) · data_hash `0x28a734e118e2f972004f44063a2e795088ca2ed1340dc48ad85ac9d84dcc94d8` · type_id args `0xf0bad0541211603bf14946e09ceac920dd7ed4f862f0ffd53d0d477d6e1d0f0b`

```json
{
  "script": { "code_hash": "0xcc9dc33ef234e14bc788c43a4848556a5fb16401a04662fc55db9bb201987037", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → N` Issue / Mint (owner mode)

**Input** · some input: owner

```
Cell{
  lock: {{hash(lock) == args[0..32]}}   // default
  // flags 0x80000000: input type hash also accepted
  // flags 0x40000000: output type hash also accepted
  // flags 0x20000000: disables the input-lock method
}
```

**Output** · output: xUDT cell

```
Cell{
  type: { codeHash: xUDT,
          args: {{owner lock hash 32B}} {{[flags u32 LE] [extension data]}} },
  data: {{amount u128 LE (16B)}} [extension data]
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type.args | ≥ 32 bytes | -1 |
| owner mode | when any enabled owner condition holds, the amount check is skipped (extension scripts still run) |  |

### 2. `N → M` Transfer / Burn

**Input** · inputs: xUDT cells (same type)

```
Cell{
  type: { codeHash: xUDT, args: … },
  data: {{amount_in u128 LE}}
}
```

**Output** · outputs: xUDT cells (same type)

```
Cell{
  type: { codeHash: xUDT, args: … },
  data: {{amount_out u128 LE}}
}
```

byte layout: type.args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | owner lock hash | 32B | hash used for owner checks | ≥ 32B | -1 |
| 1 | flags | 4B u32 LE (optional) | low bits: 0 no extension / 1 extensions in args / 2 extensions in witness; top 3 bits: owner-mode switches | ∈ {0,1,2} after masking owner bits | 44 |
| 2 | extension data | variable | flags=1: ScriptVec; flags=2: 20-byte blake160 of the ScriptVec in the witness | flags=1 length must match the ScriptVec; flags=2 must be 20 bytes and the hash must match | 45 / 44 / 49 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| data | length ≥ 16 bytes; first 16 bytes are u128 LE | -2 |
| Σ amount | summation must not overflow | -51 |
| Σ amount_in | ≥ Σ amount_out (non-owner mode) | -52 |
| extension scripts | each extension script's validate must return 0 (note: error codes depend on the extension) |  |

## Notes

- Verification: the list marks USDI as closed source. On chain, the binary in the mainnet USDI Type ID code cell (0xf6a5eef6…e20d:0, type_id args 0x9105ea69…11c4) hashes (blake2b) to 0x50bd8d66…1b95, identical to the RFC 0052 xUDT data1 code_hash. So mainnet USDI IS the open-source xUDT script, referenced through a different Type ID. The cards below reuse the xUDT rules.
- The testnet USDI (0xcc9d…7037) code cell data hash is 0x28a734e1…94d8, which is not xUDT and was not found in ckb-production-scripts history; testnet is identified only, not checked.
- Type ID is upgradable: if the issuer replaces the mainnet code cell this conclusion no longer holds (check-deployments reports the data-hash change). Website https://www.interpaystellar.com/ (Explorer registry).
- Numeric error codes come from the c/rce.h enum (ERROR_INVALID_FLAG=44, ERROR_INVALID_ARGS_FORMAT=45, ERROR_HASH_MISMATCHED=49); based on master, the deployed build may differ slightly

## Example transactions

- mainnet · USDI transfer (xUDT rules) · [0x2444ef0400844731dde2a76e95d86d71d2e2e78a12217ec6a45e2c4032746ce1](https://explorer.nervos.org/transaction/0x2444ef0400844731dde2a76e95d86d71d2e2e78a12217ec6a45e2c4032746ce1) · `node decode-tx.js 0x2444ef0400844731dde2a76e95d86d71d2e2e78a12217ec6a45e2c4032746ce1`
- testnet · USDI testnet (match only) · [0x73b3dbfc73877a9c8876170a2764a7426c094d51513e62ce2b1ee4d710cda9d4](https://testnet.explorer.nervos.org/transaction/0x73b3dbfc73877a9c8876170a2764a7426c094d51513e62ce2b1ee4d710cda9d4) · `node decode-tx.js 0x73b3dbfc73877a9c8876170a2764a7426c094d51513e62ce2b1ee4d710cda9d4 --testnet`

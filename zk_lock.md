# zk-Lock (Groth16 proof-unlocked) Constraints

> Source: CECILIA-MULANDI/zk-Lock @699c63a crates/zk-lock-core/src, contracts/zk-lock, contracts/zk-lock-bound　·　Pudge testnet generic 0x2417…fa7b (type) / bound 0xfbb4…028e (type)　·　deployments in README.md "Pudge testnet"

- id: `zk_lock` · lock script · networks: testnet · tags: identity, zk, open-source, community
- links: page https://retricsu.github.io/community-scripts/zk_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [CECILIA-MULANDI/zk-Lock@699c63a7](https://github.com/CECILIA-MULANDI/zk-Lock/tree/699c63a7ef424345180d24dfc1764ff7947c728b) · [crates/zk-lock-core/src/lib.rs](https://github.com/CECILIA-MULANDI/zk-Lock/blob/699c63a7ef424345180d24dfc1764ff7947c728b/crates/zk-lock-core/src/lib.rs) · [crates/zk-lock-core/src/error.rs](https://github.com/CECILIA-MULANDI/zk-Lock/blob/699c63a7ef424345180d24dfc1764ff7947c728b/crates/zk-lock-core/src/error.rs) · [contracts/zk-lock/src/main.rs](https://github.com/CECILIA-MULANDI/zk-Lock/blob/699c63a7ef424345180d24dfc1764ff7947c728b/contracts/zk-lock/src/main.rs) · [contracts/zk-lock-bound/src/main.rs](https://github.com/CECILIA-MULANDI/zk-Lock/blob/699c63a7ef424345180d24dfc1764ff7947c728b/contracts/zk-lock-bound/src/main.rs) (commit read when writing this spec (default-branch HEAD 2026-11-11); verifier-core read at CECILIA-MULANDI/groth16-ckb@e969ad154ea2c00df57f68238ddfbcbc9ceb1419 (the rev zk-lock-core pins). Deployment constants from README.md "Pudge testnet" and web/src/lib/config.ts. The generic code cell data hash 0x6aec96e2… is not listed in the repo (only the zk-lock-bound hash 0x21f2173b… is, in README.md); neither binary was rebuilt here.)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-11-12
- contributors: [@CECILIA-MULANDI](https://github.com/CECILIA-MULANDI)

## Deployments

### testnet — zk-Lock README.md "Pudge testnet" (generic zk-lock, cell 0x7d80c7a2…06fb:0) + web/src/lib/config.ts

- code_hash: `0x24172f2dc2ebd6634fe925a6f0beda7cfd4cdb9aab1214f2e1cbd3127ea1fa7b` · hash_type: `type`
- deployed in tx [`0x7d80c7a2781328cc766497f9d67b036a4d1295bda9f1de0d329bf08afd0e06fb`](https://testnet.explorer.nervos.org/transaction/0x7d80c7a2781328cc766497f9d67b036a4d1295bda9f1de0d329bf08afd0e06fb) (block 22278058) · data_hash `0x6aec96e2a90e83c3676de9403ef3624664e56983acab83c707e4d53430658f33` · type_id args `0x2fd91958f450471a1d2226d29275667e6b6251c77810257c1f5e171a10f925c0`

```json
{
  "script": { "code_hash": "0x24172f2dc2ebd6634fe925a6f0beda7cfd4cdb9aab1214f2e1cbd3127ea1fa7b", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7d80c7a2781328cc766497f9d67b036a4d1295bda9f1de0d329bf08afd0e06fb", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — zk-Lock README.md "Pudge testnet" (transaction-binding zk-lock-bound, cell 0x5f21b4d1…4011:0)

- code_hash: `0xfbb4acb5c3f8fc8b24216dc8dc8d6bb8f8d3ea9aab4b29a210571959a1f9028e` · hash_type: `type`
- deployed in tx [`0x5f21b4d1e6b8a7fa3d0e739fbc7b6d42e660d7e1ef02a857c6ab249f5b004011`](https://testnet.explorer.nervos.org/transaction/0x5f21b4d1e6b8a7fa3d0e739fbc7b6d42e660d7e1ef02a857c6ab249f5b004011) (block 23029367) · data_hash `0x21f2173b72484484e5fb095e2f5d3b11b9379535cbfbd0e4f592d6244f191c2d` · type_id args `0x6efafd32606f9df9a35e8be9ac7632c4a26bbe0779eed4ff5f4ae866ea52c74c`

```json
{
  "script": { "code_hash": "0xfbb4acb5c3f8fc8b24216dc8dc8d6bb8f8d3ea9aab4b29a210571959a1f9028e", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x5f21b4d1e6b8a7fa3d0e739fbc7b6d42e660d7e1ef02a857c6ab249f5b004011", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Lock: create a zk-Lock cell (lock does not run)

**Input** · any inputs

```
authorized by their own locks
```

**Output** · zk-Lock cell

```
Cell{
  capacity: C,
  lock: ZK_LOCK{ args: {{vk_hash ‖ pi_commitment}} },
  type: any
}
```

byte layout: lock.args byte layout (64B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | vk_hash | 32B | data hash of the verifying-key cell (blake2b-256, ckb-default-hash) | exactly one cell_dep has this data hash | 14 / 21 |
| 1 | pi_commitment | 32B | public-input commitment = blake2b-256(public-input bytes); excludes input 0 in bound mode | = blake2b(public-input body in witness) | 15 |

Example:

- vk_hash: `0x58480ee31438fa04fd733af8ec1821498462be31ffa89694d5b6de76bbfffab5`
- pi_commitment: `0x2567e69254d608455e5a462e0d8d74dd32b89920a58b1a0d8930ba26549bc675`

Note: Example: lock.args of output 0 in Pudge tx 0x929a6507…ecd5; length must be exactly 64 bytes, else 10

### 2. `1 → N` Generic unlock (Binding::None, contracts/zk-lock): any valid proof, in any transaction

**Input** · zk-Lock cell (group input)

```
Cell{
  lock: ZK_LOCK(0x2417…fa7b){ args: {{vk_hash ‖ pi_commitment}} }
}
```

**Input** · witness

```
WitnessArgs{ lock: {{proof(128) ‖ pi_count u32 ‖ pi × 32}} }
```

**Output** · outputs: any

```
outputs not checked
```

byte layout: witness.lock byte layout (WitnessArgs.lock at the group's first input index)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | proof.A | 32B | G1 compressed (arkworks) | not infinity, deserializable | 17 |
| 1 | proof.B | 64B | G2 compressed | not infinity | 17 |
| 2 | proof.C | 32B | G1 compressed | not infinity | 17 |
| 3 | pi_count | 4B u32 LE | number of public inputs n | total = 128 + 4 + 32n; n + 1 = VK ic_len | 13 / 19 |
| 4 | pi × n | 32B × n | BN254 Fr elements (LE, canonical) | < modulus | 18 |

Example:

- proof: `0x3dc6d41b…637c17 (128B)`
- pi_count: `0x01000000 (= 1)`
- pi[0]: `0x3100000000000000000000000000000000000000000000000000000000000000`

Note: Example: witness.lock of Pudge tx 0xc967684e…7571 (164B); blake2b(pi[0]) = 0x2567e692…c675 = args[32..64]

byte layout: VK cell data (arkworks-compressed VerifyingKey<Bn254>, raw bytes, not molecule)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | alpha_g1 | 32B | G1 | not infinity | 16 |
| 1 | beta_g2 | 64B | G2 | not infinity | 16 |
| 2 | gamma_g2 | 64B | G2 | not infinity | 16 |
| 3 | delta_g2 | 64B | G2 | not infinity | 16 |
| 4 | ic_len | 8B u64 LE | number of gamma_abc_g1 points | ≥ 1; total = 232 + 32·ic_len | 16 |
| 5 | gamma_abc_g1 | 32B × ic_len | G1 points | none at infinity | 16 |

Note: From groth16-ckb verifier-core (zk-lock-core pins rev e969ad1). The cell is only a cell_dep; zk-Lock never consumes it

**Also**

- cell_deps: [ zk-Lock code, {{VK cell: data hash = vk_hash (exactly one)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script.args | length = 64 bytes | 10 |
| cell_deps | exactly one cell_dep with data hash = vk_hash; a second one (note: duplicate checked first (21), then missing (14)) | 21 |
| cell_deps | no cell_dep with data hash = vk_hash | 14 |
| witness[group 0].lock | WitnessArgs.lock must be present (note: if the witness is not valid WitnessArgs ckb-std returns SysError → 4 (Encoding); missing witness → 1 (IndexOutOfBound)) | 11 |
| witness.lock | length ≥ 132 (128 proof + 4 pi_count) | 12 |
| witness.lock | length = 128 + 4 + 32 × pi_count | 13 |
| pi_commitment | blake2b-256(all public-input bytes, without pi_count) = args[32..64] | 15 |
| VK cell data | length ≥ 232, ic_len ≥ 1, length = 232 + 32·ic_len, points deserialize and are not infinity | 16 |
| proof | 128 bytes, deserializable, A/B/C not infinity | 17 |
| public inputs | each Fr canonically encoded | 18 |
| pi_count | pi_count + 1 = VK ic_len | 19 |
| Groth16 | BN254 pairing check passes | 20 |

### 3. `1 → N` Transaction-bound unlock (Binding::Transaction, contracts/zk-lock-bound): pi[0] = tx_hash scalar

**Input** · zk-Lock bound cell (group input)

```
Cell{
  lock: ZK_LOCK_BOUND(0xfbb4…028e){ args: {{vk_hash ‖ pi_commitment(pi[1..n])}} }
}
```

**Input** · witness

```
WitnessArgs{ lock: {{proof(128) ‖ pi_count u32 ‖ pi[0]=ctx ‖ pi[1..n]}} }
```

**Output** · outputs: pinned by tx_hash

```
any change alters tx_hash → pi[0] mismatch
```

byte layout: pi[0]: transaction-context scalar (32B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | tx_hash[0..31] | 31B | first 31 bytes of this tx_hash (witnesses excluded) | byte-equal | 22 |
| 1 | 0x00 | 1B | top byte cleared to stay < BN254 modulus | = 0x00 | 22 |

Note: pi_commitment covers pi[1..n] only; the pairing check uses the full vector including pi[0]

byte layout: witness.lock byte layout (WitnessArgs.lock at the group's first input index)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | proof.A | 32B | G1 compressed (arkworks) | not infinity, deserializable | 17 |
| 1 | proof.B | 64B | G2 compressed | not infinity | 17 |
| 2 | proof.C | 32B | G1 compressed | not infinity | 17 |
| 3 | pi_count | 4B u32 LE | number of public inputs n | total = 128 + 4 + 32n; n + 1 = VK ic_len | 13 / 19 |
| 4 | pi × n | 32B × n | BN254 Fr elements (LE, canonical) | < modulus | 18 |

Example:

- proof: `0x3dc6d41b…637c17 (128B)`
- pi_count: `0x01000000 (= 1)`
- pi[0]: `0x3100000000000000000000000000000000000000000000000000000000000000`

Note: Example: witness.lock of Pudge tx 0xc967684e…7571 (164B); blake2b(pi[0]) = 0x2567e692…c675 = args[32..64]

**Also**

- cell_deps: [ zk-Lock-bound code, {{VK cell: data hash = vk_hash (exactly one)}} ]

**Constraints**

| field | condition | error |
| --- | --- | --- |
| script.args | length = 64 bytes | 10 |
| cell_deps | exactly one cell_dep with data hash = vk_hash; a second one (note: duplicate checked first (21), then missing (14)) | 21 |
| cell_deps | no cell_dep with data hash = vk_hash | 14 |
| witness[group 0].lock | WitnessArgs.lock must be present (note: if the witness is not valid WitnessArgs ckb-std returns SysError → 4 (Encoding); missing witness → 1 (IndexOutOfBound)) | 11 |
| witness.lock | length ≥ 132 (128 proof + 4 pi_count) | 12 |
| witness.lock | length = 128 + 4 + 32 × pi_count | 13 |
| pi_count | ≥ 1 (pi[0] must exist) | 23 |
| pi_commitment | blake2b-256(pi[1..n]) = args[32..64] | 15 |
| pi[0] | = tx_hash[0..31] ‖ 0x00 | 22 |
| VK cell data | length ≥ 232, ic_len ≥ 1, length = 232 + 32·ic_len, points deserialize and are not infinity | 16 |
| proof | 128 bytes, deserializable, A/B/C not infinity | 17 |
| public inputs | each Fr canonically encoded | 18 |
| pi_count | pi_count + 1 = VK ic_len | 19 |
| Groth16 | BN254 pairing check passes | 20 |

## Notes

- Error codes from crates/zk-lock-core/src/error.rs (#[repr(i8)]): 1–5 map ckb-std SysError (1 IndexOutOfBound, 2 ItemMissing, 3 LengthNotEnough, 4 Encoding, 5 other); 10–23 are script errors. The check order is fixed: 10 → 21/14 → 11 → 12 → 13 → (bound: 23) → 15 → (bound: 22) → 16–20.
- Only the witness of group input 0 is read: several cells in one group unlock with one proof. Generic mode checks no outputs, so the witness is replayable by anyone who sees it (as the README states); bound mode binds the whole tx via tx_hash.
- 16–20 come from groth16-ckb verifier-core (rev e969ad1) VerifyError; in zk-Lock the VK is raw arkworks bytes, not the molecule Groth16VerifyingKey used by the groth16-ckb type script.
- The decoder checks offline: args length, witness length, pi_commitment, and pi[0] in bound mode; the VK cell_dep lookup and Groth16 pairing cannot be done offline (NOT_CHECKED). The project describes itself as testnet / unaudited.

## Example transactions

- testnet · zk-Lock generic unlock (Poseidon preimage) · [0xc967684e22fc4e3110e0b2c6822667fa4940cd6e47398962f4c9081610e47571](https://testnet.explorer.nervos.org/transaction/0xc967684e22fc4e3110e0b2c6822667fa4940cd6e47398962f4c9081610e47571) · `node decode-tx.js 0xc967684e22fc4e3110e0b2c6822667fa4940cd6e47398962f4c9081610e47571 --testnet`
- testnet · zk-Lock bound unlock (tx_hash-bound, README reference) · [0x013b0946b00ac5db51da4342803b4c81f2460d72802852753b93f7b18b372f85](https://testnet.explorer.nervos.org/transaction/0x013b0946b00ac5db51da4342803b4c81f2460d72802852753b93f7b18b372f85) · `node decode-tx.js 0x013b0946b00ac5db51da4342803b4c81f2460d72802852753b93f7b18b372f85 --testnet`

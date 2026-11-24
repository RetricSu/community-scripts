# Quantum-resistant SPHINCS+ Lock Constraints

> Source: cryptape/quantum-resistant-lock-script / contracts/c-sphincs-all-in-one-lock/ckb-sphincsplus-root-lock.c, docs/advanced.md　·　mainnet 0x302d…cedf (type) / testnet 0x147e…7eaf (data1)　·　deployments in README.md

- id: `sphincs_lock` · lock script · networks: mainnet, testnet · tags: identity, quantum, open-source, cryptape
- links: page https://retricsu.github.io/community-scripts/sphincs_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [cryptape/quantum-resistant-lock-script@082c0a19](https://github.com/cryptape/quantum-resistant-lock-script/tree/082c0a19ce4e0b2c0b00f7b46f423f59a30afc71) · [contracts/c-sphincs-all-in-one-lock/ckb-sphincsplus-root-lock.c](https://github.com/cryptape/quantum-resistant-lock-script/blob/082c0a19ce4e0b2c0b00f7b46f423f59a30afc71/contracts/c-sphincs-all-in-one-lock/ckb-sphincsplus-root-lock.c) · [docs/advanced.md](https://github.com/cryptape/quantum-resistant-lock-script/blob/082c0a19ce4e0b2c0b00f7b46f423f59a30afc71/docs/advanced.md) (commit read when writing this spec)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@xxuejie](https://github.com/xxuejie)

## Deployments

### mainnet — cryptape/quantum-resistant-lock-script README.md (mainnet, dep 0x4598d00d…500a:0)

- code_hash: `0x302d35982f865ebcbedb9a9360e40530ed32adb8e10b42fbbe70d8312ff7cedf` · hash_type: `type`
- deployed in tx [`0x4598d00df2f3dc8bc40eee38689a539c94f6cc3720b7a2a6746736daa60f500a`](https://explorer.nervos.org/transaction/0x4598d00df2f3dc8bc40eee38689a539c94f6cc3720b7a2a6746736daa60f500a) (block 18363853) · data_hash `0x49417a0ed39196e8d90d0088ca98bf6b881966ba1c2ea12160ca42141787565e` · type_id args `0xf75c922a8abc94895eecf172b9efcea049f4a9f666f9be3c9f6494fa71c7c25b`

```json
{
  "script": { "code_hash": "0x302d35982f865ebcbedb9a9360e40530ed32adb8e10b42fbbe70d8312ff7cedf", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x4598d00df2f3dc8bc40eee38689a539c94f6cc3720b7a2a6746736daa60f500a", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — cryptape/quantum-resistant-lock-script README.md (testnet, dep 0x631d9a60…b106:0)

- code_hash: `0x147ecbb5c5127d982ee1362d2c2bb4267803da2eb006d150e88af6caaa0a7eaf` · hash_type: `data1`
- deployed in tx [`0x631d9a6049fb1fc3790e89d9daf35abe535b5e754cd8c3404319319710f0b106`](https://testnet.explorer.nervos.org/transaction/0x631d9a6049fb1fc3790e89d9daf35abe535b5e754cd8c3404319319710f0b106) (block 19249395) · data_hash `0x147ecbb5c5127d982ee1362d2c2bb4267803da2eb006d150e88af6caaa0a7eaf`

```json
{
  "script": { "code_hash": "0x147ecbb5c5127d982ee1362d2c2bb4267803da2eb006d150e88af6caaa0a7eaf", "hash_type": "data1", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x631d9a6049fb1fc3790e89d9daf35abe535b5e754cd8c3404319319710f0b106", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` M-of-N SPHINCS+ (SLH-DSA, FIPS 205) multisig unlock; single key is the 1-of-1 case

**Input** · input

```
Cell{ lock: { codeHash: SPHINCS_LOCK, args: {{config_hash 32B}} } }
```

**Input** · witness

```
WitnessArgs{ lock: S ‖ R ‖ M ‖ N ‖ PWOS × N }
```

**Output** · outputs: any

```
any
```

byte layout: args = blake2b(personal "ckb-sphincs+-sct", multisig configuration), 32 bytes

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | S | 1B | reserved, fixed 0x80 | = 0x80 | 103 |
| 1 | R | 1B | first R pubkeys must sign | R ≤ M | 103 |
| 2 | M | 1B | threshold | 0 < M ≤ N | 103 |
| 3 | N | 1B | number of pubkeys | > 0 | 103 |
| 4 | param flag | 1B | high 7 bits param ID, lowest bit (signature flag) 0 | 48–59 | 106 |
| 5 | pubkey | 32/48/64B | SPHINCS+ public key | length set by param ID | 106 |
| 6 | … × N |  |  |  |  |

byte layout: witness.lock layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | S | 1B | reserved, fixed 0x80 | = 0x80 | 103 |
| 1 | R | 1B | first R pubkeys must sign | R ≤ M | 103 |
| 2 | M | 1B | threshold | 0 < M ≤ N | 103 |
| 3 | N | 1B | number of pubkeys | > 0 | 103 |
| 4 | param flag | 1B | param ID ≪ 1 \| has signature | — | 106 |
| 5 | pubkey | 32/48/64B | public key | — | 106 |
| 6 | signature? | 7856–49856B | present when the flag is set | exactly M | 107 |
| 7 | … × N |  | in configuration order |  |  |

byte layout: param ID (crates/ckb-fips205-utils/src/lib.rs; sizes from FIPS 205 Table 2)

| # | field | size | meaning | constraint |
| --- | --- | --- | --- | --- |
| 0 | 48 / 49 |  | SHA2-128f / 128s | pk 32B; sig 17088 / 7856 |
| 1 | 50 / 51 |  | SHA2-192f / 192s | pk 48B; sig 35664 / 16224 |
| 2 | 52 / 53 |  | SHA2-256f / 256s | pk 64B; sig 49856 / 29792 |
| 3 | 54–59 |  | SHAKE, same order | sizes as SHA2 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 32 bytes | 104 |
| witness | first group witness is WitnessArgs with non-empty lock | 106 |
| header | S = 0x80, N > 0, 0 < M ≤ N, R ≤ M | 103 |
| PWOS | N of them; valid param ID; first R must be signed; exactly M signatures; no trailing bytes | 106 |
| config hash | blake2b("ckb-sphincs+-sct", S‖R‖M‖N‖(flag & 0xFE ‖ pubkey)×N) = args | 105 |
| signature | each signature covers CKB_TX_MESSAGE_ALL (blake2b personal "ckb-sphincs+-msg"), verified by the leaf lock via exec/spawn (not checked) | 102 / 107 / 111 |

## Notes

- Error codes (ckb-sphincsplus-common.h): 101 ARGUMENTS_LEN · 102 MESSAGE · 103 ENCODING · 104 ARGS · 105 MULTISIG_HASH · 106 WITNESS · 107 VERIFY · 108 ARGV · 109 PARAMS · 110 UNEXPECTED · 111 LEAF_VERIFY
- The deployed build is the pure C one (deployment/mainnet/deployment.toml points at build/release/c-sphincs-all-in-one-lock); the Rust and hybrid versions are comparisons, not deployed
- Mainnet upgrades are controlled by a 3-of-5 multisig (deployment/mainnet/README.md)

## Example transactions

- mainnet · SPHINCS+ 2-of-2 (SHA2-256f + SHA2-128f) · [0xd94a75350af1a9d8bf3edb60f6887ee08ffd151d1ec81a81a95b04fd376dfa1f](https://explorer.nervos.org/transaction/0xd94a75350af1a9d8bf3edb60f6887ee08ffd151d1ec81a81a95b04fd376dfa1f) · `node decode-tx.js 0xd94a75350af1a9d8bf3edb60f6887ee08ffd151d1ec81a81a95b04fd376dfa1f`
- testnet · SPHINCS+ 1-of-1 SHA2-128s · [0x864d230d44f83547f8e8233acd467fbb2e3fb5bf764a6d11fa0976d36de4785e](https://testnet.explorer.nervos.org/transaction/0x864d230d44f83547f8e8233acd467fbb2e3fb5bf764a6d11fa0976d36de4785e) · `node decode-tx.js 0x864d230d44f83547f8e8233acd467fbb2e3fb5bf764a6d11fa0976d36de4785e --testnet`

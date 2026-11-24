# SHRINCS Post-quantum Lock Constraints

> Source: XuJiandong/shrincs-lock @d9326f5 contracts/shrincs-lock/src/main.rs, docs/shrincs-lock-spec.md　·　testnet 0x3874…96ac (type)　·　deployment in README.md / deployment/testnet/migrations/2026-09-07-012703.json

- id: `shrincs_lock` · lock script · networks: testnet · tags: identity, quantum, open-source, community
- links: page https://retricsu.github.io/community-scripts/shrincs_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [XuJiandong/shrincs-lock@d9326f52](https://github.com/XuJiandong/shrincs-lock/tree/d9326f524216acf3c6972e82ea600041631efeed) · [contracts/shrincs-lock/src/main.rs](https://github.com/XuJiandong/shrincs-lock/blob/d9326f524216acf3c6972e82ea600041631efeed/contracts/shrincs-lock/src/main.rs) · [docs/shrincs-lock-spec.md](https://github.com/XuJiandong/shrincs-lock/blob/d9326f524216acf3c6972e82ea600041631efeed/docs/shrincs-lock-spec.md) · [checksums.txt](https://github.com/XuJiandong/shrincs-lock/blob/d9326f524216acf3c6972e82ea600041631efeed/checksums.txt) (commit read when writing this spec (default-branch HEAD 2026-09-10). Deployment from README.md "Deployment" + deployment/testnet/migrations/2026-09-07-012703.json. sha256 of the testnet code cell data (1dae35ca1ae42da9d3bb14e1ecb1c95ef31a06389a4fde4d252374d13d5f1d14) equals build/release/shrincs-lock in checksums.txt at this commit (checksums are sha256, so check-deployments cannot match them; binary status set by hand).)
- binary vs source: verified (deployed binary matches the source) — verified by hand via sha256 checksums.txt (check-deployments compares blake2b only and would rewrite this as unverified)
- on-chain data checked: 2026-11-12
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### testnet — shrincs-lock README.md "Deployment" (testnet) + deployment/testnet/migrations/2026-09-07-012703.json (type_id)

- code_hash: `0x387496fafe46562bb3bb2fa4446f1fc1054ba2f1b4df229a88056d5422a196ac` · hash_type: `type`
- deployed in tx [`0x3216d00b72e8229d7dbb46a93ea47bd0c650f2bdae42be2f92837328413da48e`](https://testnet.explorer.nervos.org/transaction/0x3216d00b72e8229d7dbb46a93ea47bd0c650f2bdae42be2f92837328413da48e) (block 22334945) · data_hash `0x9ab6e4b3ca1ede776acd5f419c762128083aad27a4791256f95fb6e044e66c13` · type_id args `0x1b979ea50f5111c648b425d573cd85f236bea46808f1ab5dc9ffa2457cce0fcc`

```json
{
  "script": { "code_hash": "0x387496fafe46562bb3bb2fa4446f1fc1054ba2f1b4df229a88056d5422a196ac", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x3216d00b72e8229d7dbb46a93ea47bd0c650f2bdae42be2f92837328413da48e", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `1 → N` SHRINCS signature unlock (stateful 324B / stateless 2568B)

**Input** · SHRINCS cell (group input)

```
Cell{
  lock: SHRINCS_LOCK{ args: {{pubkey 32B = seed ‖ root}} }
}
```

**Input** · witness[group 0]

```
WitnessArgs{
  lock: {{SHRINCS signature}},
  input_type: … (signed),
  output_type: … (signed)
}
```

**Output** · outputs: any

```
covered by the signed message (tx_hash)
```

byte layout: lock.args byte layout (SHRINCS public key, 32B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | seed | 16B | public-key seed (PublicKey.seed) | args length = 32 | 74 |
| 1 | root | 16B | compressed root (PublicKey.root) | args length = 32 | 74 |

Example:

- seed: `0xc56884e13db7dd53a4dba68f768b2b45`
- root: `0x0cce73dd6228f313a4f1398875c9166c`

Note: Example: input lock.args of testnet tx 0xc3993e2a…a8a2

byte layout: signing message = blake2b-256(personal "ckb-shrincs-msg-", CKB_TX_MESSAGE_ALL)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | tx_hash | 32B | transaction hash |  | 71 |
| 1 | inputs | Σ | every input: CellOutput ‖ u32 len(data) ‖ data |  | 71 |
| 2 | w0.input_type / output_type | len ‖ bytes | input_type, output_type (molecule BytesOpt) of the group's first witness; lock excluded | witness is valid WitnessArgs | 72 |
| 3 | group witnesses[1..] | u32 len ‖ w | remaining group witnesses | length ≤ u32::MAX | 75 |
| 4 | extra witnesses | u32 len ‖ w | witnesses beyond the input count |  | 71 |

Note: Per RFC PR #446 (CKB_TX_MESSAGE_ALL); load failures return 71 (Syscall)

byte layout: witness.lock: SHRINCS signature (SHRINCS_B parameter set)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | signature | 324B / 2568B | stateful 324B or stateless 2568B (README parameter table) | shrincs_verify::<SHRINCS_B>(msg, sig, pk) passes | 76 |

Note: The internal signature layout is defined by the shrincs-rs 1.1.0 crate, not in this repo; the contract does not check the length and passes the whole lock bytes to verify

**Constraints**

| field | condition | error |
| --- | --- | --- |
| witness[group 0] | loadable (note: Error::Syscall = 71) | 71 |
| witness[group 0] | is valid molecule WitnessArgs | 72 |
| CKB_TX_MESSAGE_ALL | tx_hash / input cells / witnesses loadable | 71 |
| CKB_TX_MESSAGE_ALL | each length fits in u32 | 75 |
| WitnessArgs.lock | must be present (signature) | 73 |
| script | load_script succeeds | 71 |
| script.args | length = 32 (seed 16B ‖ root 16B) | 74 |
| signature | SHRINCS_B verification passes | 76 |

## Notes

- Error codes from enum Error in contracts/shrincs-lock/src/main.rs (#[repr(i8)], counting from 71): 71 Syscall, 72 WitnessParse, 73 SignatureMissing, 74 PubkeyLength, 75 CkbTxMessageAll, 76 ShrincsVerify. Note: the args length is checked only after the signing message is computed.
- Stateful signatures rely on a counter kept on the signing device (README); the on-chain script tracks no state. Only the first witness of the group carries the signature.
- The decoder checks args length, WitnessArgs shape and that a signature is present offline; the signing message and SHRINCS verification are NOT_CHECKED. Binary: sha256 of the on-chain code cell data equals build/release/shrincs-lock in checksums.txt (verified by hand).

## Example transactions

- testnet · SHRINCS stateful signature (324B) · [0xc3993e2a363c745e7cb323da5858aa77dcc35e4ba4cc8894e540215458d9a8a2](https://testnet.explorer.nervos.org/transaction/0xc3993e2a363c745e7cb323da5858aa77dcc35e4ba4cc8894e540215458d9a8a2) · `node decode-tx.js 0xc3993e2a363c745e7cb323da5858aa77dcc35e4ba4cc8894e540215458d9a8a2 --testnet`
- testnet · SHRINCS stateless signature (2568B) · [0x18aa3568176d3ec7942ee0b889ef242c7ab80104f4cd97d9af039090b2e9393b](https://testnet.explorer.nervos.org/transaction/0x18aa3568176d3ec7942ee0b889ef242c7ab80104f4cd97d9af039090b2e9393b) · `node decode-tx.js 0x18aa3568176d3ec7942ee0b889ef242c7ab80104f4cd97d9af039090b2e9393b --testnet`

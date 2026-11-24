# anyone_can_pay (lock) Constraints

> Source: ckb-production-scripts / c/anyone_can_pay.c@e570c11　·　mainnet 0xd369…2354 / testnet 0x3419…1356, hash_type type (RFC 0026)

- id: `acp` · lock script · networks: mainnet, testnet · tags: token, identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/acp.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-production-scripts@e570c11a](https://github.com/nervosnetwork/ckb-production-scripts/tree/e570c11aff3eca12a47237c21598429088c610d5) · [c/anyone_can_pay.c](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/anyone_can_pay.c) · [c/quick_pow10.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/quick_pow10.h) · [c/overflow_add.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/overflow_add.h) · [c/secp256k1_lock.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/secp256k1_lock.h) · [c/defs.h](https://github.com/nervosnetwork/ckb-production-scripts/blob/e570c11aff3eca12a47237c21598429088c610d5/c/defs.h) (pinned in the plugin header)
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@jjyr](https://github.com/jjyr)

## Deployments

### mainnet — RFC 0026

- code_hash: `0xd369597ff47f29fbc0d47d2e3775370d1250b85140c670e4718af712983a2354` · hash_type: `type`
- deployed in tx [`0x58eb58e2e3dd9852099a19424cf6e63b5238afe92e3085561b8feafced6d6876`](https://explorer.nervos.org/transaction/0x58eb58e2e3dd9852099a19424cf6e63b5238afe92e3085561b8feafced6d6876) (block 3279959) · data_hash `0xcd69ba816f7471e59110058aa37387c362ed9a240cd178f7bb1ecee386cb31e6` · type_id args `0xde8b879bd1e98399de0dc9be163e703fc1fb82d9379ee1e85143b9f5a863610c`

```json
{
  "script": { "code_hash": "0xd369597ff47f29fbc0d47d2e3775370d1250b85140c670e4718af712983a2354", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x4153a2014952d7cac45f285ce9a7c5c0c0e1b21f2d378b82ac1433cb11c25c4d", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — RFC 0026

- code_hash: `0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356` · hash_type: `type`
- deployed in tx [`0xce29e27734b3eb6f8b6a814cef217753ac2ccb4e4762ecc8b07d05634d8ba374`](https://testnet.explorer.nervos.org/transaction/0xce29e27734b3eb6f8b6a814cef217753ac2ccb4e4762ecc8b07d05634d8ba374) (block 678445) · data_hash `0xcd69ba816f7471e59110058aa37387c362ed9a240cd178f7bb1ecee386cb31e6` · type_id args `0xb9c8cb04f45fc2ad69cc37c14a70e601a4236369b9cb0bb1fff1e386d5ffde46`

```json
{
  "script": { "code_hash": "0x3419a1c09eb2567f6552ee7a8ecffd64155cffe0f1796e6e61ec088d740c1356", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xec26b0f85ed839ece5f11c4c4e837ec359f5adc4420410f6453b1f6b60fb96a6", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Owner spends with signature

**Input** · input

```
Cell{
  lock: { codeHash: ACP,
          args: {{pubkey_hash 20B}} ‖ ckb_min? ‖ udt_min? }
}
```

**Input** · witness

```
WitnessArgs{ lock: {{signature 65B}} }
```

**Output** · outputs: any

```
Cell{ lock: any }
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pubkey_hash | 20B | blake160(pubkey) | signer | -31 |
| 1 | ckb_min? | 1B | min CKB payment = 10^x shannon | optional | -1 |
| 2 | udt_min? | 1B | min UDT payment = 10^x | optional | -1 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | 20–22 bytes | -1 |
| signature | same rules as secp256k1_blake160_sighash_all | -11 / -14 / -31 |

### 2. `B` Payment unlock without signature (anyone can deposit)

**Input** · ACP inputs (same lock)

```
Cell{
  lock: ACP(args),
  capacity: {{C}},
  type: T?,
  data: {{udt u128}} (T) / empty
}
```

**Input** · witness

```
lock is not a 65-byte signature (or empty)
```

**Output** · same-lock output (paired 1:1 with input by type)

```
Cell{
  lock: ACP(args),
  type: same T,
  capacity: {{≥ C + 10^ckb_min}}  or = C,
  udt:      {{≥ U + 10^udt_min}}  or = U
}
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| type hash | < 256 group inputs (i >= 256 is checked before the end marker, so exactly 256 also fails with -43) | -43 |
| data | no-type cells have empty data; typed cells data ≥ 16B | -2 |
| amount | At least one asset meets its minimum increase; both may meet it. An asset not meeting its threshold stays unchanged; addition must not overflow | -42 |
| pairing | each same-lock output pairs with exactly one input of the same type | -44 / -45 |
| pairing | each input pairs with exactly one output | -44 / -46 |

## Notes

- Error codes: -1 ARGUMENTS_LEN · -2 ENCODING · -3 SYSCALL · -21 SCRIPT_TOO_LONG · -41 OVERFLOW · -42 OUTPUT_AMOUNT_NOT_ENOUGH · -43 TOO_MUCH_TYPE_HASH_INPUTS · -44 NO_PAIR · -45 DUPLICATED_INPUTS · -46 DUPLICATED_OUTPUTS
- If 10^x overflows, the minimum saturates to u64/u128 MAX; input 0 and output MAX can still satisfy it (the asset is not unconditionally disabled). An omitted byte sets the minimum to 0.
- 2026-11-19 upstream review (not an on-chain upgrade claim): ACP was removed on repository migration, not an upgrade of the old deployment; README points to nervosnetwork/anyone-can-pay. Retain RFC 0026 deployments and e570c11 source; correct decoder saturation and input-count boundary.

## Example transactions

- mainnet · ACP (signature) · [0x68d12578512e17deef2ac2cc4c15229275f989d6f0e20a71a2484b8a19bf145c](https://explorer.nervos.org/transaction/0x68d12578512e17deef2ac2cc4c15229275f989d6f0e20a71a2484b8a19bf145c) · `node decode-tx.js 0x68d12578512e17deef2ac2cc4c15229275f989d6f0e20a71a2484b8a19bf145c`
- mainnet · ACP (payment, no signature) · [0x6c69bda97b72a82198f6098e9959ca4970a847122c14447860b1583d88540c5e](https://explorer.nervos.org/transaction/0x6c69bda97b72a82198f6098e9959ca4970a847122c14447860b1583d88540c5e) · `node decode-tx.js 0x6c69bda97b72a82198f6098e9959ca4970a847122c14447860b1583d88540c5e`

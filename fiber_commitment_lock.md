# Fiber Commitment Lock Constraints

> Source: nervosnetwork/fiber-scripts / contracts/commitment-lock/src/main.rs (HEAD e7e1c9ba)　·　protocol: Daric　·　deployments: nervosnetwork/fiber config/*/config.yml　·　mainnet 0x2d45…406c / testnet 0x740d…81d8 (type)

- id: `fiber_commitment_lock` · lock script · networks: mainnet, testnet · tags: channel, open-source, nervos, p-fiber
- links: page https://retricsu.github.io/community-scripts/fiber_commitment_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/fiber-scripts@6bfcebfb](https://github.com/nervosnetwork/fiber-scripts/tree/6bfcebfb62f2eee2af2cec881eaa795595268c58) · [contracts/commitment-lock/src/main.rs](https://github.com/nervosnetwork/fiber-scripts/blob/6bfcebfb62f2eee2af2cec881eaa795595268c58/contracts/commitment-lock/src/main.rs) (commit after mainnet/testnet 0.7.0 type_id upgrade migrations; contract source unchanged since e7e1c9ba)
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-11-09
- contributors: [@quake](https://github.com/quake)

## Deployments

### mainnet — nervosnetwork/fiber config/mainnet/config.yml

- code_hash: `0x2d45c4d3ed3e942f1945386ee82a5d1b7e4bb16d7fe1ab015421174ab747406c` · hash_type: `type`
- deployed in tx [`0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee`](https://explorer.nervos.org/transaction/0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee) (block 20965430) · data_hash `0xaf248aab17849f9637434daff9b7d6f868951f8c209ab2de9bc18d2bc45d3cc1` · type_id args `0xdb16e6dcb17f670e5fb7c556d81e522ec5edb069ad2fa3e898e7ccea6c26a39f`

```json
{
  "script": { "code_hash": "0x2d45c4d3ed3e942f1945386ee82a5d1b7e4bb16d7fe1ab015421174ab747406c", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — nervosnetwork/fiber config/testnet/config.yml

- code_hash: `0x740dee83f87c6f309824d8fd3fbdd3c8380ee6fc9acc90b1a748438afcdf81d8` · hash_type: `type`
- deployed in tx [`0x764260c9cdd1f154b3942143a0aae01e4221287f94fca8c6f8945967c115331d`](https://testnet.explorer.nervos.org/transaction/0x764260c9cdd1f154b3942143a0aae01e4221287f94fca8c6f8945967c115331d) (block 22810047) · data_hash `0xaf248aab17849f9637434daff9b7d6f868951f8c209ab2de9bc18d2bc45d3cc1` · type_id args `0xf7e458887495cf70dd30d1543cad47dc1dfe9d874177bf19291e4db478d5751b`

```json
{
  "script": { "code_hash": "0x740dee83f87c6f309824d8fd3fbdd3c8380ee6fc9acc90b1a748438afcdf81d8", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x764260c9cdd1f154b3942143a0aae01e4221287f94fca8c6f8945967c115331d", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Revocation (unlock_count = 0): punish an old commitment with a newer version

**Input** · commitment cell

```
Cell{ lock: COMMITMENT_LOCK(args{version v}) }
```

**Output** · outputs[0]

```
new cell covered by the signature (usually back to the newer commitment)
```

byte layout: args byte layout (57 or 58 bytes)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pubkey_hash | 20B | blake160(aggregated pubkey), for revocation | — | 23 |
| 1 | delay_epoch | 8B | relative epoch since (u64 LE) | delay for first settlement | 6 |
| 2 | version | 8B | commitment version (u64 big-endian) | revocation needs ≥ | 17 |
| 3 | settlement_hash | 20B | blake160(settlement script) | = witness hash | 15 |
| 4 | settlement_flag | 1B | 0x00 first / 0x01 subsequent | decides the since check | 6 |
| 5 | feature? | 1B | 0x01 = full 32-byte payment hash (v1) | optional; length 57 or 58 | 12 |

byte layout: witness (revocation)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | empty_witness_args | 16B | empty WitnessArgs placeholder for xUDT compatibility | = 0x10000000…10000000 | 14 |
| 1 | unlock_count | 1B | 0x00 = revocation | — |  |
| 2 | version | 8B | new version (big-endian) | ≥ args.version | 17 |
| 3 | pubkey | 32B | x-only aggregated pubkey | — | 23 |
| 4 | signature | 64B | aggregated Schnorr signature | see below | 23 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| version | witness.version ≥ args.version (8-byte big-endian comparison) | 17 |
| signature | Schnorr (algorithm 7) over blake2b(outputs[0] ‖ data_len u32 LE ‖ data ‖ args[0..28] ‖ new_version) (not checked) | 23 |

### 2. `B` Settlement (unlock_count ≥ 1): pending HTLCs and party balances

**Input** · commitment cell

```
Cell{ lock: COMMITMENT_LOCK(args), type: UDT?, capacity / UDT amount = A }
```

**Input** · witness

```
16B ‖ unlock_count ‖ settlement_script ‖ unlocks[]
```

**Output** · outputs[0] (when balance > 0 and not all parties settled)

```
Cell{ lock: COMMITMENT_LOCK(args[0..36] ‖ blake160(new_settlement_script) ‖ 0x01 ‖ feature?),
      type: same UDT?, amount = A − settled }
```

byte layout: settlement_script layout

| # | field | size | meaning | constraint |
| --- | --- | --- | --- | --- |
| 0 | pending_htlc_count | 1B | N | — |
| 1 | pending_htlc × N | N × 85B / 97B | see below | — |
| 2 | remote_pubkey_hash | 20B | remote settlement pubkey hash | 0xFE signer |
| 3 | remote_amount | 16B | u128 LE | — |
| 4 | local_pubkey_hash | 20B | local settlement pubkey hash | 0xFF signer |
| 5 | local_amount | 16B | u128 LE | — |

byte layout: pending_htlc layout (85 bytes legacy; 97 bytes v1)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | htlc_type | 1B | bit0: 0 offered / 1 received; bit1: 0 blake2b / 1 sha256 | — |  |
| 1 | payment_amount | 16B | u128 LE | deducted from the balance |  |
| 2 | payment_hash | 20B / 32B | 20 bytes legacy; 32 bytes v1 | prefix of the preimage hash | 22 |
| 3 | remote_htlc_pubkey_hash | 20B | blake160(remote HTLC pubkey) | signer |  |
| 4 | local_htlc_pubkey_hash | 20B | blake160(local HTLC pubkey) | signer |  |
| 5 | htlc_expiry | 8B | absolute timestamp since | timeout path needs since ≥ | 11 |

byte layout: unlock entry layout (ascending HTLC index)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | unlock_type | 1B | 0x00–0xFD HTLC index; 0xFE remote; 0xFF local | < N or 0xFE/0xFF | 7 |
| 1 | with_preimage | 1B | 0 / 1 | other values fail | 8 |
| 2 | signature | 65B | recoverable secp256k1 signature | ckb-auth algorithm 0 | 23 |
| 3 | preimage? | 32B | HTLC preimage | hash = payment_hash | 22 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| inputs | exactly 1 group input | 5 |
| args | length 57, or 58 with args[57] = 0x01 | 12 |
| witness | length ≥ 1 + N×HTLC + 72; blake2b(settlement_script)[0..20] = args.settlement_hash | 13 / 15 |
| unlocks | at least one; at most one 0xFE/0xFF entry | 9 |
| htlc preimage | no absolute timestamp since in the tx: preimage hash prefix = payment_hash; offered signed by remote, received by local; first settlement needs relative since ≥ delay×1/3 | 22 / 6 |
| htlc timeout | with an absolute timestamp since: since ≥ htlc_expiry; offered signed by local, received by remote; first settlement needs ≥ delay×2/3 | 11 / 6 |
| party settlement | 0xFE claims the remote balance and 0xFF the local one; that party becomes 36 zero bytes in the new script; first settlement needs since ≥ delay_epoch | 6 |
| outputs[0] | balance > 0 and not all settled: same lock, args with the new settlement_hash and flag 0x01; CKB channel capacity = balance with no type; UDT channel same type, amount = balance (capacity unchanged for HTLC settlement) | 18 / 19 / 20 / 21 |
| signatures | one secp256k1 signature per settled item over blake2b(raw tx without cell_deps) (not checked) | 10 / 23 |

## Notes

- Error codes (main.rs Error, enum order): 1 IndexOutOfBound · 2 ItemMissing · 3 LengthNotEnough · 4 Encoding · 5 MultipleInputs · 6 InvalidSince · 7 InvalidUnlockType · 8 InvalidWithPreimageFlag · 9 InvalidSettlementCount · 10 InvalidUnlockCount · 11 InvalidExpiry · 12 ArgsLenError · 13 WitnessLenError · 14 EmptyWitnessArgsError · 15 WitnessHashError · 16 InvalidFundingTx · 17 InvalidRevocationVersion · 18 OutputCapacityError · 19 OutputLockError · 20 OutputTypeError · 21 OutputUdtAmountError · 22 PreimageError · 23 AuthError
- The README describes the older 85-byte HTLC; the source also supports 58-byte args (feature 0x01) and 97-byte HTLCs. Cells from earlier versions with 36/56-byte args exist on chain and are not decoded here
- Unverified: whether the deployed binary is the HEAD version

## Example transactions

- mainnet · Commitment: party settlement 0xFE · [0x11ab7787b5f36a2513db3a0ab83595b716ec1316a7ae5b05ef542347389ac9ed](https://explorer.nervos.org/transaction/0x11ab7787b5f36a2513db3a0ab83595b716ec1316a7ae5b05ef542347389ac9ed) · `node decode-tx.js 0x11ab7787b5f36a2513db3a0ab83595b716ec1316a7ae5b05ef542347389ac9ed`
- mainnet · Commitment: HTLC settlement · [0xb0f7055d8d3308d19323698edd4cdf9dc4f8456c3b1731ced5a92311115033a0](https://explorer.nervos.org/transaction/0xb0f7055d8d3308d19323698edd4cdf9dc4f8456c3b1731ced5a92311115033a0) · `node decode-tx.js 0xb0f7055d8d3308d19323698edd4cdf9dc4f8456c3b1731ced5a92311115033a0`
- testnet · Commitment: 4 pending HTLCs · [0xb3ae45d5cb5314d169eae8ad9952bdbffb671489a3d8860930fd1de0a9b146f5](https://testnet.explorer.nervos.org/transaction/0xb3ae45d5cb5314d169eae8ad9952bdbffb671489a3d8860930fd1de0a9b146f5) · `node decode-tx.js 0xb3ae45d5cb5314d169eae8ad9952bdbffb671489a3d8860930fd1de0a9b146f5 --testnet`
- testnet · Commitment: HTLC + remote settlement · [0x4633f165ff2d39f9657ddd25513ff9addba552f6bfed3cdde829408dbd235b7b](https://testnet.explorer.nervos.org/transaction/0x4633f165ff2d39f9657ddd25513ff9addba552f6bfed3cdde829408dbd235b7b) · `node decode-tx.js 0x4633f165ff2d39f9657ddd25513ff9addba552f6bfed3cdde829408dbd235b7b --testnet`

# Cheque (lock) Constraints

> Source: nervosnetwork/ckb-cheque-script / src/entry.rs, claim.rs, withdraw.rs　·　mainnet 0xe4d4…fb0c / testnet 0x60d5…0d5b, hash_type type (RFC 0039)

- id: `cheque` · lock script · networks: mainnet, testnet · tags: token, defi, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/cheque.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/ckb-cheque-script@4ca3e62a](https://github.com/nervosnetwork/ckb-cheque-script/tree/4ca3e62ae39c32cfcc061905515a2856cad03fd8) · [contracts/ckb-cheque-script/src](https://github.com/nervosnetwork/ckb-cheque-script/blob/4ca3e62ae39c32cfcc061905515a2856cad03fd8/contracts/ckb-cheque-script/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — no binary or checksum at the recorded commit matched the deployed data hash (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@duanyytop](https://github.com/duanyytop)

## Deployments

### mainnet — RFC 0039

- code_hash: `0xe4d4ecc6e5f9a059bf2f7a82cca292083aebc0c421566a52484fe2ec51a9fb0c` · hash_type: `type`
- deployed in tx [`0x0a34aeea122d9795e06e185746a92e88bca0ad41b0e5842a960e5fd1d43760a6`](https://explorer.nervos.org/transaction/0x0a34aeea122d9795e06e185746a92e88bca0ad41b0e5842a960e5fd1d43760a6) (block 4740722) · data_hash `0x28f25f0e9dc4ca642b8055ab17b21d38e4d9a4d2e95a18201e7515699ba35ec1` · type_id args `0xcc467d74500e5c56b365e9c4f56ec8626a48bde9a8fd84f7bb15b10a6e8699d1`

```json
{
  "script": { "code_hash": "0xe4d4ecc6e5f9a059bf2f7a82cca292083aebc0c421566a52484fe2ec51a9fb0c", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x04632cc459459cf5c9d384b43dee3e36f542a464bdd4127be7d6618ac6f8d268", "index": "0x0" }, "dep_type": "dep_group" }
}
```

### testnet — RFC 0039

- code_hash: `0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b` · hash_type: `type`
- deployed in tx [`0x1b16769dc508c8349803fe65558f49aa8cf04ca495fbead42513e69e46608b6c`](https://testnet.explorer.nervos.org/transaction/0x1b16769dc508c8349803fe65558f49aa8cf04ca495fbead42513e69e46608b6c) (block 1223129) · data_hash `0xbe734faa9ead3cfeef2efba92de6b6bdb5b0cadb6cd36c896081e8cab18e79b9` · type_id args `0x67e12cba7b1ef91ecf03e6f97e013aa897a2d7ea0bab2a191e078030ca585703`

```json
{
  "script": { "code_hash": "0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x7f96858be0a9d584b4a9ea190e0420835156a6010a5fde15ffcdc9d9c721ccab", "index": "0x0" }, "dep_type": "dep_group" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `0 → 1` Sender creates a cheque

**Input** · sender cells

```
Cell{ lock: SENDER(secp256k1), type: UDT?, data: amount }
```

**Output** · cheque cell

```
Cell{
  lock: { codeHash: CHEQUE,
          args: {{receiver_lock_hash[0..20]}} ‖ {{sender_lock_hash[0..20]}} },
  type: UDT, data: amount
}
```

byte layout: args byte layout

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | receiver_lock_hash[0..20] | 20B | first 20 bytes of receiver lock hash | args exactly 40B | 5 |
| 1 | sender_lock_hash[0..20] | 20B | first 20 bytes of sender lock hash | — | 5 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| create | creation does not run the cheque lock (locks run only when spent) | — |

### 2. `1 → 0` Receiver claims

**Input** · cheque cell

```
Cell{ lock: CHEQUE(args), capacity: {{C}}, since: {{0}} }
```

**Input** · receiver input (1.b, when the cheque has no signature)

```
Cell{ lock: RECEIVER, witness.lock: {{signature}} }
```

**Input** · sender inputs (optional)

```
Cell{ lock: SENDER, capacity: S }
```

**Output** · receiver UDT

```
Cell{ lock: RECEIVER, type: UDT, data: amount }
```

**Output** · refund to sender

```
Cell{ lock: SENDER,
  Σcapacity = {{S + C}} }
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| since | every cheque input since = 0 | 10 |
| capacity | Σ sender inputs + Σ cheque inputs = Σ sender outputs (capacity goes back to sender) | 8 |
| 1.a signature | cheque witness signature recovers to a secp256k1 lock hash[0..20] = receiver | 12 / 13 |
| 1.b input | without signature, an input with lock hash[0..20] = receiver whose witness.lock is non-empty | 6 / 7 |

### 3. `1 → 0` Sender withdraws (after 6 epochs)

**Input** · cheque cell

```
Cell{ lock: CHEQUE(args), since: {{0xA000000000000006}} }
```

**Input** · sender input (2.b)

```
Cell{ lock: SENDER, witness.lock: {{signature}} }
```

**Output** · outputs

```
any (usually back to sender)
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| since | every cheque input since = 0xA000000000000006 (relative 6 epochs) | 11 |
| 2.a / 2.b | signature belongs to sender, or a sender input with non-empty witness.lock | 6 / 7 / 13 |

## Notes

- Error codes: 5 InvalidArgument · 6 NoMatchedInputs · 7 WitnessSignatureWrong · 8 SenderCapacityNotSame · 9 WrongPubKey · 10 ClaimChequeInputSinceNotZero · 11 WithdrawChequeInputSinceError · 12 Secp256k1 · 13 NoMatchedSignature (signature-path errors all surface as 13); 1–4 are syscall errors
- The signature path only recognizes the secp256k1_blake160 lock (code_hash 0x9bd7…cce8, type)

## Example transactions

- mainnet · Cheque claim (signature) · [0xf4704610f2d6910ea48e534231d8ed9a4cdeeb8a3fdfb3eab98b167eba4b5e37](https://explorer.nervos.org/transaction/0xf4704610f2d6910ea48e534231d8ed9a4cdeeb8a3fdfb3eab98b167eba4b5e37) · `node decode-tx.js 0xf4704610f2d6910ea48e534231d8ed9a4cdeeb8a3fdfb3eab98b167eba4b5e37`
- mainnet · Cheque withdraw · [0x401ca834f62d55f5b613f334f52e725de037ebec5a827f4765301669e3982439](https://explorer.nervos.org/transaction/0x401ca834f62d55f5b613f334f52e725de037ebec5a827f4765301669e3982439) · `node decode-tx.js 0x401ca834f62d55f5b613f334f52e725de037ebec5a827f4765301669e3982439`

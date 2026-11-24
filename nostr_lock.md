# Nostr lock Constraints

> Source: nervosnetwork/nostr-binding / contracts/nostr-lock/src　·　mainnet 0x641a…4c68 / testnet 0x6ae5…91d5, hash_type type (ccc)

- id: `nostr_lock` · lock script · networks: mainnet, testnet · tags: identity, open-source, nervos
- links: page https://retricsu.github.io/community-scripts/nostr_lock.html · all contracts + tx decoder https://retricsu.github.io/community-scripts/llms.txt · JSON https://retricsu.github.io/community-scripts/contracts.json
- source: [nervosnetwork/nostr-binding@eef134e0](https://github.com/nervosnetwork/nostr-binding/tree/eef134e0a09dd07ccc367eb4eca84c1a5a73fb8b) · [contracts/nostr-lock/src](https://github.com/nervosnetwork/nostr-binding/blob/eef134e0a09dd07ccc367eb4eca84c1a5a73fb8b/contracts/nostr-lock/src) (default-branch HEAD recorded at backfill 2026-10-21; spec/plugin were written from the default branch shortly before (exact read commit not recorded))
- binary vs source: unverified (deployed binary not matched to the source) — hash appears in the repo only as a deployment record or doc, which does not prove the recorded commit builds this binary (reproducible build not attempted)
- on-chain data checked: 2026-10-20
- contributors: [@XuJiandong](https://github.com/XuJiandong)

## Deployments

### mainnet — ccc KnownScript.NostrLock

- code_hash: `0x641a89ad2f77721b803cd50d01351c1f308444072d5fa20088567196c0574c68` · hash_type: `type`
- deployed in tx [`0x99b116dd1e4f1fa903b70112ae672c18bb34241d3d03a9ad555cd2a611be7327`](https://explorer.nervos.org/transaction/0x99b116dd1e4f1fa903b70112ae672c18bb34241d3d03a9ad555cd2a611be7327) (block 18373370) · data_hash `0x2effea19ff3024b5b0fb4c0c59c379e7610110e7e3fe7ae003247b1115e59795` · type_id args `0xfad8cb75eb0bb01718e2336002064568bc05887af107f74ed5dd501829e192f8`

```json
{
  "script": { "code_hash": "0x641a89ad2f77721b803cd50d01351c1f308444072d5fa20088567196c0574c68", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0x99b116dd1e4f1fa903b70112ae672c18bb34241d3d03a9ad555cd2a611be7327", "index": "0x0" }, "dep_type": "code" }
}
```

### testnet — ccc KnownScript.NostrLock

- code_hash: `0x6ae5ee0cb887b2df5a9a18137315b9bdc55be8d52637b2de0624092d5f0c91d5` · hash_type: `type`
- deployed in tx [`0xa2a434dcdbe280b9ed75bb7d6c7d68186a842456aba0fc506657dc5ed7c01d68`](https://testnet.explorer.nervos.org/transaction/0xa2a434dcdbe280b9ed75bb7d6c7d68186a842456aba0fc506657dc5ed7c01d68) (block 13783286) · data_hash `0x2effea19ff3024b5b0fb4c0c59c379e7610110e7e3fe7ae003247b1115e59795` · type_id args `0x8dc56c6f35f0c535e23ded1629b1f20535477a1b43e59f14617d11e32c50e0aa`

```json
{
  "script": { "code_hash": "0x6ae5ee0cb887b2df5a9a18137315b9bdc55be8d52637b2de0624092d5f0c91d5", "hash_type": "type", "args": "<args>" },
  "cell_dep": { "out_point": { "tx_hash": "0xa2a434dcdbe280b9ed75bb7d6c7d68186a842456aba0fc506657dc5ed7c01d68", "index": "0x0" }, "dep_type": "code" }
}
```

## Transitions

In the cell sketches `{{…}}` marks a field this script checks; an error code is what the script returns when that check fails.

### 1. `A` Unlock with a Nostr key (pow_difficulty = 0)

**Input** · input

```
Cell{
  lock: { codeHash: NOSTR_LOCK,
          args: {{0x00}} ‖ {{blake160(schnorr pubkey) 20B}} }
}
```

**Input** · witness[group 0].lock

```
Nostr event JSON {
  id, pubkey, created_at,
  kind: {{23334}},
  tags: [["ckb_sighash_all", {{hex(sighash_all)}}], …],
  content: {{fixed notice}},
  sig
}
```

**Output** · outputs: any

```
Cell{ lock: any }
```

byte layout: args byte layout (21B)

| # | field | size | meaning | constraint | error |
| --- | --- | --- | --- | --- | --- |
| 0 | pow_difficulty | 1B | 0 = key unlock; >0 = anyone unlocks with PoW | — | 15 |
| 1 | pubkey hash | 20B | blake160(schnorr x-only pubkey) | = blake160(event.pubkey) | 26 |

**Constraints**

| field | condition | error |
| --- | --- | --- |
| args | exactly 21 bytes | 15 |
| witness | lock present | 27 / 2 |
| event | valid JSON event | 21 / 20 |
| tags | contains ["ckb_sighash_all", hex(sighash_all)]; sighash_all as in secp256k1_blake160 (witness.lock zeroed) | 11 |
| id | = sha256([0,pubkey,created_at,kind,tags,content]) | 17 |
| kind / content | kind = 23334, content = fixed notice | 12 / 13 |
| sig | valid schnorr signature | 18 / 19 / 16 |

### 2. `B` PoW unlock (pow_difficulty > 0)

**Input** · input

```
Cell{ lock: NOSTR_LOCK({{difficulty}} ‖ {{0×20}}) }
```

**Input** · witness

```
event.tags ∋ ["nonce", n, "{{difficulty}}"]
```

**Output** · outputs

```
any
```

**Constraints**

| field | condition | error |
| --- | --- | --- |
| nonce | a 3-element nonce tag exists and target = args[0] | 25 / 23 |
| id | leading zero bits ≥ difficulty | 24 |
| args | args[1..21] must be all zero | 22 |

## Notes

- Error codes: 1–4 syscall · 10 Unknown · 11 SighashAllMismatched · 12 KindMismatched · 13 ContentMismatched · 14 GenerateSighashAll · 15 InvalidScriptArgs · 16 InvalidPublicKey · 17 InvalidEventId · 18 ValidationFail · 19 InvalidSignatureFormat · 20 UnknownKey · 21 Json · 22 PubkeyNotEmpty · 23 WrongTargetDifficulty · 24 PoWDifficulty · 25 NonceNotFound · 26 PubkeyNotFound · 27 WrongWitnessArgs
- Fixed content: "Signing a CKB transaction\n\nIMPORTANT: Please verify the integrity and authenticity of connected Nostr client before signing this message\n"

## Example transactions

- mainnet · Nostr lock · [0x809e8238e7bec2e9c0a153fc8eb7d3a195775df7021eac5f872e6da3bd74dc8b](https://explorer.nervos.org/transaction/0x809e8238e7bec2e9c0a153fc8eb7d3a195775df7021eac5f872e6da3bd74dc8b) · `node decode-tx.js 0x809e8238e7bec2e9c0a153fc8eb7d3a195775df7021eac5f872e6da3bd74dc8b`

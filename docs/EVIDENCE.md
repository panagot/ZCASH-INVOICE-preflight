# Evidence — why preflight exists (fixture-backed)

ZCG often asks: “is this a real gap?” This file lists **reproducible failures** the helper catches.

Run: `node bin/doctor.js --file <fixture>`

| Fixture | Failure mode | Why a merchant cares |
|---------|--------------|----------------------|
| `fixtures/bad-transparent-memo.json` | Memo on transparent address | ZIP-321 invalid; wallets/plugins should reject |
| `fixtures/bad-network-mismatch.json` | Mainnet address while desk set to testnet | Wrong network → confusion / lost test funds |
| `fixtures/bad-empty-amount.json` | Missing amount | Broken payment request / QR |
| `fixtures/bad-huge-memo.json` | Memo &gt; 512 bytes | Invalid memo / failed encode |
| Multi-pay URI (see tests) | `address.1` / `amount.1` | Out of scope; helper rejects instead of silently mishandling |

**Pass cases:** `good-ua.json`, `good-sapling.json`, `label-message.json`

**Live desk:** **Good UA** and **Bad t+memo** buttons mirror `good-ua.json` and `bad-transparent-memo.json`.

## What this is not claiming

- Frequency of mistakes in the wild (no merchant telemetry yet — gather with LOI)  
- That the BTCPay plugin lacks all checks (plugin may catch some at invoice create; this is **compose-time** hygiene)  

## LOI ask tied to evidence

Ask a BTCPay Zcash maintainer: “Which of these fail codes do you already enforce at invoice create? Which should we share as a library?”

# ZEC Invoice Preflight

**Compose-time ZIP-321 validation for Zcash merchants.** Catch invalid payment requests before a customer scans a QR.

| | |
|---|---|
| **Live demo** | **[zcash-invoice-preflight.vercel.app](https://zcash-invoice-preflight.vercel.app/)** |
| **Reviewer path** | [10-minute checklist](https://zcash-invoice-preflight.vercel.app/reviewers.html) |
| **Repository** | [github.com/panagot/ZCASH-INVOICE-preflight](https://github.com/panagot/ZCASH-INVOICE-preflight) |
| **License** | MIT |

Open-source **BTCPay companion**: importable library, CLI doctor, versioned handoff JSON, and a merchant desk demo. Not a payment processor, not a BTCPay plugin rewrite, and not live chain detection.

**Package name (planned):** `zcash-invoice-preflight` · **Handoff schema:** `btcpay-zec-helper.handoff/v1`

---

## At a glance

```
Merchant composes invoice  →  Preflight (PASS / FAIL)  →  Share QR or handoff JSON  →  BTCPay settles on-chain
                              ↑ this tool                    ↑ mock lane in demo only
```

| You get | Details |
|---------|---------|
| Merchant desk | Thermal-style UI: compose, parse URI, PASS/FAIL ticket, QR, export |
| Customer pay page | Shareable link with validated QR |
| Preflight library | Stable fail codes for ZIP-321 edge cases |
| CLI doctor | `node bin/doctor.js` — exit 0 pass, 1 fail, for CI and scripts |
| BTCPay handoff v1 | JSON schema + export for plugin ingestion |
| 20 automated tests | Fixtures for PASS and FAIL scenarios |

---

## Try it now

**No install required.** Open the live demo:

1. **[Merchant desk](https://zcash-invoice-preflight.vercel.app/)** — click **Good UA**, then **Run preflight** → green PASS ticket  
2. Click **Bad t+memo** → red FAIL on memo check  
3. **Export BTCPay handoff** → JSON with `schema: btcpay-zec-helper.handoff/v1`  
4. **[Reviewer path](https://zcash-invoice-preflight.vercel.app/reviewers.html)** — full maintainer checklist  

Payment status on the desk is **MOCK — NOT CHAIN**. Real settlement belongs to the BTCPay Zcash plugin.

---

## Why this exists

Merchants can build invalid `zcash:` URIs at invoice time:

| Mistake | Consequence |
|---------|-------------|
| Memo on a transparent (`t1…`) address | Invalid ZIP-321; memo may be dropped |
| Mainnet address on a testnet desk | Rejected request or user confusion |
| Missing or malformed amount | Broken or ambiguous payment request |
| Memo over 512 bytes | Encode failure |
| Multi-payment URIs | Out of scope; rejected explicitly |

This tool runs the same class of checks **while the merchant is still composing** the request.

---

## Quick start (local)

**Requirements:** Node.js 18+ (20+ recommended)

```bash
git clone https://github.com/panagot/ZCASH-INVOICE-preflight.git
cd ZCASH-INVOICE-preflight
npm install
npm test
npm run dev
```

Open **http://localhost:5177** (same app as the [live demo](https://zcash-invoice-preflight.vercel.app/)).

```bash
node bin/doctor.js --file fixtures/good-ua.json          # exit 0
node bin/doctor.js --file fixtures/bad-transparent-memo.json   # exit 1
```

---

## What it is not

| Non-goal | Reason |
|----------|--------|
| BTCPay Server plugin | Companion + handoff contract |
| Live payment detection | Mock lane only; real watch is plugin scope |
| Indexer observatory | Different problem (invoice hygiene, not fleet health) |
| Checkout replacement | Owns compose-time validation only |

---

## Ownership boundary

| Concern | Owner |
|---------|--------|
| Memo + transparent, amount, network, URI round-trip | **ZEC Invoice Preflight** |
| Invoice create, settlement, on-chain detection | **BTCPay Zcash plugin + backend** |

---

## Preflight checks

Stable `code` fields for plugin mirroring:

| Code | Level when bad | Meaning |
|------|----------------|---------|
| `engine` | warn | WASM vs heuristic address engine |
| `address` | bad/warn | Valid Zcash address and type |
| `network` | bad | Address network vs desk setting |
| `amount` | bad | Positive ZEC, up to 8 decimals |
| `memo` | bad | Memo rules for address type; max 512 bytes |
| `privacy` | warn | Transparent receive (public on-chain) |
| `uri` | bad | ZIP-321 encode/decode integrity |
| `parse` | bad | Pasted URI parse failure |

**Pass rule:** no check with `level: "bad"`. Warnings alone do not fail preflight.

```javascript
import { ensureAddressEngine } from "./public/lib/address.js"
import { preflightInvoice } from "./public/lib/preflight.js"

await ensureAddressEngine()
const report = preflightInvoice({
  address: "u1…",
  amount: "0.042",
  memo: "Order #1042",
  network: "mainnet",
})
```

---

## BTCPay handoff

Schema: [`schemas/handoff-v1.json`](schemas/handoff-v1.json) · Details: [`docs/BTCPAY_HANDOFF.md`](docs/BTCPAY_HANDOFF.md)

```javascript
import { buildInvoice } from "./public/lib/invoice.js"
import { toBtcpayHandoff } from "./public/lib/btcpay-handoff.js"

const invoice = buildInvoice({ address, amount, memo, network: "mainnet" })
const handoff = toBtcpayHandoff(invoice)
// handoff.schema === "btcpay-zec-helper.handoff/v1"
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/REVIEWER.md`](docs/REVIEWER.md) | 10-minute reviewer path (CLI + browser) |
| [`docs/EVIDENCE.md`](docs/EVIDENCE.md) | Reproducible failure modes |
| [`docs/DEMO.md`](docs/DEMO.md) | Screen recording script |
| [`docs/PACKAGE.md`](docs/PACKAGE.md) | Module exports for integrators |
| [`docs/screenshots/`](docs/screenshots/) | Full-page UI captures |

---

## Deploy

Static root: `public/` · Live site: **[zcash-invoice-preflight.vercel.app](https://zcash-invoice-preflight.vercel.app/)**

```bash
npm run vendor
# Deploy public/ to Vercel or any static host
```

[`vercel.json`](vercel.json) sets correct WASM content type. QR and address parser are vendored under `public/vendor/` (no runtime CDN).

---

## Tests and fixtures

```bash
npm test   # 20 tests
```

| Fixture | Expected |
|---------|----------|
| `good-ua.json` | PASS |
| `good-sapling.json` | PASS |
| `bad-transparent-memo.json` | FAIL (memo on t-addr) |
| `bad-network-mismatch.json` | FAIL |
| `bad-empty-amount.json` | FAIL |
| `bad-huge-memo.json` | FAIL |

---

## Repository layout

```
public/           Merchant desk, pay page, core lib, vendor assets
bin/doctor.js     CLI preflight
fixtures/         JSON test scenarios
schemas/          handoff-v1.json
test/             Node test suite
docs/             Reviewer, evidence, demo, screenshots
```

---

## License

MIT · Dependencies: see `package.json` (`zaddr_wasm_parser`: MIT/Apache-2.0)

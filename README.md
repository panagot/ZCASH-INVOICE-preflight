# ZEC Invoice Preflight

**Compose-time ZIP-321 preflight for Zcash merchants** — catch invalid payment requests *before* a customer scans a QR or sends funds. A **BTCPay companion** (handoff JSON + importable library + CLI doctor), not a plugin rewrite or chain indexer.

**Live demo:** https://zcash-invoice-preflight.vercel.app/ · **Reviewer path:** https://zcash-invoice-preflight.vercel.app/reviewers.html  

**Naming:** npm/GitHub = `zcash-invoice-preflight` · handoff schema id = `btcpay-zec-helper.handoff/v1`

[![CI](https://github.com/panagot/ZCASH-INVOICE-preflight/actions/workflows/doctor-ci.yml/badge.svg)](https://github.com/panagot/ZCASH-INVOICE-preflight/actions/workflows/doctor-ci.yml)

---

## Table of contents

- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [What it is not](#what-it-is-not)
- [Quick start](#quick-start)
- [Merchant desk (demo UI)](#merchant-desk-demo-ui)
- [Preflight checks](#preflight-checks)
- [ZIP-321 support](#zip-321-support)
- [Address validation](#address-validation)
- [BTCPay handoff contract](#btcpay-handoff-contract)
- [Detection adapter (mock by default)](#detection-adapter-mock-by-default)
- [CLI doctor](#cli-doctor)
- [Fixtures & tests](#fixtures--tests)
- [Package exports](#package-exports)
- [Deploy (Vercel / static)](#deploy-vercel--static)
- [CI](#ci)
- [10-minute reviewer path](#10-minute-reviewer-path)
- [Repository layout](#repository-layout)
- [Dependencies & vendoring](#dependencies--vendoring)
- [Contributing / integration notes](#contributing--integration-notes)

---

## Why this exists

Merchants accepting ZEC can assemble **invalid `zcash:` payment URIs** at invoice time:

| Mistake | Consequence |
|---------|-------------|
| Memo on a **transparent** (`t1…`) address | Invalid ZIP-321; wallets may reject or drop the memo |
| **Mainnet** address while desk is on testnet | Wrong network → confusion, lost test funds |
| Missing or malformed **amount** | Broken QR / ambiguous payment |
| Memo **> 512 bytes** | Encode failure or wallet rejection |
| Multi-payment URIs (`address.1`, `amount.1`) | Out of scope; silent mishandling is worse than a loud error |

This tool runs those checks **at compose time** and prints a thermal-style **PASS / FAIL ticket** before anything is shared with a customer.

---

## What it does

1. **Build** — Enter address, amount, memo, label, message → encode a single-payment ZIP-321 URI.
2. **Parse** — Paste an existing `zcash:` URI and validate it against the same rules.
3. **Preflight** — Structured checklist with `ok` / `warn` / `bad` levels and stable `code` fields.
4. **Customer pay page** — Shareable link with QR (from a signed local invoice payload).
5. **BTCPay handoff** — Export JSON matching `schemas/handoff-v1.json` for plugin ingestion.
6. **CLI doctor** — Headless preflight with exit code `0` (pass) or `1` (fail) for scripts and CI.
7. **Mock status lane** — `unpaid → detected → confirmed` is explicitly labeled **MOCK**; real chain watch is a separate adapter seam.

The thermal POS UI is the **demo surface**. The durable deliverable is the **preflight module**, fixtures, doctor, and handoff schema.

---

## What it is not

| Non-goal | Reason |
|----------|--------|
| BTCPay Server plugin | Companion + handoff contract; merge needs maintainer LOI |
| Live payment detection | Mock by default; `ZkoolDetectionAdapter` is a stub |
| Lightwalletd / Zaino observatory | Different problem (health dashboards ≠ invoice hygiene) |
| Full BTCPay checkout replacement | Owns compose-time checks only |
| Multi-payment ZIP-321 | Rejected loudly — out of scope |

---

## Quick start

**Requirements:** Node.js 18+ (20+ recommended for stable WASM import)

```bash
git clone https://github.com/panagot/ZCASH-INVOICE-preflight.git
cd ZCASH-INVOICE-preflight
npm install          # runs postinstall → vendors browser libs
npm test
npm run dev
```

Open **http://localhost:5177**

One-liner health check:

```bash
node bin/doctor.js --file fixtures/good-ua.json
# → preflight: PASS (exit 0)

node bin/doctor.js --file fixtures/bad-transparent-memo.json
# → preflight: FAIL (exit 1)
```

---

## Merchant desk (demo UI)

The UI is a **thermal ticket printer / POS chassis** aesthetic (Archivo Black + Space Mono, graphite-green frame, hazard red FAIL). It is intentionally utilitarian — not a generic crypto SaaS dashboard.

### Tabs

| Tab | Purpose |
|-----|---------|
| **Build** | Compose invoice fields, run preflight, generate QR, export handoff |
| **Parse URI** | Validate a pasted `zcash:` string |

### Key actions

- **Run preflight** — Full checklist on current fields.
- **Open pay page** — Customer-facing QR + amount (shareable URL).
- **Export BTCPay handoff** — Downloads `handoff-v1` JSON.
- **Advance (mock)** — Steps local status; banner stays **MOCK — NOT CHAIN**.
- **Print** — Ticket layout for merchant desk workflow.

### Engine badge

The masthead shows which address engine is active:

- `Address engine · zaddr-wasm` — preferred (`@elemental-zcash/zaddr_wasm_parser`)
- `Address engine · heuristic (…)` — fallback if WASM fails to load (warn on ticket)

---

## Preflight checks

Each check has a stable **`code`** suitable for BTCPay plugin mirroring:

| Code | Level when bad | Meaning |
|------|----------------|---------|
| `engine` | warn | WASM vs heuristic address engine |
| `address` | bad/warn | Valid Zcash address? Type (transparent / sapling / unified) |
| `network` | bad | Address network vs desk `mainnet` / `testnet` |
| `amount` | bad | Positive ZEC amount, ≤ 8 decimal places |
| `memo` | bad | Memo allowed on address type; ≤ 512 UTF-8 bytes |
| `privacy` | warn | Transparent receive → public amount/linkability |
| `uri` / `uri_roundtrip` / `uri_amount` | bad | ZIP-321 encode/decode integrity |
| `parse` | bad | Pasted URI parse failure |

**Pass rule:** `ok === true` when no check has `level: "bad"`. Warnings do not fail preflight.

Programmatic usage:

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

console.log(report.ok, report.checks, report.uri)
```

---

## ZIP-321 support

Implements a **single-payment subset** of [ZIP-321](https://zips.z.cash/zip-0321):

- Scheme: `zcash:` (also accepts `zcash://`)
- Params: `amount`, `memo` (base64url), `label`, `message`
- Amount formatting: up to 8 decimal places, no trailing junk
- **Rejects** multi-payment query keys (`address.1`, `amount.1`, etc.)
- **Rejects** memo encoding when address is transparent

```javascript
import { encodePaymentUri, decodePaymentUri } from "./public/lib/zip321.js"

const uri = encodePaymentUri({
  address: "u1…",
  amount: "0.01",
  memo: "hello",
})
const parsed = decodePaymentUri(uri)
```

---

## Address validation

**Primary path:** [`@elemental-zcash/zaddr_wasm_parser`](https://www.npmjs.com/package/@elemental-zcash/zaddr_wasm_parser) (Rust `zcash_address` → WASM, MIT/Apache-2.0).

**Fallback:** Heuristic classifier in `public/lib/address-heuristic.js` when WASM is unavailable — always surfaced on the preflight ticket so reviewers are not misled.

Classification output:

```javascript
{
  ok: true,
  kind: "unified" | "sapling" | "transparent" | "tex" | "unknown",
  network: "mainnet" | "testnet" | "unknown",
  allowsMemo: boolean,
  detail: string
}
```

---

## BTCPay handoff contract

Schema: [`schemas/handoff-v1.json`](schemas/handoff-v1.json)

Export from UI or code:

```javascript
import { toBtcpayHandoff } from "./public/lib/btcpay-handoff.js"

import { buildInvoice } from "./public/lib/invoice.js"
import { toBtcpayHandoff } from "./public/lib/btcpay-handoff.js"

const invoice = buildInvoice({ address, amount, memo, network: "mainnet" })
const handoff = toBtcpayHandoff(invoice)
// handoff.schema === "btcpay-zec-helper.handoff/v1"
```

### Ownership (critical)

| Concern | Owner |
|---------|--------|
| Compose-time fail (t+memo, amount, network) | **This tool** |
| Invoice create / settle / detect payment | **BTCPay Zcash plugin + backend** |

- `btcpayInvoiceId` is `null` until a real BTCPay invoice exists.
- `disclaimer` and `ownership` fields state that mock status is not settlement.
- `preflight.checks[]` uses the same codes as the CLI doctor.

See [`docs/BTCPAY_HANDOFF.md`](docs/BTCPAY_HANDOFF.md) for field mapping details.

---

## Detection adapter (mock by default)

`public/lib/detection.js` defines a small interface:

| Adapter | Behavior |
|---------|----------|
| `MockDetectionAdapter` | Default — manual **Advance (mock)** in UI |
| `ZkoolDetectionAdapter` | Stub — documents future zkool/lightwalletd wiring; `poll()` throws |

The UI masthead shows `Detection · mock`. Chain watch is **explicitly off** until a real adapter is connected.

---

## CLI doctor

```bash
# Fixture file (JSON with address, amount, memo, network, …)
node bin/doctor.js --file fixtures/good-ua.json

# Raw URI
node bin/doctor.js --uri "zcash:u1…?amount=0.01"

# Inline fields
node bin/doctor.js --address u1… --amount 0.01 --memo "hi" --network mainnet

# JSON report to stdout
node bin/doctor.js --file fixtures/bad-transparent-memo.json --json

npm run doctor   # alias
```

**Exit codes:** `0` = pass, `1` = fail, `2` = usage error.

Example output:

```
OK    engine         Address engine · zaddr-wasm (zcash_address)
OK    address        Unified address (mainnet)
OK    network        Network · mainnet
OK    amount         Amount · 0.04200000 ZEC
…
preflight: PASS
```

---

## Fixtures & tests

Fixtures live in [`fixtures/`](fixtures/) and are exercised by `npm test` and the doctor:

| Fixture | Expected |
|---------|----------|
| `good-ua.json` | PASS — unified address + memo |
| `good-sapling.json` | PASS — Sapling address |
| `label-message.json` | PASS — label + message encoding |
| `bad-transparent-memo.json` | FAIL — memo on t-addr |
| `bad-network-mismatch.json` | FAIL — mainnet addr, testnet desk |
| `bad-empty-amount.json` | FAIL — missing amount |
| `bad-huge-memo.json` | FAIL — memo > 512 bytes |

```bash
npm test
# 20 tests — address wasm, zip321, fixtures, handoff, detection stub, security
```

---

## Package exports

`package.json` exports importable modules for BTCPay companion integration:

```javascript
import { preflightInvoice } from "zcash-invoice-preflight/preflight"
import { encodePaymentUri } from "zcash-invoice-preflight/zip321"
import { ensureAddressEngine } from "zcash-invoice-preflight/address"
import { toBtcpayHandoff } from "zcash-invoice-preflight/handoff"
import { MockDetectionAdapter } from "zcash-invoice-preflight/detection"
```

In Node, always `await ensureAddressEngine()` before preflight so WASM initializes.

See [`docs/PACKAGE.md`](docs/PACKAGE.md).

---

## Deploy (Vercel / static)

Static root: `public/`

```bash
npm run vendor   # ensure public/vendor/ is populated
# Deploy public/ to any static host
```

[`vercel.json`](vercel.json) sets correct `Content-Type` for `.wasm` if you add WASM assets to the static tree.

**CSP-friendly:** QR and zaddr parser are **vendored locally** under `public/vendor/` — no runtime CDN dependency.

Demo recording checklist: [`docs/DEMO.md`](docs/DEMO.md)

---

## CI

[`.github/workflows/doctor-ci.yml`](.github/workflows/doctor-ci.yml) on push/PR:

```yaml
npm ci
npm test
node bin/doctor.js --file fixtures/good-ua.json
node bin/doctor.js --file fixtures/bad-transparent-memo.json  # must exit 1
```

---

## 10-minute reviewer path

For BTCPay Zcash maintainers or technical reviewers:

```bash
npm ci && npm run vendor && npm test
node bin/doctor.js --file fixtures/good-ua.json
npm run dev
```

1. Masthead → **Address engine · zaddr-wasm**
2. Load **good UA** fixture path in Build → **PASS** ticket
3. Load **bad t+memo** → **FAIL** on memo
4. **Export BTCPay handoff** → `schema: btcpay-zec-helper.handoff/v1`
5. **Advance (mock)** → status still labeled mock

Full guide: [`docs/REVIEWER.md`](docs/REVIEWER.md)

---

## Repository layout

```
├── public/                 # Static merchant desk + pay page
│   ├── index.html          # Build / Parse tabs
│   ├── pay.html            # Customer QR page
│   ├── app.js              # Desk logic
│   ├── styles.css          # Thermal POS styling
│   ├── lib/                # Core modules (preflight, zip321, address, …)
│   └── vendor/             # Vendored qrcode + zaddr wasm (postinstall)
├── bin/doctor.js           # CLI preflight
├── fixtures/               # JSON invoice scenarios
├── schemas/handoff-v1.json # BTCPay handoff JSON Schema
├── test/preflight.test.js  # Node test suite
├── scripts/vendor-libs.mjs # Copies/bundles browser deps
├── docs/                   # BTCPAY_HANDOFF, REVIEWER, DEMO, PACKAGE
└── vercel.json
```

---

## Dependencies & vendoring

| Package | Role |
|---------|------|
| `@elemental-zcash/zaddr_wasm_parser@0.2.0` | Address parse/validate (WASM) |
| `qrcode@1.5.4` | QR generation (bundled to `public/vendor/qrcode.min.js`) |

`npm install` runs `scripts/vendor-libs.mjs` automatically (`postinstall`).

---

## Contributing / integration notes

**Integration target:** BTCPay Zcash plugin authors who want shared compose-time checks instead of duplicating ZIP-321 edge cases.

**Before filing grants:** Get a maintainer or merchant to confirm the handoff schema and fail codes are useful (forum reply > slide deck).

**Adding fixtures:** Drop JSON in `fixtures/`, add an assertion in `test/preflight.test.js`, run `npm test`.

---

## License

MIT. Dependencies carry their own licenses (`zaddr_wasm_parser`: MIT/Apache-2.0).

---

**One-liner:** Fail before the customer pays — ZIP-321 invoice preflight for Zcash merchants, built as a BTCPay companion.

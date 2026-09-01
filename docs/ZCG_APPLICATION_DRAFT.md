# ZCG application — ZEC Invoice Preflight

**Working title:** Zcash invoice preflight library + merchant desk (BTCPay companion)  
**Category:** Non-Wallet Applications / Integration  
**Ask:** **$3,000 USD** (two milestones: packaging + acceptor sign-off)  
**Timeline:** ~4 weeks from LOI confirmation  

> **Do not file until** a BTCPay Zcash maintainer (or named merchant) has replied on the forum that they will review the milestone deliverables.

## Naming

- **Public / npm / GitHub:** `zcash-invoice-preflight`  
- **Handoff schema id (stable contract):** `btcpay-zec-helper.handoff/v1`  

## Applicant

- **GitHub:** [panagot](https://github.com/panagot)  
- **Repo:** https://github.com/panagot/ZCASH-INVOICE-preflight  
- **Forum handle:** _(fill before submission)_  
- **LOI status:** _(Not sent / Sent / Reply received — fill before submission)_  

## Summary

Compose-time **ZIP-321 preflight** for Zcash invoices: catch memo+transparent, network mismatch, bad amounts; export honest handoff JSON for BTCPay-adjacent packaging. Thermal merchant desk is the demo; the fundable core is **shared checks + schema + doctor/CI + maintainer acceptance**.

**Live demo (already deployed):** https://zcash-invoice-preflight.vercel.app/  
**On-site reviewer path:** https://zcash-invoice-preflight.vercel.app/reviewers.html  

**Not** an indexer observatory ([#343](https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/343)).  
**Not** a BTCPay plugin rewrite.  
**Not** live payment detection (mock lane labeled; detection stub only).

## Problem (scoped)

Merchants can build invalid `zcash:` payment requests before a customer scans a QR. Reproducible failures: [docs/EVIDENCE.md](EVIDENCE.md). No production telemetry yet — LOI will confirm which fail codes maintainers already enforce.

## What is already shipped (prototype)

| Item | Status |
|------|--------|
| Live merchant desk + doc pages | ✅ Vercel |
| `@elemental-zcash/zaddr_wasm_parser` address path | ✅ |
| Handoff schema v1 + export | ✅ |
| Fixtures + CLI doctor | ✅ |
| 20 automated tests | ✅ |
| Client-side demo (no server invoice storage) | ✅ |

This grant funds **maintainer acceptance, packaging, CI on GitHub, and doc alignment** — not greenfield UI from scratch.

## Budget — two milestones ($3,000 total)

| Milestone | Amount | Deliverables | Acceptor |
|-----------|--------|--------------|----------|
| **M1** | **$1,500** | MIT LICENSE committed; CI green on GitHub; `docs/PACKAGE.md` + reviewer package aligned; live demo URLs in all grant docs; any acceptor-requested fixture additions with tests | Applicant delivers package; payment on M2 acceptor OK |
| **M2** | **$1,500** | Named BTCPay Zcash maintainer **or** merchant completes [reviewers.html](https://zcash-invoice-preflight.vercel.app/reviewers.html) / [REVIEWER.md](REVIEWER.md); forum reply confirming handoff schema + fail codes useful (or feedback incorporated) | Named acceptor posts forum confirmation |

## M1 acceptance criteria

- [ ] `npm test` + doctor good/bad fixtures pass in GitHub Actions  
- [ ] Handoff export validates against `schemas/handoff-v1.json`  
- [ ] Demo + reviewer path linked from grant thread  
- [ ] Mock detection disclaimers present in UI, handoff JSON (`source.chainWatch: false`, `statusBtcpayHint` labeled mock)  

## M2 acceptance criteria

- [ ] Acceptor confirms 10-minute reviewer path on live demo  
- [ ] Written forum reply: useful companion / which fail codes to share  
- [ ] Feedback within scope merged or documented as out-of-scope  

## Explicit non-goals

- LWD/Zaino observatory  
- Full plugin merge in this grant  
- Real zkool/mempool detection  
- Multi-payment ZIP-321  
- Exchange deposit monitoring  

## Intended-user stories

- As a merchant, I only share PASS tickets.  
- As a plugin author, I can reuse fail codes / handoff fields without owning the POS UI.  
- As ZCG, I see MOCK detection cannot be mistaken for chain watch.  

## Privacy

Merchant desk runs client-side. Invoice fields and session history use browser local storage only in the demo — no server-side invoice database.

## Red-team → answers

| Objection | Answer |
|-----------|--------|
| No LOI | **Gate:** do not file until forum reply exists |
| Side tool like #343 | Library + companion demo; handoff contract for plugin — not a health dashboard |
| Already built — why fund? | M1/M2 pay for maintainer sign-off, CI, packaging, and acceptor-driven fixtures — not re-building the UI |
| Thin wrapper | WASM validation + fixture matrix + doctor + schema + 20 tests |
| Fake status | Mock lane labeled; handoff `statusBtcpayHint` says mock when `chainWatch: false` |
| $3k too small | Two milestones tied to named acceptor; no unfunded integration theater |

## Links

- Live demo: https://zcash-invoice-preflight.vercel.app/  
- Reviewer path: https://zcash-invoice-preflight.vercel.app/reviewers.html  
- Repo: https://github.com/panagot/ZCASH-INVOICE-preflight  
- Forum Grants thread with LOI reply _(required before filing)_  
- [REVIEWER.md](REVIEWER.md) · [EVIDENCE.md](EVIDENCE.md) · [BTCPAY_HANDOFF.md](BTCPAY_HANDOFF.md)  

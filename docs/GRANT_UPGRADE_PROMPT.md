# Grant upgrade prompt (paste into a fresh agent)

```text
You are upgrading btcpay-zec-helper to maximize Zcash Community Grants (ZCG) approval odds.

## Product
Path: btcpay-zec-helper/
Merchant Zcash invoice PREFLIGHT companion for BTCPay (not an indexer observatory).
ZIP-321 encode/decode, thermal POS UI, customer pay page, mock unpaid→detected→confirmed, CLI doctor, tests.

Prior ZCG decline to avoid repeating: Indexer Observatory #343 (side dashboard / LWD health).

## Design (do not regress)
Read PRODUCT.md + DESIGN.md.
Aesthetic: thermal ticket printer + POS chassis (Archivo Black + Space Mono, graphite-green chassis, paper ticket, hazard red FAIL / green PASS). No purple SaaS, no generic gold glow, no Inter.

## Required upgrades for grant-readiness
1. Replace heuristic address checks with a maintained library path (document fallback). Prefer official/wasm parser if license-ok; keep honesty if still heuristic.
2. Add BTCPay handoff contract: JSON schema for invoice export that a plugin could ingest; document field map to BTCPay invoice.
3. Optional “detection adapter” interface (stub): functions a real zkool/lightwalletd watcher would implement — still mock by default, but show the seam clearly in UI + docs.
4. Expand fixtures: multi-payment URI rejection (out of scope), testnet mismatch, empty amount, huge memo, label/message encoding.
5. Hardening: CSP-friendly (vendor QR locally or pure impl), no drive-by CDN if possible; pin versions.
6. Deployable demo (Vercel/static) + short screen recording script in docs/DEMO.md.
7. Forum LOI package: finalize docs/LOI.md with link to live demo; list 3 named people/roles to contact (BTCPay Zcash maintainer, one merchant, ZCG process).
8. Grant draft: budget $8–15k, 2 milestones, intended-user acceptance stories, explicit non-goals (no observatory, no full plugin rewrite).
9. Keep npm test green; add doctor CI workflow.
10. Red-team the proposal: list top 5 ZCG objections and how the repo answers each.

## Deliverables
- Code changes + tests
- Updated REVIEWER.md (10-min path still holds)
- docs/ZCG_APPLICATION_DRAFT.md
- docs/GRANT_UPGRADE_PROMPT.md can stay as this prompt

## Success bar
A BTCPay Zcash maintainer can say “I’d review a milestone” after 10 minutes; ZCG cannot dismiss it as vibe-coded UI or another monitoring dashboard.
```

## How to use
1. Ship current thermal UI + features locally  
2. Deploy demo URL  
3. Paste this prompt into a new agent session  
4. Only then open the ZCG GitHub issue + forum thread  

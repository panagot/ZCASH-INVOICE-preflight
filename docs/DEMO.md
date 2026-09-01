# Demo recording script (~60s)

**Live:** https://zcash-invoice-preflight.vercel.app/  
**Reviewer path:** https://zcash-invoice-preflight.vercel.app/reviewers.html  

## Local

```bash
cd ZCASH-INVOICE-preflight   # or local folder btcpay-zec-helper
npm install
npm test
npm run dev
```

Open http://localhost:5177

## Recording checklist

1. **0:00** — Site nav + banner: mock detection disclaimer  
2. **0:10** — Mast: Address engine · zaddr-wasm · Detection · mock  
3. **0:20** — Click **Good UA** → PASS ticket + QR  
4. **0:35** — Click **Bad t+memo** → FAIL on memo check  
5. **0:45** — **Export BTCPay handoff** → show schema id + `chainWatch: false`  
6. **0:55** — **Advance (mock)** → MOCK lane label stays visible  

Optional: open customer pay page — note it shows pay request only, not chain status.

## Screenshots (grant / review bundle)

Capture all pages locally:

```bash
npm run dev   # terminal 1
npm run screenshots   # terminal 2 → docs/screenshots/
```

Outputs 12 full-page PNGs + `manifest.json` (desk empty/pass/fail, why, how, checks, integration, reviewers, pay empty/demo, about, 404).

## Vercel deploy

Static root: `public/`  
Demo URL: https://zcash-invoice-preflight.vercel.app/

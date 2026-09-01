# Reviewer guide — ZEC Invoice Preflight

For BTCPay Zcash maintainers / ZCG technical reviewers.

**Live demo (no clone):** https://zcash-invoice-preflight.vercel.app/  
**On-site reviewer path:** https://zcash-invoice-preflight.vercel.app/reviewers.html  

## What this is

Merchant **invoice preflight** (thermal desk UI):

- ZIP-321 encode/decode (single-payment)
- Address validation via **`@elemental-zcash/zaddr_wasm_parser`** (fallback heuristic documented)
- Checklist, QR, customer pay page, session roll
- BTCPay handoff JSON (`schemas/handoff-v1.json`, id `btcpay-zec-helper.handoff/v1`)
- Status lane **mock** + `ZkoolDetectionAdapter` stub seam
- CLI doctor exit 0/1 + CI workflow

## What this is not

- Not a BTCPay Server plugin (yet)
- Not a replacement for BTCPay checkout / settlement
- Not a lightwalletd / Zaino observatory ([#343](https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/343) decline shape)

## 10-minute path (browser)

1. Open https://zcash-invoice-preflight.vercel.app/  
2. Confirm mast shows **Address engine · zaddr-wasm** and **Detection · mock**  
3. **Good UA** → PASS ticket  
4. **Bad t+memo** → FAIL  
5. **Export BTCPay handoff** → `schema: btcpay-zec-helper.handoff/v1`, `source.chainWatch: false`  
6. **Advance (mock)** → lane still labeled MOCK  

## 10-minute path (CLI)

```bash
git clone https://github.com/panagot/ZCASH-INVOICE-preflight.git
cd ZCASH-INVOICE-preflight
npm ci
npm run vendor
npm test
node bin/doctor.js --file fixtures/good-ua.json
node bin/doctor.js --file fixtures/bad-transparent-memo.json
npm run dev
```

## Acceptance questions (LOI)

1. Is compose-time preflight + handoff JSON a useful companion to the plugin?  
2. Which handoff fields / fail codes should the plugin enforce at invoice create?  
3. Any ZIP-321 fixtures to add before packaging?

Future milestone (out of scope for $3k ask): wire `ZkoolDetectionAdapter` to your preferred backend — only if you want that as a separate grant.

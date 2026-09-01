# LOI outreach

**Demo:** https://zcash-invoice-preflight.vercel.app/ · **Reviewer path:** https://zcash-invoice-preflight.vercel.app/reviewers.html  
**GitHub:** https://github.com/panagot/ZCASH-INVOICE-preflight  
**Handoff schema:** `btcpay-zec-helper.handoff/v1` (stable id) · **npm package:** `zcash-invoice-preflight`

## Who to contact

1. **BTCPay Zcash maintainer / plugin author** ([#269](https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/269) / [#395](https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/395) lane). Ask: would you review a milestone that packages this preflight as a companion?
2. **One real merchant** using BTCPay + ZEC. Ask: would you run preflight before sharing a QR with a customer?
3. **ZCG process** — post the GitHub issue link in [forum Grants category](https://forum.zcashcommunity.com/c/grants/33) after LOI reply.

## Message draft

Hi — I built **ZEC Invoice Preflight** ([repo](https://github.com/panagot/ZCASH-INVOICE-preflight)): compose-time ZIP-321 validation for Zcash invoices.

- Hard-fail on memo+transparent, network mismatch, bad amounts  
- Addresses validated via `@elemental-zcash/zaddr_wasm_parser`  
- BTCPay handoff JSON (`btcpay-zec-helper.handoff/v1`)  
- Mock detection seam only — no fake chain watch  

**Demo:** https://zcash-invoice-preflight.vercel.app/  
**10-min review:** https://zcash-invoice-preflight.vercel.app/reviewers.html  

This is a **companion** to BTCPay Zcash work — not a payment processor and not an indexer observatory (different from declined #343).

If useful, would you:

1. Spend ~10 minutes on the reviewer checklist, and  
2. Reply on the forum that you’d review a $3k milestone if we package this as a BTCPay-adjacent library?

Happy to reshape deliverables around what you’d actually merge or link.

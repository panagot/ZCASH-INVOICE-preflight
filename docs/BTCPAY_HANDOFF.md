# BTCPay handoff contract

Schema: [`schemas/handoff-v1.json`](../schemas/handoff-v1.json)  
Code: `toBtcpayHandoff(invoice)` · UI: **Export BTCPay handoff**

**Naming:** npm package `zcash-invoice-preflight`; schema id `btcpay-zec-helper.handoff/v1` (stable contract namespace).

## Ownership (critical)

| Concern | Owner |
|---------|--------|
| Compose-time fail (t+memo, amount, network) | **ZEC Invoice Preflight** (`zcash-invoice-preflight`) |
| Invoice create / settle / detect payment | **BTCPay Zcash plugin + zkool** |

`btcpayInvoiceId` is `null` until the plugin creates a real invoice and passes it in.

## Useful to a maintainer

- `preflight.checks[]` fail codes (same as CLI doctor)
- `paymentRequestUri` ZIP-321 string
- Explicit `disclaimer` + `ownership` fields (no fake settlement)

## Mock status honesty

When `source.chainWatch === false` (demo default):

- `statusLocal` reflects the mock desk lane only  
- `statusBtcpayHint` is prefixed **Mock only — … (not on-chain)**  
- Do **not** treat handoff export as evidence of settlement  

## Not useful / do not fund here

- Parallel POS as a second checkout
- Mock unpaid→confirmed as “detection work”
- `statusBtcpayHint` without reading `source.chainWatch`

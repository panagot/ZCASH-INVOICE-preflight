# Package exports (for BTCPay companion import)

**npm package:** `zcash-invoice-preflight`  
**Handoff schema id:** `btcpay-zec-helper.handoff/v1`

```js
import { preflightInvoice } from "zcash-invoice-preflight/preflight"
import { encodePaymentUri } from "zcash-invoice-preflight/zip321"
import { ensureAddressEngine } from "zcash-invoice-preflight/address"
import { toBtcpayHandoff } from "zcash-invoice-preflight/handoff"
```

Requires `await ensureAddressEngine()` before preflight in Node so zaddr-wasm is loaded.

Not exported (desk-internal): `invoice.js`, `validate.js`. Plugin authors should use `preflight` + `handoff` only.

The thermal POS UI is the **demo**. The grant-relevant surface is these modules + fixtures + doctor.

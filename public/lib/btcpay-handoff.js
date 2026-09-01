/**
 * Map internal invoice → BTCPay-oriented handoff payload (plugin-ingestible draft).
 * See docs/BTCPAY_HANDOFF.md
 *
 * Honesty: this does NOT create a BTCPay invoice. Optional btcpayInvoiceId must be
 * supplied by the plugin after it creates one.
 */

export function toBtcpayHandoff(invoice, opts = {}) {
  const statusMap = {
    unpaid: "New",
    detected: "Processing",
    confirmed: "Settled",
  }

  const chainWatch = Boolean(invoice.meta?.chainWatch)
  const statusHint = statusMap[invoice.status] || "New"

  return {
    schema: "btcpay-zec-helper.handoff/v1",
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Compose-time preflight only. Does not settle payments. BTCPay/plugin owns invoice lifecycle.",
    source: {
      tool: "zcash-invoice-preflight",
      prototype: true,
      chainWatch: Boolean(invoice.meta?.chainWatch),
    },
    ownership: {
      composeTimePreflight: "zcash-invoice-preflight",
      settlementAndDetection: "btcpay-zcash-plugin / zkool (not this tool)",
    },
    invoice: {
      helperId: invoice.id,
      btcpayInvoiceId: opts.btcpayInvoiceId || invoice.btcpayInvoiceId || null,
      orderId: invoice.orderId,
      createdAt: invoice.createdAt,
      network: invoice.network,
      currency: "ZEC",
      amount: invoice.amount,
      fiatNote: invoice.fiatNote || null,
      address: invoice.address,
      memo: invoice.memo || null,
      label: invoice.label || null,
      message: invoice.message || null,
      paymentRequestUri: invoice.uri,
      statusLocal: invoice.status,
      statusBtcpayHint: chainWatch ? statusHint : `Mock only — ${statusHint} (not on-chain)`,
    },
    preflight: invoice.preflight,
  }
}

import { preflightInvoice } from "./preflight.js"
import { getDetectionAdapter } from "./detection.js"
import { getAddressEngineInfo } from "./address.js"
import { assertZcashUri, assertShareToken } from "./validate.js"

export function createInvoiceId() {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return `inv_${t}_${r}`
}

/**
 * Build a merchant invoice record suitable for export / share links.
 */
export function buildInvoice(input) {
  const network = input.network || "mainnet"
  const report = preflightInvoice({ ...input, network })
  const id = input.id || createInvoiceId()
  const createdAt = input.createdAt || new Date().toISOString()

  return {
    id,
    createdAt,
    network,
    orderId: input.orderId || null,
    fiatNote: input.fiatNote || null,
    status: input.status || "unpaid",
    statusLog: input.statusLog || [
      { status: "unpaid", at: createdAt, note: "Invoice created (local prototype)" },
    ],
    address: String(input.address || "").trim(),
    amount: report.payment?.amount || null,
    memo: input.memo || "",
    label: input.label || "",
    message: input.message || "",
    uri: report.uri,
    preflight: {
      ok: report.ok,
      checks: report.checks,
    },
    meta: {
      prototype: true,
      chainWatch: Boolean(getDetectionAdapter().chainWatch),
      detectionAdapter: getDetectionAdapter().name,
      addressEngine: getAddressEngineInfo().engine,
      btcpayPlugin: false,
    },
  }
}

export function advanceStatus(invoice, next) {
  const order = ["unpaid", "detected", "confirmed"]
  const cur = order.indexOf(invoice.status)
  const nxt = order.indexOf(next)
  if (nxt < 0 || nxt !== cur + 1) {
    throw new Error(`Cannot move status ${invoice.status} → ${next}`)
  }
  const at = new Date().toISOString()
  return {
    ...invoice,
    status: next,
    statusLog: [
      ...invoice.statusLog,
      {
        status: next,
        at,
        note:
          next === "detected"
            ? "Mock: payment seen (no real mempool)"
            : "Mock: confirmations reached (no real chain)",
      },
    ],
  }
}

export function encodeSharePayload(invoice) {
  const slim = {
    id: invoice.id,
    createdAt: invoice.createdAt,
    network: invoice.network,
    orderId: invoice.orderId,
    fiatNote: invoice.fiatNote || null,
    address: invoice.address,
    amount: invoice.amount,
    memo: invoice.memo,
    label: invoice.label,
    message: invoice.message,
    uri: invoice.uri,
    status: invoice.status,
    preflight: invoice.preflight
      ? { ok: Boolean(invoice.preflight.ok), checks: invoice.preflight.checks || [] }
      : undefined,
  }
  const json = JSON.stringify(slim)
  const bytes =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(json)
      : Buffer.from(json, "utf8")
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 =
    typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function decodeSharePayload(token) {
  assertShareToken(token)
  const s = String(token)
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)
  let json
  if (typeof atob === "function") {
    json = atob(padded)
  } else {
    json = Buffer.from(padded, "base64").toString("utf8")
  }
  const data = JSON.parse(json)
  if (data.uri) data.uri = assertZcashUri(data.uri)
  return data
}

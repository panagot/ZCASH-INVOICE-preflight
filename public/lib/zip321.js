/**
 * ZIP-321 payment URI encode/decode (single-payment subset).
 * Spec: https://zips.z.cash/zip-0321
 *
 * Supports: zcash:<addr>?amount=&memo=&label=&message=
 * Memo = base64url without '=' padding; invalid if memo used with transparent addr.
 */

import { classifyAddress } from "./address.js"

const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d{1,8})?$/

export function bytesToBase64Url(bytes) {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function base64UrlToBytes(str) {
  const s = String(str || "")
  if (/[+/=]/.test(s)) {
    throw new Error("memo must be base64url without +, /, or = padding")
  }
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)
  if (typeof atob === "function") {
    const bin = atob(padded)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  return new Uint8Array(Buffer.from(padded, "base64"))
}

export function encodeMemo(text) {
  const raw = String(text ?? "")
  const bytes =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(raw)
      : Buffer.from(raw, "utf8")
  if (bytes.length > 512) {
    throw new Error(`memo exceeds 512 bytes (${bytes.length})`)
  }
  return bytesToBase64Url(bytes)
}

export function decodeMemo(param) {
  const bytes = base64UrlToBytes(param)
  if (bytes.length > 512) {
    throw new Error(`decoded memo exceeds 512 bytes (${bytes.length})`)
  }
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes)
  }
  return Buffer.from(bytes).toString("utf8")
}

export function formatAmount(amount) {
  const n = typeof amount === "number" ? amount : Number(String(amount).trim())
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("amount must be a positive number")
  }
  // Avoid scientific notation; trim trailing zeros but keep ZIP-legal form
  let s = n.toFixed(8).replace(/\.?0+$/, "")
  if (s.includes(".")) {
    const [a, b] = s.split(".")
    s = `${a}.${b.slice(0, 8)}`
  }
  if (!AMOUNT_RE.test(s)) {
    throw new Error(`amount not ZIP-321 safe: ${s}`)
  }
  return s
}

function encodeQChar(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+")
}

function decodeQChar(value) {
  return decodeURIComponent(String(value).replace(/\+/g, "%20"))
}

/**
 * @param {{ address: string, amount: string|number, memo?: string, label?: string, message?: string }} payment
 */
export function encodePaymentUri(payment) {
  const address = String(payment.address || "").trim()
  const cls = classifyAddress(address)
  if (!cls.ok) {
    throw new Error(cls.detail || "Invalid Zcash address")
  }

  const amount = formatAmount(payment.amount)
  const parts = [`amount=${amount}`]

  if (payment.memo != null && String(payment.memo).length > 0) {
    if (!cls.allowsMemo) {
      throw new Error("ZIP-321: memo is invalid with a transparent address")
    }
    parts.push(`memo=${encodeMemo(payment.memo)}`)
  }
  if (payment.label != null && String(payment.label).length > 0) {
    parts.push(`label=${encodeQChar(payment.label)}`)
  }
  if (payment.message != null && String(payment.message).length > 0) {
    parts.push(`message=${encodeQChar(payment.message)}`)
  }

  return `zcash:${address}?${parts.join("&")}`
}

/**
 * Parse a single-payment ZIP-321 URI.
 * @returns {{ address: string, amount: string|null, memo: string|null, label: string|null, message: string|null, raw: string }}
 */
export function decodePaymentUri(uri) {
  const raw = String(uri || "").trim()
  if (!raw.toLowerCase().startsWith("zcash:")) {
    throw new Error("URI must start with zcash:")
  }

  const body = raw.slice("zcash:".length)
  let address = ""
  let query = ""

  if (body.startsWith("?")) {
    query = body.slice(1)
  } else {
    const q = body.indexOf("?")
    if (q === -1) {
      address = body
    } else {
      address = body.slice(0, q)
      query = body.slice(q + 1)
    }
  }

  const params = new URLSearchParams(query)
  for (const key of params.keys()) {
    if (/\.\d+$/.test(key) || key === "address.1" || key.startsWith("amount.")) {
      throw new Error("multi-payment ZIP-321 URIs are out of scope for this helper")
    }
  }
  if (params.has("address")) {
    address = params.get("address") || ""
  }
  if (!address) {
    throw new Error("URI missing address")
  }

  const cls = classifyAddress(address)
  const amount = params.get("amount")
  if (amount != null && amount !== "" && !AMOUNT_RE.test(amount)) {
    throw new Error(`invalid amount: ${amount}`)
  }

  let memo = null
  if (params.has("memo")) {
    if (!cls.allowsMemo) {
      throw new Error("ZIP-321: memo present but address does not allow memos")
    }
    memo = decodeMemo(params.get("memo"))
  }

  return {
    address,
    amount: amount || null,
    memo,
    label: params.has("label") ? decodeQChar(params.get("label")) : null,
    message: params.has("message") ? decodeQChar(params.get("message")) : null,
    classification: cls,
    raw,
  }
}

export function roundTripOk(payment) {
  const uri = encodePaymentUri(payment)
  const parsed = decodePaymentUri(uri)
  if (parsed.address !== String(payment.address).trim()) return false
  if (formatAmount(parsed.amount) !== formatAmount(payment.amount)) return false
  if ((payment.memo || "") !== (parsed.memo || "")) return false
  return true
}

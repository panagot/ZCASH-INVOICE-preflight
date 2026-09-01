import { classifyAddress, getAddressEngineInfo } from "./address.js"
import { decodePaymentUri, encodePaymentUri, formatAmount } from "./zip321.js"

/**
 * Merchant preflight: structured checks a reviewer / BTCPay plugin can mirror.
 * @returns {{ ok: boolean, checks: Array<{ code: string, level: 'ok'|'warn'|'bad', message: string }>, uri?: string, payment?: object }}
 */
export function preflightInvoice(input) {
  const checks = []
  const address = String(input.address || "").trim()
  const memo = input.memo != null ? String(input.memo) : ""
  const label = input.label != null ? String(input.label) : ""
  const message = input.message != null ? String(input.message) : ""
  const networkExpected = input.network || "mainnet"

  const cls = classifyAddress(address)
  if (!cls.ok) {
    checks.push({
      code: "address",
      level: cls.kind === "unknown" ? "warn" : "bad",
      message: cls.detail,
    })
  } else {
    checks.push({
      code: "address",
      level: "ok",
      message: cls.detail,
    })
  }

  if (cls.ok && networkExpected !== "any" && cls.network !== "unknown" && cls.network !== networkExpected) {
    checks.push({
      code: "network",
      level: "bad",
      message: `Address network is ${cls.network}, expected ${networkExpected}`,
    })
  } else if (cls.ok) {
    checks.push({
      code: "network",
      level: "ok",
      message: `Network · ${cls.network}`,
    })
  }

  let amountStr = null
  try {
    amountStr = formatAmount(input.amount)
    checks.push({
      code: "amount",
      level: "ok",
      message: `Amount · ${amountStr} ZEC`,
    })
  } catch (err) {
    checks.push({
      code: "amount",
      level: "bad",
      message: err.message || "Invalid amount",
    })
  }

  if (memo) {
    if (!cls.allowsMemo) {
      checks.push({
        code: "memo",
        level: "bad",
        message: "Memo set but address cannot carry a shielded memo (transparent)",
      })
    } else {
      const bytes =
        typeof TextEncoder !== "undefined"
          ? new TextEncoder().encode(memo).length
          : Buffer.byteLength(memo, "utf8")
      if (bytes > 512) {
        checks.push({
          code: "memo",
          level: "bad",
          message: `Memo too long (${bytes} bytes; max 512)`,
        })
      } else {
        checks.push({
          code: "memo",
          level: "ok",
          message: `Memo · ${bytes} bytes`,
        })
      }
    }
  } else {
    checks.push({
      code: "memo",
      level: "warn",
      message: "No memo — fine for simple checkout; add order id for support",
    })
  }

  if (cls.kind === "transparent" && cls.ok) {
    checks.push({
      code: "privacy",
      level: "warn",
      message: "Transparent receive · amount and linkability are public on-chain",
    })
  } else if (cls.ok) {
    checks.push({
      code: "privacy",
      level: "ok",
      message: "Shielded-capable receive address",
    })
  }

  let uri = null
  let payment = null
  if (amountStr && cls.ok) {
    try {
      payment = {
        address,
        amount: amountStr,
        memo: memo || undefined,
        label: label || undefined,
        message: message || undefined,
      }
      uri = encodePaymentUri(payment)
      const parsed = decodePaymentUri(uri)
      checks.push({
        code: "uri_roundtrip",
        level: "ok",
        message: "ZIP-321 URI encodes and parses back",
      })
      if (parsed.amount !== amountStr) {
        checks.push({
          code: "uri_amount",
          level: "bad",
          message: "Parsed amount mismatch after encode",
        })
      }
    } catch (err) {
      checks.push({
        code: "uri",
        level: "bad",
        message: err.message || "Failed to build URI",
      })
    }
  }

  if (input.parseUri) {
    try {
      const parsed = decodePaymentUri(input.parseUri)
      checks.push({
        code: "parse",
        level: "ok",
        message: "Provided URI parses under ZIP-321 subset",
      })
      if (!uri) {
        uri = parsed.raw
        payment = {
          address: parsed.address,
          amount: parsed.amount,
          memo: parsed.memo || undefined,
          label: parsed.label || undefined,
          message: parsed.message || undefined,
        }
      }
    } catch (err) {
      checks.push({
        code: "parse",
        level: "bad",
        message: err.message || "URI parse failed",
      })
    }
  }

  const ok = checks.every((c) => c.level !== "bad")
  const engine = getAddressEngineInfo()
  checks.unshift({
    code: "engine",
    level: engine.engine === "zaddr-wasm" ? "ok" : "warn",
    message:
      engine.engine === "zaddr-wasm"
        ? "Address engine · zaddr-wasm (zcash_address)"
        : `Address engine · ${engine.engine}${engine.error ? ` (${engine.error})` : ""} — heuristic fallback`,
  })
  return { ok, checks, uri, payment, classification: cls, engine }
}

export function preflightUri(uri, opts = {}) {
  try {
    const parsed = decodePaymentUri(uri)
    return preflightInvoice({
      address: parsed.address,
      amount: parsed.amount,
      memo: parsed.memo || "",
      label: parsed.label || "",
      message: parsed.message || "",
      network: opts.network || "any",
      parseUri: uri,
    })
  } catch (err) {
    return {
      ok: false,
      checks: [{ code: "parse", level: "bad", message: err.message || "Invalid URI" }],
      uri: null,
      payment: null,
    }
  }
}

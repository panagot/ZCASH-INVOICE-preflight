const ZCASH_URI_RE = /^zcash:/i
const SHARE_TOKEN_MAX = 8192

export function assertZcashUri(uri) {
  const s = String(uri || "").trim()
  if (!ZCASH_URI_RE.test(s)) {
    throw new Error("Payment URI must start with zcash:")
  }
  if (/^javascript:/i.test(s) || /^data:/i.test(s)) {
    throw new Error("Invalid payment URI scheme")
  }
  return s
}

export function isZcashUri(uri) {
  try {
    assertZcashUri(uri)
    return true
  } catch {
    return false
  }
}

export function assertShareToken(token) {
  const s = String(token || "")
  if (!s || s.length > SHARE_TOKEN_MAX) {
    throw new Error("Share token missing or too large")
  }
  return s
}

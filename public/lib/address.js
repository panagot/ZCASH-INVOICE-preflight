/**
 * Address classification with preferred maintained library path:
 * @elemental-zcash/zaddr_wasm_parser (Rust zcash_address → WASM, MIT/Apache-2.0)
 *
 * Node: imports from package or ../vendor/zaddr
 * Browser: imports from /vendor/zaddr/zaddr_wasm_parser.js
 * Fallback: heuristic (documented; shows engine on ticket)
 */

import { classifyAddressHeuristic } from "./address-heuristic.js"

let wasmApi = null
let wasmLoadPromise = null
let wasmError = null

function mapType(t) {
  if (t === "p2pkh" || t === "p2sh") return "transparent"
  if (t === "sapling") return "sapling"
  if (t === "unified") return "unified"
  if (t === "tex") return "tex"
  return "unknown"
}

function networkFromAddress(address, kind) {
  const a = address.toLowerCase()
  if (a.startsWith("utest1") || a.startsWith("ztestsapling1") || a.startsWith("tm")) return "testnet"
  if (kind === "transparent" && a.startsWith("t")) return "mainnet"
  if (a.startsWith("u1") || a.startsWith("zs1")) return "mainnet"
  return "unknown"
}

async function loadWasm() {
  if (wasmApi) return wasmApi
  if (wasmLoadPromise) return wasmLoadPromise

  wasmLoadPromise = (async () => {
    try {
      const isNode = typeof process !== "undefined" && process.versions?.node
      if (isNode) {
        const mod = await import("@elemental-zcash/zaddr_wasm_parser")
        wasmApi = {
          isValid: mod.is_valid_zcash_address,
          getType: mod.get_zcash_address_type,
          getReceivers: mod.get_address_receivers,
          normalize: mod.normalize_zcash_address,
        }
      } else {
        const { loadZaddrBrowserApi } = await import("./zaddr-browser.js")
        wasmApi = await loadZaddrBrowserApi()
      }
    } catch (err) {
      wasmError = err?.message || String(err)
      wasmApi = null
    }
    return wasmApi
  })()

  return wasmLoadPromise
}

/**
 * Sync path used by ZIP-321 encode (may be heuristic until ensureAddressEngine()).
 */
export function classifyAddress(raw) {
  if (wasmApi) return classifyWithWasm(raw)
  return classifyAddressHeuristic(raw)
}

export async function ensureAddressEngine() {
  await loadWasm()
  return {
    engine: wasmApi ? "zaddr-wasm" : "heuristic",
    error: wasmError,
  }
}

export function getAddressEngineInfo() {
  let engine = "pending"
  if (wasmApi) engine = "zaddr-wasm"
  else if (wasmError) engine = "heuristic"
  else if (wasmLoadPromise) engine = "pending"
  return {
    engine,
    error: wasmError,
    library: "@elemental-zcash/zaddr_wasm_parser (zcash_address)",
  }
}

function classifyWithWasm(raw) {
  const address = String(raw || "").trim()
  if (!address) {
    return {
      ok: false,
      kind: "missing",
      network: "unknown",
      allowsMemo: false,
      detail: "No address provided",
      engine: "zaddr-wasm",
    }
  }

  let valid = false
  try {
    valid = Boolean(wasmApi.isValid(address))
  } catch {
    valid = false
  }

  if (!valid) {
    return {
      ok: false,
      kind: "invalid",
      network: "unknown",
      allowsMemo: false,
      detail: "Invalid Zcash address (zaddr-wasm / zcash_address)",
      engine: "zaddr-wasm",
    }
  }

  let type = "unknown"
  try {
    type = wasmApi.getType(address)
  } catch {
    type = "unknown"
  }

  const kind = mapType(type)
  const allowsMemo = kind === "sapling" || kind === "unified"
  const network = networkFromAddress(address, kind)
  let receivers = null
  try {
    receivers = wasmApi.getReceivers(address)
  } catch {
    receivers = null
  }

  return {
    ok: true,
    kind,
    network,
    allowsMemo,
    detail: `${kind} · ${network} · validated by zaddr-wasm`,
    engine: "zaddr-wasm",
    wasmType: type,
    receivers,
  }
}

/** Async classify after ensuring engine loaded */
export async function classifyAddressAsync(raw) {
  await loadWasm()
  return classifyAddress(raw)
}

/**
 * Heuristic shape classification (fallback when WASM parser unavailable).
 * Prefer classifyAddress() from address.js which tries zaddr-wasm first.
 */

export function classifyAddressHeuristic(raw) {
  const address = String(raw || "").trim()
  if (!address) {
    return {
      ok: false,
      kind: "missing",
      network: "unknown",
      allowsMemo: false,
      detail: "No address provided",
      engine: "heuristic",
    }
  }

  if (/^utest1[a-z0-9]+$/i.test(address)) {
    return ok("unified", "testnet", true, "Unified Address (testnet) [heuristic]")
  }
  if (/^u1[a-z0-9]+$/i.test(address)) {
    return ok("unified", "mainnet", true, "Unified Address (mainnet) [heuristic]")
  }
  if (/^ztestsapling1[a-z0-9]+$/i.test(address)) {
    return ok("sapling", "testnet", true, "Sapling address (testnet) [heuristic]")
  }
  if (/^zs1[a-z0-9]+$/i.test(address)) {
    return ok("sapling", "mainnet", true, "Sapling address (mainnet) [heuristic]")
  }
  if (/^tm[a-zA-Z0-9]{33}$/.test(address)) {
    return ok("transparent", "testnet", false, "Transparent address (testnet) [heuristic]")
  }
  if (/^t[13][a-zA-Z0-9]{33}$/.test(address)) {
    return ok("transparent", "mainnet", false, "Transparent address (mainnet) [heuristic]")
  }

  if (address.length >= 20 && /^[a-z0-9]+$/i.test(address)) {
    return {
      ok: false,
      kind: "unknown",
      network: "unknown",
      allowsMemo: false,
      detail: "Unrecognized address shape [heuristic]",
      engine: "heuristic",
    }
  }

  return {
    ok: false,
    kind: "invalid",
    network: "unknown",
    allowsMemo: false,
    detail: "Does not look like a Zcash address [heuristic]",
    engine: "heuristic",
  }
}

function ok(kind, network, allowsMemo, detail) {
  return { ok: true, kind, network, allowsMemo, detail, engine: "heuristic" }
}

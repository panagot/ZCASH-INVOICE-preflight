import { decodeSharePayload, encodeSharePayload, buildInvoice } from "./lib/invoice.js"
import { preflightInvoice } from "./lib/preflight.js"
import { assertZcashUri } from "./lib/validate.js"
import { ensureAddressEngine } from "./lib/address.js"
import { showToast } from "./lib/dom.js"
import { renderCheckSummary } from "./lib/doc-viz.js"

const $ = (id) => document.getElementById(id)

const DEMO_INPUT = {
  network: "mainnet",
  orderId: "demo-1042",
  address:
    "u1mq04mn6p50lvt0p4wdslweg8tffm3d0vn6tnyz4ry7dgrh35tw2ykzf7luh77qgsgl8wcl0a2fylvk3en5csd9nrhwdzvf8tdey9vfmuk98vj6de8msslwrh4rs06q8upcnsj5pqzq7vcestnlr08gjycj72z0pdpg02y2c2a2mcutardqpflq4p00udr7tktmyp99crfcfg6e2s30d",
  amount: "0.042",
  memo: "Order #1042",
  label: "Demo Cafe",
  message: "Table 4",
  fiatNote: "~12 USD (manual)",
}

function showEmpty(msg) {
  $("pay-empty").classList.remove("hidden")
  $("pay-body").classList.add("hidden")
  const msgEl = $("pay-empty-msg")
  if (msgEl) {
    msgEl.innerHTML = msg || 'Build one on the <a href="/">merchant desk</a>.'
  }
}

async function drawQr(uri) {
  if (typeof QRCode === "undefined") throw new Error("QR library failed to load")
  await QRCode.toCanvas($("qr"), uri, {
    width: 200,
    margin: 1,
    color: { dark: "#141916", light: "#f7f8f4" },
  })
}

async function renderInvoice(inv) {
  $("pay-empty").classList.add("hidden")
  $("pay-body").classList.remove("hidden")
  $("pay-sub").textContent = inv.message || "Scan QR or open the payment URI in your Zcash wallet."
  $("fact-label").textContent = inv.label || "PAYMENT"
  $("fact-amount").textContent = inv.amount || "—"
  $("fact-order").textContent = inv.orderId || inv.id || "—"
  $("fact-network").textContent = (inv.network || "—").toUpperCase()
  $("fact-fiat").textContent = inv.fiatNote || "—"
  $("fact-message").textContent = inv.message || inv.memo || ""
  renderCheckSummary($("pay-check-viz"), inv.preflight?.checks || [])
  $("uri").value = inv.uri

  const wallet = $("wallet-link")
  wallet.href = inv.uri
  wallet.classList.remove("hidden")
  wallet.removeAttribute("aria-disabled")

  await drawQr(inv.uri)
}

function hydratePreflight(inv) {
  if (inv.preflight?.checks?.length) return inv
  const report = preflightInvoice({
    address: inv.address,
    amount: inv.amount,
    memo: inv.memo,
    label: inv.label,
    message: inv.message,
    network: inv.network || "mainnet",
  })
  return {
    ...inv,
    preflight: { ok: report.ok, checks: report.checks },
  }
}

async function main() {
  const hash = location.hash || ""
  if (!hash.startsWith("#i=")) {
    showEmpty()
    return
  }
  let inv
  try {
    await ensureAddressEngine()
    inv = decodeSharePayload(hash.slice(3))
    inv.uri = assertZcashUri(inv.uri)
    inv = hydratePreflight(inv)
  } catch {
    showEmpty("Share link is invalid or unsafe.")
    return
  }
  if (!inv.uri) {
    showEmpty("Share link has no payment URI.")
    return
  }

  await renderInvoice(inv)
}

async function loadDemoTicket() {
  try {
    await ensureAddressEngine()
    const inv = buildInvoice(DEMO_INPUT)
    if (!inv.uri || !inv.preflight?.ok) {
      showEmpty("Demo ticket could not be built.")
      return
    }
    location.hash = `i=${encodeSharePayload(inv)}`
    await renderInvoice(inv)
    showToast("Demo ticket loaded")
  } catch {
    showEmpty("Demo ticket could not be built.")
  }
}

function bindCopyOnce() {
  if (bindCopyOnce.done) return
  bindCopyOnce.done = true
  $("copy-uri").addEventListener("click", async () => {
    const uri = $("uri").value
    if (!uri) return
    try {
      await navigator.clipboard.writeText(uri)
      showToast("URI copied to clipboard")
    } catch {
      $("uri").select()
    }
  })
}

$("pay-demo")?.addEventListener("click", () => loadDemoTicket())

bindCopyOnce()
main().catch(() => showEmpty("Could not load payment ticket."))
window.addEventListener("hashchange", () => main().catch(() => showEmpty("Could not load payment ticket.")))

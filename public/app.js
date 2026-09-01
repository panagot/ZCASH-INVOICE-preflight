import { ensureAddressEngine, getAddressEngineInfo } from "./lib/address.js"
import { preflightUri } from "./lib/preflight.js"
import {
  advanceStatus,
  buildInvoice,
  decodeSharePayload,
  encodeSharePayload,
} from "./lib/invoice.js"
import { toBtcpayHandoff } from "./lib/btcpay-handoff.js"
import { getDetectionAdapter } from "./lib/detection.js"
import { escapeHtml, showDeskError, showToast } from "./lib/dom.js"
import { renderSessionStats } from "./lib/session-stats.js"

const $ = (id) => document.getElementById(id)
const HISTORY_KEY = "btcpay-zec-helper:roll"

const SAMPLE_UA =
  "u1mq04mn6p50lvt0p4wdslweg8tffm3d0vn6tnyz4ry7dgrh35tw2ykzf7luh77qgsgl8wcl0a2fylvk3en5csd9nrhwdzvf8tdey9vfmuk98vj6de8msslwrh4rs06q8upcnsj5pqzq7vcestnlr08gjycj72z0pdpg02y2c2a2mcutardqpflq4p00udr7tktmyp99crfcfg6e2s30d"
const SAMPLE_T = "t1XUKmDLFcRDxvf9A7tawmgePDN8NK6os35"

let invoice = null
let history = loadHistory()

const trackItems = [...document.querySelectorAll("#status-track li")]
const STATES = ["unpaid", "detected", "confirmed"]

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
  } catch {
    return []
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)))
}

function setMode(mode) {
  document.querySelectorAll(".mode-btn[data-mode]").forEach((btn) => {
    const active = btn.dataset.mode === mode
    btn.classList.toggle("active", active)
    btn.setAttribute("aria-pressed", active ? "true" : "false")
  })
  $("panel-build").classList.toggle("hidden", mode !== "build")
  $("panel-parse").classList.toggle("hidden", mode !== "parse")
}

function renderEngineLines() {
  const eng = getAddressEngineInfo()
  const line = $("engine-line")
  if (eng.engine === "zaddr-wasm") {
    line.textContent = "zaddr-wasm"
    line.className = "status-pill ok"
    line.title = "Address engine · zaddr-wasm (zcash_address)"
  } else if (eng.engine === "heuristic") {
    line.textContent = "heuristic"
    line.className = "status-pill warn"
    line.title = eng.error
      ? `Heuristic fallback · ${eng.error}`
      : "Heuristic fallback — WASM unavailable"
  } else {
    line.textContent = "loading…"
    line.className = "status-pill pending"
    line.removeAttribute("title")
  }
  const det = getDetectionAdapter()
  const adapter = $("adapter-line")
  adapter.textContent = `${det.name} · watch=${det.chainWatch}`
  adapter.className = "status-pill mock"
  adapter.title = "Detection adapter · mock only — not chain"
}

function renderChecklist(checks) {
  $("checklist").innerHTML = (checks || [])
    .map((c) => {
      const mark = c.level === "ok" ? "OK" : c.level === "warn" ? "WARN" : "FAIL"
      return `<li class="${escapeHtml(c.level)}"><span class="mark">${mark}</span><span>${escapeHtml(c.code)} · ${escapeHtml(c.message)}</span></li>`
    })
    .join("")
}

function renderHistory() {
  const list = $("history")
  list.replaceChildren()
  if (!history.length) {
    const li = document.createElement("li")
    const btn = document.createElement("button")
    btn.type = "button"
    btn.disabled = true
    btn.textContent = "empty"
    li.appendChild(btn)
    list.appendChild(li)
    renderSessionStats($("session-stats"), history)
    return
  }
  history.forEach((h, i) => {
    const li = document.createElement("li")
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = `${h.preflight?.ok ? "pass" : "fail"}${invoice?.id === h.id ? " active" : ""}`
    btn.dataset.idx = String(i)
    btn.innerHTML = `${h.preflight?.ok ? "PASS" : "FAIL"}<br>${escapeHtml(h.amount || "—")} ZEC<br>${escapeHtml(String(h.orderId || h.id).slice(0, 14))}`
    btn.addEventListener("click", () => showInvoice(history[i]))
    li.appendChild(btn)
    list.appendChild(li)
  })
  renderSessionStats($("session-stats"), history)
}

function renderStatus() {
  if (!invoice) {
    trackItems.forEach((li, i) => {
      li.classList.toggle("active", i === 0)
      li.classList.toggle("done", false)
    })
    $("status-next").disabled = true
    $("status-reset").disabled = true
    $("status-log").replaceChildren()
    return
  }
  const idx = STATES.indexOf(invoice.status)
  trackItems.forEach((li, i) => {
    li.classList.toggle("active", i === idx)
    li.classList.toggle("done", i < idx)
    if (i === idx) li.setAttribute("aria-current", "step")
    else li.removeAttribute("aria-current")
  })
  $("status-next").disabled = !invoice.uri || idx >= STATES.length - 1
  $("status-reset").disabled = !invoice.uri
  $("status-log").replaceChildren()
  for (const e of invoice.statusLog || []) {
    const li = document.createElement("li")
    const time = document.createElement("time")
    time.textContent = e.at
    const strong = document.createElement("strong")
    strong.textContent = e.status
    li.appendChild(time)
    li.appendChild(strong)
    li.append(` — ${e.note}`)
    $("status-log").appendChild(li)
  }
}

async function drawQr(uri) {
  if (typeof QRCode === "undefined") throw new Error("QR library failed to load")
  await QRCode.toCanvas($("qr"), uri, {
    width: 180,
    margin: 1,
    color: { dark: "#141916", light: "#f7f8f4" },
  })
}

function shareUrl() {
  if (!invoice?.uri) return ""
  return `${location.origin}/pay.html#i=${encodeSharePayload(invoice)}`
}

function pushHistory(inv) {
  history = [inv, ...history.filter((h) => h.id !== inv.id)].slice(0, 12)
  saveHistory()
  renderHistory()
}

function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function showInvoice(next) {
  invoice = next
  $("ticket-empty").classList.add("hidden")
  const ticket = $("ticket")
  ticket.classList.remove("hidden")

  const ok = Boolean(invoice.preflight?.ok && invoice.uri)
  ticket.classList.toggle("ticket-pass", ok)
  ticket.classList.toggle("ticket-fail", !ok)
  const verdict = $("verdict")
  verdict.textContent = ok ? "PASS" : "FAIL"
  verdict.className = `verdict ${ok ? "pass" : "fail"}`

  $("ticket-label").textContent = invoice.label || "MERCHANT TICKET"
  const engInfo = getAddressEngineInfo()
  if (engInfo.engine !== "pending") {
    invoice.meta = { ...invoice.meta, addressEngine: engInfo.engine }
  }
  const engine = invoice.meta?.addressEngine || engInfo.engine || "?"
  $("ticket-id").textContent = `${invoice.id} · engine=${engine} · detect=${invoice.meta?.detectionAdapter || "?"}`
  $("ticket-amount").textContent = invoice.amount ? `${invoice.amount}` : "—"
  $("ticket-fiat").textContent = invoice.fiatNote || "—"
  $("ticket-net").textContent = (invoice.network || "—").toUpperCase()
  $("ticket-order").textContent = invoice.orderId || "—"
  $("ticket-msg").textContent = invoice.message || invoice.memo || ""

  renderChecklist(invoice.preflight?.checks || [])
  renderStatus()
  renderHistory()
  renderEngineLines()

  if (!invoice.uri) {
    $("uri").value = ""
    const ctx = $("qr").getContext("2d")
    ctx.fillStyle = "#f7f8f4"
    ctx.fillRect(0, 0, $("qr").width, $("qr").height)
    return
  }

  $("uri").value = invoice.uri
  await drawQr(invoice.uri)
  try {
    sessionStorage.setItem("btcpay-zec-helper:last", JSON.stringify(invoice))
  } catch {
    /* ignore */
  }

  ticket.scrollIntoView({ behavior: "smooth", block: "nearest" })
}

function collectBuildInput() {
  return {
    network: $("network").value,
    orderId: $("orderId").value.trim() || null,
    address: $("address").value,
    amount: $("amount").value,
    memo: $("memo").value,
    label: $("label").value,
    message: $("message").value,
    fiatNote: $("fiat").value.trim() || null,
  }
}

$("invoice-form").addEventListener("submit", async (e) => {
  e.preventDefault()
  try {
    await ensureAddressEngine()
    const input = collectBuildInput()
    const built = buildInvoice(input)
    built.fiatNote = input.fiatNote
    pushHistory(built)
    await showInvoice(built)
  } catch (err) {
    showDeskError(err.message || "Failed to build invoice")
  }
})

$("parse-form").addEventListener("submit", async (e) => {
  e.preventDefault()
  try {
    await ensureAddressEngine()
    const report = preflightUri($("parse-uri").value, { network: "any" })
    const built = buildInvoice({
      network: report.classification?.network || "mainnet",
      address: report.payment?.address || "",
      amount: report.payment?.amount || "0",
      memo: report.payment?.memo || "",
      label: report.payment?.label || "",
      message: report.payment?.message || "",
    })
    built.preflight = { ok: report.ok, checks: report.checks }
    built.uri = report.uri
    if (report.payment) {
      built.address = report.payment.address
      built.amount = report.payment.amount
      built.memo = report.payment.memo || ""
    }
    pushHistory(built)
    await showInvoice(built)
  } catch (err) {
    showDeskError(err.message || "Failed to parse URI")
  }
})

$("load-sample").addEventListener("click", () => {
  setMode("build")
  $("network").value = "mainnet"
  $("orderId").value = "demo-1042"
  $("address").value = SAMPLE_UA
  $("amount").value = "0.042"
  $("fiat").value = "~12 USD (manual)"
  $("memo").value = "Order #1042"
  $("label").value = "Demo Cafe"
  $("message").value = "Table 4"
  $("invoice-form").requestSubmit()
})

$("load-bad").addEventListener("click", () => {
  setMode("build")
  $("network").value = "mainnet"
  $("orderId").value = "bad-memo"
  $("address").value = SAMPLE_T
  $("amount").value = "0.01"
  $("fiat").value = ""
  $("memo").value = "should-fail"
  $("label").value = ""
  $("message").value = ""
  $("invoice-form").requestSubmit()
})

document.querySelectorAll(".mode-btn[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode))
})

$("copy-uri").addEventListener("click", async () => {
  if (!$("uri").value) return
  try {
    await navigator.clipboard.writeText($("uri").value)
    showToast("URI copied to clipboard")
  } catch {
    $("uri").select()
  }
})

$("open-pay").addEventListener("click", () => {
  const url = shareUrl()
  if (url) window.open(url, "_blank", "noopener")
})

$("copy-share").addEventListener("click", async () => {
  const url = shareUrl()
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    showToast("Customer pay link copied")
  } catch {
    prompt("Share link", url)
  }
})

$("export-json").addEventListener("click", () => {
  if (!invoice) return
  downloadJson(`${invoice.id}.json`, invoice)
  showToast("Invoice JSON downloaded")
})

$("export-handoff").addEventListener("click", () => {
  if (!invoice) return
  downloadJson(`${invoice.id}.btcpay-handoff.json`, toBtcpayHandoff(invoice))
  showToast("BTCPay handoff JSON downloaded")
})

$("print-ticket").addEventListener("click", () => window.print())

$("status-next").addEventListener("click", async () => {
  if (!invoice?.uri) return
  const idx = STATES.indexOf(invoice.status)
  if (idx < 0 || idx >= STATES.length - 1) return
  invoice = advanceStatus(invoice, STATES[idx + 1])
  pushHistory(invoice)
  await showInvoice(invoice)
})

$("status-reset").addEventListener("click", async () => {
  if (!invoice?.uri) return
  invoice = {
    ...invoice,
    status: "unpaid",
    statusLog: [
      { status: "unpaid", at: new Date().toISOString(), note: "Status reset (local)" },
    ],
  }
  pushHistory(invoice)
  await showInvoice(invoice)
})

$("clear-history").addEventListener("click", () => {
  history = []
  saveHistory()
  renderHistory()
})

function runSample(kind) {
  if (kind === "bad") $("load-bad").click()
  else $("load-sample").click()
}

document.querySelectorAll("[data-sample]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault()
    runSample(el.dataset.sample)
  })
})

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return
  const active = document.activeElement
  if (active?.closest("#invoice-form")) {
    e.preventDefault()
    $("invoice-form").requestSubmit()
  } else if (active?.closest("#parse-form")) {
    e.preventDefault()
    $("parse-form").requestSubmit()
  }
})

renderHistory()
renderSessionStats($("session-stats"), history)
setMode("build")

ensureAddressEngine()
  .then(async () => {
    renderEngineLines()
    const sample = new URLSearchParams(location.search).get("sample")
    if (sample === "good" || sample === "bad") {
      runSample(sample === "bad" ? "bad" : "good")
      history.replaceState({}, "", location.pathname)
    } else {
      try {
        const raw = sessionStorage.getItem("btcpay-zec-helper:last")
        if (raw) await showInvoice(JSON.parse(raw))
      } catch {
        /* ignore */
      }
    }
  })
  .catch((err) => showDeskError(err.message || "Address engine failed to load"))

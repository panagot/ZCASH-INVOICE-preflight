/**
 * Static doc-page visualizations — illustrative, not live chain data.
 */

function barChart(title, rows, { caption = "" } = {}) {
  const peak = Math.max(...rows.map((r) => r.value), 1)
  return `
    <article class="doc-viz-panel">
      <h3>${title}</h3>
      ${caption ? `<p class="doc-viz-caption">${caption}</p>` : ""}
      <div class="doc-viz-bars">
        ${rows
          .map(({ label, value, cls = "" }) => {
            const pct = Math.max(8, Math.round((value / peak) * 100))
            return `<div class="doc-viz-row">
              <span class="doc-viz-label">${label}</span>
              <span class="doc-viz-track"><span class="doc-viz-fill ${cls}" style="width:${pct}%"></span></span>
              <span class="doc-viz-val">${value}</span>
            </div>`
          })
          .join("")}
      </div>
    </article>
  `
}

function splitBar(title, left, right, caption = "") {
  const total = left.value + right.value
  const lp = total ? Math.round((left.value / total) * 100) : 50
  return `
    <article class="doc-viz-panel">
      <h3>${title}</h3>
      ${caption ? `<p class="doc-viz-caption">${caption}</p>` : ""}
      <div class="doc-split-bar" aria-label="${left.label} ${lp} percent, ${right.label} ${100 - lp} percent">
        <span class="doc-split-fill pass" style="width:${lp}%">${left.label}</span>
        <span class="doc-split-fill neutral" style="width:${100 - lp}%">${right.label}</span>
      </div>
      <div class="doc-split-legend">
        <span>${left.label} · ${left.value}</span>
        <span>${right.label} · ${right.value}</span>
      </div>
    </article>
  `
}

function stepTrack(steps, current = 0) {
  return `
    <article class="doc-viz-panel">
      <h3>Reviewer steps</h3>
      <ol class="doc-step-track">
        ${steps
          .map(
            (s, i) =>
              `<li class="${i < current ? "done" : i === current ? "active" : ""}"><b>${String(i + 1).padStart(2, "0")}</b><span>${s}</span></li>`
          )
          .join("")}
      </ol>
    </article>
  `
}

const VIZ = {
  why: () => `
    <div class="doc-viz-grid">
      ${barChart(
        "Failure severity (illustrative)",
        [
          { label: "t+memo", value: 5, cls: "fail" },
          { label: "network", value: 4, cls: "fail" },
          { label: "amount", value: 3, cls: "fail" },
          { label: "long memo", value: 2, cls: "fail" },
          { label: "multi-pay", value: 1, cls: "warn" },
        ],
        { caption: "Common merchant mistakes caught at compose-time — not live chain stats." }
      )}
      ${splitBar(
        "When errors are caught",
        { label: "Compose", value: 85 },
        { label: "Pay-time", value: 15 },
        "Preflight shifts validation earlier in the flow."
      )}
    </div>
  `,
  how: () => `
    <div class="doc-viz-grid">
      ${stepTrack(["Compose / parse", "Run preflight", "Share ticket", "Export handoff", "Mock lane"], 0)}
      ${barChart(
        "Deliverables",
        [
          { label: "checks", value: 9, cls: "pass" },
          { label: "fixtures", value: 7, cls: "pass" },
          { label: "CLI doctor", value: 1, cls: "kind" },
          { label: "handoff v1", value: 1, cls: "kind" },
        ],
        { caption: "Shared library surface for BTCPay companion integration." }
      )}
    </div>
  `,
  checks: () => `
    <div class="doc-viz-grid">
      ${barChart(
        "Check codes by level",
        [
          { label: "bad", value: 6, cls: "fail" },
          { label: "warn", value: 2, cls: "warn" },
          { label: "ok", value: 1, cls: "pass" },
        ],
        { caption: "Stable codes mirrored in CLI doctor and handoff JSON." }
      )}
      ${splitBar(
        "Fixture corpus",
        { label: "PASS", value: 3 },
        { label: "FAIL", value: 4 },
        "7 JSON fixtures in repo — run via doctor or desk samples."
      )}
    </div>
  `,
  integration: () => `
    <div class="doc-viz-grid">
      ${splitBar(
        "Ownership boundary",
        { label: "Preflight tool", value: 55 },
        { label: "BTCPay plugin", value: 45 },
        "Compose-time validation vs settlement & detection."
      )}
      ${barChart(
        "Handoff v1 fields",
        [
          { label: "checks[]", value: 9, cls: "pass" },
          { label: "invoice", value: 8, cls: "kind" },
          { label: "ownership", value: 4, cls: "kind" },
          { label: "disclaimer", value: 2, cls: "warn" },
        ],
        { caption: "Schema id: btcpay-zec-helper.handoff/v1" }
      )}
    </div>
  `,
  reviewers: () => `
    <div class="doc-viz-grid">
      ${stepTrack(
        ["Engine check", "Good UA PASS", "Bad t+memo FAIL", "Export handoff", "Advance mock"],
        0
      )}
      ${barChart(
        "10-minute path",
        [
          { label: "browser", value: 5, cls: "pass" },
          { label: "CLI optional", value: 2, cls: "kind" },
          { label: "LOI questions", value: 3, cls: "warn" },
        ],
        { caption: "All browser steps run on the live merchant desk." }
      )}
    </div>
  `,
  about: () => `
    <div class="doc-viz-grid">
      ${splitBar("Scope", { label: "In scope", value: 4 }, { label: "Non-goals", value: 4 })}
      ${barChart(
        "Milestone focus",
        [
          { label: "preflight lib", value: 4, cls: "pass" },
          { label: "desk demo", value: 3, cls: "kind" },
          { label: "handoff", value: 2, cls: "kind" },
          { label: "detection", value: 0, cls: "fail" },
        ],
        { caption: "Detection stays mock — real chain watch is BTCPay plugin scope." }
      )}
    </div>
  `,
}

export function mountDocViz(page) {
  const root = document.getElementById("doc-viz")
  if (!root || !VIZ[page]) return
  root.innerHTML = VIZ[page]()
}

export function renderCheckSummary(root, checks = []) {
  if (!root) return
  const ok = checks.filter((c) => c.level === "ok").length
  const warn = checks.filter((c) => c.level === "warn").length
  const bad = checks.filter((c) => c.level === "bad").length
  root.innerHTML = `
    <div class="pay-check-viz" aria-label="Preflight check summary">
      <span class="pay-check-stat pass">${ok} ok</span>
      <span class="pay-check-stat warn">${warn} warn</span>
      <span class="pay-check-stat fail">${bad} fail</span>
    </div>
  `
}

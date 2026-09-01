/**
 * Session telemetry from local roll history — not chain data.
 */

export function computeSessionStats(history = []) {
  const stats = {
    total: history.length,
    pass: 0,
    fail: 0,
    passRate: 0,
    failCodes: {},
    warnCodes: {},
    addressKinds: {},
    recent: [],
    totalZec: 0,
  }

  for (const inv of history) {
    const ok = Boolean(inv.preflight?.ok)
    if (ok) stats.pass += 1
    else stats.fail += 1
    stats.recent.push(ok)

    const amt = Number(inv.amount)
    if (Number.isFinite(amt) && amt > 0) stats.totalZec += amt

    for (const c of inv.preflight?.checks || []) {
      if (c.level === "bad") {
        stats.failCodes[c.code] = (stats.failCodes[c.code] || 0) + 1
      }
      if (c.level === "warn") {
        stats.warnCodes[c.code] = (stats.warnCodes[c.code] || 0) + 1
      }
      if (c.code === "address" && c.level === "ok") {
        const kind = inferKind(c.message)
        if (kind) stats.addressKinds[kind] = (stats.addressKinds[kind] || 0) + 1
      }
    }
  }

  stats.passRate = stats.total ? Math.round((stats.pass / stats.total) * 100) : 0
  stats.recent = stats.recent.slice(0, 12).reverse()
  stats.totalZec = Math.round(stats.totalZec * 1e8) / 1e8
  return stats
}

function inferKind(message = "") {
  const m = message.toLowerCase()
  if (m.includes("unified")) return "unified"
  if (m.includes("sapling")) return "sapling"
  if (m.includes("transparent")) return "transparent"
  if (m.includes("tex")) return "tex"
  return null
}

function topEntries(map, limit = 4) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

function miniBars(entries, className, emptyLabel = "—") {
  if (!entries.length) {
    return `<p class="stats-empty">${emptyLabel}</p>`
  }
  const peak = Math.max(...entries.map(([, v]) => v), 1)
  return `<div class="mini-bars">${entries
    .map(([label, value]) => {
      const pct = Math.max(10, Math.round((value / peak) * 100))
      return `<div class="mini-bar">
        <span class="mini-bar-label">${label}</span>
        <span class="mini-bar-track"><span class="mini-bar-fill ${className}" style="width:${pct}%"></span></span>
        <span class="mini-bar-val">${value}</span>
      </div>`
    })
    .join("")}</div>`
}

function passRing(passRate, pass, fail) {
  const r = 18
  const c = 2 * Math.PI * r
  const passLen = (passRate / 100) * c
  return `<div class="pass-ring" aria-label="Pass rate ${passRate} percent">
    <svg viewBox="0 0 44 44" width="44" height="44">
      <circle cx="22" cy="22" r="${r}" fill="none" stroke="#2a332e" stroke-width="4"/>
      <circle cx="22" cy="22" r="${r}" fill="none" stroke="#2f9e44" stroke-width="4"
        stroke-dasharray="${passLen} ${c}" stroke-linecap="square" transform="rotate(-90 22 22)"/>
    </svg>
    <div class="pass-ring-label">
      <strong>${passRate}%</strong>
      <span>${pass}P · ${fail}F</span>
    </div>
  </div>`
}

function sparkline(recent) {
  if (!recent.length) {
    return `<svg class="spark spark-wide" viewBox="0 0 160 24" aria-hidden="true"><text x="0" y="16" fill="#8a968e" font-size="8">empty</text></svg>`
  }
  const w = 160
  const h = 24
  const step = recent.length > 1 ? w / (recent.length - 1) : w
  const dots = recent
    .map((ok, i) => {
      const x = Math.round(i * step)
      const y = ok ? 5 : 19
      const fill = ok ? "#2f9e44" : "#d62828"
      return `<circle cx="${x}" cy="${y}" r="2.5" fill="${fill}"/>`
    })
    .join("")
  return `<svg class="spark spark-wide" viewBox="0 0 ${w} ${h}" aria-label="Recent pass fail trend">${dots}</svg>`
}

export function renderSessionStats(root, history) {
  if (!root) return
  const s = computeSessionStats(history)
  const failRows = topEntries(s.failCodes, 3)
  const warnRows = topEntries(s.warnCodes, 3)
  const kindRows = topEntries(s.addressKinds, 3)
  const empty = s.total === 0

  root.innerHTML = `
    <header class="stats-head">
      <div class="stats-head-left">
        <h2>Session roll <span class="mock">LOCAL · NOT CHAIN</span></h2>
      </div>
      <dl class="stats-kpis">
        <div><dt>Runs</dt><dd>${s.total}</dd></div>
        <div><dt>ZEC</dt><dd>${s.totalZec || "—"}</dd></div>
      </dl>
    </header>

    ${
      empty
        ? `<p class="stats-empty stats-empty-block">Run preflight to populate session charts.</p>`
        : `<div class="stats-layout">
            <div class="stats-primary">
              ${passRing(s.passRate, s.pass, s.fail)}
              <div class="stats-trend">
                <span class="stats-trend-label">Recent</span>
                ${sparkline(s.recent)}
              </div>
            </div>
            <div class="stats-breakdown">
              <div class="stats-breakdown-col">
                <h3>Fail</h3>
                ${miniBars(failRows, "fail-code", "none")}
              </div>
              <div class="stats-breakdown-col">
                <h3>Warn</h3>
                ${miniBars(warnRows, "kind", "none")}
              </div>
              <div class="stats-breakdown-col">
                <h3>Addr ok</h3>
                ${miniBars(kindRows, "kind", "none")}
              </div>
            </div>
          </div>`
    }
  `
}

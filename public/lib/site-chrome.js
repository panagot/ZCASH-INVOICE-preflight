import { mountThemeToggle, getTheme } from "./theme.js"

const SITE = {
  name: "ZEC Invoice Preflight",
  short: "Preflight",
  url: "https://zcash-invoice-preflight.vercel.app",
  repo: "https://github.com/panagot/ZCASH-INVOICE-preflight",
  demo: "/",
}

const OG_IMAGE = `${SITE.url}/og-card.svg`

const NAV = [
  { id: "desk", href: "/", label: "Merchant desk" },
  { id: "why", href: "/why.html", label: "Why" },
  { id: "how", href: "/how.html", label: "How it works" },
  { id: "checks", href: "/checks.html", label: "Checks" },
  { id: "integration", href: "/integration.html", label: "BTCPay" },
  { id: "reviewers", href: "/reviewers.html", label: "Reviewers" },
  { id: "pay", href: "/pay.html", label: "Customer pay" },
  { id: "about", href: "/about.html", label: "About" },
]

const PROJECT_STATS = [
  { k: "Tests", v: "20 pass" },
  { k: "Handoff", v: "v1 schema" },
  { k: "Package", v: "0.4.1" },
  { k: "Storage", v: "local only" },
]

const DOC_FLOW = [
  { id: "why", href: "/why.html", label: "Why preflight" },
  { id: "how", href: "/how.html", label: "How it works" },
  { id: "checks", href: "/checks.html", label: "Check reference" },
  { id: "integration", href: "/integration.html", label: "BTCPay integration" },
  { id: "reviewers", href: "/reviewers.html", label: "Reviewer path" },
]

function navLink(item, active) {
  const current = item.id === active ? ' aria-current="page"' : ""
  const ext = item.external ? ' target="_blank" rel="noopener noreferrer"' : ""
  return `<a class="site-nav-link${item.id === active ? " active" : ""}" href="${item.href}"${current}${ext}>${item.label}</a>`
}

function closeMobileNav() {
  const menu = document.getElementById("site-nav-menu")
  const toggle = document.getElementById("site-nav-toggle")
  menu?.classList.remove("open")
  toggle?.setAttribute("aria-expanded", "false")
}

export function mountPageMeta({ title, description, path = "/" } = {}) {
  const url = `${SITE.url}${path}`
  document.title = title || SITE.name

  const setMeta = (key, value, property = false) => {
    const attr = property ? "property" : "name"
    let el = document.querySelector(`meta[${attr}="${key}"]`)
    if (!el) {
      el = document.createElement("meta")
      el.setAttribute(attr, key)
      document.head.appendChild(el)
    }
    el.setAttribute("content", value)
  }

  if (description) setMeta("description", description)
  setMeta("og:title", title || SITE.name, true)
  setMeta("og:description", description || "", true)
  setMeta("og:type", "website", true)
  setMeta("og:url", url, true)
  setMeta("og:image", OG_IMAGE, true)
  setMeta("og:image:alt", "ZEC Invoice Preflight — thermal merchant desk", true)
  setMeta("twitter:card", "summary_large_image")
  setMeta("twitter:image", OG_IMAGE)

  let theme = document.querySelector('meta[name="theme-color"]')
  if (!theme) {
    theme = document.createElement("meta")
    theme.name = "theme-color"
    document.head.appendChild(theme)
  }
  theme.content = getTheme() === "light" ? "#fafafa" : "#0c0f0d"

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement("link")
    canonical.rel = "canonical"
    document.head.appendChild(canonical)
  }
  canonical.href = url
}

export function mountSiteChrome({ page = "", showBanner = true } = {}) {
  const navRoot = document.getElementById("site-nav")
  const footRoot = document.getElementById("site-footer")

  if (navRoot) {
    navRoot.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to content</a>
      <div class="site-nav-inner">
        <a class="site-brand" href="/">
          <span class="site-brand-mark">ZEC</span>
          <span class="site-brand-text">
            <strong>${SITE.short}</strong>
            <small>Compose-time ZIP-321 · BTCPay companion</small>
          </span>
        </a>
        <button type="button" class="site-nav-toggle" id="site-nav-toggle" aria-expanded="false" aria-controls="site-nav-menu">
          Menu
        </button>
        <nav class="site-nav-menu" id="site-nav-menu" aria-label="Site">
          ${NAV.map((item) => navLink(item, page)).join("")}
          <a class="site-nav-link site-nav-cta" href="${SITE.repo}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
      ${
        showBanner
          ? `<p class="site-banner">Demo only · payment detection is <strong>mock</strong> · on-chain settlement belongs to BTCPay Zcash plugin</p>`
          : ""
      }
    `

    const toggle = document.getElementById("site-nav-toggle")
    const menu = document.getElementById("site-nav-menu")
    toggle?.addEventListener("click", () => {
      const open = menu.classList.toggle("open")
      toggle.setAttribute("aria-expanded", open ? "true" : "false")
    })

    menu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMobileNav())
    })

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav()
    })

    mountThemeToggle()
  }

  if (footRoot) {
    const year = new Date().getFullYear()
    footRoot.innerHTML = `
      <div class="site-footer-grid">
        <div class="site-footer-brand">
          <p class="site-footer-title">${SITE.name}</p>
          <p class="site-footer-tag">Compose-time ZIP-321 preflight for Zcash merchants. BTCPay companion demo — <a href="${SITE.url}">zcash-invoice-preflight.vercel.app</a>. Not a wallet, indexer, or BTCPay checkout replacement.</p>
        </div>
        <div>
          <p class="site-footer-heading">Product</p>
          <ul class="site-footer-links">
            <li><a href="/">Merchant desk</a></li>
            <li><a href="/why.html">Why preflight</a></li>
            <li><a href="/how.html">How it works</a></li>
            <li><a href="/checks.html">Check reference</a></li>
            <li><a href="/about.html">About</a></li>
          </ul>
        </div>
        <div>
          <p class="site-footer-heading">Grant / review</p>
          <ul class="site-footer-links">
            <li><a href="/reviewers.html">10-minute reviewer path</a></li>
            <li><a href="/integration.html">BTCPay handoff</a></li>
            <li><a href="${SITE.repo}/blob/main/docs/REVIEWER.md" target="_blank" rel="noopener noreferrer">REVIEWER.md (GitHub)</a></li>
            <li><a href="${SITE.repo}/blob/main/schemas/handoff-v1.json" target="_blank" rel="noopener noreferrer">Handoff schema</a></li>
          </ul>
        </div>
        <div>
          <p class="site-footer-heading">References</p>
          <ul class="site-footer-links">
            <li><a href="https://zips.z.cash/zip-0321" target="_blank" rel="noopener noreferrer">ZIP-321 spec</a></li>
            <li><a href="https://docs.btcpayserver.org/" target="_blank" rel="noopener noreferrer">BTCPay Server docs</a></li>
            <li><a href="${SITE.repo}" target="_blank" rel="noopener noreferrer">Source on GitHub</a></li>
            <li><a href="${SITE.repo}/issues" target="_blank" rel="noopener noreferrer">Report an issue</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer-bottom">
        <span>© ${year} · MIT · Client-side demo · no server invoice storage</span>
        <span>On-chain settlement &amp; detection → BTCPay Zcash plugin · status lane here is <strong>mock only</strong></span>
      </div>
    `
  }
}

export function mountDocHero() {
  const root = document.getElementById("doc-hero")
  if (!root) return
  root.innerHTML = `
    <div class="doc-hero" aria-label="Project snapshot">
      ${PROJECT_STATS.map(
        (s) => `<div class="doc-hero-stat"><span class="doc-hero-v">${s.v}</span><span class="doc-hero-k">${s.k}</span></div>`
      ).join("")}
    </div>
  `
}

export function mountDocPager(page) {
  const root = document.getElementById("doc-pager")
  if (!root) return
  const idx = DOC_FLOW.findIndex((p) => p.id === page)
  if (idx < 0) return
  const prev = DOC_FLOW[idx - 1]
  const next = DOC_FLOW[idx + 1]
  root.innerHTML = `
    ${prev ? `<a class="btn ghost doc-pager-link" href="${prev.href}">← ${prev.label}</a>` : "<span></span>"}
    <a class="btn ghost doc-pager-link" href="/reviewers.html">Reviewer path</a>
    ${next ? `<a class="btn ghost doc-pager-link" href="${next.href}">${next.label} →</a>` : "<span></span>"}
  `
}

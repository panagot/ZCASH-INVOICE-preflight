/**
 * Capture full-page screenshots for visual audit.
 * Usage: node scripts/capture-screenshots.mjs
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const OUT = path.join(ROOT, "docs", "screenshots")
const BASE = process.env.SCREENSHOT_BASE || "http://localhost:5177"

const PAGES = [
  { slug: "01-desk-empty", path: "/" },
  { slug: "02-desk-pass", path: "/", interact: "pass" },
  { slug: "03-desk-fail", path: "/", interact: "fail" },
  { slug: "04-why", path: "/why.html" },
  { slug: "05-how", path: "/how.html" },
  { slug: "06-checks", path: "/checks.html" },
  { slug: "07-integration", path: "/integration.html" },
  { slug: "08-reviewers", path: "/reviewers.html" },
  { slug: "09-pay-empty", path: "/pay.html" },
  { slug: "10-pay-demo", path: "/pay.html", interact: "demo" },
  { slug: "11-about", path: "/about.html" },
  { slug: "12-404", path: "/does-not-exist-page" },
]

async function main() {
  const { chromium } = await import("playwright")
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  await context.addInitScript(() => {
    localStorage.setItem("zec-preflight:theme", "light")
  })

  const manifest = []

  for (const page of PAGES) {
    const tab = await context.newPage()
    const url = `${BASE}${page.path}`
    await tab.goto(url, { waitUntil: "networkidle", timeout: 60000 })

    if (page.interact === "pass") {
      await tab.click("#load-sample")
      await tab.click('button[type="submit"]')
      await tab.waitForSelector("#ticket:not(.hidden)", { timeout: 15000 })
      await tab.waitForTimeout(800)
    }

    if (page.interact === "fail") {
      await tab.click("#load-bad")
      await tab.click('button[type="submit"]')
      await tab.waitForSelector("#ticket:not(.hidden)", { timeout: 15000 })
      await tab.waitForTimeout(800)
    }

    if (page.path === "/") {
      await tab.waitForFunction(
        () => {
          const t = document.getElementById("engine-line")?.textContent || ""
          return t.includes("zaddr-wasm") || t.includes("heuristic") || t.includes("loading")
        },
        { timeout: 15000 }
      )
    }

    if (page.path === "/pay.html" && page.interact === "demo") {
      await tab.click("#pay-demo")
      await tab.waitForSelector("#pay-body:not(.hidden)", { timeout: 15000 })
      await tab.waitForTimeout(600)
    }

    const file = `${page.slug}.png`
    const filePath = path.join(OUT, file)
    await tab.screenshot({ path: filePath, fullPage: true })
    manifest.push({ slug: page.slug, url, file })
    await tab.close()
  }

  await writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), base: BASE, pages: manifest }, null, 2)
  )

  await browser.close()
  console.log(`Captured ${manifest.length} screenshots → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

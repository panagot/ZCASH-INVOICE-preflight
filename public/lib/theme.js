const KEY = "zec-preflight:theme"

const THEME_COLORS = {
  dark: "#0c0f0d",
  light: "#fafafa",
}

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

export function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark"
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignore */
  }
  syncThemeMeta(next)
  syncToggle(next)
}

function syncThemeMeta(theme) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLORS[theme]
}

function syncToggle(theme) {
  const btn = document.getElementById("theme-toggle")
  if (!btn) return
  const light = theme === "light"
  btn.setAttribute("aria-pressed", light ? "true" : "false")
  btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme")
  const label = btn.querySelector(".theme-toggle-text")
  if (label) label.textContent = light ? "Light" : "Dark"
  btn.classList.toggle("is-light", light)
}

export function mountThemeToggle() {
  let btn = document.getElementById("theme-toggle")
  if (!btn) {
    btn = document.createElement("button")
    btn.id = "theme-toggle"
    btn.type = "button"
    btn.className = "theme-toggle"
    btn.innerHTML = `
      <span class="theme-switch" aria-hidden="true"><span class="theme-switch-knob"></span></span>
      <span class="theme-toggle-text">Dark</span>
    `
    document.body.appendChild(btn)
  }

  btn.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark")
  })

  syncThemeMeta(getTheme())
  syncToggle(getTheme())
}

/** Escape text for safe HTML insertion. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Brief toast for copy / export feedback. */
export function showToast(message, { ms = 2200 } = {}) {
  let el = document.getElementById("site-toast")
  if (!el) {
    el = document.createElement("p")
    el.id = "site-toast"
    el.className = "site-toast"
    el.setAttribute("role", "status")
    el.setAttribute("aria-live", "polite")
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.add("show")
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => el.classList.remove("show"), ms)
}

/** Show a brief inline error under the ticket bay. */
export function showDeskError(message) {
  let el = document.getElementById("desk-error")
  if (!el) {
    el = document.createElement("p")
    el.id = "desk-error"
    el.className = "desk-error"
    el.setAttribute("role", "alert")
    el.setAttribute("tabindex", "-1")
    const bay = document.querySelector(".ticket-bay")
    bay?.prepend(el)
  }
  el.textContent = message
  el.classList.remove("hidden")
  el.focus()
  clearTimeout(showDeskError._t)
  showDeskError._t = setTimeout(() => el.classList.add("hidden"), 6000)
}

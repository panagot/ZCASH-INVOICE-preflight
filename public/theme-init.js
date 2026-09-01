(function () {
  try {
    var t = localStorage.getItem("zec-preflight:theme")
    document.documentElement.dataset.theme = t === "dark" ? "dark" : "light"
  } catch (e) {
    document.documentElement.dataset.theme = "light"
  }
})()

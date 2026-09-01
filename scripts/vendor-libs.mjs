#!/usr/bin/env node
import { cpSync, mkdirSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const zaddrSrc = resolve(root, "node_modules/@elemental-zcash/zaddr_wasm_parser")
const zaddrDst = resolve(root, "public/vendor/zaddr")
const qrEntry = resolve(root, "node_modules/qrcode/lib/browser.js")
const qrOut = resolve(root, "public/vendor/qrcode.min.js")

if (!existsSync(zaddrSrc) || !existsSync(qrEntry)) {
  console.error("Missing deps — run npm install")
  process.exit(1)
}

mkdirSync(zaddrDst, { recursive: true })
for (const f of [
  "zaddr_wasm_parser.js",
  "zaddr_wasm_parser_bg.js",
  "zaddr_wasm_parser_bg.wasm",
]) {
  cpSync(resolve(zaddrSrc, f), resolve(zaddrDst, f))
}

const bundled = spawnSync(
  "npx",
  ["--yes", "esbuild", qrEntry, "--bundle", "--minify", `--outfile=${qrOut}`, "--format=iife", "--global-name=QRCode"],
  { cwd: root, shell: true, encoding: "utf8" }
)
if (bundled.status !== 0) {
  console.error(bundled.stderr || bundled.stdout)
  process.exit(1)
}

console.log("vendored zaddr-wasm + qrcode → public/vendor/")

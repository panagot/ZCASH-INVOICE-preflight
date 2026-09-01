#!/usr/bin/env node
/**
 * CLI preflight for ZIP-321 invoices — exit 0 pass, 1 fail.
 * Usage:
 *   node bin/doctor.js --uri "zcash:..."
 *   node bin/doctor.js --file fixtures/good-ua.json
 *   node bin/doctor.js --address u1... --amount 0.01 --memo "hi"
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const addressUrl = pathToFileURL(resolve(root, "public/lib/address.js")).href
const preflightUrl = pathToFileURL(resolve(root, "public/lib/preflight.js")).href
const { ensureAddressEngine } = await import(addressUrl)
await ensureAddressEngine()
const { preflightInvoice, preflightUri } = await import(preflightUrl)

function usage() {
  console.log(`ZEC Invoice Preflight doctor

  --uri <zcash:...>
  --file <invoice.json>
  --address <addr> --amount <zec> [--memo ...] [--network mainnet|testnet|any]
  --json          print full report JSON
  --help
`)
}

function parseArgs(argv) {
  const out = { json: false, network: "mainnet" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--help" || a === "-h") out.help = true
    else if (a === "--json") out.json = true
    else if (a === "--uri") out.uri = argv[++i]
    else if (a === "--file") out.file = argv[++i]
    else if (a === "--address") out.address = argv[++i]
    else if (a === "--amount") out.amount = argv[++i]
    else if (a === "--memo") out.memo = argv[++i]
    else if (a === "--label") out.label = argv[++i]
    else if (a === "--message") out.message = argv[++i]
    else if (a === "--network") out.network = argv[++i]
    else throw new Error(`Unknown arg: ${a}`)
  }
  return out
}

function printReport(report) {
  for (const c of report.checks) {
    const tag = c.level === "ok" ? "OK  " : c.level === "warn" ? "WARN" : "FAIL"
    console.log(`${tag}  ${c.code.padEnd(14)} ${c.message}`)
  }
  if (report.uri) console.log(`\nURI  ${report.uri}`)
  console.log(report.ok ? "\npreflight: PASS" : "\npreflight: FAIL")
}

const args = parseArgs(process.argv.slice(2))
if (args.help || (!args.uri && !args.file && !args.address)) {
  usage()
  process.exit(args.help ? 0 : 2)
}

let report
try {
  if (args.uri) {
    report = preflightUri(args.uri, { network: args.network })
  } else if (args.file) {
    let data
    try {
      data = JSON.parse(readFileSync(resolve(args.file), "utf8"))
    } catch (err) {
      console.error(`Failed to read ${args.file}: ${err.message}`)
      process.exit(1)
    }
    if (data.uri && !data.address) {
      report = preflightUri(data.uri, { network: data.network || args.network })
    } else {
      report = preflightInvoice({
        address: data.address,
        amount: data.amount,
        memo: data.memo || "",
        label: data.label || "",
        message: data.message || "",
        network: data.network || args.network,
      })
    }
  } else {
    report = preflightInvoice({
      address: args.address,
      amount: args.amount,
      memo: args.memo || "",
      label: args.label || "",
      message: args.message || "",
      network: args.network,
    })
  }
} catch (err) {
  console.error(err.message || String(err))
  process.exit(1)
}

if (args.json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  printReport(report)
}

process.exit(report.ok ? 0 : 1)

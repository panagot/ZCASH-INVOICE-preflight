import { describe, it, before } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const lib = (name) => pathToFileURL(resolve(root, "public/lib", name)).href

const { ensureAddressEngine, classifyAddressAsync } = await import(lib("address.js"))
const { encodePaymentUri, decodePaymentUri, roundTripOk, formatAmount } = await import(lib("zip321.js"))
const { preflightInvoice, preflightUri } = await import(lib("preflight.js"))
const { buildInvoice, advanceStatus, encodeSharePayload, decodeSharePayload } = await import(
  lib("invoice.js")
)
const { toBtcpayHandoff } = await import(lib("btcpay-handoff.js"))
const { assertZcashUri } = await import(lib("validate.js"))
const { MockDetectionAdapter, ZkoolDetectionAdapter, setDetectionAdapter, getDetectionAdapter } =
  await import(lib("detection.js"))

const UA =
  "u1mq04mn6p50lvt0p4wdslweg8tffm3d0vn6tnyz4ry7dgrh35tw2ykzf7luh77qgsgl8wcl0a2fylvk3en5csd9nrhwdzvf8tdey9vfmuk98vj6de8msslwrh4rs06q8upcnsj5pqzq7vcestnlr08gjycj72z0pdpg02y2c2a2mcutardqpflq4p00udr7tktmyp99crfcfg6e2s30d"
const SAPLING =
  "zs1jap4fpzz4wj0uh7zavxsju6xrqud6gdkelx4gng8h0t30qv5huz6ar4hpvsxr6tdvza9zasweve"
const TADDR = "t1XUKmDLFcRDxvf9A7tawmgePDN8NK6os35"

before(async () => {
  const eng = await ensureAddressEngine()
  assert.equal(eng.engine, "zaddr-wasm", `expected zaddr-wasm, got ${eng.engine}: ${eng.error}`)
})

describe("address wasm", () => {
  it("validates real vectors", async () => {
    const ua = await classifyAddressAsync(UA)
    assert.equal(ua.ok, true)
    assert.equal(ua.kind, "unified")
    assert.equal(ua.engine, "zaddr-wasm")
    const t = await classifyAddressAsync(TADDR)
    assert.equal(t.kind, "transparent")
    assert.equal(t.allowsMemo, false)
  })

  it("rejects fake addresses", async () => {
    const bad = await classifyAddressAsync("t1TAtrnaYcg4oE9pPQHv8N9qXhDH5rH5coT")
    assert.equal(bad.ok, false)
  })
})

describe("zip321", () => {
  it("formats amounts with <= 8 decimals", () => {
    assert.equal(formatAmount(0.042), "0.042")
    assert.equal(formatAmount("1"), "1")
  })

  it("round-trips UA payment with memo + label/message", () => {
    const payment = {
      address: UA,
      amount: "0.042",
      memo: "Order #1042",
      label: "Cafe & Co",
      message: "Thanks — table 7",
    }
    assert.equal(roundTripOk(payment), true)
    const parsed = decodePaymentUri(encodePaymentUri(payment))
    assert.equal(parsed.label, "Cafe & Co")
    assert.equal(parsed.message, "Thanks — table 7")
  })

  it("rejects memo on transparent address", () => {
    assert.throws(() => encodePaymentUri({ address: TADDR, amount: "0.01", memo: "x" }), /memo/i)
  })

  it("rejects multi-payment URIs", () => {
    assert.throws(
      () => decodePaymentUri(`zcash:?address.1=${SAPLING}&amount.1=1`),
      /multi-payment/i
    )
  })

  it("rejects unknown address shapes", () => {
    assert.throws(
      () => encodePaymentUri({ address: "not-a-zcash-address-at-all", amount: "0.01" }),
      /address/i
    )
  })
})

describe("preflight fixtures", () => {
  for (const [file, expectOk] of [
    ["fixtures/good-ua.json", true],
    ["fixtures/good-sapling.json", true],
    ["fixtures/label-message.json", true],
    ["fixtures/bad-transparent-memo.json", false],
    ["fixtures/bad-network-mismatch.json", false],
    ["fixtures/bad-empty-amount.json", false],
    ["fixtures/bad-huge-memo.json", false],
  ]) {
    it(`${file} → ok=${expectOk}`, () => {
      const data = JSON.parse(readFileSync(resolve(root, file), "utf8"))
      const report = preflightInvoice(data)
      assert.equal(report.ok, expectOk)
    })
  }

  it("parses encoded URI", () => {
    const uri = encodePaymentUri({ address: SAPLING, amount: "1.5", message: "hi" })
    assert.equal(preflightUri(uri, { network: "any" }).ok, true)
  })
})

describe("invoice + handoff + detection", () => {
  it("builds, advances, share round-trip", () => {
    setDetectionAdapter(new MockDetectionAdapter())
    const inv = buildInvoice({ address: UA, amount: "0.1", network: "mainnet" })
    assert.equal(inv.meta.detectionAdapter, "mock")
    assert.equal(inv.meta.addressEngine, "zaddr-wasm")
    const d = advanceStatus(inv, "detected")
    assert.equal(d.status, "detected")
    const slim = decodeSharePayload(encodeSharePayload(d))
    assert.equal(slim.uri, d.uri)
    assert.equal(slim.preflight?.ok, d.preflight.ok)
    assert.ok(Array.isArray(slim.preflight?.checks) && slim.preflight.checks.length > 0)
  })

  it("exports BTCPay handoff schema id", () => {
    const inv = buildInvoice({ address: SAPLING, amount: "0.2", orderId: "o-1" })
    const handoff = toBtcpayHandoff(inv)
    assert.equal(handoff.schema, "btcpay-zec-helper.handoff/v1")
    assert.equal(handoff.invoice.orderId, "o-1")
    assert.equal(handoff.invoice.currency, "ZEC")
    assert.equal(handoff.invoice.btcpayInvoiceId, null)
    assert.match(handoff.disclaimer, /Does not settle/i)
    assert.match(handoff.invoice.statusBtcpayHint, /Mock only/i)
  })

  it("zkool stub refuses poll", async () => {
    const stub = new ZkoolDetectionAdapter({ endpoint: "http://127.0.0.1:9" })
    await assert.rejects(() => stub.pollInvoice({}), /not implemented/)
    setDetectionAdapter(new MockDetectionAdapter())
    assert.equal(getDetectionAdapter().name, "mock")
  })

  it("rejects unsafe share URIs", () => {
    const inv = buildInvoice({ address: UA, amount: "0.1", network: "mainnet" })
    const token = encodeSharePayload({ ...inv, uri: "javascript:alert(1)" })
    assert.throws(() => decodeSharePayload(token), /zcash:/i)
  })

  it("validates zcash URI helper", () => {
    assert.doesNotThrow(() => assertZcashUri(`zcash:${UA}?amount=0.1`))
    assert.throws(() => assertZcashUri("javascript:alert(1)"), /zcash:/i)
  })
})

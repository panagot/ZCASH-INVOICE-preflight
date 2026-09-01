/**
 * Detection adapter seam — what a BTCPay / zkool / lightwalletd watcher would implement.
 * Default: MockDetectionAdapter (local status advances only).
 */

export class MockDetectionAdapter {
  constructor() {
    this.name = "mock"
    this.chainWatch = false
  }

  async getCapabilities() {
    return {
      name: this.name,
      chainWatch: false,
      mempool: false,
      confirmations: false,
      note: "Local demo only. Swap for ZkoolDetectionAdapter when wiring BTCPay.",
    }
  }

  /** @returns {Promise<'unpaid'|'detected'|'confirmed'>} */
  async pollInvoice(_invoice) {
    return "unpaid"
  }
}

/**
 * Stub for a future zkool/lightwalletd-backed watcher.
 * Methods throw until implemented — keeps the seam visible in reviews.
 */
export class ZkoolDetectionAdapter {
  constructor(opts = {}) {
    this.name = "zkool-stub"
    this.endpoint = opts.endpoint || null
    this.chainWatch = true
  }

  async getCapabilities() {
    return {
      name: this.name,
      chainWatch: true,
      mempool: true,
      confirmations: true,
      endpoint: this.endpoint,
      note: "Stub — not connected. Implement pollInvoice against zkool GraphQL / lightwalletd.",
    }
  }

  async pollInvoice(_invoice) {
    throw new Error("ZkoolDetectionAdapter.pollInvoice is not implemented (stub)")
  }
}

let active = new MockDetectionAdapter()

export function getDetectionAdapter() {
  return active
}

export function setDetectionAdapter(adapter) {
  active = adapter
  return active
}

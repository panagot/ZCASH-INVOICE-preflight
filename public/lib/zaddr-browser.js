/**
 * Browser-only zaddr WASM loader (fetch + instantiate — no direct .wasm import).
 */
import * as bg from "/vendor/zaddr/zaddr_wasm_parser_bg.js"

const WASM_URL = "/vendor/zaddr/zaddr_wasm_parser_bg.wasm"

export async function loadZaddrBrowserApi() {
  const resp = await fetch(WASM_URL)
  if (!resp.ok) throw new Error(`WASM fetch failed (${resp.status})`)
  const bytes = await resp.arrayBuffer()
  const { instance } = await WebAssembly.instantiate(bytes, {
    "./zaddr_wasm_parser_bg.js": {
      __wbindgen_string_new: bg.__wbindgen_string_new,
      __wbg_set_3f1d0b984ed272ed: bg.__wbg_set_3f1d0b984ed272ed,
      __wbg_new_405e22f390576ce2: bg.__wbg_new_405e22f390576ce2,
      __wbindgen_throw: bg.__wbindgen_throw,
      __wbindgen_init_externref_table: bg.__wbindgen_init_externref_table,
    },
  })
  bg.__wbg_set_wasm(instance.exports)
  instance.exports.__wbindgen_start()
  return {
    isValid: bg.is_valid_zcash_address,
    getType: bg.get_zcash_address_type,
    getReceivers: bg.get_address_receivers,
    normalize: bg.normalize_zcash_address,
  }
}

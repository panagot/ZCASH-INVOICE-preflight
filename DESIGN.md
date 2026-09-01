# DESIGN.md

## Scene
Counter staff at a cafe with a BTCPay tablet under bright shop lights. The UI should feel like a **thermal ticket printer + POS terminal**, not a startup landing page.

## Strategy
Committed: machine chassis (cool graphite-green) + thermal paper white for the ticket/QR. Hazard red for FAIL only. Phosphor green for PASS.

## Typography
- Display: Archivo Black (uppercase structural titles)
- Data: Space Mono

## Color (OKLCH-ish hex)
- Chassis `--bg`: `#1a211e`
- Panel `--panel`: `#222b27`
- Paper `--paper`: `#eef1ea`
- Ink `--ink`: `#141916`
- Accent FAIL: `#d62828`
- Accent PASS: `#2f9e44`
- Warn: `#c77d1a`
- Muted: `#8a968e`

## Motion
Minimal. Ticket slide-in 180ms. Status stamp pop. No gradient glows, no glassmorphism.

## Layout
Asymmetric: left controls (chassis), right thermal ticket. History as a stub roll on the left edge.

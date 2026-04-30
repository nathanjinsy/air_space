import {
  CANVAS_W, CANVAS_H, MARGIN_X, RUNWAY_LENGTH,
  TERMINAL_X, TERMINAL_Y, TERMINAL_W, TERMINAL_H,
  APRON_Y, APRON_H,
  TAXIWAY_ALPHA_Y, TAXIWAY_H, TAXIWAY_BRAVO_Y,
  RWY_UPPER_Y, RWY_LOWER_Y, RWY_H,
  GRASS_STRIP_Y, GRASS_STRIP_H,
  RWY_LEFT_X, RWY_RIGHT_X, HOLD_SHORT_OFFSET,
  CONNECTOR_LEFT_X, CONNECTOR_RIGHT_X,
  CARGO_TAX_Y, CARGO_TAX_H, CARGO_APRON_Y, CARGO_APRON_H,
  CARGO_BLDG_Y, CARGO_BLDG_H, CARGO_STAND_COUNT,
  GATE_COUNT, GATE_SPACING, GATE_Y,
  C,
} from '../constants'

let cachedCanvas: HTMLCanvasElement | null = null

/** Returns a pre-rendered offscreen canvas with the static airport scene. */
export function getAirportCanvas(): HTMLCanvasElement {
  if (cachedCanvas) return cachedCanvas

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')!

  drawAirport(ctx)
  cachedCanvas = canvas
  return canvas
}

// ---------------------------------------------------------------------------

function drawAirport(ctx: CanvasRenderingContext2D): void {
  // 1. Grass background
  ctx.fillStyle = C.grass
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // 2. Tree clusters (seeded pseudo-random)
  drawTrees(ctx)

  // 3. Apron (concrete behind terminal)
  ctx.fillStyle = C.apron
  ctx.fillRect(TERMINAL_X, APRON_Y, TERMINAL_W, APRON_H)

  // 4. Terminal building
  drawTerminal(ctx)

  // 5. Gate jetways
  drawGateJetways(ctx)

  // 6. Taxiway Alpha (north)
  drawTaxiway(ctx, TAXIWAY_ALPHA_Y)

  // 7. Taxiway Bravo (south)
  drawTaxiway(ctx, TAXIWAY_BRAVO_Y)

  // 8. Grass strip between runways
  ctx.fillStyle = C.grass
  ctx.fillRect(MARGIN_X, GRASS_STRIP_Y, RUNWAY_LENGTH, GRASS_STRIP_H)

  // 9. Runways
  drawRunway(ctx, RWY_UPPER_Y, '09R', '27L')
  drawRunway(ctx, RWY_LOWER_Y, '09L', '27R')

  // 10. End-connector taxiways (painted over grass/runway ends so no grass crossing)
  drawConnectors(ctx)

  // 11. Taxiway network centerline (solid, smooth curves at all junctions)
  drawTaxiwayNetwork(ctx)

  // 12. Runway entry/exit centerline connections (lead-on curves + lead-off lines)
  drawRunwayConnections(ctx)

  // 13. Cargo/GA area (south end)
  drawCargoArea(ctx)

  // 14. Stopbar markings at each taxiway-runway entry point (static dim red paint)
  drawStopbars(ctx)
}

// ---------------------------------------------------------------------------

function drawTrees(ctx: CanvasRenderingContext2D): void {
  // Simple LCG for seeded pseudo-random
  let seed = 42
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }

  ctx.fillStyle = C.grassDark

  // Border clusters: top strip, bottom strip, left/right ends
  const treeSections = [
    { x0: 0, y0: 0, x1: CANVAS_W, y1: TERMINAL_Y - 2, count: 30 },
    { x0: 0, y0: TAXIWAY_BRAVO_Y + TAXIWAY_H + 4, x1: CANVAS_W, y1: CANVAS_H, count: 30 },
    { x0: 0, y0: TERMINAL_Y, x1: MARGIN_X - 4, y1: TAXIWAY_BRAVO_Y + TAXIWAY_H, count: 12 },
    { x0: CANVAS_W - MARGIN_X + 4, y0: TERMINAL_Y, x1: CANVAS_W, y1: TAXIWAY_BRAVO_Y + TAXIWAY_H, count: 12 },
    { x0: MARGIN_X, y0: GRASS_STRIP_Y + 4, x1: CANVAS_W - MARGIN_X, y1: GRASS_STRIP_Y + GRASS_STRIP_H - 4, count: 18 },
  ]

  for (const s of treeSections) {
    for (let i = 0; i < s.count; i++) {
      const tx = s.x0 + rand() * (s.x1 - s.x0)
      const ty = s.y0 + rand() * (s.y1 - s.y0)
      const r = 5 + rand() * 5
      ctx.beginPath()
      ctx.arc(tx, ty, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawTerminal(ctx: CanvasRenderingContext2D): void {
  // Main body
  ctx.fillStyle = C.terminal
  ctx.fillRect(TERMINAL_X, TERMINAL_Y, TERMINAL_W, TERMINAL_H)

  // Roof — lighter band across top
  ctx.fillStyle = C.terminalRoof
  ctx.fillRect(TERMINAL_X, TERMINAL_Y, TERMINAL_W, 12)

  // Simple single row of windows (regional = one level)
  ctx.fillStyle = C.terminalWin
  const winW = 8; const winH = 6; const winGap = 22
  const winY = TERMINAL_Y + 26
  for (let wx = TERMINAL_X + 20; wx < TERMINAL_X + TERMINAL_W - 20; wx += winGap) {
    ctx.fillRect(wx, winY, winW, winH)
  }

  // Small control tower on the right end
  const twX = TERMINAL_X + TERMINAL_W - 28
  ctx.fillStyle = '#9a8a78'
  ctx.fillRect(twX, TERMINAL_Y - 22, 18, TERMINAL_H + 22)
  ctx.fillStyle = C.terminalWin
  ctx.fillRect(twX + 2, TERMINAL_Y - 18, 14, 10)   // tower cab window
}

function drawGateJetways(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < GATE_COUNT; i++) {
    const gx = MARGIN_X + GATE_SPACING * (i + 1)

    // Boarding stairs (angled ramp — regional airports use apron stairs)
    ctx.fillStyle = C.jetway
    ctx.beginPath()
    ctx.moveTo(gx - 4, TERMINAL_Y + TERMINAL_H)
    ctx.lineTo(gx + 4, TERMINAL_Y + TERMINAL_H)
    ctx.lineTo(gx + 8, GATE_Y + 6)
    ctx.lineTo(gx - 8, GATE_Y + 6)
    ctx.closePath()
    ctx.fill()

    // Step lines on the ramp
    ctx.strokeStyle = '#8a7a6a'
    ctx.lineWidth = 1
    for (let s = 1; s <= 3; s++) {
      const sy = TERMINAL_Y + TERMINAL_H + (APRON_H * s / 4)
      ctx.beginPath()
      ctx.moveTo(gx - 3 - s, sy); ctx.lineTo(gx + 3 + s, sy)
      ctx.stroke()
    }

    // Gate parking box
    ctx.strokeStyle = '#3a3030'
    ctx.lineWidth = 1
    ctx.strokeRect(gx - 16, GATE_Y - 8, 32, 16)
  }
}

function drawTaxiway(ctx: CanvasRenderingContext2D, y: number): void {
  // Fill
  ctx.fillStyle = C.taxiway
  ctx.fillRect(MARGIN_X, y, RUNWAY_LENGTH, TAXIWAY_H)

  // Edge guidelines (light gray lines along top and bottom edges)
  ctx.strokeStyle = 'rgba(200, 200, 180, 0.55)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(MARGIN_X, y + 1);              ctx.lineTo(MARGIN_X + RUNWAY_LENGTH, y + 1)
  ctx.moveTo(MARGIN_X, y + TAXIWAY_H - 1); ctx.lineTo(MARGIN_X + RUNWAY_LENGTH, y + TAXIWAY_H - 1)
  ctx.stroke()
  // Centerline drawn separately by drawTaxiwayNetwork with smooth curves
}

function drawRunway(
  ctx: CanvasRenderingContext2D,
  y: number,
  leftId: string,
  rightId: string
): void {
  const x = MARGIN_X
  const w = RUNWAY_LENGTH
  const cy = y + RWY_H / 2

  // Concrete fill
  ctx.fillStyle = '#8c8c84'
  ctx.fillRect(x, y, w, RWY_H)

  // Edge shadows
  ctx.fillStyle = '#686860'
  ctx.fillRect(x, y, w, 3)
  ctx.fillRect(x, y + RWY_H - 3, w, 3)

  // Centerline dashes
  ctx.strokeStyle = C.marking
  ctx.lineWidth = 1.5
  ctx.setLineDash([20, 15])
  ctx.beginPath()
  ctx.moveTo(x + 80, cy)
  ctx.lineTo(x + w - 80, cy)
  ctx.stroke()
  ctx.setLineDash([])

  // Threshold bars (left end)
  drawThresholdBars(ctx, x + 4, cy, false)
  // Threshold bars (right end)
  drawThresholdBars(ctx, x + w - 4, cy, true)

  // Runway number labels
  ctx.font = 'bold 11px "Courier New"'
  ctx.fillStyle = C.marking
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(leftId, x + 22, cy)
  ctx.fillText(rightId, x + w - 22, cy)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Hold-short lines (at each end)
  ctx.strokeStyle = '#c8960a'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(RWY_LEFT_X + 2, y + 2)
  ctx.lineTo(RWY_LEFT_X + 2, y + RWY_H - 2)
  ctx.moveTo(RWY_RIGHT_X - 2, y + 2)
  ctx.lineTo(RWY_RIGHT_X - 2, y + RWY_H - 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawCargoArea(ctx: CanvasRenderingContext2D): void {
  const x = TERMINAL_X
  const w = RUNWAY_LENGTH

  // GA taxiway strip
  ctx.fillStyle = C.taxiway
  ctx.fillRect(x, CARGO_TAX_Y, w, CARGO_TAX_H)
  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x, CARGO_TAX_Y + CARGO_TAX_H / 2)
  ctx.lineTo(x + w, CARGO_TAX_Y + CARGO_TAX_H / 2)
  ctx.stroke()

  // GA ramp (concrete)
  ctx.fillStyle = C.apron
  ctx.fillRect(x, CARGO_APRON_Y, w, CARGO_APRON_H)
  ctx.font = 'bold 9px "Courier New"'
  ctx.fillStyle = '#666'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('GENERAL AVIATION RAMP', x + w / 2, CARGO_APRON_Y + CARGO_APRON_H / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // FBO building (small, left side)
  const fboW = 140; const fboH = CARGO_BLDG_H * 0.6
  const fboX = x + 30
  const fboY = CARGO_BLDG_Y + (CARGO_BLDG_H - fboH) / 2
  ctx.fillStyle = '#7a8a7a'
  ctx.fillRect(fboX, fboY, fboW, fboH)
  ctx.fillStyle = '#5a6a5a'
  ctx.fillRect(fboX, fboY, fboW, 8)
  ctx.font = 'bold 8px "Courier New"'
  ctx.fillStyle = '#ccc'
  ctx.textAlign = 'center'
  ctx.fillText('FBO', fboX + fboW / 2, fboY + fboH / 2 + 3)

  // Fuel depot (right side — two small tanks)
  const tankX = x + w - 100
  const tankY = CARGO_BLDG_Y + 6
  for (let t = 0; t < 2; t++) {
    ctx.fillStyle = '#5a6878'
    ctx.beginPath()
    ctx.arc(tankX + t * 36, tankY + 16, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#3a4858'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.font = '7px "Courier New"'
  ctx.fillStyle = '#aaa'
  ctx.textAlign = 'center'
  ctx.fillText('FUEL', tankX + 18, tankY + 38)
  ctx.textAlign = 'left'
}

function drawConnectors(ctx: CanvasRenderingContext2D): void {
  // Vertical taxiway strips on each end connecting Taxiway Alpha ↔ Taxiway Bravo.
  // Drawn after runways so they paint over the grass strip and runway-end areas.
  const topY    = TAXIWAY_ALPHA_Y
  const bottomY = TAXIWAY_BRAVO_Y + TAXIWAY_H
  const h       = bottomY - topY

  ctx.fillStyle = C.taxiway
  // Left connector (between MARGIN_X and RWY_LEFT_X)
  ctx.fillRect(MARGIN_X, topY, RWY_LEFT_X - MARGIN_X, h)
  // Right connector (between RWY_RIGHT_X and CANVAS_W - MARGIN_X)
  ctx.fillRect(RWY_RIGHT_X, topY, CANVAS_W - MARGIN_X - RWY_RIGHT_X, h)

  // Centerlines drawn by drawTaxiwayNetwork with smooth curves
}

/**
 * Draws the full taxiway centerline network as a single smooth path.
 * Alpha and Bravo are connected by the end-connectors, forming a rounded
 * rectangle — arcTo handles the quarter-circle transitions at each corner.
 */
function drawTaxiwayNetwork(ctx: CanvasRenderingContext2D): void {
  const r     = 11   // corner curve radius
  const alphaY = TAXIWAY_ALPHA_Y + TAXIWAY_H / 2
  const bravoY = TAXIWAY_BRAVO_Y + TAXIWAY_H / 2
  const lx    = CONNECTOR_LEFT_X
  const rx    = CONNECTOR_RIGHT_X

  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([])

  ctx.beginPath()
  // Start on Alpha, just east of the top-left curve
  ctx.moveTo(lx + r, alphaY)
  // → Alpha eastward
  ctx.lineTo(rx - r, alphaY)
  // ↘ top-right curve (Alpha → right connector, heading south)
  ctx.arcTo(rx, alphaY, rx, alphaY + r, r)
  // ↓ right connector downward
  ctx.lineTo(rx, bravoY - r)
  // ↙ bottom-right curve (right connector → Bravo, heading west)
  ctx.arcTo(rx, bravoY, rx - r, bravoY, r)
  // ← Bravo westward
  ctx.lineTo(lx + r, bravoY)
  // ↖ bottom-left curve (Bravo → left connector, heading north)
  ctx.arcTo(lx, bravoY, lx, bravoY - r, r)
  // ↑ left connector upward
  ctx.lineTo(lx, alphaY + r)
  // ↗ top-left curve (left connector → Alpha, heading east)
  ctx.arcTo(lx, alphaY, lx + r, alphaY, r)
  ctx.closePath()
  ctx.stroke()
}

/**
 * Curved lead-on lines at each hold-short entry point and straight lead-off
 * lines at each vacate exit point, connecting taxiway centerlines to the
 * runway centerline painted on the runway surface.
 */
function drawRunwayConnections(ctx: CanvasRenderingContext2D): void {
  const alphaY  = TAXIWAY_ALPHA_Y + TAXIWAY_H / 2
  const bravoY  = TAXIWAY_BRAVO_Y + TAXIWAY_H / 2
  const upCY    = RWY_UPPER_Y + RWY_H / 2
  const loCY    = RWY_LOWER_Y + RWY_H / 2
  const holdL   = RWY_LEFT_X  + HOLD_SHORT_OFFSET    // left entry x
  const holdR   = RWY_RIGHT_X - HOLD_SHORT_OFFSET    // right entry x
  const span    = RWY_RIGHT_X - RWY_LEFT_X
  const exitL   = RWY_LEFT_X  + span * 0.25           // left vacate x
  const exitR   = RWY_RIGHT_X - span * 0.25           // right vacate x
  const reach   = 55   // how far the lead-on extends along runway centerline

  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([])

  // ── Upper runway — Alpha is NORTH, entries curve south ───────────────────
  // Left entry: curve from Alpha down onto runway centerline, extending east
  ctx.beginPath()
  ctx.moveTo(holdL, alphaY)
  ctx.quadraticCurveTo(holdL, upCY, holdL + reach, upCY)
  ctx.stroke()
  // Right entry: curve from Alpha down onto runway centerline, extending west
  ctx.beginPath()
  ctx.moveTo(holdR, alphaY)
  ctx.quadraticCurveTo(holdR, upCY, holdR - reach, upCY)
  ctx.stroke()
  // Left exit: came from west heading east → smooth curve north to Alpha
  ctx.beginPath()
  ctx.moveTo(exitL - reach, upCY)
  ctx.quadraticCurveTo(exitL, upCY, exitL, alphaY)
  ctx.stroke()
  // Right exit: came from east heading west → smooth curve north to Alpha
  ctx.beginPath()
  ctx.moveTo(exitR + reach, upCY)
  ctx.quadraticCurveTo(exitR, upCY, exitR, alphaY)
  ctx.stroke()

  // ── Lower runway — Bravo is SOUTH, entries curve north ───────────────────
  // Left entry: curve from Bravo up onto runway centerline, extending east
  ctx.beginPath()
  ctx.moveTo(holdL, bravoY)
  ctx.quadraticCurveTo(holdL, loCY, holdL + reach, loCY)
  ctx.stroke()
  // Right entry: curve from Bravo up onto runway centerline, extending west
  ctx.beginPath()
  ctx.moveTo(holdR, bravoY)
  ctx.quadraticCurveTo(holdR, loCY, holdR - reach, loCY)
  ctx.stroke()
  // Left exit: came from west heading east → smooth curve south to Bravo
  ctx.beginPath()
  ctx.moveTo(exitL - reach, loCY)
  ctx.quadraticCurveTo(exitL, loCY, exitL, bravoY)
  ctx.stroke()
  // Right exit: came from east heading west → smooth curve south to Bravo
  ctx.beginPath()
  ctx.moveTo(exitR + reach, loCY)
  ctx.quadraticCurveTo(exitR, loCY, exitR, bravoY)
  ctx.stroke()
}

/**
 * Stopbar lights at each taxiway/runway entry point.
 * Drawn as dim red bars in the static canvas; UIRenderer overlays bright red
 * when the corresponding runway is occupied.
 *
 * Entry points on taxiway:
 *   Alpha/upper-runway boundary: y = RWY_UPPER_Y
 *   Lower-runway/Bravo boundary: y = TAXIWAY_BRAVO_Y
 * at x = RWY_LEFT_X + HOLD_SHORT_OFFSET (left side)
 * and x = RWY_RIGHT_X - HOLD_SHORT_OFFSET (right side)
 */
function drawStopbars(ctx: CanvasRenderingContext2D): void {
  const leftX  = RWY_LEFT_X  + HOLD_SHORT_OFFSET
  const rightX = RWY_RIGHT_X - HOLD_SHORT_OFFSET
  const hw = 13   // half-width of each bar cluster
  const bH = 3    // bar height
  const pad = 2   // black surround padding

  function drawBar(cx: number, barY: number): void {
    // Black surround
    ctx.fillStyle = '#111'
    ctx.fillRect(cx - hw - pad, barY - 1 - pad, hw * 2 + pad * 2, bH + pad * 2)
    // Yellow bar
    ctx.fillStyle = '#e8c800'
    ctx.fillRect(cx - hw, barY - 1, hw * 2, bH)
  }

  // Upper runway entry (from Taxiway Alpha)
  drawBar(leftX,  RWY_UPPER_Y)
  drawBar(rightX, RWY_UPPER_Y)
  // Lower runway entry (from Taxiway Bravo)
  drawBar(leftX,  TAXIWAY_BRAVO_Y)
  drawBar(rightX, TAXIWAY_BRAVO_Y)
}

function drawThresholdBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  flipDir: boolean
): void {
  const barW = 6; const barH = 10; const barGap = 5
  const barCount = 4
  const startX = flipDir ? x - barW - barCount * (barW + barGap) : x

  ctx.fillStyle = C.marking
  for (let i = 0; i < barCount; i++) {
    const bx = startX + i * (barW + barGap)
    ctx.fillRect(bx, cy - barH / 2, barW, barH)
  }
}

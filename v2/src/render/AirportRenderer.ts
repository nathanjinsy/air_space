import {
  CANVAS_W, CANVAS_H, MARGIN_X, RUNWAY_LENGTH,
  TERMINAL_X, TERMINAL_Y, TERMINAL_W, TERMINAL_H,
  APRON_Y, APRON_H,
  TAXIWAY_ALPHA_Y, TAXIWAY_H, TAXIWAY_BRAVO_Y,
  RWY_UPPER_Y, RWY_LOWER_Y, RWY_H,
  GRASS_STRIP_Y, GRASS_STRIP_H,
  RWY_LEFT_X, RWY_RIGHT_X,
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

  // 11. Cargo area (south end)
  drawCargoArea(ctx)
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

  // Darker roof stripe
  ctx.fillStyle = C.terminalRoof
  ctx.fillRect(TERMINAL_X, TERMINAL_Y, TERMINAL_W, 14)

  // Windows (rows of small blue rectangles)
  ctx.fillStyle = C.terminalWin
  const winW = 10; const winH = 7; const winGap = 18
  const winY1 = TERMINAL_Y + 20
  const winY2 = TERMINAL_Y + 38
  for (let wx = TERMINAL_X + 16; wx < TERMINAL_X + TERMINAL_W - 16; wx += winGap) {
    ctx.fillRect(wx, winY1, winW, winH)
    ctx.fillRect(wx, winY2, winW, winH)
  }
}

function drawGateJetways(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.jetway
  for (let i = 0; i < GATE_COUNT; i++) {
    const gx = MARGIN_X + GATE_SPACING * (i + 1)
    // Jetway: thin rectangle extending south from terminal bottom
    ctx.fillRect(gx - 3, TERMINAL_Y + TERMINAL_H, 6, APRON_H + 4)
    // Gate parking box outline
    ctx.strokeStyle = '#3a3030'
    ctx.lineWidth = 1
    ctx.strokeRect(gx - 16, GATE_Y - 8, 32, 16)
  }
}

function drawTaxiway(ctx: CanvasRenderingContext2D, y: number): void {
  // Fill
  ctx.fillStyle = C.taxiway
  ctx.fillRect(MARGIN_X, y, RUNWAY_LENGTH, TAXIWAY_H)

  // Yellow centerline dashes
  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([14, 10])
  ctx.beginPath()
  ctx.moveTo(MARGIN_X, y + TAXIWAY_H / 2)
  ctx.lineTo(MARGIN_X + RUNWAY_LENGTH, y + TAXIWAY_H / 2)
  ctx.stroke()
  ctx.setLineDash([])
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

  // Asphalt fill
  ctx.fillStyle = C.asphalt
  ctx.fillRect(x, y, w, RWY_H)

  // Edge shadows
  ctx.fillStyle = C.asphaltDark
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

  // Cargo taxiway (connects to Taxiway Bravo via the side connectors visually)
  ctx.fillStyle = C.taxiway
  ctx.fillRect(x, CARGO_TAX_Y, w, CARGO_TAX_H)
  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([14, 10])
  ctx.beginPath()
  ctx.moveTo(x, CARGO_TAX_Y + CARGO_TAX_H / 2)
  ctx.lineTo(x + w, CARGO_TAX_Y + CARGO_TAX_H / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Cargo apron (concrete)
  ctx.fillStyle = C.apron
  ctx.fillRect(x, CARGO_APRON_Y, w, CARGO_APRON_H)

  // Cargo stand markings — guide lines for aircraft parking
  const standW = Math.floor(w / (CARGO_STAND_COUNT + 1))
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  for (let i = 1; i <= CARGO_STAND_COUNT; i++) {
    const sx = x + standW * i
    ctx.beginPath()
    ctx.moveTo(sx, CARGO_APRON_Y + 4)
    ctx.lineTo(sx, CARGO_APRON_Y + CARGO_APRON_H - 4)
    ctx.stroke()
  }
  ctx.setLineDash([])

  // "CARGO" label on apron
  ctx.font = 'bold 9px "Courier New"'
  ctx.fillStyle = '#777'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CARGO APRON', x + w / 2, CARGO_APRON_Y + CARGO_APRON_H / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Two warehouse buildings side by side
  const bldgGap = 20
  const bldgW = (w - bldgGap * 3) / 2
  const bldg1X = x + bldgGap
  const bldg2X = bldg1X + bldgW + bldgGap

  for (const bx of [bldg1X, bldg2X]) {
    // Main wall
    ctx.fillStyle = '#6a6050'
    ctx.fillRect(bx, CARGO_BLDG_Y, bldgW, CARGO_BLDG_H)
    // Darker roof stripe
    ctx.fillStyle = '#4a3a2a'
    ctx.fillRect(bx, CARGO_BLDG_Y, bldgW, 10)
    // Loading bay doors (dark rectangles)
    ctx.fillStyle = '#3a3028'
    const doorW = 22; const doorH = 18; const doorGap = 38
    for (let d = bx + 30; d < bx + bldgW - 30; d += doorGap) {
      ctx.fillRect(d, CARGO_BLDG_Y + CARGO_BLDG_H - doorH - 2, doorW, doorH)
    }
    // Building label
    ctx.font = '8px "Courier New"'
    ctx.fillStyle = '#999'
    ctx.textAlign = 'center'
    ctx.fillText('CARGO', bx + bldgW / 2, CARGO_BLDG_Y + CARGO_BLDG_H / 2 + 4)
    ctx.textAlign = 'left'
  }
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

  // Yellow centerlines
  ctx.strokeStyle = C.taxiCenter
  ctx.lineWidth = 1.5
  ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.moveTo(CONNECTOR_LEFT_X,  topY);    ctx.lineTo(CONNECTOR_LEFT_X,  bottomY)
  ctx.moveTo(CONNECTOR_RIGHT_X, topY);    ctx.lineTo(CONNECTOR_RIGHT_X, bottomY)
  ctx.stroke()
  ctx.setLineDash([])
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

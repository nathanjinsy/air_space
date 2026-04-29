import type { GameState } from '../types'
import {
  CANVAS_W, C,
  RWY_UPPER_Y, TAXIWAY_BRAVO_Y, RWY_LEFT_X, RWY_RIGHT_X, HOLD_SHORT_OFFSET,
  CRASH_FLASH_MS,
} from '../constants'

export function renderUI(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawTopBar(ctx, state)
  drawStopbarOverlays(ctx, state)
  drawCrashFlash(ctx, state)
}

/** Bright red stopbar overlay when the runway is occupied. */
function drawStopbarOverlays(ctx: CanvasRenderingContext2D, state: GameState): void {
  const leftX  = RWY_LEFT_X  + HOLD_SHORT_OFFSET
  const rightX = RWY_RIGHT_X - HOLD_SHORT_OFFSET
  const hw = 14
  const bH = 4

  for (const rwy of state.runways) {
    if (rwy.status !== 'occupied') continue
    const stopY = (rwy.id === '09R') ? RWY_UPPER_Y : TAXIWAY_BRAVO_Y
    ctx.fillStyle = 'rgba(255, 45, 45, 0.90)'
    ctx.fillRect(leftX  - hw, stopY - bH / 2, hw * 2, bH)
    ctx.fillRect(rightX - hw, stopY - bH / 2, hw * 2, bH)
  }
}

function drawTopBar(ctx: CanvasRenderingContext2D, state: GameState): void {
  const barH = 28
  ctx.fillStyle = C.uiBg
  ctx.fillRect(0, 0, CANVAS_W, barH)

  ctx.font = 'bold 12px "Courier New"'
  ctx.fillStyle = C.uiText
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const active = state.aircraft.length
  ctx.fillText(`SCORE: ${state.score}`, 12, barH / 2)
  ctx.fillText(`PLANES: ${active}`, 160, barH / 2)

  // Runway status badges
  let rx = 340
  for (const rwy of state.runways) {
    const clear = rwy.status === 'available'
    ctx.fillStyle = clear ? 'rgba(30,60,30,0.9)' : 'rgba(60,20,20,0.9)'
    ctx.fillRect(rx, 4, 80, 20)
    ctx.strokeStyle = clear ? '#3a6a3a' : '#6a3a3a'
    ctx.lineWidth = 1
    ctx.strokeRect(rx, 4, 80, 20)
    ctx.fillStyle = clear ? C.clear : C.occupied
    ctx.font = '10px "Courier New"'
    ctx.fillText(`${rwy.id} ${clear ? '✓' : '✗'}`, rx + 6, barH / 2)
    rx += 90
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** Expanding red ring that fades out at the crash site — game continues underneath. */
function drawCrashFlash(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.crashPosition || state.crashFlashTimer <= 0) return

  const t = state.crashFlashTimer / CRASH_FLASH_MS  // 1 → 0 as it fades
  const { x, y } = state.crashPosition

  // Expanding filled circle
  const radius = 18 + (1 - t) * 60
  ctx.fillStyle = `rgba(200, 30, 30, ${t * 0.55})`
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Bright ring outline
  ctx.strokeStyle = `rgba(255, 80, 80, ${t * 0.9})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()

  // "CRASH" label — only visible while t > 0.4 (first 60% of flash duration)
  if (t > 0.4) {
    const textAlpha = (t - 0.4) / 0.6
    ctx.font = 'bold 14px "Courier New"'
    ctx.fillStyle = `rgba(255, 100, 100, ${textAlpha})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CRASH  −30', x, y - radius - 10)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }
}

import type { GameState } from '../types'
import { CANVAS_W, CANVAS_H, C } from '../constants'

export function renderUI(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawTopBar(ctx, state)

  if (state.gameOver) {
    drawGameOver(ctx, state)
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

function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.72)'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Crash flash at crash position
  if (state.crashPosition) {
    const { x, y } = state.crashPosition
    ctx.fillStyle = C.crashFlash
    ctx.beginPath()
    ctx.arc(x, y, 32, 0, Math.PI * 2)
    ctx.fill()
  }

  const cx = CANVAS_W / 2
  const cy = CANVAS_H / 2

  // CRASH text
  ctx.font = 'bold 56px "Courier New"'
  ctx.fillStyle = '#cc2222'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CRASH', cx, cy - 40)

  // Score
  ctx.font = 'bold 22px "Courier New"'
  ctx.fillStyle = '#ccc'
  ctx.fillText(`Final Score: ${state.score}`, cx, cy + 10)

  // Restart hint
  ctx.font = '13px "Courier New"'
  ctx.fillStyle = '#888'
  ctx.fillText('Click anywhere to restart', cx, cy + 44)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

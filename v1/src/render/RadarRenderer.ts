import type { World } from '../game/World'
import type { AircraftState } from '../types'

const RADAR_RANGE_NM = 120
const SWEEP_PERIOD_S = 6      // seconds per full rotation
const RING_INTERVALS = [30, 60, 90, 120]
const BLIP_RADIUS = 5
const HIT_RADIUS = 12
const TRAIL_ARC_RAD = Math.PI * 0.9  // trailing glow arc width

const COLOR_NORMAL   = '#00ff88'
const COLOR_WARNING  = '#ffaa00'
const COLOR_CONFLICT = '#ff3333'
const COLOR_CONTROL  = '#44aaff'
const COLOR_SELECTED = '#ffffff'
const COLOR_DIM      = 'rgba(0,255,136,0.15)'
const COLOR_RING     = 'rgba(0,255,136,0.12)'
const COLOR_SWEEP    = 'rgba(0,255,136,0.6)'

let sweepAngle = 0  // radians

export function renderRadar(
  ctx: CanvasRenderingContext2D,
  world: World,
  dt: number
): void {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const cx = W / 2
  const cy = H / 2
  const radiusPx = Math.min(W, H) / 2 - 4
  const scale = radiusPx / RADAR_RANGE_NM  // px per nm

  // Advance sweep angle
  sweepAngle = (sweepAngle + (2 * Math.PI / SWEEP_PERIOD_S) * dt) % (2 * Math.PI)

  // 1. Clear
  ctx.fillStyle = '#050d1a'
  ctx.fillRect(0, 0, W, H)

  // 2. Clip to radar circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radiusPx, 0, 2 * Math.PI)
  ctx.clip()

  // 3. Range rings
  ctx.strokeStyle = COLOR_RING
  ctx.lineWidth = 1
  for (const nm of RING_INTERVALS) {
    const r = nm * scale
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.stroke()
  }

  // 4. Cross-hair lines
  ctx.strokeStyle = COLOR_DIM
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, cy - radiusPx); ctx.lineTo(cx, cy + radiusPx)
  ctx.moveTo(cx - radiusPx, cy); ctx.lineTo(cx + radiusPx, cy)
  ctx.stroke()

  // 5. Sweep glow arc (trailing behind sweep line)
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx)
  grad.addColorStop(0, 'rgba(0,255,136,0)')
  grad.addColorStop(0.3, 'rgba(0,255,136,0.04)')
  grad.addColorStop(1, 'rgba(0,255,136,0.12)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radiusPx, sweepAngle - TRAIL_ARC_RAD, sweepAngle)
  ctx.closePath()
  ctx.fill()

  // 6. Sweep line
  ctx.strokeStyle = COLOR_SWEEP
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(
    cx + Math.cos(sweepAngle) * radiusPx,
    cy + Math.sin(sweepAngle) * radiusPx
  )
  ctx.stroke()

  // 7. Trails
  for (const ac of world.aircraft) {
    drawTrail(ctx, ac, cx, cy, scale)
  }

  // 8. Blips
  const conflictIds = new Set<string>()
  const warningIds = new Set<string>()
  for (const c of world.conflicts) {
    if (c.severity === 'conflict') {
      conflictIds.add(c.a.id); conflictIds.add(c.b.id)
    } else {
      warningIds.add(c.a.id); warningIds.add(c.b.id)
    }
  }

  for (const ac of world.aircraft) {
    const px = worldToCanvasX(ac.x, cx, scale)
    const py = worldToCanvasY(ac.y, cy, scale)
    const isSelected = ac.id === world.selectedId

    let color = COLOR_NORMAL
    if (ac.isUnderControl) color = COLOR_CONTROL
    if (warningIds.has(ac.id)) color = COLOR_WARNING
    if (conflictIds.has(ac.id)) color = COLOR_CONFLICT

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = COLOR_SELECTED
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, BLIP_RADIUS + 6, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Blip
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px, py, BLIP_RADIUS, 0, 2 * Math.PI)
    ctx.fill()

    // Heading tick
    drawHeadingTick(ctx, ac, px, py, color)

    // Data tag
    drawDataTag(ctx, ac, px, py, color, isSelected)
  }

  ctx.restore()  // end clip

  // 9. Outer bezel ring
  ctx.strokeStyle = '#0a3a1a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radiusPx + 1, 0, 2 * Math.PI)
  ctx.stroke()

  // 10. Compass labels
  drawCompassLabels(ctx, cx, cy, radiusPx)
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  ac: AircraftState,
  cx: number, cy: number, scale: number
): void {
  for (let i = 0; i < ac.trail.length; i++) {
    const alpha = (i + 1) / ac.trail.length * 0.5
    const r = 2
    ctx.fillStyle = `rgba(0,255,136,${alpha})`
    const px = worldToCanvasX(ac.trail[i].x, cx, scale)
    const py = worldToCanvasY(ac.trail[i].y, cy, scale)
    ctx.beginPath()
    ctx.arc(px, py, r, 0, 2 * Math.PI)
    ctx.fill()
  }
}

function drawHeadingTick(
  ctx: CanvasRenderingContext2D,
  ac: AircraftState,
  px: number, py: number,
  color: string
): void {
  // Short line in the direction of heading (canvas: 0=east, heading: 0=north)
  const rad = ((ac.heading - 90) * Math.PI) / 180
  const len = 14
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(px + Math.cos(rad) * len, py + Math.sin(rad) * len)
  ctx.stroke()
}

function drawDataTag(
  ctx: CanvasRenderingContext2D,
  ac: AircraftState,
  px: number, py: number,
  color: string,
  isSelected: boolean
): void {
  const flLevel = Math.round(ac.altitude / 100)
  const fl = `FL${flLevel.toString().padStart(3, '0')}`
  const spd = `${Math.round(ac.speed)}kt`

  const offsetX = 12
  const offsetY = -12

  ctx.font = isSelected ? 'bold 11px "Courier New"' : '10px "Courier New"'
  ctx.fillStyle = color

  ctx.fillText(ac.callsign, px + offsetX, py + offsetY)
  ctx.fillStyle = isSelected ? color : 'rgba(0,200,100,0.75)'
  ctx.font = '9px "Courier New"'
  ctx.fillText(fl, px + offsetX, py + offsetY + 11)
  ctx.fillText(spd, px + offsetX, py + offsetY + 21)
}

function drawCompassLabels(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number
): void {
  const labels = [
    { text: 'N', angle: -Math.PI / 2 },
    { text: 'E', angle: 0 },
    { text: 'S', angle: Math.PI / 2 },
    { text: 'W', angle: Math.PI },
  ]
  ctx.font = '10px "Courier New"'
  ctx.fillStyle = 'rgba(0,255,136,0.35)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const { text, angle } of labels) {
    const lx = cx + Math.cos(angle) * (radius - 12)
    const ly = cy + Math.sin(angle) * (radius - 12)
    ctx.fillText(text, lx, ly)
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

export function worldToCanvasX(wx: number, cx: number, scale: number): number {
  return cx + wx * scale
}

export function worldToCanvasY(wy: number, cy: number, scale: number): number {
  return cy - wy * scale  // flip Y: canvas Y grows downward, world Y grows northward
}

/** Returns aircraft id at canvas position (mx, my), or null */
export function hitTest(
  mx: number, my: number,
  aircraft: AircraftState[],
  cx: number, cy: number, scale: number
): string | null {
  for (const ac of aircraft) {
    const px = worldToCanvasX(ac.x, cx, scale)
    const py = worldToCanvasY(ac.y, cy, scale)
    const dx = mx - px
    const dy = my - py
    if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
      return ac.id
    }
  }
  return null
}

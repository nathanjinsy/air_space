import type { Aircraft } from '../types'
import { C, PLANE_LENGTH, PLANE_WINGSPAN } from '../constants'

// Nose offset from aircraft center (half the fuselage length, local −y = north)
const NOSE_OFFSET = PLANE_LENGTH / 2

const PHASE_LABELS: Partial<Record<string, string>> = {
  approaching:       'APPR',
  cleared_to_land:   'CLR',
  landing_roll:      'LDG',
  vacating:          'VAC',
  taxiing_to_gate:   'TAXI',
  at_gate:           'GATE',
  pushing_back:      'PUSH',
  taxiing_to_runway: 'TAXI',
  holding_short:     'HOLD',
  lining_up:         'L/U',
  lined_up:          'RDY',
  taking_off:        'T/O',
}

export function renderAircraft(
  ctx: CanvasRenderingContext2D,
  aircraft: Aircraft[],
  selectedId: string | null
): void {
  for (const ac of aircraft) {
    drawPlane(ctx, ac, ac.id === selectedId)
  }
}

function drawPlane(
  ctx: CanvasRenderingContext2D,
  ac: Aircraft,
  isSelected: boolean
): void {
  const { x, y, heading, liveryColor, crashInvolved } = ac

  // Rotate so the shape's local −y (nose) points in the heading direction.
  // heading 0=North→up, 90=East→right, 270=West→left
  const rad = (heading * Math.PI) / 180

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rad)

  // Drop shadow
  ctx.save()
  ctx.translate(3, 3)
  ctx.globalAlpha = 0.2
  drawPlaneShape(ctx, liveryColor, true)
  ctx.restore()
  ctx.globalAlpha = 1

  // Selection ring (drawn before plane so it's underneath)
  if (isSelected) {
    ctx.strokeStyle = C.selectionRing
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.ellipse(0, 0, PLANE_LENGTH * 0.7, PLANE_LENGTH * 0.7, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Crash highlight
  if (crashInvolved) {
    ctx.strokeStyle = '#ff3333'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(0, 0, PLANE_LENGTH * 0.8, PLANE_LENGTH * 0.8, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  drawPlaneShape(ctx, liveryColor, false)

  ctx.restore()

  // Pushback tug — attached to aircraft nose during at_gate and pushing_back
  if (ac.phase === 'at_gate' || ac.phase === 'pushing_back') {
    drawPushbackTug(ctx, ac)
  }

  // Label (drawn in screen space, not rotated)
  drawLabel(ctx, ac, isSelected)
}

function drawPlaneShape(
  ctx: CanvasRenderingContext2D,
  liveryColor: string,
  shadow: boolean
): void {
  const fill = shadow ? '#000' : C.planeBody
  const hl = PLANE_LENGTH / 2
  const hw = PLANE_WINGSPAN / 2

  // Fuselage: rounded rectangle, forward = negative Y (up in local space after rotation)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.ellipse(0, 0, 5, hl, 0, 0, Math.PI * 2)
  ctx.fill()

  // Wings: two trapezoids
  ctx.fillStyle = fill
  // Left wing
  ctx.beginPath()
  ctx.moveTo(-3, -4)
  ctx.lineTo(-hw, 4)
  ctx.lineTo(-hw + 3, 8)
  ctx.lineTo(3, 0)
  ctx.closePath()
  ctx.fill()
  // Right wing
  ctx.beginPath()
  ctx.moveTo(3, -4)
  ctx.lineTo(hw, 4)
  ctx.lineTo(hw - 3, 8)
  ctx.lineTo(-3, 0)
  ctx.closePath()
  ctx.fill()

  // Tail fin
  if (!shadow) {
    ctx.fillStyle = liveryColor
  }
  ctx.beginPath()
  ctx.moveTo(-3, hl - 4)
  ctx.lineTo(3, hl - 4)
  ctx.lineTo(2, hl + 2)
  ctx.lineTo(-2, hl + 2)
  ctx.closePath()
  ctx.fill()

  // Livery stripe on fuselage
  if (!shadow) {
    ctx.fillStyle = liveryColor
    ctx.globalAlpha = 0.7
    ctx.fillRect(-4, -hl * 0.3, 8, hl * 0.5)
    ctx.globalAlpha = 1
  }
}

/**
 * Draw a pushback tug at the aircraft's nose position (world space).
 * The tug is always just north of the nose since parked aircraft at a gate
 * always face north (heading ≈ 0°).
 */
function drawPushbackTug(ctx: CanvasRenderingContext2D, ac: Aircraft): void {
  // The renderer rotates local -y to point in the heading direction.
  // In world space, the nose offset vector is (+sin θ, -cos θ) where θ = heading in radians.
  // heading=0° (north): nose at (ac.x, ac.y - NOSE_OFFSET)  ✓ (toward terminal)
  // heading=90° (east): nose at (ac.x + NOSE_OFFSET, ac.y)  ✓
  const rad = (ac.heading * Math.PI) / 180
  const nx = Math.sin(rad)
  const ny = -Math.cos(rad)

  const noseX = ac.x + nx * NOSE_OFFSET
  const noseY = ac.y + ny * NOSE_OFFSET

  // Tug sits 8px further beyond the nose
  const tugX = ac.x + nx * (NOSE_OFFSET + 8)
  const tugY = ac.y + ny * (NOSE_OFFSET + 8)

  // Towbar (thin line from nose to tug)
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(noseX, noseY)
  ctx.lineTo(tugX, tugY)
  ctx.stroke()

  // Tug body (small yellow vehicle)
  ctx.save()
  ctx.translate(tugX, tugY)
  ctx.fillStyle = '#d4a010'
  ctx.fillRect(-5, -3, 10, 6)   // body
  ctx.fillStyle = '#9a7010'
  ctx.fillRect(-4, -4, 8, 2)    // roof/cab
  ctx.fillStyle = '#111'
  ctx.fillRect(-4, 3, 3, 2)     // rear wheels
  ctx.fillRect(1, 3, 3, 2)      // front wheels
  ctx.restore()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  ac: Aircraft,
  isSelected: boolean
): void {
  const labelX = ac.x + 14
  const labelY = ac.y - 14

  const phase = PHASE_LABELS[ac.phase] ?? ac.phase

  ctx.font = isSelected ? 'bold 10px "Courier New"' : '9px "Courier New"'
  ctx.fillStyle = isSelected ? '#fff' : '#ccc'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(ac.callsign, labelX, labelY)

  ctx.font = '8px "Courier New"'
  ctx.fillStyle = isSelected ? '#ddd' : '#888'
  ctx.fillText(phase, labelX, labelY + 10)

  if (ac.phase === 'at_gate' && ac.boardingTimer > 0) {
    const secs = Math.ceil(ac.boardingTimer / 1000)
    ctx.fillText(`${secs}s`, labelX, labelY + 20)
  }
}

import type { Vehicle } from '../types'

// ---------------------------------------------------------------------------
// Vehicle sprites — drawn in local space (0,0 = vehicle center)
// All vehicles travel east-west only; facingRight selects which end is "front"
// ---------------------------------------------------------------------------

export function renderVehicles(ctx: CanvasRenderingContext2D, vehicles: Vehicle[]): void {
  for (const v of vehicles) {
    ctx.save()
    ctx.translate(Math.round(v.x), Math.round(v.y))

    const facingRight = v.heading === 90
    switch (v.type) {
      case 'fuel_truck':   drawFuelTruck(ctx, v.color, facingRight);   break
      case 'baggage_cart': drawBaggageCart(ctx, v.color, facingRight); break
      case 'tug':          drawTug(ctx, v.color, facingRight);         break
    }

    ctx.restore()
  }
}

// ---------------------------------------------------------------------------

function drawFuelTruck(ctx: CanvasRenderingContext2D, color: string, facingRight: boolean): void {
  const d = facingRight ? 1 : -1

  // Tank body (rear)
  ctx.fillStyle = '#9a7220'
  ctx.fillRect(-d * 6, -3, d * 9, 6)

  // Cab (front)
  ctx.fillStyle = color
  ctx.fillRect(d * 3, -4, d * 5, 7)

  // Headlight glint
  ctx.fillStyle = '#ffe080'
  ctx.fillRect(d * 7, -2, d * 1, 2)

  // Wheels
  ctx.fillStyle = '#111'
  ctx.fillRect(d * 3, 3, d * 3, 2)
  ctx.fillRect(-d * 5, 3, d * 3, 2)
}

function drawBaggageCart(ctx: CanvasRenderingContext2D, color: string, facingRight: boolean): void {
  const d = facingRight ? 1 : -1

  // Flat cargo bed
  ctx.fillStyle = color
  ctx.fillRect(-7, -2, 14, 5)

  // Front bumper / cab indicator
  ctx.fillStyle = '#2a5a2a'
  ctx.fillRect(d * 7, -2, d * 2, 5)

  // Wheels
  ctx.fillStyle = '#111'
  ctx.fillRect(-6, 3, 3, 2)
  ctx.fillRect(3, 3, 3, 2)
}

function drawTug(ctx: CanvasRenderingContext2D, color: string, facingRight: boolean): void {
  const d = facingRight ? 1 : -1

  // Boxy body
  ctx.fillStyle = color
  ctx.fillRect(-5, -4, 10, 8)

  // Engine cover (darker square, front half)
  ctx.fillStyle = '#5a3010'
  ctx.fillRect(d * 0, -3, d * 4, 4)

  // Wheel hint
  ctx.fillStyle = '#111'
  ctx.fillRect(d * 1, 4, d * 3, 2)
  ctx.fillRect(-d * 4, 4, d * 3, 2)
}

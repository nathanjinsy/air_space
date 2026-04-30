import type { RoadVehicle } from '../game/RoadVehicles'

const CAR_W = 14;  const CAR_H = 6
const BUS_W = 30;  const BUS_H = 9

export function renderRoadVehicles(
  ctx: CanvasRenderingContext2D,
  vehicles: readonly RoadVehicle[]
): void {
  for (const v of vehicles) drawRoadVehicle(ctx, v)
}

function drawRoadVehicle(ctx: CanvasRenderingContext2D, v: RoadVehicle): void {
  const w = v.type === 'bus' ? BUS_W : CAR_W
  const h = v.type === 'bus' ? BUS_H : CAR_H

  ctx.save()
  ctx.translate(v.x, v.y)
  if (v.heading === 270) ctx.scale(-1, 1)   // flip westbound to face left

  // Body
  ctx.fillStyle = v.color
  ctx.fillRect(-w / 2, -h / 2, w, h)

  // Windshield (front = right side before flip)
  ctx.fillStyle = 'rgba(170,215,240,0.75)'
  const wsW = v.type === 'bus' ? 5 : 4
  ctx.fillRect(w / 2 - wsW - 1, -h / 2 + 1, wsW, h - 2)

  // Taxi checker stripe along the side
  if (v.type === 'taxi') {
    ctx.fillStyle = '#111'
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) ctx.fillRect(-w / 2 + 2 + i * 3, -h / 2, 3, 3)
    }
  }

  // Bus windows
  if (v.type === 'bus') {
    ctx.fillStyle = 'rgba(170,215,240,0.6)'
    for (let wx = -w / 2 + 4; wx < w / 2 - 6; wx += 6) {
      ctx.fillRect(wx, -h / 2 + 1, 4, h - 2)
    }
  }

  // Wheels
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(-w / 2 + 2, h / 2 - 2, 4, 2)   // rear axle
  ctx.fillRect( w / 2 - 6,  h / 2 - 2, 4, 2)   // front axle

  ctx.restore()
}

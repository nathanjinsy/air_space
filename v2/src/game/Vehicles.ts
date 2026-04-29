import type { Vehicle } from '../types'
import {
  GATE_Y, RWY_LEFT_X, RWY_RIGHT_X,
  CARGO_APRON_Y, CARGO_APRON_H, MARGIN_X, CANVAS_W,
} from '../constants'

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function makeVehicles(): Vehicle[] {
  const apronY = GATE_Y                             // terminal apron centerline
  const cargoY = CARGO_APRON_Y + CARGO_APRON_H / 2 // cargo apron centerline
  const midX   = (RWY_LEFT_X + RWY_RIGHT_X) / 2

  return [
    // — Terminal apron: two fuel trucks patrolling opposite halves —
    {
      id: 'veh-ft1', type: 'fuel_truck',
      x: RWY_LEFT_X + 100, y: apronY - 4,
      heading: 90, speed: 18,
      patrolMin: RWY_LEFT_X + 50, patrolMax: midX - 30,
      color: '#c8960a',
    },
    {
      id: 'veh-ft2', type: 'fuel_truck',
      x: RWY_RIGHT_X - 100, y: apronY - 4,
      heading: 270, speed: 18,
      patrolMin: midX + 30, patrolMax: RWY_RIGHT_X - 50,
      color: '#c8960a',
    },

    // — Terminal apron: two baggage carts in the other lane —
    {
      id: 'veh-bc1', type: 'baggage_cart',
      x: RWY_LEFT_X + 160, y: apronY + 4,
      heading: 90, speed: 13,
      patrolMin: RWY_LEFT_X + 50, patrolMax: midX + 80,
      color: '#4a7a4a',
    },
    {
      id: 'veh-bc2', type: 'baggage_cart',
      x: RWY_RIGHT_X - 220, y: apronY + 4,
      heading: 270, speed: 13,
      patrolMin: midX - 80, patrolMax: RWY_RIGHT_X - 50,
      color: '#4a7a4a',
    },

    // — Cargo apron: two tugs —
    {
      id: 'veh-tg1', type: 'tug',
      x: MARGIN_X + 120, y: cargoY,
      heading: 90, speed: 10,
      patrolMin: MARGIN_X + 60, patrolMax: CANVAS_W / 2 - 30,
      color: '#8a5a3a',
    },
    {
      id: 'veh-tg2', type: 'tug',
      x: CANVAS_W - MARGIN_X - 120, y: cargoY,
      heading: 270, speed: 10,
      patrolMin: CANVAS_W / 2 + 30, patrolMax: CANVAS_W - MARGIN_X - 60,
      color: '#8a5a3a',
    },
  ]
}

// ---------------------------------------------------------------------------
// Per-frame update — simple east/west ping-pong patrol
// ---------------------------------------------------------------------------

export function updateVehicles(vehicles: Vehicle[], dt: number): void {
  for (const v of vehicles) {
    const dir = v.heading === 90 ? 1 : -1
    v.x += dir * v.speed * dt

    if (v.heading === 90 && v.x >= v.patrolMax) {
      v.x = v.patrolMax
      v.heading = 270
    } else if (v.heading === 270 && v.x <= v.patrolMin) {
      v.x = v.patrolMin
      v.heading = 90
    }
  }
}

export function resetVehicles(): Vehicle[] {
  return makeVehicles()
}

import {
  CANVAS_W, MARGIN_X, RUNWAY_LENGTH,
  ROAD_UPPER_Y, ROAD_LOWER_Y,
  GATE_COUNT,
} from '../constants'

export interface RoadVehicle {
  id: string
  type: 'car' | 'taxi' | 'bus'
  x: number
  y: number
  heading: 90 | 270   // 90=east (arriving/upper lane), 270=west (departing/lower lane)
  speed: number
  stopX: number | null // x to stop at; null = non-stop pass-through
  stopTimer: number    // ms remaining at stop
  color: string
}

const CAR_COLORS  = ['#4a5a6a', '#6a4040', '#4a6040', '#6a5a38', '#584868', '#5a5a3a']
const BUS_COLORS  = ['#2a5a8a', '#2a683a', '#6a4828']
const GATE_SPACING = RUNWAY_LENGTH / (GATE_COUNT + 1)
const STOP_ZONES  = Array.from({ length: GATE_COUNT }, (_, i) =>
  Math.round(MARGIN_X + GATE_SPACING * (i + 1))
)

let vehicles: RoadVehicle[] = []
let spawnTimer = 1500
let idCounter  = 0
let nextLane: 'upper' | 'lower' = 'upper'

function nextId(): string { return `rv${++idCounter}` }

function spawnVehicle(): void {
  const upper = nextLane === 'upper'
  nextLane = upper ? 'lower' : 'upper'

  const roll = Math.random()
  const type: 'car' | 'taxi' | 'bus' =
    roll < 0.55 ? 'car' : roll < 0.80 ? 'taxi' : 'bus'

  const willStop = Math.random() < 0.72
  const stopX    = willStop
    ? STOP_ZONES[Math.floor(Math.random() * STOP_ZONES.length)]
    : null
  const stopTimer = type === 'bus'  ? 4500 + Math.random() * 3500
                  : type === 'taxi' ? 2200 + Math.random() * 2000
                  :                   1200 + Math.random() * 1500

  const color = type === 'taxi' ? '#d4a010'
              : type === 'bus'  ? BUS_COLORS[Math.floor(Math.random() * BUS_COLORS.length)]
              :                   CAR_COLORS [Math.floor(Math.random() * CAR_COLORS.length)]

  const speed = type === 'bus' ? 52 : type === 'taxi' ? 68 : 78

  vehicles.push({
    id: nextId(),
    type,
    x:       upper ? -60 : CANVAS_W + 60,
    y:       upper ? ROAD_UPPER_Y : ROAD_LOWER_Y,
    heading: upper ? 90 : 270,
    speed,
    stopX:    willStop ? stopX : null,
    stopTimer: willStop ? stopTimer : 0,
    color,
  })
}

export function tickRoadVehicles(dt: number): void {
  spawnTimer -= dt * 1000
  if (spawnTimer <= 0) {
    spawnTimer = 3000 + Math.random() * 4500
    spawnVehicle()
  }

  for (const v of vehicles) {
    const eastbound = v.heading === 90

    // At stop — count down then resume
    if (v.stopX !== null && v.stopTimer > 0) {
      const atStop = eastbound ? v.x >= v.stopX : v.x <= v.stopX
      if (atStop) {
        v.x = v.stopX
        v.stopTimer -= dt * 1000
        if (v.stopTimer <= 0) { v.stopTimer = 0; v.stopX = null }
        continue
      }
    }

    v.x += (eastbound ? 1 : -1) * v.speed * dt
  }

  // Cull off-screen vehicles
  vehicles = vehicles.filter(v => v.x > -100 && v.x < CANVAS_W + 100)
}

export function getRoadVehicles(): readonly RoadVehicle[] { return vehicles }

export function resetRoadVehicles(): void {
  vehicles   = []
  spawnTimer = 1500
  nextLane   = 'upper'
}

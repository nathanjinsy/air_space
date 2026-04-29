import type { Aircraft, GameState } from '../types'
import {
  CALLSIGNS, LIVERY_COLORS,
  SPAWN_BASE_MS, SPAWN_MIN_MS, SPAWN_SCORE_STEP,
  APPROACH_SPEED, CANVAS_W,
} from '../constants'
import { makeRunways, approachPathFromLeft, approachPathFromRight } from './Airport'

let idCounter = 0
let usedCallsigns: Set<string> = new Set()

function nextId(): string { return `ac${++idCounter}` }

function pickCallsign(): string {
  const available = CALLSIGNS.filter(c => !usedCallsigns.has(c))
  const pool = available.length > 0 ? available : CALLSIGNS
  const pick = pool[Math.floor(Math.random() * pool.length)]
  usedCallsigns.add(pick)
  return pick
}

function spawnInterval(score: number): number {
  const reduction = Math.floor(score / SPAWN_SCORE_STEP) * 1000
  return Math.max(SPAWN_MIN_MS, SPAWN_BASE_MS - reduction)
}

export function initSpawnTimer(state: GameState): void {
  state.spawnTimer = SPAWN_BASE_MS
}

export function tickSpawner(state: GameState, dt: number): void {
  state.spawnTimer -= dt * 1000
  if (state.spawnTimer > 0) return

  state.spawnTimer = spawnInterval(state.score)
  spawnPlane(state)
}

let spawnFromRight = false  // alternate sides

function spawnPlane(state: GameState): void {
  // Use temporary runway geometry for approach path calculation
  const runways = makeRunways()
  const runway = runways[Math.floor(Math.random() * runways.length)]

  const fromRight = spawnFromRight
  spawnFromRight = !spawnFromRight

  const waypoints = fromRight
    ? approachPathFromRight(runway)
    : approachPathFromLeft(runway)

  const startX = fromRight ? CANVAS_W + 80 : -80

  const ac: Aircraft = {
    id: nextId(),
    callsign: pickCallsign(),
    liveryColor: LIVERY_COLORS[Math.floor(Math.random() * LIVERY_COLORS.length)],
    x: startX,
    y: runway.centerY,
    heading: fromRight ? 270 : 90,  // 270=west, 90=east
    speed: APPROACH_SPEED,
    phase: 'approaching',
    assignedRunway: null,
    assignedGate: null,
    waypoints,
    boardingTimer: 0,
    crashInvolved: false,
    fromRight,
  }

  state.aircraft.push(ac)
}

export function releaseCallsign(callsign: string): void {
  usedCallsigns.delete(callsign)
}

export function resetSpawner(): void {
  idCounter = 0
  usedCallsigns = new Set()
  spawnFromRight = false
}

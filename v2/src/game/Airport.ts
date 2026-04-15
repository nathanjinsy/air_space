import type { Point, Runway, Gate } from '../types'
import {
  CANVAS_W, MARGIN_X,
  RWY_UPPER_CENTER_Y, RWY_LOWER_CENTER_Y,
  RWY_LEFT_X, RWY_RIGHT_X,
  TAXIWAY_ALPHA_Y, TAXIWAY_H, TAXIWAY_BRAVO_Y,
  CONNECTOR_LEFT_X, CONNECTOR_RIGHT_X,
  GATE_COUNT, GATE_Y, GATE_SPACING,
  HOLD_SHORT_OFFSET,
} from '../constants'

// ---------------------------------------------------------------------------
// Static airport geometry factory
// ---------------------------------------------------------------------------

export function makeRunways(): Runway[] {
  return [
    {
      id: '09R', reciprocal: '27L',
      thresholdLeft:  { x: RWY_LEFT_X,  y: RWY_UPPER_CENTER_Y },
      thresholdRight: { x: RWY_RIGHT_X, y: RWY_UPPER_CENTER_Y },
      centerY: RWY_UPPER_CENTER_Y,
      status: 'available', occupiedBy: null,
    },
    {
      id: '09L', reciprocal: '27R',
      thresholdLeft:  { x: RWY_LEFT_X,  y: RWY_LOWER_CENTER_Y },
      thresholdRight: { x: RWY_RIGHT_X, y: RWY_LOWER_CENTER_Y },
      centerY: RWY_LOWER_CENTER_Y,
      status: 'available', occupiedBy: null,
    },
  ]
}

export function makeGates(): Gate[] {
  const gates: Gate[] = []
  for (let i = 0; i < GATE_COUNT; i++) {
    const x = MARGIN_X + GATE_SPACING * (i + 1)
    gates.push({
      id: `G${i + 1}`,
      position: { x, y: GATE_Y },
      occupied: false,
      occupiedBy: null,
    })
  }
  return gates
}

// ---------------------------------------------------------------------------
// Approach paths — 4-point path from screen edge to runway threshold
// ---------------------------------------------------------------------------

/** Path for plane approaching from the LEFT (heading east ~090°) */
export function approachPathFromLeft(runway: Runway): Point[] {
  const threshold = runway.thresholdLeft
  return [
    { x: -80,              y: runway.centerY },
    { x: MARGIN_X - 10,   y: runway.centerY },
    { x: threshold.x,     y: runway.centerY },
  ]
}

/** Path for plane approaching from the RIGHT (heading west ~270°) */
export function approachPathFromRight(runway: Runway): Point[] {
  const threshold = runway.thresholdRight
  return [
    { x: CANVAS_W + 80,   y: runway.centerY },
    { x: CANVAS_W - MARGIN_X + 10, y: runway.centerY },
    { x: threshold.x,     y: runway.centerY },
  ]
}

// ---------------------------------------------------------------------------
// Vacate path — from landing roll end to Taxiway Alpha
// ---------------------------------------------------------------------------

const ALPHA_Y = TAXIWAY_ALPHA_Y + TAXIWAY_H / 2
const BRAVO_Y = TAXIWAY_BRAVO_Y + TAXIWAY_H / 2

function isUpperRunway(runway: Runway): boolean {
  return runway.centerY === RWY_UPPER_CENTER_Y
}

/**
 * Upper runway (09R/27L): vacate directly north to Taxiway Alpha.
 * Lower runway (09L/27R): vacate south to Taxiway Bravo, then use the
 * end-connector taxiway (left or right side) to reach Taxiway Alpha —
 * never crossing the upper runway or grass.
 */
export function vacatePath(runway: Runway, fromRight: boolean): Point[] {
  const exitX = fromRight
    ? RWY_RIGHT_X - (RWY_RIGHT_X - RWY_LEFT_X) * 0.25  // 75 % mark
    : RWY_LEFT_X  + (RWY_RIGHT_X - RWY_LEFT_X) * 0.25  // 25 % mark

  if (isUpperRunway(runway)) {
    return [
      { x: exitX,             y: runway.centerY },
      { x: exitX,             y: ALPHA_Y },
    ]
  }

  // Lower runway: south → Bravo → connector → Alpha
  const connX = fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
  return [
    { x: exitX,  y: runway.centerY },
    { x: exitX,  y: BRAVO_Y },
    { x: connX,  y: BRAVO_Y },
    { x: connX,  y: ALPHA_Y },
  ]
}

/**
 * X position where the plane arrives at Taxiway Alpha after vacating.
 * Used by Aircraft.ts to pick the nearest gate.
 */
export function vacateArrivalX(runway: Runway, fromRight: boolean): number {
  if (isUpperRunway(runway)) {
    return fromRight
      ? RWY_RIGHT_X - (RWY_RIGHT_X - RWY_LEFT_X) * 0.25
      : RWY_LEFT_X  + (RWY_RIGHT_X - RWY_LEFT_X) * 0.25
  }
  return fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
}

// ---------------------------------------------------------------------------
// Taxi paths — taxiway waypoints to/from gates
// ---------------------------------------------------------------------------

/** Taxiway centerline Y — always Taxiway Alpha (nearest to terminal). */
function taxiYForRunway(_runway: Runway): number {
  return TAXIWAY_ALPHA_Y + TAXIWAY_H / 2
}

/** Gate apron Y (south face of terminal) */
const APRON_CENTER_Y = GATE_Y

export function taxiPathToGate(vacateEnd: Point, gate: Gate, runway: Runway): Point[] {
  const taxiY = taxiYForRunway(runway)
  return [
    { x: vacateEnd.x, y: taxiY },
    { x: gate.position.x, y: taxiY },
    { x: gate.position.x, y: APRON_CENTER_Y },
  ]
}

export function taxiPathToRunway(gate: Gate, runway: Runway, fromRight: boolean): Point[] {
  const holdX = fromRight
    ? runway.thresholdRight.x - HOLD_SHORT_OFFSET
    : runway.thresholdLeft.x + HOLD_SHORT_OFFSET

  if (isUpperRunway(runway)) {
    // Gate → Alpha → hold-short → upper runway
    return [
      { x: gate.position.x, y: APRON_CENTER_Y },
      { x: gate.position.x, y: ALPHA_Y },
      { x: holdX,           y: ALPHA_Y },
      { x: holdX,           y: runway.centerY },
    ]
  }

  // Lower runway: gate → Alpha → connector → Bravo → hold-short → lower runway
  const connX = fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
  return [
    { x: gate.position.x, y: APRON_CENTER_Y },
    { x: gate.position.x, y: ALPHA_Y },
    { x: connX,           y: ALPHA_Y },
    { x: connX,           y: BRAVO_Y },
    { x: holdX,           y: BRAVO_Y },
    { x: holdX,           y: runway.centerY },
  ]
}

// ---------------------------------------------------------------------------
// Takeoff path — accelerate down runway and off screen
// ---------------------------------------------------------------------------
export function takeoffPath(runway: Runway, fromRight: boolean): Point[] {
  if (fromRight) {
    // Took off toward the right (27 direction)
    return [{ x: CANVAS_W + 120, y: runway.centerY }]
  } else {
    // Took off toward the left (09 direction? no — depart opposite to arrival)
    return [{ x: -120, y: runway.centerY }]
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function findRunwayById(runways: Runway[], id: string): Runway | undefined {
  return runways.find(r => r.id === id || r.reciprocal === id)
}

export function findGateById(gates: Gate[], id: string): Gate | undefined {
  return gates.find(g => g.id === id)
}

export function findFreeGate(gates: Gate[]): Gate | undefined {
  return gates.find(g => !g.occupied)
}


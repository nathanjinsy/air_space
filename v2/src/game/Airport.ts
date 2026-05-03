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
 * Lower runway (09L/27R): vacate directly south to Taxiway Bravo (near terminal).
 * Upper runway (09R/27L): vacate north to Taxiway Alpha, then use the
 * end-connector taxiway to reach Taxiway Bravo — never crossing grass or lower runway.
 */
export function vacatePath(runway: Runway, fromRight: boolean): Point[] {
  const exitX = fromRight
    ? RWY_RIGHT_X - (RWY_RIGHT_X - RWY_LEFT_X) * 0.25  // 75 % mark
    : RWY_LEFT_X  + (RWY_RIGHT_X - RWY_LEFT_X) * 0.25  // 25 % mark

  if (!isUpperRunway(runway)) {
    // Short path: exit south directly to Bravo (terminal side)
    return [
      { x: exitX, y: runway.centerY },
      { x: exitX, y: BRAVO_Y },
    ]
  }

  // Upper runway: north → Alpha → connector → Bravo
  const connX = fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
  return [
    { x: exitX,  y: runway.centerY },
    { x: exitX,  y: ALPHA_Y },
    { x: connX,  y: ALPHA_Y },
    { x: connX,  y: BRAVO_Y },
  ]
}

/**
 * X position where the plane arrives at Taxiway Bravo after vacating.
 * Used by Aircraft.ts to pick the nearest gate.
 */
export function vacateArrivalX(runway: Runway, fromRight: boolean): number {
  if (!isUpperRunway(runway)) {
    return fromRight
      ? RWY_RIGHT_X - (RWY_RIGHT_X - RWY_LEFT_X) * 0.25
      : RWY_LEFT_X  + (RWY_RIGHT_X - RWY_LEFT_X) * 0.25
  }
  return fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
}

// ---------------------------------------------------------------------------
// Taxi paths — taxiway waypoints to/from gates
// ---------------------------------------------------------------------------

/** Taxiway centerline Y — Taxiway Bravo (nearest to terminal, south side). */
function taxiYForRunway(_runway: Runway): number {
  return TAXIWAY_BRAVO_Y + TAXIWAY_H / 2
}

/** Gate apron Y (north face of terminal) */
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

  if (!isUpperRunway(runway)) {
    // Lower runway: gate → Bravo → hold-short → lower runway (short path)
    return [
      { x: gate.position.x, y: APRON_CENTER_Y },
      { x: gate.position.x, y: BRAVO_Y },
      { x: holdX,           y: BRAVO_Y },
      { x: holdX,           y: runway.centerY },
    ]
  }

  // Upper runway: gate → Bravo → connector → Alpha → hold-short → upper runway
  const connX = fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
  return [
    { x: gate.position.x, y: APRON_CENTER_Y },
    { x: gate.position.x, y: BRAVO_Y },
    { x: connX,           y: BRAVO_Y },
    { x: connX,           y: ALPHA_Y },
    { x: holdX,           y: ALPHA_Y },
    { x: holdX,           y: runway.centerY },
  ]
}

// ---------------------------------------------------------------------------
// Line-up path — from hold-short, move onto runway facing the departure direction
// ---------------------------------------------------------------------------

/**
 * The aircraft is currently at (holdX, runway.centerY).  Move it 50 px further
 * in the departure direction so that:
 *   - fromRight=false → heading east (90°) — ready to depart right
 *   - fromRight=true  → heading west (270°) — ready to depart left
 */
export function lineUpPath(runway: Runway, fromRight: boolean): Point[] {
  if (!fromRight) {
    return [{ x: RWY_LEFT_X + 50, y: runway.centerY }]
  } else {
    return [{ x: RWY_RIGHT_X - 50, y: runway.centerY }]
  }
}

// ---------------------------------------------------------------------------
// Cross path — route from one runway's hold-short to the other runway's
// hold-short via the end-connector taxiway (no grass or runway crossings)
// ---------------------------------------------------------------------------

export function crossRunwayPath(
  fromRight: boolean,
  sourceRunway: Runway,
  targetRunway: Runway,
): Point[] {
  const connX = fromRight ? CONNECTOR_RIGHT_X : CONNECTOR_LEFT_X
  const srcHoldX = fromRight
    ? sourceRunway.thresholdRight.x - HOLD_SHORT_OFFSET
    : sourceRunway.thresholdLeft.x  + HOLD_SHORT_OFFSET
  const dstHoldX = fromRight
    ? targetRunway.thresholdRight.x - HOLD_SHORT_OFFSET
    : targetRunway.thresholdLeft.x  + HOLD_SHORT_OFFSET

  if (isUpperRunway(sourceRunway)) {
    // Upper → Lower: back north to Alpha, connector south to Bravo, east/west to target
    return [
      { x: srcHoldX, y: ALPHA_Y },
      { x: connX,    y: ALPHA_Y },
      { x: connX,    y: BRAVO_Y },
      { x: dstHoldX, y: BRAVO_Y },
      { x: dstHoldX, y: targetRunway.centerY },
    ]
  } else {
    // Lower → Upper: back south to Bravo, connector north to Alpha, east/west to target
    return [
      { x: srcHoldX, y: BRAVO_Y },
      { x: connX,    y: BRAVO_Y },
      { x: connX,    y: ALPHA_Y },
      { x: dstHoldX, y: ALPHA_Y },
      { x: dstHoldX, y: targetRunway.centerY },
    ]
  }
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


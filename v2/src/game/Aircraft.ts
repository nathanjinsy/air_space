import type { Aircraft, Point, Runway, GameState } from '../types'
import {
  APPROACH_SPEED, TAXI_SPEED, TAKEOFF_SPEED,
  LANDING_DECEL, TURN_SPEED_DEG, TAXI_TURN_SPEED_DEG, WAYPOINT_REACH_PX,
  BOARDING_TIME_MS, SCORE_LAND, SCORE_TAKEOFF, SCORE_GOAROUND,
  TAXIWAY_ALPHA_Y, TAXIWAY_H, CANVAS_W, MARGIN_X,
} from '../constants'
import {
  vacatePath, vacateArrivalX, taxiPathToGate, taxiPathToRunway,
  takeoffPath, lineUpPath, crossRunwayPath, findRunwayById, findGateById,
} from './Airport'

// ---------------------------------------------------------------------------
// Heading math
// ---------------------------------------------------------------------------
function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360
}

/** Heading from point a to point b, in degrees clockwise from North */
export function headingTo(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  // atan2 gives angle from east, CCW. Convert to CW from north.
  const rad = Math.atan2(dy, dx)
  return normalizeHeading((rad * 180 / Math.PI) + 90)
}

/** Shortest delta from current to target, range [-180, 180] */
function headingDelta(current: number, target: number): number {
  return ((target - current + 540) % 360) - 180
}

// ---------------------------------------------------------------------------
// Per-frame update — returns updated score delta
// ---------------------------------------------------------------------------
export function updateAircraft(ac: Aircraft, dt: number, state: GameState): number {
  let scoreDelta = 0

  switch (ac.phase) {

    case 'approaching':
    case 'cleared_to_land':
      moveTowardWaypoint(ac, dt, APPROACH_SPEED)
      if (ac.phase === 'cleared_to_land' && ac.waypoints.length === 0) {
        // Reached runway threshold — begin landing roll
        ac.phase = 'landing_roll'
        ac.speed = APPROACH_SPEED
      }
      break

    case 'landing_roll': {
      // Decelerate
      ac.speed = Math.max(0, ac.speed - LANDING_DECEL * dt)
      moveForward(ac, dt)
      if (ac.speed === 0) {
        // Transition to vacating
        ac.phase = 'vacating'
        const runway = findRunwayById(state.runways, ac.assignedRunway!)!
        ac.waypoints = vacatePath(runway, ac.fromRight)
        ac.speed = TAXI_SPEED
        // Mark runway available
        runway.status = 'available'
        runway.occupiedBy = null
        // Score for landing
        scoreDelta += SCORE_LAND
        // Auto-assign nearest free gate to where the plane will arrive on Taxiway Alpha
        const arrivalX = vacateArrivalX(runway, ac.fromRight)
        const freeGate = state.gates
          .filter(g => !g.occupied)
          .sort((a, b) => Math.abs(a.position.x - arrivalX) - Math.abs(b.position.x - arrivalX))[0]
        if (freeGate) {
          ac.assignedGate = freeGate.id
          freeGate.occupied = true
          freeGate.occupiedBy = ac.id
        }
      }
      break
    }

    case 'vacating':
      moveTowardWaypoint(ac, dt, TAXI_SPEED, TAXI_TURN_SPEED_DEG)
      if (ac.waypoints.length === 0) {
        ac.phase = 'taxiing_to_gate'
        const runway = findRunwayById(state.runways, ac.assignedRunway ?? '')
        const gate = ac.assignedGate ? findGateById(state.gates, ac.assignedGate) : undefined
        if (runway && gate) {
          ac.waypoints = taxiPathToGate({ x: ac.x, y: ac.y }, gate, runway)
        }
        // If no gate assigned (all full), waypoints stay empty → immediately transitions
        // to at_gate at current position (edge case, boarding still runs)
      }
      break

    case 'taxiing_to_gate':
      moveTowardWaypoint(ac, dt, TAXI_SPEED, TAXI_TURN_SPEED_DEG)
      if (ac.waypoints.length === 0) {
        ac.phase = 'at_gate'
        ac.speed = 0
        ac.boardingTimer = BOARDING_TIME_MS
      }
      break

    case 'at_gate':
      ac.boardingTimer -= dt * 1000
      if (ac.boardingTimer <= 0) {
        ac.boardingTimer = 0
        // Begin pushback — tug will push aircraft backward (south) to taxiway
        ac.phase = 'pushing_back'
        ac.speed = TAXI_SPEED * 0.6  // pushback is slow
      }
      break

    case 'pushing_back': {
      // Move backward (opposite to current heading) until reaching Taxiway Alpha
      movePushback(ac, dt)
      const alphaY = TAXIWAY_ALPHA_Y + TAXIWAY_H / 2
      if (ac.y >= alphaY) {
        ac.y = alphaY
        ac.phase = 'taxiing_to_runway'
        ac.speed = TAXI_SPEED
        const runway = findRunwayById(state.runways, ac.assignedRunway ?? '')
        const gate = ac.assignedGate ? findGateById(state.gates, ac.assignedGate) : undefined
        if (runway && gate) {
          // taxiPathToRunway starts from gate pos → alpha; we're already at alpha
          // so skip the first two waypoints (gate-pos and alpha-at-gate-x)
          ac.waypoints = taxiPathToRunway(gate, runway, ac.fromRight).slice(2)
        } else if (runway) {
          const holdX = ac.fromRight
            ? runway.thresholdRight.x - 20
            : runway.thresholdLeft.x + 20
          ac.waypoints = [
            { x: holdX, y: alphaY },
            { x: holdX, y: runway.centerY },
          ]
        }
      }
      break
    }

    case 'taxiing_to_runway': {
      // When one waypoint remains the aircraft is at the taxiway/runway boundary —
      // the stopbar position.  Hold here while the runway is occupied so the
      // plane doesn't taxi through a lit stopbar onto an active runway.
      if (ac.waypoints.length === 1) {
        const rwy = findRunwayById(state.runways, ac.assignedRunway ?? '')
        if (rwy && rwy.status === 'occupied') {
          ac.speed = 0   // hold at stopbar; resume automatically when clear
          break
        }
      }
      moveTowardWaypoint(ac, dt, TAXI_SPEED, TAXI_TURN_SPEED_DEG)
      if (ac.waypoints.length === 0) {
        ac.phase = 'holding_short'
        ac.speed = 0
      }
      break
    }

    case 'holding_short':
      // Waiting for player command: line up, cross, or direct takeoff clearance
      break

    case 'lining_up':
      moveTowardWaypoint(ac, dt, TAXI_SPEED, TAXI_TURN_SPEED_DEG)
      if (ac.waypoints.length === 0) {
        ac.phase = 'lined_up'
        ac.speed = 0
      }
      break

    case 'lined_up':
      // On runway at threshold — waiting for takeoff clearance
      break

    case 'taking_off': {
      ac.speed = Math.min(TAKEOFF_SPEED, ac.speed + LANDING_DECEL * dt)
      moveTowardWaypoint(ac, dt, ac.speed, TAXI_TURN_SPEED_DEG)
      if (ac.waypoints.length === 0) {
        ac.phase = 'departed'
        scoreDelta += SCORE_TAKEOFF
        // Free runway
        const runway = findRunwayById(state.runways, ac.assignedRunway!)
        if (runway) { runway.status = 'available'; runway.occupiedBy = null }
      }
      break
    }

    case 'departed':
      break
  }

  return scoreDelta
}

// ---------------------------------------------------------------------------
// Movement helpers
// ---------------------------------------------------------------------------

function moveTowardWaypoint(
  ac: Aircraft, dt: number, speed: number,
  turnRate: number = TURN_SPEED_DEG,
): void {
  if (ac.waypoints.length === 0) return
  const target = ac.waypoints[0]
  const targetHdg = headingTo({ x: ac.x, y: ac.y }, target)
  turnToward(ac, targetHdg, dt, turnRate)

  ac.speed = speed
  moveForward(ac, dt)

  // Check if waypoint reached
  const dx = target.x - ac.x
  const dy = target.y - ac.y
  if (Math.sqrt(dx * dx + dy * dy) < WAYPOINT_REACH_PX) {
    ac.x = target.x
    ac.y = target.y
    ac.waypoints.shift()
  }
}

function turnToward(ac: Aircraft, targetHdg: number, dt: number, turnRate: number = TURN_SPEED_DEG): void {
  const delta = headingDelta(ac.heading, targetHdg)
  const maxTurn = turnRate * dt
  if (Math.abs(delta) <= maxTurn) {
    ac.heading = targetHdg
  } else {
    ac.heading = normalizeHeading(ac.heading + Math.sign(delta) * maxTurn)
  }
}

function moveForward(ac: Aircraft, dt: number): void {
  // heading 0=North → +y down is South in canvas, so:
  // heading 90=East → dx positive, dy=0
  const rad = ((ac.heading - 90) * Math.PI) / 180
  ac.x += Math.cos(rad) * ac.speed * dt
  ac.y += Math.sin(rad) * ac.speed * dt
}

/** Move opposite to heading — used for pushback from gate. Heading stays fixed. */
function movePushback(ac: Aircraft, dt: number): void {
  const rad = ((ac.heading - 90) * Math.PI) / 180
  ac.x -= Math.cos(rad) * ac.speed * dt
  ac.y -= Math.sin(rad) * ac.speed * dt
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

export function assignRunway(ac: Aircraft, runway: Runway, _state: GameState): void {
  if (ac.phase !== 'approaching') return
  if (runway.status === 'occupied') return

  ac.assignedRunway = runway.id
  runway.status = 'occupied'
  runway.occupiedBy = ac.id
  ac.phase = 'cleared_to_land'

  // Fly directly to the threshold — no intermediate overshoot waypoint
  const threshold = ac.fromRight ? runway.thresholdRight : runway.thresholdLeft
  ac.waypoints = [{ x: threshold.x, y: runway.centerY }]
}

export function clearForTakeoff(ac: Aircraft, state: GameState): void {
  if (ac.phase !== 'holding_short' && ac.phase !== 'lined_up') return
  const runway = findRunwayById(state.runways, ac.assignedRunway!)
  if (!runway) return

  if (ac.phase === 'holding_short') {
    // Mark runway occupied (lined_up already did this)
    runway.status = 'occupied'
    runway.occupiedBy = ac.id
  }

  ac.phase = 'taking_off'
  ac.speed = TAXI_SPEED

  // Free gate
  if (ac.assignedGate) {
    const gate = findGateById(state.gates, ac.assignedGate)
    if (gate) { gate.occupied = false; gate.occupiedBy = null }
    ac.assignedGate = null
  }

  ac.waypoints = takeoffPath(runway, !ac.fromRight)  // depart opposite direction
}

/** Line up and wait: enter the runway, position at threshold facing departure direction. */
export function lineUp(ac: Aircraft, state: GameState): void {
  if (ac.phase !== 'holding_short') return
  const runway = findRunwayById(state.runways, ac.assignedRunway!)
  if (!runway || runway.status === 'occupied') return

  runway.status = 'occupied'
  runway.occupiedBy = ac.id
  ac.phase = 'lining_up'
  ac.speed = TAXI_SPEED
  ac.waypoints = lineUpPath(runway, ac.fromRight)
}

/** Cross: route to the other runway via end-connector, re-hold-short there. */
export function crossRunway(ac: Aircraft, state: GameState): void {
  if (ac.phase !== 'holding_short') return
  const srcRunway = findRunwayById(state.runways, ac.assignedRunway!)
  if (!srcRunway) return
  const dstRunway = state.runways.find(r => r.id !== srcRunway.id)
  if (!dstRunway) return

  // Reassign to the other runway — will hold short there after crossing
  ac.assignedRunway = dstRunway.id
  ac.phase = 'taxiing_to_runway'
  ac.speed = TAXI_SPEED
  ac.waypoints = crossRunwayPath(ac.fromRight, srcRunway, dstRunway)
}

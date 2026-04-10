import type { AircraftState, TrailPoint } from '../types'

const TURN_RATE = 3        // degrees per second
const CLIMB_RATE = 800     // feet per minute
const ACCEL_RATE = 5       // knots per second
const TRAIL_LENGTH = 8
const TRAIL_INTERVAL_MS = 2000

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360
}

/** Shortest angular delta from current to target, in range [-180, 180] */
function headingDelta(current: number, target: number): number {
  return ((target - current + 540) % 360) - 180
}

export function createAircraft(
  partial: Partial<AircraftState> & { id: string; callsign: string }
): AircraftState {
  const heading = partial.heading ?? Math.random() * 360
  const altitude = partial.altitude ?? (Math.floor(Math.random() * 13) * 2000 + 18000)
  const speed = partial.speed ?? (Math.floor(Math.random() * 7) * 30 + 280)
  return {
    x: 0,
    y: 0,
    trail: [],
    isUnderControl: false,
    controlExpiresAt: 0,
    autopilotNextNudge: Date.now() + 5000 + Math.random() * 15000,
    ...partial,
    heading,
    altitude,
    speed,
    targetHeading: partial.targetHeading ?? heading,
    targetAltitude: partial.targetAltitude ?? altitude,
    targetSpeed: partial.targetSpeed ?? speed,
  }
}

export function updateAircraft(
  ac: AircraftState,
  dt: number,          // seconds elapsed
  now: number,         // current ms timestamp
  trailTimer: Map<string, number>
): void {
  // Expire player control
  if (ac.isUnderControl && now >= ac.controlExpiresAt) {
    ac.isUnderControl = false
  }

  // Smooth heading turn at TURN_RATE °/s
  const hdgDelta = headingDelta(ac.heading, ac.targetHeading)
  const maxTurn = TURN_RATE * dt
  if (Math.abs(hdgDelta) <= maxTurn) {
    ac.heading = ac.targetHeading
  } else {
    ac.heading = normalizeHeading(ac.heading + Math.sign(hdgDelta) * maxTurn)
  }

  // Smooth altitude climb/descend at CLIMB_RATE fpm → ft/s
  const altDelta = ac.targetAltitude - ac.altitude
  const maxClimb = (CLIMB_RATE / 60) * dt
  if (Math.abs(altDelta) <= maxClimb) {
    ac.altitude = ac.targetAltitude
  } else {
    ac.altitude += Math.sign(altDelta) * maxClimb
  }

  // Smooth speed change at ACCEL_RATE kts/s
  const spdDelta = ac.targetSpeed - ac.speed
  const maxAccel = ACCEL_RATE * dt
  if (Math.abs(spdDelta) <= maxAccel) {
    ac.speed = ac.targetSpeed
  } else {
    ac.speed += Math.sign(spdDelta) * maxAccel
  }

  // Move: heading 0=North, east=+x, north=+y
  // speed (knots) → nm/s = knots / 3600
  const headingRad = (ac.heading * Math.PI) / 180
  const nmPerSec = ac.speed / 3600
  ac.x += Math.sin(headingRad) * nmPerSec * dt
  ac.y += Math.cos(headingRad) * nmPerSec * dt

  // Append trail point every TRAIL_INTERVAL_MS
  const lastTrailTime = trailTimer.get(ac.id) ?? 0
  if (now - lastTrailTime >= TRAIL_INTERVAL_MS) {
    trailTimer.set(ac.id, now)
    const point: TrailPoint = { x: ac.x, y: ac.y }
    ac.trail.push(point)
    if (ac.trail.length > TRAIL_LENGTH) {
      ac.trail.shift()
    }
  }
}

export function issueCommand(
  ac: AircraftState,
  heading: number | null,
  altitudeFl: number | null,
  speed: number | null,
  now: number
): void {
  if (heading !== null) ac.targetHeading = normalizeHeading(heading)
  if (altitudeFl !== null) ac.targetAltitude = altitudeFl * 100
  if (speed !== null) ac.targetSpeed = speed
  ac.isUnderControl = true
  ac.controlExpiresAt = now + 120_000
}

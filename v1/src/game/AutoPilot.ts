import type { AircraftState } from '../types'

const MIN_ALT = 18000   // FL180
const MAX_ALT = 39000   // FL390
const NUDGE_INTERVAL_MIN = 10000   // ms
const NUDGE_INTERVAL_MAX = 25000   // ms

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360
}

export function tickAutoPilot(aircraft: AircraftState[], now: number): void {
  for (const ac of aircraft) {
    if (ac.isUnderControl) continue
    if (now < ac.autopilotNextNudge) continue

    // Schedule next nudge
    ac.autopilotNextNudge = now + randomBetween(NUDGE_INTERVAL_MIN, NUDGE_INTERVAL_MAX)

    // Adjust heading: ±30° from current target
    const hdgShift = randomBetween(-30, 30)
    ac.targetHeading = normalizeHeading(ac.targetHeading + hdgShift)

    // Occasionally shift altitude (40% chance)
    if (Math.random() < 0.4) {
      const steps = [-2000, -1000, 1000, 2000]
      const shift = steps[Math.floor(Math.random() * steps.length)]
      ac.targetAltitude = Math.max(MIN_ALT, Math.min(MAX_ALT, ac.targetAltitude + shift))
    }
  }
}

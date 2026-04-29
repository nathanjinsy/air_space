import type { Aircraft, GameState, Point } from '../types'
import { CRASH_DIST_PX, SCORE_CRASH, CRASH_FLASH_MS } from '../constants'

const ACTIVE_PHASES = new Set([
  'approaching', 'cleared_to_land', 'landing_roll',
  'vacating', 'taxiing_to_gate', 'taxiing_to_runway',
  'holding_short', 'lining_up', 'lined_up', 'taking_off',
])

function dist(a: Aircraft, b: Aircraft): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function scrubPlane(ac: Aircraft, state: GameState): void {
  ac.crashInvolved = true
  ac.phase = 'departed'  // World.ts cleanup will release the callsign next frame

  // Free any runway this plane was holding / on
  for (const rwy of state.runways) {
    if (rwy.occupiedBy === ac.id) {
      rwy.status = 'available'
      rwy.occupiedBy = null
    }
  }
  // Free any gate this plane occupied
  for (const gate of state.gates) {
    if (gate.occupiedBy === ac.id) {
      gate.occupied = false
      gate.occupiedBy = null
    }
  }
}

export function detectCrash(state: GameState): void {
  const active = state.aircraft.filter(ac => ACTIVE_PHASES.has(ac.phase))

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (dist(active[i], active[j]) < CRASH_DIST_PX) {
        const midPoint: Point = {
          x: (active[i].x + active[j].x) / 2,
          y: (active[i].y + active[j].y) / 2,
        }

        scrubPlane(active[i], state)
        scrubPlane(active[j], state)

        // Score penalty (floor at 0)
        state.score = Math.max(0, state.score + SCORE_CRASH)

        // Trigger flash effect — timer is in ms; UIRenderer fades it out
        state.crashPosition = midPoint
        state.crashFlashTimer = CRASH_FLASH_MS

        // Only handle one collision per frame to avoid cascade confusion
        return
      }
    }
  }
}

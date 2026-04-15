import type { Aircraft, GameState, Point } from '../types'
import { CRASH_DIST_PX } from '../constants'

const ACTIVE_PHASES = new Set([
  'approaching', 'cleared_to_land', 'landing_roll',
  'vacating', 'taxiing_to_gate', 'taxiing_to_runway',
  'holding_short', 'taking_off',
])

function dist(a: Aircraft, b: Aircraft): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function detectCrash(state: GameState): void {
  if (state.gameOver) return

  const active = state.aircraft.filter(ac => ACTIVE_PHASES.has(ac.phase))

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (dist(active[i], active[j]) < CRASH_DIST_PX) {
        state.gameOver = true
        active[i].crashInvolved = true
        active[j].crashInvolved = true
        const midPoint: Point = {
          x: (active[i].x + active[j].x) / 2,
          y: (active[i].y + active[j].y) / 2,
        }
        state.crashPosition = midPoint
        return
      }
    }
  }
}

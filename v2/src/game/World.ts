import type { GameState } from '../types'
import { makeRunways, makeGates } from './Airport'
import { updateAircraft } from './Aircraft'
import { detectCrash } from './ConflictDetector'
import { tickSpawner, initSpawnTimer, releaseCallsign, resetSpawner } from './Spawner'
import { SCORE_GOAROUND, CANVAS_W } from '../constants'

export function createWorld(): GameState {
  const state: GameState = {
    aircraft: [],
    runways: makeRunways(),
    gates: makeGates(),
    score: 0,
    gameOver: false,
    crashPosition: null,
    selectedId: null,
    spawnTimer: 0,
  }
  initSpawnTimer(state)
  return state
}

export function resetWorld(state: GameState): void {
  resetSpawner()
  state.aircraft = []
  state.runways = makeRunways()
  state.gates = makeGates()
  state.score = 0
  state.gameOver = false
  state.crashPosition = null
  state.selectedId = null
  initSpawnTimer(state)
}

export function updateWorld(state: GameState, dt: number): void {
  if (state.gameOver) return

  // Tick spawner
  tickSpawner(state, dt)

  // Update each aircraft
  for (const ac of state.aircraft) {
    const delta = updateAircraft(ac, dt, state)
    state.score = Math.max(0, state.score + delta)
  }

  // Go-around: approaching planes that have flown past the far edge without assignment
  for (const ac of state.aircraft) {
    if (ac.phase !== 'approaching') continue
    const tooFar = ac.fromRight
      ? ac.x < -60
      : ac.x > CANVAS_W + 60
    if (tooFar) {
      ac.phase = 'departed'
      state.score = Math.max(0, state.score + SCORE_GOAROUND)
    }
  }

  // Remove departed planes
  const departing = state.aircraft.filter(ac => ac.phase === 'departed')
  for (const ac of departing) {
    releaseCallsign(ac.callsign)
  }
  state.aircraft = state.aircraft.filter(ac => ac.phase !== 'departed')

  // Deselect if selected plane was removed
  if (state.selectedId && !state.aircraft.find(ac => ac.id === state.selectedId)) {
    state.selectedId = null
  }

  // Check for crashes
  detectCrash(state)
}

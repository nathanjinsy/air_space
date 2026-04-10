import type { AircraftState, ConflictInfo } from '../types'
import { createAircraft, updateAircraft } from './Aircraft'
import { tickAutoPilot } from './AutoPilot'
import { detectConflicts } from './ConflictDetector'

export interface World {
  aircraft: AircraftState[]
  conflicts: ConflictInfo[]
  selectedId: string | null
}

// Trail timers: last time each aircraft appended a trail point
const trailTimers = new Map<string, number>()

export function createWorld(): World {
  const aircraft = spawnAircraft()
  return {
    aircraft,
    conflicts: [],
    selectedId: null,
  }
}

export function updateWorld(world: World, dt: number): void {
  const now = Date.now()

  // Remove aircraft that have wandered too far off-scope (> 140 nm)
  world.aircraft = world.aircraft.filter(ac => {
    const dist = Math.sqrt(ac.x * ac.x + ac.y * ac.y)
    return dist < 140
  })

  tickAutoPilot(world.aircraft, now)

  for (const ac of world.aircraft) {
    updateAircraft(ac, dt, now, trailTimers)
  }

  world.conflicts = detectConflicts(world.aircraft)

  // If selected aircraft was removed, clear selection
  if (world.selectedId !== null) {
    const still = world.aircraft.find(ac => ac.id === world.selectedId)
    if (!still) world.selectedId = null
  }
}

// ---------------------------------------------------------------------------
// Spawn scenario: 6 aircraft, 2 converging pairs + 2 normal cruisers
// ---------------------------------------------------------------------------
function spawnAircraft(): AircraftState[] {
  const now = Date.now()

  // Pair 1: converging near center, similar altitude (will trigger conflict)
  const pair1a = createAircraft({
    id: 'p1a', callsign: 'UAL301',
    x: -70, y: 30, heading: 110, altitude: 33000, speed: 420,
    autopilotNextNudge: now + 30000,
  })
  const pair1b = createAircraft({
    id: 'p1b', callsign: 'DAL487',
    x: 60, y: 55, heading: 240, altitude: 34000, speed: 390,
    autopilotNextNudge: now + 32000,
  })

  // Pair 2: converging from north/south, slightly different altitudes (warning)
  const pair2a = createAircraft({
    id: 'p2a', callsign: 'AAL552',
    x: 10, y: 85, heading: 175, altitude: 37000, speed: 450,
    autopilotNextNudge: now + 20000,
  })
  const pair2b = createAircraft({
    id: 'p2b', callsign: 'SWA819',
    x: -15, y: -80, heading: 355, altitude: 36000, speed: 380,
    autopilotNextNudge: now + 22000,
  })

  // Singles: cruising normally
  const single1 = createAircraft({
    id: 's1', callsign: 'JBU144',
    x: -90, y: -40, heading: 45, altitude: 29000, speed: 360,
    autopilotNextNudge: now + 8000,
  })
  const single2 = createAircraft({
    id: 's2', callsign: 'FFT211',
    x: 80, y: -60, heading: 310, altitude: 31000, speed: 400,
    autopilotNextNudge: now + 12000,
  })

  return [pair1a, pair1b, pair2a, pair2b, single1, single2]
}

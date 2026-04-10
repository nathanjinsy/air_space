export interface TrailPoint {
  x: number
  y: number
}

export interface AircraftState {
  id: string
  callsign: string
  x: number              // nautical miles from center (east = positive)
  y: number              // nautical miles from center (north = positive)
  heading: number        // degrees, 0=N, 90=E, 180=S, 270=W
  altitude: number       // feet (e.g. 32000)
  speed: number          // knots
  targetHeading: number
  targetAltitude: number
  targetSpeed: number
  trail: TrailPoint[]
  isUnderControl: boolean
  controlExpiresAt: number      // ms timestamp when player control expires
  autopilotNextNudge: number    // ms timestamp for next autopilot nudge
}

export interface ConflictInfo {
  a: AircraftState
  b: AircraftState
  distanceNm: number
  altDiff: number
  severity: 'warning' | 'conflict'
}

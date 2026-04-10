import type { AircraftState, ConflictInfo } from '../types'

const WARN_NM = 8
const WARN_FT = 2000
const CONFLICT_NM = 5
const CONFLICT_FT = 1000

function distanceNm(a: AircraftState, b: AircraftState): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function detectConflicts(aircraft: AircraftState[]): ConflictInfo[] {
  const results: ConflictInfo[] = []

  for (let i = 0; i < aircraft.length; i++) {
    for (let j = i + 1; j < aircraft.length; j++) {
      const a = aircraft[i]
      const b = aircraft[j]
      const dist = distanceNm(a, b)
      const altDiff = Math.abs(a.altitude - b.altitude)

      if (dist < CONFLICT_NM && altDiff < CONFLICT_FT) {
        results.push({ a, b, distanceNm: dist, altDiff, severity: 'conflict' })
      } else if (dist < WARN_NM && altDiff < WARN_FT) {
        results.push({ a, b, distanceNm: dist, altDiff, severity: 'warning' })
      }
    }
  }

  return results
}

export interface Point { x: number; y: number }

export type FlightPhase =
  | 'approaching'
  | 'cleared_to_land'
  | 'landing_roll'
  | 'vacating'
  | 'taxiing_to_gate'
  | 'at_gate'
  | 'taxiing_to_runway'
  | 'holding_short'
  | 'taking_off'
  | 'departed'

export interface Aircraft {
  id: string
  callsign: string
  liveryColor: string
  x: number
  y: number
  heading: number        // degrees clockwise from North (0=N, 90=E)
  speed: number          // px/s
  phase: FlightPhase
  assignedRunway: string | null
  assignedGate: string | null
  waypoints: Point[]
  boardingTimer: number  // ms remaining at gate
  crashInvolved: boolean
  fromRight: boolean     // which side the plane came from
}

export interface Runway {
  id: string             // '09R'
  reciprocal: string     // '27L'
  thresholdLeft: Point   // 09 end (left side of canvas)
  thresholdRight: Point  // 27 end (right side of canvas)
  centerY: number
  status: 'available' | 'occupied'
  occupiedBy: string | null
}

export interface Gate {
  id: string
  position: Point        // center of gate parking spot
  occupied: boolean
  occupiedBy: string | null
}

export type VehicleType = 'fuel_truck' | 'baggage_cart' | 'tug'

export interface Vehicle {
  id: string
  type: VehicleType
  x: number
  y: number
  heading: number      // 90 = east, 270 = west
  speed: number        // px/s
  patrolMin: number    // western turnaround x
  patrolMax: number    // eastern turnaround x
  color: string
}

export interface GameState {
  aircraft: Aircraft[]
  runways: Runway[]
  gates: Gate[]
  vehicles: Vehicle[]
  score: number
  gameOver: boolean
  crashPosition: Point | null
  selectedId: string | null
  spawnTimer: number     // ms until next spawn
}

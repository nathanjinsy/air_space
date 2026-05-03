// ---------------------------------------------------------------------------
// Canvas dimensions (fixed scene size)
// ---------------------------------------------------------------------------
export const CANVAS_W = 1200
export const CANVAS_H = 500

// ---------------------------------------------------------------------------
// Airport layout — KPWK style: terminal + hangars on SOUTH side
// Derives top-to-bottom from TAXIWAY_ALPHA_Y (north perimeter)
// ---------------------------------------------------------------------------
export const MARGIN_X = 40
export const RUNWAY_LENGTH = CANVAS_W - MARGIN_X * 2

export const TAXIWAY_H = 26
export const RWY_H     = 56

// Taxiway Alpha — north perimeter taxiway (far side, no terminal)
export const TAXIWAY_ALPHA_Y    = 80
// Runway 09R/27L (upper)
export const RWY_UPPER_Y        = TAXIWAY_ALPHA_Y + TAXIWAY_H        // 106
export const RWY_UPPER_CENTER_Y = RWY_UPPER_Y + RWY_H / 2            // 134
// Grass strip between runways
export const GRASS_STRIP_H      = 36
export const GRASS_STRIP_Y      = RWY_UPPER_Y + RWY_H                // 162
// Runway 09L/27R (lower)
export const RWY_LOWER_Y        = GRASS_STRIP_Y + GRASS_STRIP_H      // 198
export const RWY_LOWER_CENTER_Y = RWY_LOWER_Y + RWY_H / 2            // 226
// Taxiway Bravo — south perimeter taxiway (near terminal side)
export const TAXIWAY_BRAVO_Y    = RWY_LOWER_Y + RWY_H                // 254

// Apron — between Taxiway Bravo and terminal north face
export const APRON_H  = 20
export const APRON_Y  = TAXIWAY_BRAVO_Y + TAXIWAY_H                  // 280
// Terminal building — south side, north face toward runways
export const TERMINAL_H = 80
export const TERMINAL_Y = APRON_Y + APRON_H                          // 300
export const TERMINAL_X = MARGIN_X
export const TERMINAL_W = RUNWAY_LENGTH

// Hangar row — south of terminal (KPWK has large hangar complexes here)
export const HANGAR_AREA_H = 60
export const HANGAR_AREA_Y = TERMINAL_Y + TERMINAL_H                 // 380

// Access road — south of hangars (landside)
export const ROAD_VERGE_H  = 6
export const ROAD_DRIVE_H  = CANVAS_H - HANGAR_AREA_Y - HANGAR_AREA_H - ROAD_VERGE_H // 54
export const ROAD_START_Y  = HANGAR_AREA_Y + HANGAR_AREA_H           // 440
export const ROAD_UPPER_Y  = ROAD_START_Y + Math.round(ROAD_DRIVE_H * 0.25) // 454
export const ROAD_LOWER_Y  = ROAD_START_Y + Math.round(ROAD_DRIVE_H * 0.75) // 481

// Gates (3 evenly spaced, on apron between Bravo and terminal)
export const GATE_COUNT   = 3
export const GATE_Y       = APRON_Y + APRON_H / 2                    // 290
export const GATE_SPACING = RUNWAY_LENGTH / (GATE_COUNT + 1)

// Runway thresholds (left = 09 end, right = 27 end)
export const RWY_LEFT_X = MARGIN_X + 30
export const RWY_RIGHT_X = CANVAS_W - MARGIN_X - 30

// Hold-short line offset from threshold
export const HOLD_SHORT_OFFSET = 20

// End-connector taxiway centers (vertical strips on each side linking Alpha ↔ Bravo)
// They sit between MARGIN_X and RWY_LEFT_X (30px wide on each side)
export const CONNECTOR_LEFT_X  = Math.round((MARGIN_X + RWY_LEFT_X) / 2)              // ≈ 55
export const CONNECTOR_RIGHT_X = Math.round((RWY_RIGHT_X + CANVAS_W - MARGIN_X) / 2) // ≈ 1145

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const C = {
  grass:        '#4a5a3a',
  grassDark:    '#2d4a2d',  // trees
  asphalt:      '#2c2c2c',  // runways
  asphaltDark:  '#1e1e1e',  // runway edges
  marking:      '#d8d8d8',  // runway markings (off-white)
  taxiway:      '#464646',
  taxiCenter:   '#c8960a',  // yellow taxiway centerline
  apron:        '#585858',
  terminal:     '#7a6a5a',
  terminalRoof: '#c8b8a8',
  terminalWin:  '#8aaccc',  // muted blue window tint
  jetway:       '#6a5a4a',
  planeBody:    '#f0f0f0',
  planeShadow:  'rgba(0,0,0,0.18)',
  selectionRing:'rgba(255,255,200,0.7)',
  crashFlash:   'rgba(200,40,40,0.85)',
  uiBg:         'rgba(10,10,10,0.82)',
  uiText:       '#d0d0d0',
  uiDim:        '#666',
  clear:        '#5aaa5a',
  occupied:     '#aa5a5a',
}

// ---------------------------------------------------------------------------
// Aircraft
// ---------------------------------------------------------------------------
export const APPROACH_SPEED = 90     // px/s on final approach
export const TAXI_SPEED = 28         // px/s on taxiway
export const TAKEOFF_SPEED = 160     // px/s when accelerating for takeoff
export const LANDING_DECEL = 60      // px/s² deceleration on landing roll
export const TURN_SPEED_DEG = 60     // degrees/s for heading changes (airborne)
export const TAXI_TURN_SPEED_DEG = 720 // degrees/s on the ground — near-instant turns
export const WAYPOINT_REACH_PX = 8   // distance to consider waypoint reached
export const BOARDING_TIME_MS = 10000
export const CRASH_DIST_PX = 24      // planes closer than this = crash
export const PLANE_LENGTH = 36       // fuselage length px
export const PLANE_WINGSPAN = 30     // total wingspan px

// Airport identity
export const AIRPORT_ICAO = 'KPWK'
export const AIRPORT_NAME = 'CHICAGO EXECUTIVE'
export const AIRPORT_CITY = 'WHEELING, IL'

// Livery palette — corporate / charter tones
export const LIVERY_COLORS = [
  '#3a5a8a', '#8a3a3a', '#2a6a4a',
  '#7a5a2a', '#6a3a6a', '#3a6a6a',
]

// Callsign pool — KPWK traffic: NetJets, FlexJet, corporate, GA N-numbers
export const CALLSIGNS = [
  'EJA412','EJA788','EJA031','EJA556',   // NetJets
  'LXJ202','LXJ594','LXJ871',             // FlexJet
  'NJA503','NJA271',                       // NetJets Air
  'N231PW','N7742G','N4521F',             // GA N-numbers
  'N882PK','N601EX','N45WKP','N3317K',
]

// ---------------------------------------------------------------------------
// Spawner
// ---------------------------------------------------------------------------
export const SPAWN_BASE_MS = 45000   // 45s between planes at start
export const SPAWN_MIN_MS  = 18000   // floor: one plane every 18s at peak
export const SPAWN_SCORE_STEP = 6    // score points per 1s reduction (slower ramp)

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
export const SCORE_LAND    = 10
export const SCORE_TAKEOFF = 10
export const SCORE_GOAROUND = -5
export const SCORE_CRASH   = -30  // per collision

export const CRASH_FLASH_MS = 1600  // ms the crash ring stays visible

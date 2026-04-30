// ---------------------------------------------------------------------------
// Canvas dimensions (fixed scene size)
// ---------------------------------------------------------------------------
export const CANVAS_W = 1200
export const CANVAS_H = 500

// ---------------------------------------------------------------------------
// Airport layout (all in canvas pixels)
// ---------------------------------------------------------------------------
export const MARGIN_X = 40          // left/right grass border
export const RUNWAY_LENGTH = CANVAS_W - MARGIN_X * 2

// Terminal
export const TERMINAL_Y = 52
export const TERMINAL_H = 80
export const TERMINAL_X = MARGIN_X
export const TERMINAL_W = RUNWAY_LENGTH

// Apron (concrete behind gates)
export const APRON_Y = TERMINAL_Y + TERMINAL_H
export const APRON_H = 20

// Taxiway Alpha (north of runways, between terminal apron and RWY 09R)
export const TAXIWAY_ALPHA_Y = APRON_Y + APRON_H
export const TAXIWAY_H = 26

// Runway 09R/27L (upper)
export const RWY_UPPER_Y = TAXIWAY_ALPHA_Y + TAXIWAY_H
export const RWY_H = 56
export const RWY_UPPER_CENTER_Y = RWY_UPPER_Y + RWY_H / 2

// Grass strip between runways
export const GRASS_STRIP_Y = RWY_UPPER_Y + RWY_H
export const GRASS_STRIP_H = 36

// Runway 09L/27R (lower)
export const RWY_LOWER_Y = GRASS_STRIP_Y + GRASS_STRIP_H
export const RWY_LOWER_CENTER_Y = RWY_LOWER_Y + RWY_H / 2

// Taxiway Bravo (south of lower runway)
export const TAXIWAY_BRAVO_Y = RWY_LOWER_Y + RWY_H

// Cargo area (south of Taxiway Bravo, directly connected)
export const CARGO_TAX_Y        = TAXIWAY_BRAVO_Y + TAXIWAY_H
export const CARGO_TAX_H        = 20
export const CARGO_APRON_Y      = CARGO_TAX_Y + CARGO_TAX_H
export const CARGO_APRON_H      = 40
export const CARGO_BLDG_Y       = CARGO_APRON_Y + CARGO_APRON_H
export const CARGO_BLDG_H       = 52
export const CARGO_STAND_COUNT  = 3

// Access road (north face of terminal — y=0 to TERMINAL_Y)
export const ROAD_VERGE_H    = 6                                   // grass verge at very top
export const ROAD_SIDEWALK_H = 5                                   // curb at terminal face
export const ROAD_DRIVE_H    = TERMINAL_Y - ROAD_VERGE_H - ROAD_SIDEWALK_H
export const ROAD_UPPER_Y    = Math.round(ROAD_VERGE_H + ROAD_DRIVE_H * 0.25) // arriving lane
export const ROAD_LOWER_Y    = Math.round(ROAD_VERGE_H + ROAD_DRIVE_H * 0.75) // departing lane

// Gates (3 evenly spaced along terminal south face)
export const GATE_COUNT = 3
export const GATE_Y = APRON_Y + APRON_H / 2   // center of apron
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

// Livery palette — regional carriers (muted tones)
export const LIVERY_COLORS = [
  '#3a5a8a', '#8a3a3a', '#2a6a4a',
  '#7a5a2a', '#6a3a6a', '#3a6a6a',
]

// Callsign pool — regional carriers
export const CALLSIGNS = [
  'SKW491','SKW228','QXE201','QXE509','RPA342','RPA118',
  'ASH603','ASH714','ENY334','ENY821','CPZ156','CPZ482',
  'PDT293','PDT607','JIA449','JIA072','GJS814','SIL261',
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

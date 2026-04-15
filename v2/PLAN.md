# Air Space v2 — Airport Ground + Approach Demo

## Concept
Top-down realistic airport scene, all drawn programmatically with Canvas 2D.
Full flight cycle: planes approach from edges → assigned runway → land → taxi to gate → board → taxi back → take off and depart.
Player is the ATC: assigns runways and gates. Conflict if two planes share a runway simultaneously.

---

## Visual Style
Top-down, clean and stylized (not radar — real airport map feel):
- Background: deep green grass (`#3a6b3a`)
- Runways: dark asphalt (`#2a2a2a`) with white threshold/centerline markings
- Taxiways: medium gray (`#555`) with yellow centerlines
- Terminal: flat-top building with windows, colored roof
- Apron/ramp: light gray concrete
- Trees: small dark green circles in clusters along edges
- Planes: white body, colored tail livery, drawn top-down (fuselage + wings + tail)

---

## Airport Layout (top-down, fixed scene)

```
┌───────────────────────────────────────────────────────────┐
│  🌳🌳🌳  (grass + trees border)                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │          TERMINAL BUILDING                          │   │
│  │  [G1]  [G2]  [G3]  [G4]  [G5]   (gate jetways)   │   │
│  └────────────────────────────────────────────────────┘   │
│       ──────── TAXIWAY ALPHA ────────── (gray)             │
│  ══════════════════════════════════════════════════════   │ RWY 09R/27L
│  (grass strip between runways)                            │
│  ══════════════════════════════════════════════════════   │ RWY 09L/27R
│       ──────── TAXIWAY BRAVO ────────── (gray)             │
│  🌳🌳🌳  (grass + trees border)                            │
└───────────────────────────────────────────────────────────┘
```

Key geometry constants in `constants.ts`:
- Two parallel runways (horizontal, east-west)
- Two taxiways (one north of runways, one south)
- Five gates along terminal apron
- Approach paths from left and right screen edges

---

## Plane State Machine

```
APPROACHING
    │ (player assigns runway)
    ▼
CLEARED_TO_LAND
    │ (lines up on final approach)
    ▼
LANDING_ROLL         (decelerating on runway)
    │ (speed = 0)
    ▼
VACATING             (turning off runway onto taxiway)
    │ (player assigns gate, or auto-assign)
    ▼
TAXIING_TO_GATE      (following taxiway waypoints)
    │ (reached gate position)
    ▼
AT_GATE              (boarding timer 10–15s)
    │ (timer expires)
    ▼
TAXIING_TO_RUNWAY    (following taxiway waypoints back)
    │ (reached hold short)
    ▼
HOLDING_SHORT        (waiting for runway clear)
    │ (runway available)
    ▼
TAKING_OFF           (accelerating down runway)
    │ (airborne, past screen edge)
    ▼
DEPARTED             (removed from world)
```

---

## File Structure

```
v2/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                  # Canvas setup, wires everything, starts loop
    ├── types.ts                 # All shared interfaces
    ├── constants.ts             # Layout geometry, colors, timings
    ├── game/
    │   ├── Airport.ts           # Static geometry: runways, taxiways, gates, approach paths
    │   ├── Aircraft.ts          # Aircraft state machine + waypoint movement
    │   ├── World.ts             # All game state: aircraft[], runways, gates, score
    │   ├── Spawner.ts           # Spawns approaching planes on increasing timer
    │   ├── GameLoop.ts          # requestAnimationFrame loop with delta-time
    │   └── ConflictDetector.ts  # Runway occupancy conflicts
    └── render/
        ├── AirportRenderer.ts   # Draws entire airport scene (background layer, cached)
        ├── AircraftRenderer.ts  # Draws each plane: fuselage, wings, tail, label
        ├── UIRenderer.ts        # Score, runway status badges, gate indicators, selection
        └── InputHandler.ts      # Click plane → show context menu → assign runway/gate
```

---

## Core Interfaces (types.ts)

```ts
type FlightPhase =
  | 'approaching' | 'cleared_to_land' | 'landing_roll'
  | 'vacating' | 'taxiing_to_gate' | 'at_gate'
  | 'taxiing_to_runway' | 'holding_short' | 'taking_off' | 'departed'

interface Aircraft {
  id: string
  callsign: string          // "UAL301"
  liveryColor: string       // tail color "#003087"
  x: number                 // canvas pixels
  y: number
  heading: number           // degrees, 0=N, 90=E (clockwise)
  speed: number             // px/s in canvas space
  phase: FlightPhase
  assignedRunway: string | null   // "09R", "27L", etc.
  assignedGate: string | null     // "G1"–"G5"
  waypoints: Point[]              // remaining path to follow
  boardingTimer: number           // ms remaining at gate
}

interface Runway {
  id: string                // "09R"
  reciprocal: string        // "27L"
  start: Point              // threshold end (landing end)
  end: Point                // far end
  headingDeg: number        // direction of landing (090 = landing eastward)
  status: 'available' | 'occupied'
  occupiedBy: string | null
}

interface Gate {
  id: string
  position: Point
  occupied: boolean
  occupiedBy: string | null
}

interface Point { x: number; y: number }
```

---

## Airport Geometry (constants.ts)

All positions in canvas pixels (scene is drawn to fill the canvas):
- Runway width: 60px
- Runway length: 85% of canvas width
- Gap between runways: 80px
- Taxiway width: 30px
- Terminal height: 80px, full width
- Gate spacing: evenly distributed, 5 gates

Approach paths: predefined `Point[]` arrays that curve in from screen edge to runway threshold.
- Left approaches (heading 090°): enter from left edge
- Right approaches (heading 270°): enter from right edge

---

## Spawner Logic

- Spawn interval starts at 20s, decreases to 8s as score increases
- Each plane spawns at a random approach path start point
- Callsign and livery assigned randomly from an airline list
- Plane enters `approaching` phase, drifts toward runway area
- Player must click and assign runway before it reaches a "go-around" boundary

---

## Player Interaction

1. **Click approaching plane** → selection ring appears, context panel shows
2. **Context panel** (sidebar): "Assign Runway" buttons: [09R] [09L] [27R] [27L]
3. **Plane clears runway** → auto-assigned nearest available gate (or player picks)
4. **Departing plane**: player clicks [Clear for Takeoff] button in panel
5. **Keyboard**: Escape = deselect, number keys 1–5 = assign gate

---

## Rendering Strategy

### Airport scene (AirportRenderer)
Drawn once to an offscreen canvas (OffscreenCanvas or a second `<canvas>`), then blitted each frame:
- Green grass background
- Dark apron/ramp rectangles
- Runway rectangles with threshold bars and centerline dashes
- Taxiway paths with yellow centerlines
- Terminal building (rectangle + windows + roof color)
- Gate jetways (small rectangles extending from terminal)
- Tree clusters (random circles, seeded so they don't move)

### Plane drawing (AircraftRenderer)
Each plane drawn with `ctx.save()` / `ctx.translate(x,y)` / `ctx.rotate(headingRad)`:
- Fuselage: rounded rectangle, white
- Wings: two symmetric arcs or bezier curves
- Tail fin: small triangle at rear
- Livery band: colored stripe on tail
- Label: callsign + phase badge above plane

### UI overlay (UIRenderer)
- Top bar: SCORE | PLANES IN SYSTEM | TIME
- Runway status strip: [09R: CLEAR ✓] [09L: OCCUPIED ✗]
- Gate status: small colored dots above each gate
- Selection panel (right sidebar): assigned plane info + action buttons

---

## Scoring
- +10 per successful landing
- +10 per successful takeoff
- -20 per conflict / go-around forced
- Display multiplier if 3+ landings in a row without conflict

---

## Progress Checklist

### To Do
- [ ] `v2/package.json`, `tsconfig.json`, `vite.config.ts`
- [ ] `v2/index.html`
- [ ] `src/types.ts`
- [ ] `src/constants.ts`
- [ ] `src/game/Airport.ts`
- [ ] `src/game/Aircraft.ts`
- [ ] `src/game/World.ts`
- [ ] `src/game/Spawner.ts`
- [ ] `src/game/GameLoop.ts`
- [ ] `src/game/ConflictDetector.ts`
- [ ] `src/render/AirportRenderer.ts`
- [ ] `src/render/AircraftRenderer.ts`
- [ ] `src/render/UIRenderer.ts`
- [ ] `src/render/InputHandler.ts`
- [ ] `src/main.ts`
- [ ] npm install + verify dev server

---

## Differences from v1
| | v1 | v2 |
|---|---|---|
| View | Radar / green-on-dark | Top-down airport, realistic colors |
| Planes | Blips with data tags | Drawn airplane shapes (body + wings) |
| Setting | En-route airspace | Airport (ground + approach) |
| Player role | Issue heading/alt commands | Assign runway + gate + takeoff clearance |
| Gameplay | Open-ended demo | Full loop with score |
| Scene | Dynamic (planes drift in/out) | Fixed airport layout |

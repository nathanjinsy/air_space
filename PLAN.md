# Air Space — ATC Demo: Implementation Plan

## Version Structure
- `v1/` — initial implementation (complete — see below)
- `v2/` — next approach (TBD)

---

## v1 Overview
A browser-based, visual air traffic control (ATC) demo. Classic green-on-dark radar scope aesthetic with animated sweep, plane blips, and data tags. Runs in auto-pilot mode by default; player can click any plane and issue heading/speed/altitude commands. Conflict detection highlights dangerous proximity in real time.

**Stack:** TypeScript + Vite + plain HTML5 Canvas 2D API (no game framework, no runtime dependencies)

---

## Project Structure

```
air_space/
├── index.html               # Single page layout: canvas (75%) + sidebar (25%)
├── package.json             # vite + typescript devDeps only
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts              # Entry point — wires everything together
    ├── types.ts             # Shared interfaces (AircraftState, ConflictInfo, etc.)
    ├── game/
    │   ├── Aircraft.ts      # Aircraft model + smooth interpolation logic
    │   ├── AutoPilot.ts     # Auto-mode: random heading/alt nudges every ~15s per plane
    │   ├── ConflictDetector.ts  # Scans all pairs, flags < 5nm AND < 1000ft
    │   ├── World.ts         # Holds all aircraft, spawns planes, runs update loop
    │   └── GameLoop.ts      # requestAnimationFrame loop with delta-time
    └── render/
        ├── RadarRenderer.ts # Sweep, range rings, compass, blips, trails, data tags
        ├── SidePanel.ts     # DOM sidebar: selected aircraft controls + conflict list
        └── InputHandler.ts  # Click-to-select, issue commands
```

---

## Core Design

### Coordinate System
- World space in **nautical miles**, centered at (0, 0) = radar center
- East = +x, North = +y
- Radar range: 120 nm radius
- Canvas pixels mapped from world via a scale factor

### Aircraft Model
```ts
{
  callsign: string        // e.g. "AA301"
  x, y: number           // nm from center
  heading: number        // 0=N, 90=E, 180=S, 270=W
  altitude: number       // feet (e.g. 32000)
  speed: number          // knots
  targetHeading/Altitude/Speed   // smooth interpolation targets
  trail: {x,y}[]        // last 8 positions (one per 2s) for ghost trail
  isUnderControl: boolean
  controlExpiresAt: number  // player control expires after 120s
  autopilotNextNudge: number
}
```

### Conflict Detection (both conditions required)
- **Warning**: < 8 nm horizontal AND < 2000 ft vertical
- **Conflict**: < 5 nm horizontal AND < 1000 ft vertical

### Autopilot
- Each plane has an independent nudge timer (random 10–25s interval)
- On nudge: random new target heading (±30° from current), occasional altitude shift (±2000 ft, clamped FL180–FL390)
- Planes under player control are skipped until `controlExpiresAt`

### Rendering Pipeline (per frame)
1. Clear canvas (`#050d1a`)
2. Draw range rings at 30, 60, 90, 120 nm
3. Draw compass rose (N/E/S/W labels)
4. Draw radar sweep (rotating line + fading arc, ~6s full rotation)
5. Draw ghost trails (fading dots)
6. Draw aircraft blips (color = normal/warning/conflict/selected)
7. Draw data tags (callsign, FL, speed) offset NE of blip
8. Draw selection ring for selected aircraft

### Sidebar
- **Top:** Selected aircraft info (callsign, HDG, ALT, SPD, mode) + command inputs (HDG / FL / SPD) + Issue button
- **Bottom:** Live conflict list with severity badge
- **Footer:** Color legend

### Player Interaction
- Click blip → select (hit radius ~12px in screen space)
- Click empty canvas → deselect
- Type heading/FL/speed → click "Issue Command" → plane smoothly turns/climbs → auto resumes after 120s

### Spawn Scenario
6 planes with deliberate converging paths so conflicts trigger within ~60s:
- 2 pairs on intersecting headings at similar altitudes
- 2 singles cruising normally

---

## Progress

### Done
- [x] `package.json` — vite + typescript devDeps
- [x] `tsconfig.json`
- [x] `vite.config.ts`
- [x] `index.html` — full layout, CSS, sidebar DOM structure

### Done
- [x] `src/types.ts`
- [x] `src/game/Aircraft.ts`
- [x] `src/game/AutoPilot.ts`
- [x] `src/game/ConflictDetector.ts`
- [x] `src/game/World.ts`
- [x] `src/game/GameLoop.ts`
- [x] `src/render/RadarRenderer.ts`
- [x] `src/render/SidePanel.ts`
- [x] `src/render/InputHandler.ts`
- [x] `src/main.ts`

### Remaining
- [ ] `npm install` + verify `npm run dev` works (needs Node.js installed on machine)

---

## Verification
1. `npm run dev` → browser opens, radar renders with sweep animation
2. Planes move, trails appear, data tags update live
3. Two converging planes trigger ⚠ warning → then conflict indicator in sidebar
4. Click a plane → sidebar shows its data, command form appears
5. Issue heading command → plane smoothly turns
6. After 120s, plane resumes autopilot behavior
7. `npm run build` → no TypeScript errors

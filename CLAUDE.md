# Air Space — CLAUDE.md

## Project
Browser-based ATC radar demo. TypeScript + Vite + plain HTML5 Canvas 2D. No runtime dependencies, no game framework.

## Versions
- `v1/` — initial implementation: plain Canvas, 6 planes, radar sweep, conflict detection, player commands
- `v2/` — in progress (different approach, TBD)

## Dev Commands (run from inside the version folder)
```bash
cd v1
npm install        # first-time setup
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

## Key Conventions

### Coordinate System
- World space in **nautical miles**, centered at (0,0) = radar center
- **East = +x, North = +y** (standard math axes, not screen axes)
- Heading: 0=North, 90=East, 180=South, 270=West (clockwise from North)
- Altitude in **feet** internally (e.g. 32000). Display as FL: `Math.round(altitude / 100)`
- Speed in **knots**

### File Layout (v1)
```
v1/src/
  types.ts          — shared interfaces only, no logic
  game/             — pure simulation logic, no DOM/canvas
  render/           — canvas drawing + DOM sidebar, reads from World state
  main.ts           — wires game + render together, starts loop
```

### Style
- Strict TypeScript — no `any`, no unused vars
- No classes with complex inheritance — prefer plain objects + functions
- Keep render/ and game/ layers separate: render reads state, never mutates it (except InputHandler issuing commands via World API)

## Architecture Notes (v1)
- See `PLAN.md` for full design rationale and progress checklist
- Conflict thresholds: warning = 8nm / 2000ft, conflict = 5nm / 1000ft
- Player control duration: 120 seconds, then autopilot resumes
- Trail: 8 ghost points, one appended every 2 seconds

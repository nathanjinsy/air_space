import { createWorld, updateWorld } from './game/World'
import { createGameLoop } from './game/GameLoop'
import { getAirportCanvas } from './render/AirportRenderer'
import { renderAircraft } from './render/AircraftRenderer'
import { renderVehicles } from './render/VehicleRenderer'
import { renderRoadVehicles } from './render/RoadVehicleRenderer'
import { getRoadVehicles } from './game/RoadVehicles'
import { renderUI } from './render/UIRenderer'
import { getPanelElements, updateSidePanel } from './render/SidePanel'
import { setupInput } from './render/InputHandler'
import { CANVAS_W, CANVAS_H } from './constants'

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('airport') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const wrap = document.getElementById('canvas-wrap')!

canvas.width = CANVAS_W
canvas.height = CANVAS_H

// Scale canvas to fit the wrap div while keeping aspect ratio
function scaleCanvas(): void {
  const rect = wrap.getBoundingClientRect()
  const scaleW = rect.width / CANVAS_W
  const scaleH = rect.height / CANVAS_H
  const scale = Math.min(scaleW, scaleH)
  canvas.style.width = `${CANVAS_W * scale}px`
  canvas.style.height = `${CANVAS_H * scale}px`
}

window.addEventListener('resize', scaleCanvas)
// Defer first scale call so flexbox layout is fully settled
requestAnimationFrame(scaleCanvas)

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------
const state = createWorld()
const els = getPanelElements()
setupInput(canvas, state)

// Pre-render static airport scene
const airportBg = getAirportCanvas()

const loop = createGameLoop((dt) => {
  updateWorld(state, dt)

  // Draw airport background
  ctx.drawImage(airportBg, 0, 0)

  // Draw road vehicles on the access road (north)
  renderRoadVehicles(ctx, getRoadVehicles())

  // Draw ground vehicles (below aircraft)
  renderVehicles(ctx, state.vehicles)

  // Draw aircraft
  renderAircraft(ctx, state.aircraft, state.selectedId)

  // Draw UI overlay
  renderUI(ctx, state)

  // Update DOM sidebar
  updateSidePanel(els, state)
})

loop.start()

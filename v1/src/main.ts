import { createWorld, updateWorld } from './game/World'
import { createGameLoop } from './game/GameLoop'
import { renderRadar } from './render/RadarRenderer'
import { getSidePanelElements, updateSidePanel } from './render/SidePanel'
import { setupInputHandler } from './render/InputHandler'

const canvas = document.getElementById('radar') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const radarWrap = document.getElementById('radar-wrap')!

// Resize canvas to fill its container, keeping it square
function resizeCanvas(): void {
  const rect = radarWrap.getBoundingClientRect()
  const size = Math.min(rect.width, rect.height) - 8
  canvas.width = size
  canvas.height = size
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()

const world = createWorld()
const els = getSidePanelElements()
setupInputHandler(canvas, world, els)

const loop = createGameLoop((dt) => {
  updateWorld(world, dt)

  renderRadar(ctx, world, dt)

  const selected = world.selectedId
    ? world.aircraft.find(ac => ac.id === world.selectedId) ?? null
    : null
  updateSidePanel(els, selected, world.conflicts)
})

loop.start()

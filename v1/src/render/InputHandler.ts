import type { World } from '../game/World'
import { issueCommand } from '../game/Aircraft'
import { hitTest } from './RadarRenderer'
import type { SidePanelElements } from './SidePanel'

const RADAR_RANGE_NM = 120

export function setupInputHandler(
  canvas: HTMLCanvasElement,
  world: World,
  els: SidePanelElements
): void {
  // Canvas click: select or deselect aircraft
  canvas.addEventListener('click', (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const radiusPx = Math.min(canvas.width, canvas.height) / 2 - 4
    const scale = radiusPx / RADAR_RANGE_NM

    const hit = hitTest(mx, my, world.aircraft, cx, cy, scale)
    world.selectedId = hit  // null = deselect

    // Clear command inputs on new selection
    if (hit) {
      const ac = world.aircraft.find(a => a.id === hit)
      if (ac) {
        const fl = Math.round(ac.altitude / 100)
        els.cmdHdg.value = Math.round(ac.heading).toString()
        els.cmdAlt.value = fl.toString()
        els.cmdSpd.value = Math.round(ac.speed).toString()
      }
    }
  })

  // Issue command button
  els.issueBtn.addEventListener('click', () => {
    if (!world.selectedId) return
    const ac = world.aircraft.find(a => a.id === world.selectedId)
    if (!ac) return

    const now = Date.now()

    const hdgVal = parseInt(els.cmdHdg.value, 10)
    const altVal = parseInt(els.cmdAlt.value, 10)
    const spdVal = parseInt(els.cmdSpd.value, 10)

    const heading = (!isNaN(hdgVal) && hdgVal >= 1 && hdgVal <= 360) ? hdgVal : null
    const altFl   = (!isNaN(altVal) && altVal >= 180 && altVal <= 450) ? altVal : null
    const speed   = (!isNaN(spdVal) && spdVal >= 200 && spdVal <= 550) ? spdVal : null

    if (heading !== null || altFl !== null || speed !== null) {
      issueCommand(ac, heading, altFl, speed, now)
    }
  })

  // Allow pressing Enter in any command input to issue
  for (const input of [els.cmdHdg, els.cmdAlt, els.cmdSpd]) {
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') els.issueBtn.click()
    })
  }

  // Escape to deselect
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') world.selectedId = null
  })
}

import type { GameState } from '../types'
import { resetWorld } from '../game/World'
import { PLANE_LENGTH } from '../constants'

const HIT_RADIUS = Math.max(PLANE_LENGTH, 20)

export function setupInput(
  canvas: HTMLCanvasElement,
  state: GameState
): void {
  canvas.addEventListener('click', (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    if (state.gameOver) {
      resetWorld(state)
      return
    }

    // Hit-test planes
    let hit: string | null = null
    for (const ac of state.aircraft) {
      const dx = ac.x - mx
      const dy = ac.y - my
      if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
        hit = ac.id
        break
      }
    }
    state.selectedId = hit
  })

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') state.selectedId = null
  })
}

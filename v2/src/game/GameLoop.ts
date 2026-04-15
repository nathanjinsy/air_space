export type TickFn = (dt: number) => void

export interface GameLoop {
  start: () => void
  stop: () => void
}

export function createGameLoop(tick: TickFn): GameLoop {
  let rafId: number | null = null
  let lastTime: number | null = null

  function frame(timestamp: number): void {
    if (lastTime === null) lastTime = timestamp
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1)
    lastTime = timestamp
    tick(dt)
    rafId = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (rafId !== null) return
      rafId = requestAnimationFrame(frame)
    },
    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
        lastTime = null
      }
    },
  }
}

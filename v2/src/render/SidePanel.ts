import type { GameState, Aircraft } from '../types'
import { assignRunway, clearForTakeoff, lineUp, crossRunway } from '../game/Aircraft'

export interface PanelElements {
  noSelection: HTMLElement
  aircraftDetail: HTMLElement
  detailCallsign: HTMLElement
  detailPhase: HTMLElement
  detailSpeed: HTMLElement
  detailRunway: HTMLElement
  detailGate: HTMLElement
  actionButtons: HTMLElement
  runwayList: HTMLElement
  gateDots: HTMLElement
}

// ---------------------------------------------------------------------------
// Dirty-flag state — only rebuild DOM when these keys change
// ---------------------------------------------------------------------------
let lastSelectedId: string | null = null
let lastPhase: string | null = null
let lastRunwayKey = ''
let lastGateKey = ''

export function getPanelElements(): PanelElements {
  function el<T extends HTMLElement>(id: string): T {
    const e = document.getElementById(id)
    if (!e) throw new Error(`#${id} not found`)
    return e as T
  }
  return {
    noSelection:    el('no-selection'),
    aircraftDetail: el('aircraft-detail'),
    detailCallsign: el('detail-callsign'),
    detailPhase:    el('detail-phase'),
    detailSpeed:    el('detail-speed'),
    detailRunway:   el('detail-runway'),
    detailGate:     el('detail-gate'),
    actionButtons:  el('action-buttons'),
    runwayList:     el('runway-list'),
    gateDots:       el('gate-dots'),
  }
}

export function updateSidePanel(els: PanelElements, state: GameState): void {
  updateSelection(els, state)
  updateRunwayList(els, state)
  updateGateDots(els, state)
}

function updateSelection(els: PanelElements, state: GameState): void {
  const ac = state.selectedId
    ? state.aircraft.find(a => a.id === state.selectedId) ?? null
    : null

  if (!ac) {
    if (lastSelectedId !== null) {
      els.noSelection.style.display = 'block'
      els.aircraftDetail.style.display = 'none'
      els.actionButtons.innerHTML = ''
      lastSelectedId = null
      lastPhase = null
    }
    return
  }

  // Always show detail panel
  els.noSelection.style.display = 'none'
  els.aircraftDetail.style.display = 'block'

  // Live stats update every frame (just text, no DOM churn)
  els.detailCallsign.textContent = ac.callsign
  els.detailCallsign.style.color = ac.liveryColor
  els.detailPhase.textContent = ac.phase.replace(/_/g, ' ').toUpperCase()
  els.detailSpeed.textContent = `${Math.round(ac.speed)} px/s`
  els.detailRunway.textContent = ac.assignedRunway ?? '—'
  els.detailGate.textContent = ac.assignedGate ?? '—'

  // Only rebuild action buttons when selection or phase changes
  if (ac.id !== lastSelectedId || ac.phase !== lastPhase) {
    lastSelectedId = ac.id
    lastPhase = ac.phase
    buildActionButtons(els.actionButtons, ac, state)
  }
}

function buildActionButtons(container: HTMLElement, ac: Aircraft, state: GameState): void {
  container.innerHTML = ''

  if (ac.phase === 'approaching') {
    for (const rwy of state.runways) {
      const clear = rwy.status === 'available'
      const label = ac.fromRight ? rwy.reciprocal : rwy.id
      const btn = document.createElement('button')
      btn.className = 'action-btn'
      btn.textContent = `→ Land ${label} ${clear ? '✓' : '(busy)'}`
      btn.disabled = !clear
      btn.addEventListener('click', () => {
        assignRunway(ac, rwy, state)
      })
      container.appendChild(btn)
    }
  }

  if (ac.phase === 'holding_short') {
    const rwy = state.runways.find(r => r.id === ac.assignedRunway || r.reciprocal === ac.assignedRunway)
    const clear = !rwy || rwy.status === 'available'
    const rwyLabel = ac.fromRight ? rwy?.reciprocal : rwy?.id

    // Line up and wait
    const luBtn = document.createElement('button')
    luBtn.className = 'action-btn'
    luBtn.textContent = `↕ Line Up ${rwyLabel ?? ''}`
    luBtn.disabled = !clear
    luBtn.addEventListener('click', () => lineUp(ac, state))
    container.appendChild(luBtn)

    // Cross to other runway
    const otherRwy = state.runways.find(r => r.id !== rwy?.id)
    const crossLabel = otherRwy ? (ac.fromRight ? otherRwy.reciprocal : otherRwy.id) : '?'
    const crBtn = document.createElement('button')
    crBtn.className = 'action-btn'
    crBtn.textContent = `↔ Cross → ${crossLabel}`
    crBtn.addEventListener('click', () => crossRunway(ac, state))
    container.appendChild(crBtn)

    // Direct takeoff clearance
    const toBtn = document.createElement('button')
    toBtn.className = 'action-btn primary'
    toBtn.textContent = `✈ Cleared for Takeoff`
    toBtn.disabled = !clear
    toBtn.addEventListener('click', () => clearForTakeoff(ac, state))
    container.appendChild(toBtn)
  }

  // Already lined up on runway — only takeoff clearance needed
  if (ac.phase === 'lined_up') {
    const btn = document.createElement('button')
    btn.className = 'action-btn primary'
    btn.textContent = `✈ Cleared for Takeoff`
    btn.addEventListener('click', () => clearForTakeoff(ac, state))
    container.appendChild(btn)
  }
}

function updateRunwayList(els: PanelElements, state: GameState): void {
  // Only rebuild when runway statuses change
  const key = state.runways.map(r => `${r.id}:${r.status}`).join(',')
  if (key === lastRunwayKey) return
  lastRunwayKey = key

  els.runwayList.innerHTML = ''
  for (const rwy of state.runways) {
    const div = document.createElement('div')
    div.className = 'runway-status'
    const clear = rwy.status === 'available'
    div.innerHTML = `
      <span>${rwy.id} / ${rwy.reciprocal}</span>
      <span class="rwy-badge ${clear ? 'clear' : 'occupied'}">${clear ? 'CLEAR' : 'OCCUPIED'}</span>
    `
    els.runwayList.appendChild(div)
  }
}

function updateGateDots(els: PanelElements, state: GameState): void {
  // Only rebuild when gate occupancy changes
  const key = state.gates.map(g => `${g.id}:${g.occupied ? '1' : '0'}`).join(',')
  if (key === lastGateKey) return
  lastGateKey = key

  els.gateDots.innerHTML = ''
  for (const gate of state.gates) {
    const dot = document.createElement('div')
    dot.className = `gate-dot ${gate.occupied ? 'occupied' : 'free'}`
    dot.textContent = gate.id
    dot.title = gate.occupied
      ? `${gate.id}: ${state.aircraft.find(a => a.id === gate.occupiedBy)?.callsign ?? 'occupied'}`
      : `${gate.id}: free`
    els.gateDots.appendChild(dot)
  }
}

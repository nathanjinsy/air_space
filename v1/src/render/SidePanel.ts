import type { AircraftState, ConflictInfo } from '../types'

export interface SidePanelElements {
  noSelection: HTMLElement
  aircraftDetail: HTMLElement
  detailCallsign: HTMLElement
  detailHdg: HTMLElement
  detailAlt: HTMLElement
  detailSpd: HTMLElement
  detailMode: HTMLElement
  cmdForm: HTMLElement
  cmdHdg: HTMLInputElement
  cmdAlt: HTMLInputElement
  cmdSpd: HTMLInputElement
  issueBtn: HTMLButtonElement
  conflictList: HTMLElement
  noConflicts: HTMLElement
  clock: HTMLElement
}

export function getSidePanelElements(): SidePanelElements {
  function el<T extends HTMLElement>(id: string): T {
    const e = document.getElementById(id)
    if (!e) throw new Error(`Element #${id} not found`)
    return e as T
  }
  return {
    noSelection:    el('no-selection'),
    aircraftDetail: el('aircraft-detail'),
    detailCallsign: el('detail-callsign'),
    detailHdg:      el('detail-hdg'),
    detailAlt:      el('detail-alt'),
    detailSpd:      el('detail-spd'),
    detailMode:     el('detail-mode'),
    cmdForm:        el('cmd-form'),
    cmdHdg:         el<HTMLInputElement>('cmd-hdg'),
    cmdAlt:         el<HTMLInputElement>('cmd-alt'),
    cmdSpd:         el<HTMLInputElement>('cmd-spd'),
    issueBtn:       el<HTMLButtonElement>('issue-btn'),
    conflictList:   el('conflict-list'),
    noConflicts:    el('no-conflicts'),
    clock:          el('clock'),
  }
}

export function updateSidePanel(
  els: SidePanelElements,
  selected: AircraftState | null,
  conflicts: ConflictInfo[]
): void {
  // Clock
  const now = new Date()
  const hh = now.getUTCHours().toString().padStart(2, '0')
  const mm = now.getUTCMinutes().toString().padStart(2, '0')
  const ss = now.getUTCSeconds().toString().padStart(2, '0')
  els.clock.textContent = `${hh}:${mm}:${ss} UTC`

  // Selected aircraft
  if (selected) {
    els.noSelection.style.display = 'none'
    els.aircraftDetail.style.display = 'block'
    els.cmdForm.style.display = 'block'

    const fl = Math.round(selected.altitude / 100)
    els.detailCallsign.textContent = selected.callsign
    els.detailHdg.textContent = `${Math.round(selected.heading).toString().padStart(3, '0')}°`
    els.detailAlt.textContent = `FL${fl.toString().padStart(3, '0')}`
    els.detailSpd.textContent = `${Math.round(selected.speed)} kt`
    els.detailMode.textContent = selected.isUnderControl ? 'ATC' : 'AUTO'
  } else {
    els.noSelection.style.display = 'block'
    els.aircraftDetail.style.display = 'none'
    els.cmdForm.style.display = 'none'
  }

  // Conflicts
  // Remove old conflict items (keep the no-conflicts div)
  const existing = els.conflictList.querySelectorAll('.conflict-item')
  existing.forEach(e => e.remove())

  if (conflicts.length === 0) {
    els.noConflicts.style.display = 'block'
  } else {
    els.noConflicts.style.display = 'none'
    for (const c of conflicts) {
      const item = document.createElement('div')
      item.className = `conflict-item ${c.severity}`

      const distStr = c.distanceNm.toFixed(1)
      const altStr = Math.round(c.altDiff / 100) * 100

      item.innerHTML = `
        <div class="pair">${c.a.callsign} / ${c.b.callsign}</div>
        <div class="detail">${distStr}nm  |  ${altStr}ft sep</div>
      `
      els.conflictList.appendChild(item)
    }
  }
}

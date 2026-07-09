'use client'

import { useRef, useState, useEffect } from 'react'
import { flushSync } from 'react-dom'

function EditableField({ value, className, emptyClass, placeholder, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value || '')

  useEffect(() => { if (!editing) setDraft(value || '') }, [value, editing])

  const commit = () => {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed !== (value || '')) onSave(trimmed)
  }

  if (editing) {
    return (
      <input
        className={`inline-edit ${className}`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) }
        }}
        autoFocus
        onClick={e => e.stopPropagation()}
      />
    )
  }

  return (
    <div
      className={`${className}${!value ? ` ${emptyClass}` : ''} editable`}
      title="Click to edit"
      onClick={e => { e.stopPropagation(); setDraft(value || ''); setEditing(true) }}
    >
      {value || placeholder}
    </div>
  )
}

const VAULT_COLOR = {
  cybersecurity: 'p-coral',
  fitness:       'p-jade',
  spirituality:  'p-amethyst',
  homelab:       'p-azure',
}

function colorClass(vaultId) {
  return VAULT_COLOR[vaultId?.toLowerCase()] ?? 'p-azure'
}

// move item from index `from` to index `to`, return new array
function move(arr, from, to) {
  const a = arr.slice()
  const [x] = a.splice(from, 1)
  a.splice(to, 0, x)
  return a
}

const DROP_MS = 190
const EASE = 'cubic-bezier(.2,.8,.2,1)'
// snappy slide for rows pushed aside by the dragged item
const SHIFT_TRANSITION = 'transform .17s cubic-bezier(.22,.61,.36,1)'

export default function PriorityPanel({ statuses, onUpdate, order, onReorder }) {
  const containerRef = useRef(null)
  const rowRefs = useRef(new Map())   // vault_id -> element
  const drag = useRef(null)           // live drag state, no re-render during move

  function setRow(id, el) {
    if (el) rowRefs.current.set(id, el)
    else    rowRefs.current.delete(id)
  }

  function startDrag(e, vaultId) {
    e.preventDefault()
    if (drag.current) return
    const handle = e.currentTarget
    const draggedEl = rowRefs.current.get(vaultId)
    if (!draggedEl || !containerRef.current) return

    // base order = current visual order (DOM matches statuses)
    const baseOrder = statuses.map(s => s.vault_id)
    const fromIndex = baseOrder.indexOf(vaultId)

    // snapshot each row's center in viewport coords (pre-drag layout)
    const centers = new Map()
    let slotHeight = draggedEl.getBoundingClientRect().height
    for (const id of baseOrder) {
      const el = rowRefs.current.get(id)
      if (!el) continue
      const r = el.getBoundingClientRect()
      centers.set(id, r.top + r.height / 2)
      // arm pushed-aside rows with a quick, deterministic slide
      if (id !== vaultId) el.style.transition = SHIFT_TRANSITION
    }
    // slot = distance between adjacent rows (accounts for border/padding gaps)
    if (baseOrder.length > 1) {
      const a = centers.get(baseOrder[0])
      const b = centers.get(baseOrder[1])
      if (a != null && b != null) slotHeight = Math.abs(b - a)
    }

    handle.setPointerCapture(e.pointerId)
    draggedEl.classList.add('dragging')
    draggedEl.style.transition = 'none'
    draggedEl.style.zIndex = '5'

    drag.current = {
      vaultId, handle, draggedEl, baseOrder, fromIndex,
      centers, slotHeight, startY: e.clientY, overIndex: fromIndex,
    }

    function onMove(ev) {
      const d = drag.current
      if (!d) return
      const dy = ev.clientY - d.startY
      // dragged row tracks the finger instantly
      d.draggedEl.style.transform = `translateY(${dy}px) scale(1.02)`

      // where does the dragged center sit now?
      const draggedCenter = d.centers.get(d.vaultId) + dy
      // target index = how many OTHER rows sit above the dragged center
      let cnt = 0
      for (const id of d.baseOrder) {
        if (id === d.vaultId) continue
        if (d.centers.get(id) < draggedCenter) cnt++
      }
      if (cnt === d.overIndex) return
      d.overIndex = cnt

      // open the gap: shift each sibling to its target slot
      const target = move(d.baseOrder, d.fromIndex, d.overIndex)
      for (const id of d.baseOrder) {
        if (id === d.vaultId) continue
        const el = rowRefs.current.get(id)
        if (!el) continue
        const delta = (target.indexOf(id) - d.baseOrder.indexOf(id)) * d.slotHeight
        el.style.transform = delta ? `translateY(${delta}px)` : ''
      }
    }

    function onUp() {
      const d = drag.current
      if (!d) return
      d.handle.removeEventListener('pointermove', onMove)

      const target = move(d.baseOrder, d.fromIndex, d.overIndex)
      const restShift = (d.overIndex - d.fromIndex) * d.slotHeight

      // settle the dragged row into the gap
      d.draggedEl.style.transition = `transform ${DROP_MS}ms ${EASE}`
      d.draggedEl.style.transform = `translateY(${restShift}px) scale(1)`
      d.draggedEl.classList.remove('dragging')

      setTimeout(() => {
        // Atomic swap: commit new order AND clear transforms in one synchronous
        // tick so the browser never paints an in-between frame.
        // transformed-old-order == untransformed-new-order → invisible handoff.
        const els = d.baseOrder.map(id => rowRefs.current.get(id)).filter(Boolean)
        for (const el of els) el.style.transition = 'none'
        flushSync(() => onReorder(target))   // DOM reorders now, synchronously
        for (const el of els) { el.style.transform = ''; el.style.zIndex = '' }
        // force reflow so the cleared transforms apply before transitions return
        if (containerRef.current) void containerRef.current.offsetHeight
        for (const el of els) el.style.transition = ''
      }, DROP_MS)

      drag.current = null
    }

    handle.addEventListener('pointermove',   onMove)
    handle.addEventListener('pointerup',     onUp, { once: true })
    handle.addEventListener('pointercancel', onUp, { once: true })
  }

  if (!statuses.length) {
    return (
      <div className="glass card">
        <div className="card-head">
          <div className="card-label head-amethyst"><span className="dot" />Active Priorities</div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>No vaults connected. Check vault.config.js</p>
      </div>
    )
  }

  return (
    <div className="glass card">
      <div className="card-head">
        <div className="card-label head-amethyst"><span className="dot" />Active Priorities</div>
        <span className="reorder-hint">drag to reorder</span>
      </div>
      <div ref={containerRef} className="card-scroll">
        {statuses.map(s => (
          <div
            key={s.vault_id}
            ref={el => setRow(s.vault_id, el)}
            data-vault-id={s.vault_id}
            className={`priority ${colorClass(s.vault_id)}`}
          >
            <span
              className="p-label"
              onClick={e => {
                e.stopPropagation()
                fetch('/api/open-vault', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ vault: s.vault_name || s.vault_id }),
                })
              }}
            >{s.vault_label || s.vault_id}</span>
            <EditableField
              value={s.next_move}
              className="p-text"
              emptyClass="empty"
              placeholder="No next_move set"
              onSave={val => onUpdate(s.vault_id, 'next_move', val)}
            />
            {s.focus_area && <div className="p-sub">{s.focus_area}</div>}
            <button
              className="drag-handle"
              aria-label={`Drag to reorder ${s.vault_label || s.vault_id}`}
              onPointerDown={e => startDrag(e, s.vault_id)}
            >
              <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">
                <circle cx="2.5" cy="3"  r="1.1" />
                <circle cx="7.5" cy="3"  r="1.1" />
                <circle cx="2.5" cy="8"  r="1.1" />
                <circle cx="7.5" cy="8"  r="1.1" />
                <circle cx="2.5" cy="13" r="1.1" />
                <circle cx="7.5" cy="13" r="1.1" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

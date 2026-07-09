import { useState, useRef, useCallback } from 'react'

const PAGE_SIZE = 5

export default function PriorityPanel({ statuses, onUpdate, order, onReorder }) {
  const [page,     setPage]     = useState(0)
  const [editing,  setEditing]  = useState(null) // vault_id being edited
  const [dragging, setDragging] = useState(null) // vault_id being dragged
  const [dragOver, setDragOver] = useState(null)
  const editRefs = useRef({})

  const totalPages = Math.ceil(statuses.length / PAGE_SIZE)
  const visible    = statuses.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  // ── DRAG AND DROP ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e, vaultId) => {
    setDragging(vaultId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e, vaultId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(vaultId)
  }, [])

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault()
    if (!dragging || dragging === targetId) return
    const newOrder = [...order]
    const fromIdx  = newOrder.indexOf(dragging)
    const toIdx    = newOrder.indexOf(targetId)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragging)
    onReorder(newOrder)
    setDragging(null)
    setDragOver(null)
  }, [dragging, order, onReorder])

  const handleDragEnd = useCallback(() => {
    setDragging(null)
    setDragOver(null)
  }, [])

  // ── INLINE EDIT ────────────────────────────────────────────────────────────
  const handleEditBlur = useCallback((vaultId, el) => {
    const newVal = el.innerText.trim()
    if (newVal) onUpdate(vaultId, 'next_move', newVal)
    setEditing(null)
  }, [onUpdate])

  const handleEditKeyDown = useCallback((e, vaultId, el) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      el.blur()
    }
    if (e.key === 'Escape') {
      setEditing(null)
    }
  }, [])

  if (!statuses.length) {
    return (
      <div className="panel" style={{ borderTop: '2px solid #378ADD' }}>
        <div className="panel-label">
          <div className="panel-label-dot" style={{ background: '#378ADD' }} />
          Active priorities
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>No vaults connected. Check vault.config.js</p>
      </div>
    )
  }

  return (
    <div
      className="panel"
      style={{ borderTop: '2px solid #378ADD' }}
      // Clear drag state if pointer leaves the panel entirely
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDragging(null)
          setDragOver(null)
        }
      }}
    >
      <div className="panel-label">
        <div className="panel-label-dot" style={{ background: '#378ADD' }} />
        Active priorities
      </div>

      <div>
        {visible.map((s, i) => {
          const color     = s.vault_color || '#888'
          const isDragged = dragging  === s.vault_id
          const isOver    = dragOver  === s.vault_id
          const isBlocked = s.blocked === true

          return (
            <div
              key={s.vault_id}
              className="priority-row"
              draggable
              onDragStart={e => handleDragStart(e, s.vault_id)}
              onDragOver={e  => handleDragOver(e,  s.vault_id)}
              onDrop={e      => handleDrop(e,       s.vault_id)}
              onDragEnd={handleDragEnd}
              style={{
                display:       'flex',
                alignItems:    'flex-start',
                gap:           '8px',
                padding:       '9px 0',
                borderBottom:  i < visible.length - 1 ? '0.5px solid var(--border)' : 'none',
                opacity:       isDragged ? 0.4 : 1,
                background:    isOver    ? 'var(--surface2)' : 'transparent',
                borderRadius:  isOver    ? 'var(--radius-sm)' : '0',
                transition:    'all 150ms ease',
                cursor:        'default',
              }}
            >
              {/* Drag handle */}
              <div className="drag-handle" style={{ marginTop: '2px', fontSize: '11px' }}>⠿</div>

              {/* Color indicator */}
              <div style={{
                width:        3,
                height:       '100%',
                minHeight:    32,
                background:   color,
                borderRadius: 2,
                flexShrink:   0,
                marginTop:    2,
              }} />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '9px',
                  fontWeight:    500,
                  letterSpacing: '.08em',
                  color,
                  marginBottom:  '3px',
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '5px',
                }}>
                  {s.vault_label || s.vault_id}
                  {isBlocked && (
                    <span style={{
                      background:   'var(--color-background-danger, #FAECE7)',
                      color:        'var(--color-text-danger, #993C1D)',
                      border:       '0.5px solid var(--color-border-danger, #F0997B)',
                      borderRadius: '3px',
                      padding:      '0 4px',
                      fontSize:     '8px',
                    }}>
                      blocked
                    </span>
                  )}
                </div>

                <div
                  ref={el => { if (el) editRefs.current[s.vault_id] = el }}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={() => setEditing(s.vault_id)}
                  onBlur={e  => handleEditBlur(s.vault_id, e.currentTarget)}
                  onKeyDown={e => handleEditKeyDown(e, s.vault_id, e.currentTarget)}
                  style={{
                    fontSize:   '12.5px',
                    color:      s.next_move ? 'var(--text)' : 'var(--text-3)',
                    lineHeight: 1.45,
                    outline:    'none',
                    padding:    editing === s.vault_id ? '1px 3px' : '1px 0',
                    borderRadius: 3,
                    background:   editing === s.vault_id ? 'var(--surface2)' : 'transparent',
                    minHeight:    '18px',
                  }}
                >
                  {s.next_move || 'No next_move set'}
                </div>

                {s.focus_area && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   '9px',
                    color:      'var(--text-3)',
                    marginTop:  '3px',
                  }}>
                    {s.focus_area}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dot pagination */}
      {totalPages > 1 && (
        <div className="dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={`dot ${i === page ? 'active' : ''}`}
              style={{ background: i === page ? '#378ADD' : undefined }}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

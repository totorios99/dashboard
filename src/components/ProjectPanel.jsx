import { useState, useCallback, useEffect } from 'react'

export default function ProjectPanel({ statuses, onUpdate }) {
  const [page, setPage] = useState(0)

  const projects = statuses
    .filter(s => s.project_status === 'active' && s.project_name)
    .map(s => {
      const milestones     = Array.isArray(s.project_milestones) ? s.project_milestones : []
      const doneMilestones = milestones.filter(m => m.done).length
      const pct = milestones.length
        ? Math.round((doneMilestones / milestones.length) * 100)
        : Math.min(100, Math.max(0, Number(s.project_pct) || 0))
      return {
        vaultId:    s.vault_id,
        vaultColor: s.vault_color || '#888',
        vaultLabel: s.vault_label || s.vault_id,
        name:       s.project_name,
        nextMove:   s.project_next_move || s.next_move || '',
        pct,
        milestones,
        pillars:    s.pillars || [s.vault_id],
        started:    s.project_started || '',
      }
    })

  const totalPages = projects.length

  // Reset page when the number of projects changes to avoid stale index
  useEffect(() => {
    setPage(p => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const project = projects[Math.min(page, Math.max(0, totalPages - 1))]

  const toggleMilestone = useCallback((vaultId, milestones, idx) => {
    const updated = milestones.map((m, i) =>
      i === idx ? { ...m, done: !m.done } : m
    )
    onUpdate(vaultId, 'project_milestones', updated)
  }, [onUpdate])

  const handleNextMoveEdit = useCallback((e, vaultId) => {
    const val = e.currentTarget.innerText.trim()
    if (val) onUpdate(vaultId, 'project_next_move', val)
  }, [onUpdate])

  if (!projects.length) {
    return (
      <div className="panel" style={{ borderTop: '2px solid #BA7517' }}>
        <div className="panel-label">
          <div className="panel-label-dot" style={{ background: '#BA7517' }} />
          Active project
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          No active projects. Set <span style={{ fontFamily: 'var(--font-mono)' }}>project_status: active</span> in a STATUS.md
        </p>
      </div>
    )
  }

  const c = project.vaultColor

  return (
    <div className="panel" style={{ borderTop: '2px solid #BA7517' }}>
      <div className="panel-label">
        <div className="panel-label-dot" style={{ background: '#BA7517' }} />
        Active project
      </div>

      <div key={page} className="fade-up">

        {/* Title */}
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px', lineHeight: 1.3 }}>
          {project.name}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {(Array.isArray(project.pillars) ? project.pillars : [project.pillars]).map(p => (
            <span key={p} className="tag" style={{
              background:  `${c}18`,
              color:       c,
              borderColor: `${c}40`,
            }}>
              {p}
            </span>
          ))}
          {project.started && (
            <span className="tag mono" style={{
              background:  'var(--surface2)',
              color:       'var(--text-3)',
              borderColor: 'var(--border)',
            }}>
              since {project.started}
            </span>
          )}
        </div>

        {/* Next move */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '9px',
            color:         'var(--text-3)',
            letterSpacing: '.08em',
            marginBottom:  '4px',
          }}>
            next move
          </div>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={e => handleNextMoveEdit(e, project.vaultId)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            style={{
              fontSize:     '12.5px',
              color:        'var(--text)',
              lineHeight:   1.45,
              outline:      'none',
              padding:      '2px 4px',
              borderRadius: '3px',
              border:       '0.5px solid transparent',
              transition:   'border-color 150ms ease, background 150ms ease',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--border2)'
              e.currentTarget.style.background  = 'var(--surface2)'
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.background  = 'transparent'
            }}
          >
            {project.nextMove || '—'}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-3)' }}>
            Sprint progress
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: c }}>
            {project.pct}%
          </span>
        </div>

        <div className="progress-bar" style={{ marginBottom: '10px' }}>
          <div className="progress-fill" style={{ width: `${project.pct}%`, background: c }} />
        </div>

        {/* Milestone pills */}
        {project.milestones.length > 0 ? (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {project.milestones.map((m, i) => (
              <button
                key={`${m.label}-${i}`}
                onClick={() => toggleMilestone(project.vaultId, project.milestones, i)}
                style={{
                  fontFamily:      'var(--font-mono)',
                  fontSize:        '10px',
                  padding:         '3px 10px',
                  borderRadius:    '20px',
                  border:          `0.5px solid ${m.done ? `${c}60` : 'var(--border2)'}`,
                  background:      m.done ? `${c}18` : 'transparent',
                  color:           m.done ? c : 'var(--text-3)',
                  textDecoration:  m.done ? 'line-through' : 'none',
                  cursor:          'pointer',
                  transition:      'all 200ms ease',
                  userSelect:      'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            Add <code style={{ fontSize: '10px' }}>project_milestones:</code> to STATUS.md
          </p>
        )}
      </div>

      {/* Dot pagination */}
      {totalPages > 1 && (
        <div className="dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={`dot ${i === page ? 'active' : ''}`}
              style={{ background: i === page ? project.vaultColor : undefined }}
              onClick={() => setPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

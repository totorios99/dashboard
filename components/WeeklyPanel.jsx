'use client'

import { useState } from 'react'
import { useWeekly } from '@/hooks/useStatus.js'

const STATE_CLS = ['', 'prog', 'done']
const STATE_TXT = ['pending', 'in progress', 'done']

export default function WeeklyPanel() {
  const { data, loading, cycleItem, updateLabel } = useWeekly()
  const [editingIdx, setEditingIdx] = useState(null)
  const [editLabel,  setEditLabel]  = useState('')

  if (loading || !data) {
    return (
      <div className="glass card">
        <div className="card-head">
          <div className="card-label head-jade"><span className="dot" />Weekly Checklist</div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>Loading…</p>
      </div>
    )
  }

  const doneCount = data.items.filter(i => i.status === 'done').length
  const total     = data.items.length

  /* map stored status string → 0/1/2 index */
  function stateIndex(status) {
    if (status === 'in-progress') return 1
    if (status === 'done')        return 2
    return 0
  }

  return (
    <div className="glass card">
      <div className="card-head">
        <div className="card-label head-jade"><span className="dot" />Weekly Checklist</div>
        <span className="count-badge count-badge-jade">{doneCount}/{total}</span>
      </div>
      <div className="card-scroll">
        {data.items.map((item, i) => {
          const si  = stateIndex(item.status)
          const cls = STATE_CLS[si]
          return (
            <div key={i} className={`check-item${cls ? ' ' + cls : ''}`} onClick={() => cycleItem(i)}>
              <span className="checkbox">
                <svg viewBox="0 0 14 14" fill="none">
                  <path d="M2 7.5L5.5 11L12 3.5" />
                </svg>
              </span>
              {editingIdx === i ? (
                <input
                  className="inline-edit c-text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onBlur={() => { updateLabel(i, editLabel); setEditingIdx(null) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { updateLabel(i, editLabel); setEditingIdx(null) }
                    if (e.key === 'Escape') setEditingIdx(null)
                  }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span
                  className="c-text editable"
                  onClick={e => { e.stopPropagation(); setEditLabel(item.label); setEditingIdx(i) }}
                >{item.label}</span>
              )}
              <span className="status-badge">{STATE_TXT[si]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

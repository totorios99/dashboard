'use client'

import { useCallback, useState, useEffect } from 'react'
import { api } from '@/utils/api.js'

const VAULT_CLASS = {
  cybersecurity: 'h-cyber',
  fitness:       'h-fit',
  spirituality:  'h-spirit',
  homelab:       'h-home',
}

const HABITS_PER_PAGE = 4

function habitClass(vaultId) {
  return VAULT_CLASS[vaultId?.toLowerCase()] ?? 'h-home'
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function HabitPanel({ statuses, onUpdate }) {
  const [histories, setHistories] = useState({})
  const [page,      setPage]      = useState(0)

  useEffect(() => {
    statuses.forEach(s => {
      api.getHabitHistory(s.vault_id)
        .then(h => setHistories(prev => ({ ...prev, [s.vault_id]: h })))
        .catch(() => {})
    })
  }, [statuses])

  const habits = statuses.flatMap(s => {
    if (!s.habits || typeof s.habits !== 'object') return []
    return Object.entries(s.habits).map(([key, done]) => ({
      vaultId: s.vault_id, vaultLabel: s.vault_label || s.vault_id,
      key, label: formatLabel(key), done: done === true,
      history: histories[s.vault_id]?.[key] ?? Array(7).fill(false),
    }))
  })

  const totalPages = Math.max(1, Math.ceil(habits.length / HABITS_PER_PAGE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageHabits = habits.slice(safePage * HABITS_PER_PAGE, (safePage + 1) * HABITS_PER_PAGE)

  const toggle = useCallback((vaultId, key, current) => {
    onUpdate(vaultId, `habits.${key}`, !current)
    setHistories(prev => {
      const vh  = { ...prev[vaultId] }
      const arr = [...(vh[key] ?? Array(7).fill(false))]
      arr[6]    = !current
      vh[key]   = arr
      return { ...prev, [vaultId]: vh }
    })
  }, [onUpdate])

  if (!habits.length) {
    return (
      <div className="glass card habits-card">
        <div className="card-head">
          <div className="card-label head-jade"><span className="dot" />Daily Habits</div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
          No habits defined. Add a <code style={{ fontFamily: '"JetBrains Mono",monospace' }}>habits:</code> block to STATUS.md
        </p>
      </div>
    )
  }

  return (
    <div className="glass card habits-card">
      <div className="card-head">
        <div className="card-label head-jade"><span className="dot" />Daily Habits</div>
        {totalPages > 1 && (
          <div className="page-nav">
            <button className="page-btn" disabled={safePage === 0} onClick={() => setPage(p => p - 1)} aria-label="Previous">‹</button>
            <span className="page-num">{safePage + 1} / {totalPages}</span>
            <button className="page-btn" disabled={safePage === totalPages - 1} onClick={() => setPage(p => p + 1)} aria-label="Next">›</button>
          </div>
        )}
      </div>
      <div>
        {pageHabits.map(h => (
          <HabitRow key={`${h.vaultId}-${h.key}`} habit={h} onToggle={toggle} />
        ))}
      </div>
    </div>
  )
}

function HabitRow({ habit, onToggle }) {
  const { vaultId, vaultLabel, label, done, history } = habit
  const [localDone, setLocalDone] = useState(done)

  useEffect(() => { setLocalDone(done) }, [done])

  const streak = (() => {
    let count = 0
    const arr = [...history]; arr[6] = localDone
    for (let i = arr.length - 1; i >= 0; i--) { if (arr[i]) count++; else break }
    return count
  })()

  const handleToggle = () => {
    const next = !localDone
    setLocalDone(next)
    onToggle(vaultId, habit.key, localDone)
  }

  const handlePip = (idx) => {
    if (idx === 6) {
      setLocalDone(!history[idx])
      onToggle(vaultId, habit.key, history[idx])
    }
  }

  const cls = habitClass(vaultId)

  return (
    <div className={`habit ${cls}`}>
      <div>
        <div className="h-name">{label}</div>
        <div className="h-meta">
          <span>{streak} day streak</span>
          {vaultLabel && <> · <b>{vaultLabel}</b></>}
        </div>
      </div>
      <div className="streak">
        {history.map((filled, i) => {
          const isToday = i === 6
          const active  = isToday ? localDone : filled
          return (
            <button
              key={i}
              className={`pip${active ? ' on' : ''}`}
              aria-label={`${label} day ${i + 1}${isToday ? ' (today)' : ''}`}
              onClick={isToday ? handleToggle : () => handlePip(i)}
            />
          )
        })}
      </div>
      <button className="add-btn" aria-label={`Mark ${label} done today`} onClick={handleToggle}>
        +
      </button>
    </div>
  )
}

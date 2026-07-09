import { useCallback, useState, useEffect } from 'react'
import { api } from '../utils/api.js'

export default function HabitPanel({ statuses, onUpdate }) {
  // Fetch 7-day history for each vault
  const [histories, setHistories] = useState({})

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
      vaultId:    s.vault_id,
      vaultLabel: s.vault_label || s.vault_id,
      vaultColor: s.vault_color || '#888',
      key,
      label:      formatLabel(key),
      done:       done === true,
      // history: array of 7 booleans, index 0 = 6 days ago, index 6 = today
      history:    histories[s.vault_id]?.[key] ?? Array(7).fill(false),
    }))
  })

  const toggle = useCallback((vaultId, key, current) => {
    onUpdate(vaultId, `habits.${key}`, !current)
    // Optimistically update local history for today (index 6)
    setHistories(prev => {
      const vaultHistory = { ...prev[vaultId] }
      const arr          = [...(vaultHistory[key] ?? Array(7).fill(false))]
      arr[6]             = !current
      vaultHistory[key]  = arr
      return { ...prev, [vaultId]: vaultHistory }
    })
  }, [onUpdate])

  if (!habits.length) {
    return (
      <div className="panel" style={{ borderTop: '2px solid #7F77DD' }}>
        <div className="panel-label">
          <div className="panel-label-dot" style={{ background: '#7F77DD' }} />
          Daily habits
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          No habits defined. Add a{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>habits:</span>{' '}
          block to STATUS.md
        </p>
      </div>
    )
  }

  return (
    <div className="panel" style={{ borderTop: '2px solid #7F77DD' }}>
      <div className="panel-label">
        <div className="panel-label-dot" style={{ background: '#7F77DD' }} />
        Daily habits
      </div>
      <div>
        {habits.map((h, i) => (
          <HabitRow
            key={`${h.vaultId}-${h.key}`}
            habit={h}
            isLast={i === habits.length - 1}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  )
}

function HabitRow({ habit, isLast, onToggle }) {
  const { vaultId, vaultColor, label, done, history } = habit

  const [localDone, setLocalDone] = useState(done)
  const [animating, setAnimating] = useState(false)

  // Sync from server on refresh
  useEffect(() => { setLocalDone(done) }, [done])

  const handleToggle = () => {
    const next = !localDone
    setLocalDone(next)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 350)
    onToggle(vaultId, habit.key, localDone)
  }

  // Streak: count consecutive done days ending today (index 6 backwards)
  const streak = (() => {
    let count = 0
    // history[6] is today — use localDone for today since it may not be in history yet
    const arr = [...history]
    arr[6] = localDone
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i]) count++
      else break
    }
    return count
  })()

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
      padding:      '10px 0',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
    }}>
      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.5 }}>
          {streak} day streak{habit.vaultLabel ? ` · ${habit.vaultLabel}` : ''}
        </div>
      </div>

      {/* Rings row: 7 history + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        {history.map((filled, i) => (
          <HistoryRing key={i} filled={i === 6 ? localDone : filled} color={vaultColor} />
        ))}
        <div style={{ width: 8, flexShrink: 0 }} />
        <ToggleButton
          done={localDone}
          color={vaultColor}
          animating={animating}
          onClick={handleToggle}
        />
      </div>
    </div>
  )
}

function HistoryRing({ filled, color }) {
  const R = 6
  const C = 2 * Math.PI * R
  return (
    <svg width="16" height="16" viewBox="0 0 16 16"
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="8" cy="8" r={R} fill="none" stroke="var(--surface2)" strokeWidth="2" />
      <circle cx="8" cy="8" r={R}
        fill="none"
        stroke={filled ? color : 'transparent'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={filled ? 0 : C}
        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.2s ease' }}
      />
    </svg>
  )
}

function ToggleButton({ done, color, animating, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:          26,
        height:         26,
        borderRadius:   '50%',
        background:     done ? color : 'transparent',
        border:         `2px solid ${done ? color : 'var(--border2)'}`,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        transition:     'background 0.3s cubic-bezier(0.4,0,0.2,1), border-color 0.3s ease, transform 0.15s ease',
        transform:      animating ? 'scale(0.85)' : 'scale(1)',
        userSelect:     'none',
      }}
    >
      {done ? (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
          style={{ opacity: animating ? 0 : 1, transition: 'opacity 0.2s ease' }}>
          <polyline points="3,8 6.5,12 13,4" stroke="white"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <div style={{
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--border2)',
          opacity: animating ? 0 : 1, transition: 'opacity 0.2s ease',
        }} />
      )}
    </div>
  )
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

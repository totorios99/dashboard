import { useState, useEffect, useMemo } from 'react'
import { useStatus, usePriorityOrder }  from './hooks/useStatus.js'

import FlipClock      from './components/FlipClock.jsx'
import QuoteWidget    from './components/QuoteWidget.jsx'
import PolaroidWidget from './components/PolaroidWidget.jsx'
import PriorityPanel  from './components/PriorityPanel.jsx'
import ProjectPanel   from './components/ProjectPanel.jsx'
import HabitPanel     from './components/HabitPanel.jsx'
import InboxPanel     from './components/InboxPanel.jsx'
import WeeklyPanel    from './components/WeeklyPanel.jsx'

// ── PURE UTILITIES (outside component — never recreated) ──────────────────────

function getWeekNumber(date) {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function getDayOfYear(date) {
  // Uses UTC math — correct in all timezones including leap years
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  return Math.floor((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 86400000)
}

function greetingFor(hour) {
  if (hour < 12) return 'Good morning, Antonio'
  if (hour < 17) return 'Good afternoon, Antonio'
  return 'Good evening, Antonio'
}

function sanitizeError(err) {
  if (!err) return null
  // Never surface raw server messages or stack traces
  if (err.toLowerCase().includes('fetch') || err.toLowerCase().includes('network')) {
    return 'Cannot reach server — is ./start.sh running?'
  }
  return 'Connection issue — check the terminal'
}

// ── LOADING SCREEN ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '100vh',
      fontFamily:     'var(--font-mono)',
      fontSize:       '12px',
      color:          'var(--text-3)',
    }}>
      Connecting to vaults…
    </div>
  )
}

// ── HEADER (own interval — only this component re-renders every second) ────────

function Header({ error }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Memoized — only recalculate when the calendar date changes, not every second
  const { greeting, dayName, rest, week, day } = useMemo(() => {
    const formatted = time.toLocaleDateString('en-US', {
      weekday: 'long',
      month:   'short',
      day:     'numeric',
      year:    'numeric',
    })
    // "Monday, Mar 24, 2026" → dayName="Monday", rest="Mar 24, 2026"
    const commaIdx = formatted.indexOf(',')
    const dayName  = commaIdx > -1 ? formatted.slice(0, commaIdx) : formatted
    const rest     = commaIdx > -1 ? formatted.slice(commaIdx + 2) : ''

    return {
      greeting: greetingFor(time.getHours()),
      dayName,
      rest,
      week: getWeekNumber(time),
      day:  getDayOfYear(time),
    }
  }, [time.toDateString()]) // toDateString() only changes once per day

  const safeError = sanitizeError(error)

  return (
    <header style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'flex-start',
      padding:        '4px 2px',
    }}>
      {/* Left — greeting + date */}
      <div>
        <div style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '10px',
          color:         'var(--text-3)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom:  '5px',
        }}>
          {greeting}
        </div>
        <div style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1 }}>
          {dayName}
          <span style={{ color: 'var(--text-3)', fontWeight: 300 }}>
            {rest ? ` · ${rest}` : ''}
          </span>
        </div>
      </div>

      {/* Right — flip clock + week/day + error */}
      <div style={{ textAlign: 'right' }}>
        <FlipClock time={time} />
        <div style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '9px',
          color:         'var(--text-3)',
          marginTop:     '5px',
          letterSpacing: '.04em',
        }}>
          Week {week} · Day {day} / {isLeapYear(time.getFullYear()) ? 366 : 365}
        </div>
        {safeError && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   '9px',
            color:      '#E24B4A',
            marginTop:  '3px',
          }}>
            ⚠ {safeError}
          </div>
        )}
      </div>
    </header>
  )
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

// ── APP (no clock state — panels no longer re-render every second) ─────────────

export default function App() {
  const { statuses, loading, error, updateField } = useStatus()
  const { sorted, order, reorder }                = usePriorityOrder(statuses)

  if (loading) return <LoadingScreen />

  return (
    <div className="cockpit">

      {/* ── ROW 0: HEADER ──────────────────────────────────────────────── */}
      <Header error={error} />

      {/* ── ROW 1: INSPIRATION STRIP ─────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 170px',
        gap:                 '12px',
        alignItems:          'start',
      }}>
        <div className="panel" style={{ padding: 0, overflow: 'hidden', minHeight: '110px' }}>
          <QuoteWidget />
        </div>
        <div className="panel" style={{ padding: 0, overflow: 'visible' }}>
          <PolaroidWidget />
        </div>
      </div>

      {/* ── ROW 2: MAIN PANELS ────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap:                 '12px',
      }}>
        <PriorityPanel
          statuses={sorted}
          onUpdate={updateField}
          order={order}
          onReorder={reorder}
        />
        <ProjectPanel
          statuses={statuses}
          onUpdate={updateField}
        />
        <HabitPanel
          statuses={statuses}
          onUpdate={updateField}
        />
      </div>

      {/* ── ROW 3: BOTTOM ROW ─────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '12px',
      }}>
        <InboxPanel />
        <WeeklyPanel />
      </div>

    </div>
  )
}

import { FlipClock } from 'second-brain-cockpit'

const wrap = (children) => (
  <div style={{ background: 'var(--surface)', padding: '20px 28px', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-lg)' }}>
    {children}
  </div>
)

export function Morning() {
  return wrap(<FlipClock time={new Date(2026, 5, 16, 9, 42)} />)
}

export function Afternoon() {
  return wrap(<FlipClock time={new Date(2026, 5, 16, 14, 7)} />)
}

export function Evening() {
  return wrap(<FlipClock time={new Date(2026, 5, 16, 21, 55)} />)
}

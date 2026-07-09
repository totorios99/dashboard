import { QuoteWidget } from 'second-brain-cockpit'

export function Default() {
  return (
    <div style={{
      width: 280,
      height: 160,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <QuoteWidget />
    </div>
  )
}

import { useWeekly } from '../hooks/useStatus.js'

const STATUS_CONFIG = {
  'pending':     { label: 'pending',     bg: 'var(--surface2)', color: 'var(--text-3)', border: 'var(--border)' },
  'in-progress': { label: 'in progress', bg: '#FAEEDA',         color: '#633806',       border: '#EF9F27'       },
  'done':        { label: 'done',        bg: '#E1F5EE',         color: '#085041',       border: '#5DCAA5'       },
}

export default function WeeklyPanel() {
  const { data, loading, cycleItem } = useWeekly()

  if (loading || !data) {
    return (
      <div className="panel" style={{ borderTop: '2px solid #1D9E75' }}>
        <div className="panel-label">
          <div className="panel-label-dot" style={{ background: '#1D9E75' }} />
          Weekly checklist
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Loading…</p>
      </div>
    )
  }

  const doneCount = data.items.filter(i => i.status === 'done').length
  const total     = data.items.length

  return (
    <div className="panel" style={{ borderTop: '2px solid #1D9E75' }}>
      <div className="panel-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="panel-label-dot" style={{ background: '#1D9E75' }} />
          Weekly checklist
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: doneCount === total ? '#1D9E75' : 'var(--text-3)' }}>
          {doneCount}/{total}
        </span>
      </div>

      <div>
        {data.items.map((item, i) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
          return (
            <div
              key={i}
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                gap:          '8px',
                padding:      '7px 0',
                borderBottom: i < data.items.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <span style={{
                fontSize:        '12px',
                color:           item.status === 'done' ? 'var(--text-3)' : 'var(--text)',
                textDecoration:  item.status === 'done' ? 'line-through' : 'none',
                flex:            1,
                lineHeight:      1.4,
              }}>
                {item.label}
              </span>

              <button
                onClick={() => cycleItem(i)}
                style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     '9px',
                  padding:      '2px 8px',
                  borderRadius: '4px',
                  border:       `0.5px solid ${cfg.border}`,
                  background:   cfg.bg,
                  color:        cfg.color,
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  transition:   'all 150ms ease',
                  flexShrink:   0,
                }}
              >
                {cfg.label}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

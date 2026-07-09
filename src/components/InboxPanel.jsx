import { useState, useRef, useCallback } from 'react'
import { useInbox } from '../hooks/useStatus.js'

const TAGS = [
  { id: 'cyber',        label: 'cyber',   color: '#378ADD', bg: '#E6F1FB', border: '#85B7EB' },
  { id: 'fitness',      label: 'fit',     color: '#1D9E75', bg: '#E1F5EE', border: '#5DCAA5' },
  { id: 'spirituality', label: 'spirit',  color: '#9F7AEA', bg: '#EEEDFE', border: '#AFA9EC' },
  { id: 'branch',       label: 'branch',  color: '#BA7517', bg: '#FAEEDA', border: '#EF9F27' },
  { id: 'general',      label: 'general', color: '#888780', bg: 'var(--surface2)', border: 'var(--border2)' },
]

const tagInfo = id => TAGS.find(t => t.id === id) ?? TAGS[TAGS.length - 1]

export default function InboxPanel() {
  const { items, loading, error, add, remove } = useInbox()
  const [text,      setText]      = useState('')
  const [tag,       setTag]       = useState('general')
  const [adding,    setAdding]    = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const inputRef = useRef(null)

  // Use a callback ref instead of setTimeout to focus — fires after DOM update
  const addingRef = useCallback(node => {
    if (node) node.focus()
  }, [])

  const openCapture = () => {
    setSaveError(null)
    setAdding(true)
  }

  const closeCapture = () => {
    setText('')
    setTag('general')
    setAdding(false)
    setSaveError(null)
  }

  const handleAdd = async () => {
    const t = text.trim()
    if (!t || saving) return
    setSaving(true)
    setSaveError(null)
    const result = await add(t, tag)
    setSaving(false)
    if (result.ok) {
      closeCapture()
    } else {
      setSaveError('Failed to save — check the server is running')
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter')  handleAdd()
    if (e.key === 'Escape') closeCapture()
  }

  const itemCount = items.length

  return (
    <div className="panel" style={{ borderTop: '2px solid #5F5E5A' }}>

      {/* Header */}
      <div className="panel-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="panel-label-dot" style={{ background: '#888780' }} />
          Inbox
          {itemCount > 0 && (
            <span style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     '9px',
              background:   'var(--surface2)',
              color:        'var(--text-2)',
              border:       '0.5px solid var(--border2)',
              borderRadius: '20px',
              padding:      '0px 6px',
              lineHeight:   '16px',
            }}>
              {itemCount}
            </span>
          )}
        </span>
        {!adding && (
          <button onClick={openCapture} style={captureButtonStyle}>
            + capture
          </button>
        )}
      </div>

      {/* Capture form */}
      {adding && (
        <div style={{ marginBottom: '10px' }} className="fade-up">
          <input
            ref={addingRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought…"
            disabled={saving}
            style={{
              width:        '100%',
              padding:      '7px 10px',
              fontSize:     '12px',
              border:       '0.5px solid var(--border2)',
              borderRadius: 'var(--radius-sm)',
              background:   'var(--surface2)',
              color:        'var(--text)',
              outline:      'none',
              fontFamily:   'var(--font-sans)',
              marginBottom: '6px',
              opacity:      saving ? 0.6 : 1,
            }}
          />

          {saveError && (
            <p style={{ fontSize: '10px', color: '#E24B4A', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
              ⚠ {saveError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {TAGS.map(t => (
              <button
                key={t.id}
                onClick={() => setTag(t.id)}
                style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     '9px',
                  padding:      '2px 7px',
                  borderRadius: '20px',
                  border:       `0.5px solid ${tag === t.id ? t.border : 'var(--border)'}`,
                  background:   tag === t.id ? t.bg : 'transparent',
                  color:        tag === t.id ? t.color : 'var(--text-3)',
                  cursor:       'pointer',
                  transition:   'all 150ms ease',
                }}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={handleAdd}
              disabled={!text.trim() || saving}
              style={{
                fontFamily:  'var(--font-mono)',
                fontSize:    '9px',
                padding:     '2px 10px',
                borderRadius:'20px',
                border:      '0.5px solid var(--border2)',
                background:  saving ? 'var(--surface2)' : 'var(--text)',
                color:       saving ? 'var(--text-3)' : 'var(--bg)',
                cursor:      text.trim() && !saving ? 'pointer' : 'default',
                marginLeft:  'auto',
                transition:  'all 150ms ease',
              }}
            >
              {saving ? '…' : 'add →'}
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !adding && (
        <p style={{ fontSize: '11px', color: '#E24B4A', fontFamily: 'var(--font-mono)', paddingTop: '4px' }}>
          ⚠ Could not load inbox
        </p>
      )}

      {/* Items */}
      <div>
        {!loading && itemCount === 0 && !adding && (
          <p style={{ fontSize: '12px', color: 'var(--text-3)', paddingTop: '4px' }}>
            Inbox clear — nothing to triage.
          </p>
        )}
        {items.map((item, i) => {
          const t = tagInfo(item.tag)
          // Defensive defaults for any missing server fields
          const text = item.text ?? '(no content)'
          return (
            <div
              key={item.id ?? i}
              style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:          '7px',
                padding:      '7px 0',
                borderBottom: i < items.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <span className="tag" style={{
                background:  t.bg,
                color:       t.color,
                borderColor: t.border,
                flexShrink:  0,
                marginTop:   '1px',
              }}>
                {t.label}
              </span>
              <span style={{
                flex:       1,
                fontSize:   '12px',
                color:      'var(--text)',
                lineHeight: 1.45,
                // Prevent extremely long words from overflowing
                overflowWrap: 'break-word',
                minWidth:     0,
              }}>
                {text}
              </span>
              <button
                onClick={() => remove(item.id)}
                title="Dismiss"
                aria-label="Dismiss inbox item"
                style={{
                  background: 'transparent',
                  border:     'none',
                  color:      'var(--text-3)',
                  cursor:     'pointer',
                  fontSize:   '16px',
                  lineHeight: 1,
                  padding:    '0 2px',
                  flexShrink: 0,
                  marginTop:  '0px',
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}

const captureButtonStyle = {
  fontFamily:   'var(--font-mono)',
  fontSize:     '9px',
  padding:      '2px 8px',
  borderRadius: '4px',
  border:       '0.5px solid var(--border2)',
  background:   'transparent',
  color:        'var(--text-2)',
  cursor:       'pointer',
}

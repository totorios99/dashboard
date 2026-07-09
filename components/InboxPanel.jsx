'use client'

import { useState, useCallback } from 'react'
import { useInbox } from '@/hooks/useStatus.js'

const TAGS = [
  { id: 'general',      label: 'general', cls: 'tag-general' },
  { id: 'cyber',        label: 'cyber',   cls: 'tag-cyber'   },
  { id: 'fitness',      label: 'fit',     cls: 'tag-fit'     },
  { id: 'spirituality', label: 'spirit',  cls: 'tag-spirit'  },
  { id: 'homelab',      label: 'home',    cls: 'tag-home'    },
  { id: 'branch',       label: 'branch',  cls: 'tag-branch'  },
]

const tagInfo = id => TAGS.find(t => t.id === id) ?? TAGS[0]

export default function InboxPanel() {
  const { items, loading, error, add, remove, update } = useInbox()
  const [text,       setText]      = useState('')
  const [tag,        setTag]       = useState('general')
  const [adding,     setAdding]    = useState(false)
  const [saving,     setSaving]    = useState(false)
  const [saveError,  setSaveError] = useState(null)
  const [editingId,  setEditingId] = useState(null)
  const [editText,   setEditText]  = useState('')

  const inputRef = useCallback(node => { if (node) node.focus() }, [])

  const openCapture  = () => { setSaveError(null); setAdding(true) }
  const closeCapture = () => { setText(''); setTag('general'); setAdding(false); setSaveError(null) }

  const handleAdd = async () => {
    const t = text.trim()
    if (!t || saving) return
    setSaving(true); setSaveError(null)
    const result = await add(t, tag)
    setSaving(false)
    if (result.ok) { setText(''); /* keep form open for rapid capture */ }
    else setSaveError('Failed to save')
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter')  handleAdd()
    if (e.key === 'Escape') closeCapture()
  }

  return (
    <div className="glass card">
      <div className="card-head">
        <div className="card-label head-azure">
          <span className="dot" />
          Inbox
          {items.length > 0 && (
            <span className="count-badge count-badge-azure">{items.length}</span>
          )}
        </div>
        <button
          className="ghost-btn"
          onClick={adding ? closeCapture : openCapture}
          aria-expanded={String(adding)}
        >
          {adding ? '× cancel' : '+ capture'}
        </button>
      </div>

      <form
        className={`capture-form${adding ? ' open' : ''}`}
        onSubmit={e => { e.preventDefault(); handleAdd() }}
      >
        <select className="capture-tag" value={tag} onChange={e => setTag(e.target.value)} aria-label="Vault">
          {TAGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input
          ref={adding ? inputRef : null}
          className="capture-input"
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a thought…"
          disabled={saving}
          autoComplete="off"
        />
        <button className="capture-add" type="submit" disabled={!text.trim() || saving}>
          {saving ? '…' : 'Add'}
        </button>
      </form>

      {saveError && (
        <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '10px', color: 'hsl(var(--coral))', marginBottom: '8px' }}>
          ⚠ {saveError}
        </p>
      )}

      {error && !adding && (
        <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: '10px', color: 'hsl(var(--coral))' }}>
          ⚠ Could not load inbox
        </p>
      )}

      <div className="card-scroll">
        {!loading && items.length === 0 && !adding && (
          <p style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>Inbox clear — nothing to triage.</p>
        )}
        {items.map((item, i) => {
          const t = tagInfo(item.tag)
          return (
            <div key={item.id ?? i} className="inbox-item">
              <span className={`tag ${t.cls}`}>{t.label}</span>
              {editingId === item.id ? (
                <input
                  className="inline-edit i-text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => { update(item.id, editText); setEditingId(null) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { update(item.id, editText); setEditingId(null) }
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span
                  className="i-text editable"
                  onClick={() => { setEditText(item.text ?? ''); setEditingId(item.id) }}
                >{item.text ?? '(no content)'}</span>
              )}
              <button className="x-btn" onClick={() => remove(item.id)} aria-label="Dismiss">×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

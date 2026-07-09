import { useState, useCallback } from 'react'
import { quotes } from '../data/quotes.js'

function getDailyIndex() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return seed % quotes.length
}

export default function QuoteWidget() {
  const [idx,     setIdx]     = useState(getDailyIndex)
  const [animKey, setAnimKey] = useState(0)

  const next = useCallback(() => {
    setIdx(i => (i + 1) % quotes.length)
    setAnimKey(k => k + 1)
  }, [])

  const quote = quotes[idx] ?? quotes[0]

  return (
    <div
      onClick={next}
      title="Click for next quote"
      style={{
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '16px 22px',
        // No fixed height — panel height is driven by min-height on the grid row.
        // Content is clamped so overflow never occurs.
        height:         '100%',
        cursor:         'pointer',
        userSelect:     'none',
        boxSizing:      'border-box',
        overflow:       'hidden',
      }}
    >
      <p
        key={animKey}
        className="serif fade-up"
        style={{
          fontSize:   '14px',
          fontStyle:  'italic',
          fontWeight: 400,
          color:      'var(--text)',
          lineHeight: 1.6,
          marginBottom: '8px',
          // Clamp to 3 lines — prevents very long quotes from overflowing
          display:           '-webkit-box',
          WebkitLineClamp:   3,
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
        }}
      >
        "{quote.text}"
      </p>
      {quote.author && (
        <p
          key={`a-${animKey}`}
          className="mono fade-up"
          style={{
            fontSize:       '10px',
            color:          'var(--text-3)',
            letterSpacing:  '.04em',
            animationDelay: '50ms',
            overflow:       'hidden',
            textOverflow:   'ellipsis',
            whiteSpace:     'nowrap',
          }}
        >
          — {quote.author}
        </p>
      )}
    </div>
  )
}

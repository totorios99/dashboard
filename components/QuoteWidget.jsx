'use client'

import { useState, useCallback } from 'react'
import { quotes } from '@/data/quotes.js'

function getDailyIndex() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return seed % quotes.length
}

export default function QuoteWidget({ bare = false }) {
  const [idx,     setIdx]     = useState(getDailyIndex)
  const [animKey, setAnimKey] = useState(0)

  const next = useCallback(() => {
    setIdx(i => (i + 1) % quotes.length)
    setAnimKey(k => k + 1)
  }, [])

  const quote = quotes[idx] ?? quotes[0]

  const inner = (
    <>
      <blockquote key={animKey} className="fade-up">
        {quote.text}
      </blockquote>
      {quote.author && (
        <div key={`a-${animKey}`} className="attrib fade-up" style={{ animationDelay: '50ms' }}>
          {quote.author}
        </div>
      )}
    </>
  )

  return (
    <div
      className={bare ? 'quote-bare' : 'glass quote-card'}
      onClick={next}
      title="Click for next quote"
    >
      {inner}
    </div>
  )
}

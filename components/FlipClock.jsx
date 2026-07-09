'use client'

import { useState, useEffect, useRef } from 'react'

const CARD_W = 46
const CARD_H = 58

let _injected = false
function injectStyles() {
  if (_injected || typeof document === 'undefined') return
  _injected = true
  const s = document.createElement('style')
  s.textContent = `
    @keyframes flipFoldDown { from { transform: rotateX(0deg);  } to { transform: rotateX(-90deg); } }
    @keyframes flipFoldUp   { from { transform: rotateX(90deg); } to { transform: rotateX(0deg);   } }
  `
  document.head.appendChild(s)
}

function FlipCard({ value }) {
  useEffect(() => { injectStyles() }, [])

  const [cur,      setCur]      = useState(value)
  const [prev,     setPrev]     = useState(value)
  const [flipping, setFlipping] = useState(false)
  const lastVal = useRef(value)

  useEffect(() => {
    if (value === lastVal.current) return
    setPrev(lastVal.current)
    lastVal.current = value
    setFlipping(true)
    const t = setTimeout(() => { setCur(value); setFlipping(false) }, 320)
    return () => clearTimeout(t)
  }, [value])

  const card = {
    position: 'relative', width: CARD_W, height: CARD_H, flexShrink: 0, perspective: 400,
    borderRadius: 14,
    background: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    WebkitBackdropFilter: 'blur(14px)', backdropFilter: 'blur(14px)',
    boxShadow: '0 1px 0 var(--glass-hi) inset, 0 10px 24px -12px rgba(0,0,0,.6)',
  }
  const half = {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--glass-bg-strong)',
    color: 'var(--ink)',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 32, fontWeight: 700, lineHeight: 1,
    borderRadius: 14, overflow: 'hidden', userSelect: 'none',
  }
  const clipTop    = 'inset(0 0 50% 0 round 14px 14px 0 0)'
  const clipBottom = 'inset(50% 0 0 0 round 0 0 14px 14px)'

  return (
    <div style={card}>
      <div style={{ ...half, clipPath: clipBottom }}>{cur}</div>
      <div style={{ ...half, clipPath: clipTop    }}>{cur}</div>
      {flipping && (
        <div style={{ ...half, clipPath: clipTop, transformOrigin: 'bottom center', animation: 'flipFoldDown 0.22s ease-in both', zIndex: 6 }}>{prev}</div>
      )}
      {flipping && (
        <div style={{ ...half, clipPath: clipBottom, transformOrigin: 'top center', animation: 'flipFoldUp 0.22s ease-out 0.16s both', zIndex: 6 }}>{value}</div>
      )}
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '50%', height: 1, background: 'rgba(0,0,0,.3)', zIndex: 10, pointerEvents: 'none', transform: 'translateY(-.5px)' }} />
    </div>
  )
}

export default function FlipClock({ time }) {
  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      <FlipCard value={hh[0]} />
      <FlipCard value={hh[1]} />
      <span className="colon">:</span>
      <FlipCard value={mm[0]} />
      <FlipCard value={mm[1]} />
    </div>
  )
}

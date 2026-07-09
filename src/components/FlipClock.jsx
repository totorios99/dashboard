import { useState, useEffect, useRef } from 'react'

const CARD_W = 36
const CARD_H = 52

const tileBase = {
  position:        'absolute',
  width:           '100%',
  height:          '100%',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  fontFamily:      'var(--font-mono)',
  fontSize:        32,
  fontWeight:      400,
  letterSpacing:   '-0.02em',
  userSelect:      'none',
  overflow:        'hidden',
  borderRadius:    6,
}

let _injected = false
function injectGlobalStyles() {
  if (_injected || typeof document === 'undefined') return
  _injected = true
  const s = document.createElement('style')
  s.textContent = `
    @keyframes flipFoldDown {
      from { transform: rotateX(0deg);   }
      to   { transform: rotateX(-90deg); }
    }
    @keyframes flipFoldUp {
      from { transform: rotateX(90deg); }
      to   { transform: rotateX(0deg);  }
    }
    @keyframes colonBlink {
      0%, 100% { opacity: 1;   }
      50%      { opacity: 0.2; }
    }
  `
  document.head.appendChild(s)
}

function useDark() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = e => setDark(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return dark
}

function FlipCard({ value, dark }) {
  useEffect(() => { injectGlobalStyles() }, [])

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

  const bg    = dark ? '#1c1c22' : '#dedad2'
  const color = dark ? '#d8d6d0' : '#1a1a1a'
  const tile  = { ...tileBase, background: bg, color }

  const clipTop    = 'inset(0 0 50% 0 round 6px 6px 0 0)'
  const clipBottom = 'inset(50% 0 0 0 round 0 0 6px 6px)'
  const sepColor   = dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.18)'

  return (
    <div style={{ position: 'relative', width: CARD_W, height: CARD_H, flexShrink: 0, perspective: 400 }}>

      {/* Static bottom — current */}
      <div style={{ ...tile, clipPath: clipBottom }}><span style={{ lineHeight: 1 }}>{cur}</span></div>
      {/* Static top — current */}
      <div style={{ ...tile, clipPath: clipTop    }}><span style={{ lineHeight: 1 }}>{cur}</span></div>

      {/* Flip top — old folds down */}
      {flipping && (
        <div style={{
          ...tile, clipPath: clipTop,
          transformOrigin: 'bottom center',
          animation: 'flipFoldDown 0.22s ease-in both',
          zIndex: 6,
        }}><span style={{ lineHeight: 1 }}>{prev}</span></div>
      )}

      {/* Flip bottom — new comes up */}
      {flipping && (
        <div style={{
          ...tile, clipPath: clipBottom,
          transformOrigin: 'top center',
          animation: 'flipFoldUp 0.22s ease-out 0.16s both',
          zIndex: 6,
        }}><span style={{ lineHeight: 1 }}>{cur}</span></div>
      )}

      {/* Horizontal divider line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%',
        height: 1, background: sepColor, zIndex: 10, pointerEvents: 'none',
      }} />
    </div>
  )
}

export default function FlipClock({ time }) {
  const dark = useDark()

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
      <FlipCard value={hh[0]} dark={dark} />
      <FlipCard value={hh[1]} dark={dark} />

      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      26,
        fontWeight:    300,
        color:         dark ? '#44444e' : '#b8b5ae',
        lineHeight:    1,
        margin:        '0 3px',
        paddingBottom: 4,
        animation:     'colonBlink 1s step-end infinite',
        display:       'inline-block',
      }}>:</span>

      <FlipCard value={mm[0]} dark={dark} />
      <FlipCard value={mm[1]} dark={dark} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { usePhotos } from '../hooks/useStatus.js'

const ROTATIONS = [-2.5, 1.8, -1.2, 2.1, -0.8, 1.5, -2.0]

export default function PolaroidWidget() {
  const { photos, captions, loading } = usePhotos()
  const [activeIdx, setActiveIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  // Auto-advance to a daily photo on mount
  useEffect(() => {
    if (!photos.length) return
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    setActiveIdx(seed % photos.length)
  }, [photos.length])

  const next = () => {
    setActiveIdx(i => (i + 1) % photos.length)
    setAnimKey(k => k + 1)
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle} />
      </div>
    )
  }

  if (!photos.length) {
    return (
      <div style={containerStyle}>
        <div style={{ ...placeholderStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '4px' }}>
            Add photos to<br />cockpit/photos/
          </span>
        </div>
      </div>
    )
  }

  const photo = photos[activeIdx]
  const filename = photo.split('/').pop()
  const caption = captions[filename] || null
  const rotation = ROTATIONS[activeIdx % ROTATIONS.length]

  // Stack: show up to 2 ghost photos behind the active one
  const behind = photos.length > 1
    ? [(activeIdx + 1) % photos.length, (activeIdx + 2) % photos.length]
    : []

  return (
    <div
      style={containerStyle}
      onClick={next}
      title="Click for next photo"
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Ghost photos behind */}
        {behind.slice().reverse().map((photoIdx, i) => (
          <div
            key={photoIdx}
            style={{
              ...polaroidStyle,
              position: 'absolute',
              transform: `rotate(${ROTATIONS[(photoIdx) % ROTATIONS.length]}deg) scale(${0.88 - i * 0.04})`,
              zIndex: i,
              opacity: 0.45 - i * 0.15,
            }}
          >
            <div style={photoAreaStyle} />
            <div style={captionAreaStyle} />
          </div>
        ))}

        {/* Active photo */}
        <div
          key={animKey}
          className="fade-up"
          style={{
            ...polaroidStyle,
            transform: `rotate(${rotation}deg)`,
            zIndex: 10,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <img
            src={photo}
            alt={caption || ''}
            style={{
              width: '100%',
              height: photoAreaStyle.height,
              objectFit: 'cover',
              display: 'block',
              borderRadius: '1px',
            }}
          />
          <div style={{ ...captionAreaStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {caption && (
              <span style={{ fontSize: '8px', color: '#888', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.3 }}>
                {caption}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// Photo area: 2:3 portrait ratio
// Column is 170px. Polaroid frame width 130px → photo inside 118px × 177px.

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  position: 'relative',
  overflow: 'visible',
}

const polaroidStyle = {
  background: '#ffffff',
  padding: '7px 7px 26px 7px',
  borderRadius: '3px',
  width: 132,
  flexShrink: 0,
  transition: 'transform 0.2s ease',
}

const photoAreaStyle = {
  width: 118,
  height: 118,   // 1:1 square — classic Polaroid OneStep proportions
  background: '#e0ddd8',
  borderRadius: '1px',
}

const captionAreaStyle = {
  height: 16,
  marginTop: 5,
}

const placeholderStyle = {
  ...polaroidStyle,
  transform: 'rotate(-1.5deg)',
  opacity: 0.3,
}

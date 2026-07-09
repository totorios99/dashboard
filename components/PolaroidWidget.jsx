'use client'

import { useState, useEffect } from 'react'
import { usePhotos } from '@/hooks/useStatus.js'

const ROTATIONS = [-2.5, 1.8, -1.2, 2.1, -0.8, 1.5, -2.0]

export default function PolaroidWidget() {
  const { photos, captions, loading } = usePhotos()
  const [activeIdx, setActiveIdx]     = useState(0)
  const [animKey,   setAnimKey]       = useState(0)

  useEffect(() => {
    if (!photos.length) return
    const today = new Date()
    const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    setActiveIdx(seed % photos.length)
  }, [photos.length])

  const next = () => {
    if (!photos.length) return
    setActiveIdx(i => (i + 1) % photos.length)
    setAnimKey(k => k + 1)
  }

  if (loading) {
    return (
      <figure className="glass polaroid">
        <div className="photo-placeholder" />
        <figcaption className="cap" />
      </figure>
    )
  }

  if (!photos.length) {
    return (
      <figure className="glass polaroid">
        <div className="photo-placeholder">
          Add photos to<br />cockpit/photos/
        </div>
        <figcaption className="cap" />
      </figure>
    )
  }

  const photo    = photos[activeIdx]
  const filename = photo.split('/').pop()
  const caption  = captions[filename] || null
  const rotation = ROTATIONS[activeIdx % ROTATIONS.length]

  return (
    <figure
      className="glass polaroid"
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={next}
      title="Click for next photo"
    >
      <img key={animKey} src={photo} alt={caption || ''} className="fade-up" />
      <figcaption className="cap">{caption || ' '}</figcaption>
    </figure>
  )
}

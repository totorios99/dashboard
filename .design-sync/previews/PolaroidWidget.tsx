import { PolaroidWidget } from 'second-brain-cockpit'

// Tiny SVG placeholder photo — a warm landscape silhouette
const PHOTO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="118" height="118" viewBox="0 0 118 118"><rect width="118" height="118" fill="#c8b4a0"/><rect x="0" y="72" width="118" height="46" fill="#8a6a50"/><ellipse cx="59" cy="72" rx="40" ry="18" fill="#6b4f38"/><circle cx="22" cy="38" r="14" fill="#e8a020" opacity="0.9"/><rect x="32" y="64" width="6" height="20" fill="#4a3020"/><rect x="28" y="56" width="14" height="10" fill="#3a5a28" rx="4"/><rect x="72" y="58" width="5" height="26" fill="#4a3020"/><rect x="68" y="48" width="13" height="12" fill="#3a5a28" rx="5"/></svg>`)}`

const MOCK_PHOTOS = {
  photos: [PHOTO_SVG, PHOTO_SVG, PHOTO_SVG],
  captions: {
    [PHOTO_SVG.split('/').pop()]: 'Golden hour',
  },
}

if (typeof window !== 'undefined') {
  const _origFetch = window.fetch
  window.fetch = async (url: any, opts?: any) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    if (path === '/api/photos') {
      return new Response(JSON.stringify(MOCK_PHOTOS), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return _origFetch(url, opts)
  }
}

export function WithPhotos() {
  return (
    <div style={{
      width: 200,
      height: 200,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <PolaroidWidget />
    </div>
  )
}

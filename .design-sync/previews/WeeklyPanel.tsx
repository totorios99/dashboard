import { WeeklyPanel } from 'second-brain-cockpit'

const MOCK_WEEKLY = {
  weekKey: '2026-W25',
  items: [
    { label: 'Review week notes', status: 'done', pos: 0 },
    { label: 'Update project trackers', status: 'in-progress', pos: 1 },
    { label: 'Clean up inbox', status: 'done', pos: 2 },
    { label: 'Plan next week', status: 'pending', pos: 3 },
    { label: 'Physical exercise 3×', status: 'in-progress', pos: 4 },
    { label: 'Read 30 min daily', status: 'pending', pos: 5 },
  ],
}

if (typeof window !== 'undefined') {
  const _origFetch = window.fetch
  window.fetch = async (url: any, opts?: any) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    if (path === '/api/weekly') {
      return new Response(JSON.stringify(MOCK_WEEKLY), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (path.match(/^\/api\/weekly\/\d+$/)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    return _origFetch(url, opts)
  }
}

export function Default() {
  return (
    <div style={{ width: 380, background: 'var(--bg)', padding: 16 }}>
      <WeeklyPanel />
    </div>
  )
}

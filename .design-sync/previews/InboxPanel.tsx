import { InboxPanel } from 'second-brain-cockpit'

const MOCK_INBOX = [
  { id: 1, text: 'Review CTF writeup draft before posting', tag: 'cyber', createdAt: '2026-06-16T10:00:00Z' },
  { id: 2, text: 'Log Tuesday workout — PR on bench press', tag: 'fitness', createdAt: '2026-06-16T09:00:00Z' },
  { id: 3, text: 'Research Proxmox + Ceph networking setup', tag: 'branch', createdAt: '2026-06-15T20:00:00Z' },
  { id: 4, text: 'Reflect on stoic passage from Meditations IV', tag: 'spirituality', createdAt: '2026-06-15T18:00:00Z' },
  { id: 5, text: 'Update CTF notes with new tooling', tag: 'cyber', createdAt: '2026-06-15T14:00:00Z' },
]

if (typeof window !== 'undefined') {
  const _origFetch = window.fetch
  window.fetch = async (url: any, opts?: any) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    if (path === '/api/inbox') {
      return new Response(JSON.stringify(MOCK_INBOX), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (path.startsWith('/api/inbox/')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }
    return _origFetch(url, opts)
  }
}

export function WithItems() {
  return (
    <div style={{ width: 380, background: 'var(--bg)', padding: 16 }}>
      <InboxPanel />
    </div>
  )
}

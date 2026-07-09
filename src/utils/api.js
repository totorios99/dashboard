// All server communication lives here.
// Components never call fetch() directly.

const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ── STATUS ────────────────────────────────────────────────────────────────────

export const api = {

  // Read all vault statuses
  getAllStatus: ()                        => request('GET',   '/status'),

  // Update one field (or multiple) in a vault's STATUS.md
  updateStatus: (vaultId, updates)        => request('PATCH', `/status/${vaultId}`, updates),

  // ── HABITS ─────────────────────────────────────────────────────────────────
  getHabitHistory: (vaultId)              => request('GET',   `/habits/${vaultId}/history`),

  // ── INBOX ──────────────────────────────────────────────────────────────────
  getInbox:     ()                        => request('GET',   '/inbox'),
  addInboxItem: (text, tag)               => request('POST',  '/inbox', { text, tag }),
  deleteInboxItem: (id)                   => request('DELETE',`/inbox/${id}`),

  // ── WEEKLY ─────────────────────────────────────────────────────────────────
  getWeekly:          ()                  => request('GET',   '/weekly'),
  updateWeeklyItem:   (index, status)     => request('PATCH', `/weekly/${index}`, { status }),

  // ── PHOTOS ─────────────────────────────────────────────────────────────────
  getPhotos:    ()                        => request('GET',   '/photos'),

  // ── PRIORITY ORDER ─────────────────────────────────────────────────────────
  getPriorityOrder:   ()                  => request('GET',   '/priority-order'),
  savePriorityOrder:  (order)             => request('PATCH', '/priority-order', { order }),

  // ── HEALTH ─────────────────────────────────────────────────────────────────
  health:       ()                        => request('GET',   '/health'),
}

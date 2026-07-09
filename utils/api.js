// All server communication lives here.
// Components never call fetch() directly.
// Uses relative /api paths — works correctly from any device on the network.

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

export const api = {
  getAllStatus:      ()                   => request('GET',    '/status'),
  updateStatus:     (vaultId, updates)   => request('PATCH',  `/status/${vaultId}`, updates),
  getHabitHistory:  (vaultId)            => request('GET',    `/habits/${vaultId}/history`),
  getInbox:         ()                   => request('GET',    '/inbox'),
  addInboxItem:     (text, tag)          => request('POST',   '/inbox', { text, tag }),
  updateInboxItem:  (id, text)           => request('PATCH',  `/inbox/${id}`, { text }),
  deleteInboxItem:  (id)                 => request('DELETE', `/inbox/${id}`),
  getWeekly:        ()                   => request('GET',    '/weekly'),
  updateWeeklyItem: (index, status)      => request('PATCH',  `/weekly/${index}`, { status }),
  updateWeeklyLabel:(index, label)       => request('PATCH',  `/weekly/${index}`, { label }),
  getPriorityOrder: ()                   => request('GET',    '/priority-order'),
  savePriorityOrder:(order)              => request('PATCH',  '/priority-order', { order }),
  openVault:        (vault)              => request('POST',   '/open-vault', { vault }),
}

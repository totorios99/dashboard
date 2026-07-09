import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api.js'

const POLL_INTERVAL = 30_000

// Module-level constant — not recreated on every render
const WEEKLY_CYCLE = ['pending', 'in-progress', 'done']

// Resolve dot-notation key into a nested object for optimistic UI update
// e.g. setNested({habits:{study:false}}, 'habits.study', true)
//   → {habits:{study:true}}
function setNested(obj, dotPath, value) {
  const keys = dotPath.split('.')
  if (keys.length === 1) return { ...obj, [dotPath]: value }
  const [head, ...tail] = keys
  return {
    ...obj,
    [head]: setNested(obj[head] && typeof obj[head] === 'object' ? obj[head] : {}, tail.join('.'), value),
  }
}

export function useStatus() {
  const [statuses,  setStatuses]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const data = await api.getAllStatus()
      setStatuses(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const id = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAll])

  const updateField = useCallback(async (vaultId, key, value) => {
    // Snapshot for rollback
    const prev = statuses

    // Optimistic update — correctly handles dot-notation like 'habits.study'
    setStatuses(curr => curr.map(s =>
      s.vault_id === vaultId ? setNested(s, key, value) : s
    ))

    try {
      await api.updateStatus(vaultId, { [key]: value })
    } catch (e) {
      // Rollback on failure
      setStatuses(prev)
      setError(`Failed to save: ${e.message}`)
    }
  }, [statuses])

  const updateFields = useCallback(async (vaultId, updates) => {
    const prev = statuses
    setStatuses(curr => curr.map(s => {
      if (s.vault_id !== vaultId) return s
      let next = s
      for (const [key, val] of Object.entries(updates)) {
        next = setNested(next, key, val)
      }
      return next
    }))
    try {
      await api.updateStatus(vaultId, updates)
    } catch (e) {
      setStatuses(prev)
      setError(`Failed to save: ${e.message}`)
    }
  }, [statuses])

  return { statuses, loading, error, refresh: fetchAll, updateField, updateFields }
}

export function useInbox() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.getInbox()
      setItems(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (text, tag) => {
    // Optimistic add
    const optimistic = { id: `tmp-${Date.now()}`, text, tag, createdAt: new Date().toISOString() }
    setItems(prev => [optimistic, ...prev])
    try {
      const real = await api.addInboxItem(text, tag)
      // Replace optimistic item with real one from server
      setItems(prev => prev.map(i => i.id === optimistic.id ? real : i))
      return { ok: true }
    } catch (e) {
      // Rollback
      setItems(prev => prev.filter(i => i.id !== optimistic.id))
      return { ok: false, error: e.message }
    }
  }, [])

  const remove = useCallback(async (id) => {
    const prev = items
    setItems(curr => curr.filter(i => i.id !== id))
    try {
      await api.deleteInboxItem(id)
    } catch {
      setItems(prev) // rollback
    }
  }, [items])

  return { items, loading, error, add, remove }
}

export function useWeekly() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await api.getWeekly()
      setData(d)
    } catch {
      // Non-fatal — panel shows loading state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cycleItem = useCallback(async (index) => {
    if (!data?.items?.[index]) return
    const current = data.items[index].status
    const next    = WEEKLY_CYCLE[(WEEKLY_CYCLE.indexOf(current) + 1) % WEEKLY_CYCLE.length]

    // Optimistic
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, status: next } : item),
    }))

    try {
      await api.updateWeeklyItem(index, next)
    } catch {
      // Reload on failure
      load()
    }
  }, [data, load])

  return { data, loading, cycleItem }
}

export function usePhotos() {
  const [photos,   setPhotos]   = useState([])
  const [captions, setCaptions] = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.getPhotos()
      .then(({ photos = [], captions = {} }) => {
        setPhotos(photos)
        setCaptions(captions)
      })
      .catch(() => {}) // Polaroid gracefully shows placeholder
      .finally(() => setLoading(false))
  }, [])

  return { photos, captions, loading }
}

export function usePriorityOrder(statuses) {
  const [order, setOrder] = useState([])

  useEffect(() => {
    if (!statuses.length) return
    api.getPriorityOrder()
      .then(({ order: saved = [] }) => {
        const ids    = statuses.map(s => s.vault_id)
        const merged = [
          ...saved.filter(id => ids.includes(id)),
          ...ids.filter(id => !saved.includes(id)),
        ]
        setOrder(merged)
      })
      .catch(() => {
        // Fall back to unordered — non-fatal
        setOrder(statuses.map(s => s.vault_id))
      })
  }, [statuses.length])

  const reorder = useCallback(async (newOrder) => {
    setOrder(newOrder)
    try {
      await api.savePriorityOrder(newOrder)
    } catch {
      // Order reverts on next load — acceptable
    }
  }, [])

  const sorted = order.length
    ? order.map(id => statuses.find(s => s.vault_id === id)).filter(Boolean)
    : statuses

  return { sorted, order, reorder }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api.js'
import { setNested } from '@/utils/shared.js'

const POLL_INTERVAL  = 30_000
const WEEKLY_CYCLE   = ['pending', 'in-progress', 'done']

export function useStatus() {
  const [statuses, setStatuses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

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
    const prev = statuses
    setStatuses(curr => curr.map(s => s.vault_id === vaultId ? setNested(s, key, value) : s))
    try {
      await api.updateStatus(vaultId, { [key]: value })
    } catch (e) {
      setStatuses(prev)
      setError(`Failed to save: ${e.message}`)
    }
  }, [statuses])

  const updateFields = useCallback(async (vaultId, updates) => {
    const prev = statuses
    setStatuses(curr => curr.map(s => {
      if (s.vault_id !== vaultId) return s
      let next = s
      for (const [key, val] of Object.entries(updates)) next = setNested(next, key, val)
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
    const optimistic = { id: `tmp-${Date.now()}`, text, tag, createdAt: new Date().toISOString() }
    setItems(prev => [optimistic, ...prev])
    try {
      const real = await api.addInboxItem(text, tag)
      setItems(prev => prev.map(i => i.id === optimistic.id ? real : i))
      return { ok: true }
    } catch (e) {
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
      setItems(prev)
    }
  }, [items])

  const update = useCallback(async (id, text) => {
    const prev = items
    setItems(curr => curr.map(i => i.id === id ? { ...i, text } : i))
    try {
      await api.updateInboxItem(id, text)
    } catch {
      setItems(prev)
    }
  }, [items])

  return { items, loading, error, add, remove, update }
}

export function useWeekly() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await api.getWeekly()
      setData(d)
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cycleItem = useCallback(async (index) => {
    if (!data?.items?.[index]) return
    const current = data.items[index].status
    const next    = WEEKLY_CYCLE[(WEEKLY_CYCLE.indexOf(current) + 1) % WEEKLY_CYCLE.length]
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, status: next } : item),
    }))
    try {
      await api.updateWeeklyItem(index, next)
    } catch {
      load()
    }
  }, [data, load])

  const updateLabel = useCallback(async (index, label) => {
    if (!data?.items?.[index]) return
    setData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, label } : item),
    }))
    try {
      await api.updateWeeklyLabel(index, label)
    } catch {
      load()
    }
  }, [data, load])

  return { data, loading, cycleItem, updateLabel }
}

export function usePriorityOrder(statuses) {
  const [order, setOrder] = useState([])
  const vaultIds = statuses.map(s => s.vault_id).join()

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
      .catch(() => { setOrder(statuses.map(s => s.vault_id)) })
  }, [vaultIds])

  const reorder = useCallback(async (newOrder) => {
    setOrder(newOrder)
    try { await api.savePriorityOrder(newOrder) } catch { /* reverts on next load */ }
  }, [])

  const sorted = order.length
    ? order.map(id => statuses.find(s => s.vault_id === id)).filter(Boolean)
    : statuses

  return { sorted, order, reorder }
}

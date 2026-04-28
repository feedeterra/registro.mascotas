import { useCallback, useEffect, useState } from 'react'
import {
  deleteShelterAnnouncement,
  deleteShelterEvent,
  insertShelterAnnouncement,
  insertShelterEvent,
  listShelterAnnouncementsPage,
  listShelterEventsPage,
  updateShelterAnnouncement,
  updateShelterEvent,
} from '../services/shelters'

export function useShelterAnnouncements(shelterId, { page = 1, pageSize = 10 } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setItems([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err, count } = await listShelterAnnouncementsPage(shelterId, page, pageSize)
      if (err) throw err
      setItems(data ?? [])
      setTotal(count ?? 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [shelterId, page, pageSize])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (payload) => {
    const { data, error: err } = await insertShelterAnnouncement({
      shelter_id: shelterId,
      ...payload,
    })
    if (err) throw err
    await fetchAll()
    return data
  }, [shelterId, fetchAll])

  const update = useCallback(async (id, changes) => {
    const { data, error: err } = await updateShelterAnnouncement(id, changes)
    if (err) throw err
    setItems(prev => prev.map(x => x.id === id ? data : x))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error: err } = await deleteShelterAnnouncement(id)
    if (err) throw err
    await fetchAll()
  }, [fetchAll])

  return { items, total, loading, error, fetchAll, create, update, remove }
}

export function useShelterEvents(shelterId, { page = 1, pageSize = 10 } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setItems([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err, count } = await listShelterEventsPage(shelterId, page, pageSize)
      if (err) throw err
      setItems(data ?? [])
      setTotal(count ?? 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [shelterId, page, pageSize])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (payload) => {
    const { data, error: err } = await insertShelterEvent({
      shelter_id: shelterId,
      ...payload,
    })
    if (err) throw err
    await fetchAll()
    return data
  }, [shelterId, fetchAll])

  const update = useCallback(async (id, changes) => {
    const { data, error: err } = await updateShelterEvent(id, changes)
    if (err) throw err
    setItems(prev => prev.map(x => x.id === id ? data : x).sort((a, b) => new Date(a.event_at) - new Date(b.event_at)))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error: err } = await deleteShelterEvent(id)
    if (err) throw err
    await fetchAll()
  }, [fetchAll])

  return { items, total, loading, error, fetchAll, create, update, remove }
}

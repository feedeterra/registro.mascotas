import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useShelterAnnouncements(shelterId, { page = 1, pageSize = 10 } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setItems([]); setTotal(0); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err, count } = await supabase
        .from('shelter_announcements')
        .select('*', { count: 'exact' })
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })
        .range(
          Math.max(0, (page - 1) * pageSize),
          Math.max(0, (page - 1) * pageSize) + pageSize - 1
        )
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
    const { data, error: err } = await supabase
      .from('shelter_announcements')
      .insert({ shelter_id: shelterId, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (err) throw err
    await fetchAll()
    return data
  }, [shelterId, fetchAll])

  const update = useCallback(async (id, changes) => {
    const { data, error: err } = await supabase
      .from('shelter_announcements')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setItems(prev => prev.map(x => x.id === id ? data : x))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('shelter_announcements')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }, [])

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
      const { data, error: err, count } = await supabase
        .from('shelter_events')
        .select('*', { count: 'exact' })
        .eq('shelter_id', shelterId)
        .order('event_at', { ascending: true })
        .range(
          Math.max(0, (page - 1) * pageSize),
          Math.max(0, (page - 1) * pageSize) + pageSize - 1
        )
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
    const { data, error: err } = await supabase
      .from('shelter_events')
      .insert({ shelter_id: shelterId, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (err) throw err
    await fetchAll()
    return data
  }, [shelterId, fetchAll])

  const update = useCallback(async (id, changes) => {
    const { data, error: err } = await supabase
      .from('shelter_events')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setItems(prev => prev.map(x => x.id === id ? data : x).sort((a, b) => new Date(a.event_at) - new Date(b.event_at)))
    return data
  }, [])

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('shelter_events')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchAll()
  }, [fetchAll])

  return { items, total, loading, error, fetchAll, create, update, remove }
}


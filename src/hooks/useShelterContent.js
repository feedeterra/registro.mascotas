import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useShelterAnnouncements(shelterId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setItems([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('shelter_announcements')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setItems(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [shelterId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('shelter_announcements')
      .insert({ shelter_id: shelterId, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (err) throw err
    setItems(prev => [data, ...prev])
    return data
  }, [shelterId])

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
    setItems(prev => prev.filter(x => x.id !== id))
  }, [])

  return { items, loading, error, fetchAll, create, update, remove }
}

export function useShelterEvents(shelterId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setItems([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('shelter_events')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('event_at', { ascending: true })
      if (err) throw err
      setItems(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [shelterId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('shelter_events')
      .insert({ shelter_id: shelterId, ...payload, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (err) throw err
    setItems(prev => [...prev, data].sort((a, b) => new Date(a.event_at) - new Date(b.event_at)))
    return data
  }, [shelterId])

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
    setItems(prev => prev.filter(x => x.id !== id))
  }, [])

  return { items, loading, error, fetchAll, create, update, remove }
}


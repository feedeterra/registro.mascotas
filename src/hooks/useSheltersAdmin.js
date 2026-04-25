import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSheltersAdmin(enabled = true) {
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchShelters = useCallback(async () => {
    if (!enabled) { setShelters([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('shelters')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      setShelters(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => { fetchShelters() }, [fetchShelters])

  const createShelter = useCallback(async (payload) => {
    const { data, error: err } = await supabase
      .from('shelters')
      .insert({ ...payload, is_active: payload.is_active ?? true })
      .select()
      .single()
    if (err) throw err
    setShelters(prev => [data, ...prev])
    return data
  }, [])

  const updateShelter = useCallback(async (id, changes) => {
    const { data, error: err } = await supabase
      .from('shelters')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setShelters(prev => prev.map(s => s.id === id ? data : s))
    return data
  }, [])

  const deactivateShelter = useCallback(async (id) => {
    return updateShelter(id, { is_active: false })
  }, [updateShelter])

  return { shelters, loading, error, fetchShelters, createShelter, updateShelter, deactivateShelter }
}


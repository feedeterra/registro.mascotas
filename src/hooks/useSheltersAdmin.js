import { useCallback, useEffect, useState } from 'react'
import { insertShelterRow, listAllSheltersAdmin, updateShelterRow } from '../services/shelters'

export function useSheltersAdmin(enabled = true) {
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchShelters = useCallback(async () => {
    if (!enabled) { setShelters([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await listAllSheltersAdmin()
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
    const { data, error: err } = await insertShelterRow(payload)
    if (err) throw err
    setShelters(prev => [data, ...prev])
    return data
  }, [])

  const updateShelter = useCallback(async (id, changes) => {
    const { data, error: err } = await updateShelterRow(id, changes)
    if (err) throw err
    setShelters(prev => prev.map(s => s.id === id ? data : s))
    return data
  }, [])

  const deactivateShelter = useCallback(async (id) => {
    return updateShelter(id, { is_active: false })
  }, [updateShelter])

  return { shelters, loading, error, fetchShelters, createShelter, updateShelter, deactivateShelter }
}

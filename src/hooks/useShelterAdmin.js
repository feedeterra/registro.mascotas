import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getShelterById,
  getShelterConfigByShelterId,
  updateShelterRow,
  upsertShelterConfigForShelter,
} from '../services/shelters'

export function useMyShelterAdmin(shelterId) {
  const [shelter, setShelter] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setShelter(null); setConfig(null); setLoading(false); return }
    setLoading(true)

    const { data: sh } = await getShelterById(shelterId)
    const { data: cfg } = await getShelterConfigByShelterId(shelterId)

    setShelter(sh ?? null)
    setConfig(cfg ?? null)
    setLoading(false)
  }, [shelterId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateShelter = useCallback(async (changes) => {
    if (!shelterId) throw new Error('Falta shelterId')
    const { data, error } = await updateShelterRow(shelterId, changes)
    if (error) throw error
    setShelter(data)
    return data
  }, [shelterId])

  const upsertConfig = useCallback(async (changes) => {
    if (!shelterId) throw new Error('Falta shelterId')
    const { data, error } = await upsertShelterConfigForShelter(shelterId, changes)
    if (error) throw error
    setConfig(data)
    return data
  }, [shelterId])

  const shelterName = useMemo(() => config?.name || shelter?.name || 'Mi refugio', [config?.name, shelter?.name])

  return {
    shelter,
    config,
    loading,
    shelterName,
    fetchAll,
    updateShelter,
    upsertConfig,
  }
}

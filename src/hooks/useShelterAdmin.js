import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useMyShelterAdmin(shelterId) {
  const [shelter, setShelter] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!shelterId) { setShelter(null); setConfig(null); setLoading(false); return }
    setLoading(true)

    const { data: sh } = await supabase
      .from('shelters')
      .select('*')
      .eq('id', shelterId)
      .maybeSingle()

    const { data: cfg } = await supabase
      .from('shelter_config')
      .select('*')
      .eq('shelter_id', shelterId)
      .maybeSingle()

    setShelter(sh ?? null)
    setConfig(cfg ?? null)
    setLoading(false)
  }, [shelterId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateShelter = useCallback(async (changes) => {
    if (!shelterId) throw new Error('Falta shelterId')
    const { data, error } = await supabase
      .from('shelters')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', shelterId)
      .select()
      .single()
    if (error) throw error
    setShelter(data)
    return data
  }, [shelterId])

  const upsertConfig = useCallback(async (changes) => {
    if (!shelterId) throw new Error('Falta shelterId')

    // Upsert por shelter_id (requiere unique o PK en DB; si no, hace fallback a insert/update manual)
    const payload = { shelter_id: shelterId, ...changes, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('shelter_config')
      .upsert(payload, { onConflict: 'shelter_id' })
      .select()
      .single()

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


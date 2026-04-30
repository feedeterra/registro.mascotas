import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPublicVolunteerStats } from '../services/home'

/**
 * Config y fila de refugio para una URL pública /refugio/:slug.
 * Si aún no corrés la migración SQL, para slug `casa` hace fallback a shelter_config.id = 'casa'.
 */
export function useShelterPublicConfig(slug) {
  const normalized = slug || 'casa'
  const [config, setConfig] = useState(null)
  const [shelter, setShelter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [{ data: shRow, error: shErr }, volStats] = await Promise.all([
        supabase
          .from('shelters')
          .select('id, slug, name, city, lat, lng')
          .eq('slug', normalized)
          .maybeSingle(),
        fetchPublicVolunteerStats().catch(() => ({ total: 0, byShelter: {} })),
      ])

      if (cancelled) return

      if (shErr || !shRow) {
        if (normalized === 'casa') {
          const { data: legacy } = await supabase
            .from('shelter_config')
            .select('*')
            .eq('id', 'casa')
            .maybeSingle()
          if (!cancelled) {
            setShelter(null)
            setConfig(legacy ?? null)
            setLoading(false)
          }
          return
        }
        if (!cancelled) {
          setShelter(null)
          setConfig(null)
          setLoading(false)
        }
        return
      }

      const byVol = volStats.byShelter || {}
      setShelter({
        ...shRow,
        volunteerCount: Number(byVol[String(shRow.id)]) || 0,
      })

      const { data: cfgByShelter } = await supabase
        .from('shelter_config')
        .select('*')
        .eq('shelter_id', shRow.id)
        .maybeSingle()

      let row = cfgByShelter
      if (!row) {
        const { data: byId } = await supabase
          .from('shelter_config')
          .select('*')
          .eq('id', shRow.id)
          .maybeSingle()
        row = byId
      }
      if (!row && normalized === 'casa') {
        const { data: legacy } = await supabase
          .from('shelter_config')
          .select('*')
          .eq('id', 'casa')
          .maybeSingle()
        row = legacy
      }

      if (!cancelled) {
        setConfig(row ?? null)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [normalized])

  return { config, shelter, loading }
}

export function useShelterConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchConfig = useCallback(async () => {
    // Ya no proveemos config global harcodeada 'casa'; en global usamos null y evitamos cruce de datos.
    setConfig(null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const updateConfig = useCallback(async (changes) => {
    const { data, error } = await supabase
      .from('shelter_config')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', 'casa')
      .select()
      .single()

    if (error) throw error
    setConfig(data)
    return data
  }, [])

  return { config, loading, fetchConfig, updateConfig }
}

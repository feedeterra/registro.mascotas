import { useState, useEffect, useCallback } from 'react'
import {
  getShelterConfigById,
  getShelterConfigByLegacyId,
  getShelterConfigByShelterId,
  selectShelterRowBySlug,
  updateShelterConfigByCasaId,
} from '../services/shelters'

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
      const { data: shRow, error: shErr } = await selectShelterRowBySlug(normalized)

      if (cancelled) return

      if (shErr || !shRow) {
        if (normalized === 'casa') {
          const { data: legacy } = await getShelterConfigByLegacyId('casa')
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

      setShelter(shRow)

      const { data: byShelter } = await getShelterConfigByShelterId(shRow.id)

      let row = byShelter
      if (!row) {
        const { data: byId } = await getShelterConfigById(shRow.id)
        row = byId
      }
      if (!row && normalized === 'casa') {
        const { data: legacy } = await getShelterConfigByLegacyId('casa')
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
    setConfig(null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const updateConfig = useCallback(async (changes) => {
    const { data, error } = await updateShelterConfigByCasaId(changes)
    if (error) throw error
    setConfig(data)
    return data
  }, [])

  return { config, loading, fetchConfig, updateConfig }
}

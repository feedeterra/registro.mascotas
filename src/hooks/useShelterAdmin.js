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

    const basePayload = { shelter_id: shelterId, ...changes, updated_at: new Date().toISOString() }

    const removeMissingColumnFromPayload = (payload, err) => {
      const msg = (err?.message || '').toString()
      const m = msg.match(/Could not find the '([^']+)' column/i)
      if (!m?.[1]) return null
      const col = m[1]
      if (!Object.prototype.hasOwnProperty.call(payload, col)) return null
      const next = { ...payload }
      delete next[col]
      return next
    }

    const insertWithSchemaFallback = async (payload) => {
      let current = { ...payload }
      for (let i = 0; i < 12; i++) {
        const { data, error } = await supabase
          .from('shelter_config')
          .insert(current)
          .select()
          .maybeSingle()
        if (!error) return data
        // If PK already exists, fallback to update-by-id to avoid spamming inserts.
        if ((error?.message || '').includes('duplicate key value violates unique constraint "shelter_config_pkey"')) {
          const updated = await updateWithSchemaFallback(shelterId, current)
          return updated
        }
        const next = removeMissingColumnFromPayload(current, error)
        if (next) { current = next; continue }
        throw error
      }
      throw new Error('No pudimos crear la configuración (schema mismatch).')
    }

    const updateWithSchemaFallback = async (id, payload) => {
      let current = { ...payload }
      for (let i = 0; i < 12; i++) {
        const { data, error } = await supabase
          .from('shelter_config')
          .update(current)
          .eq('id', id)
          .select()
          .maybeSingle()
        if (!error) return data
        const next = removeMissingColumnFromPayload(current, error)
        if (next) {
          current = next
          // If the schema is missing columns, don't spam many retries: keep stripping until it works,
          // but cap quickly once payload got smaller.
          continue
        }
        throw error
      }
      throw new Error('No pudimos guardar la configuración (schema mismatch).')
    }
    // Manual path (avoids noisy 400s when shelter_id doesn't have a UNIQUE constraint for upsert onConflict)
    // Fetch the most recent row for this shelter_id, if any.
    const { data: existing, error: existingErr } = await supabase
      .from('shelter_config')
      .select('id')
      .eq('shelter_id', shelterId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (existingErr) throw existingErr

    const existingId = Array.isArray(existing) && existing.length ? existing[0]?.id : null
    if (existingId) {
      const updated = await updateWithSchemaFallback(existingId, basePayload)
      setConfig(updated)
      return updated
    }

    // Some legacy schemas have shelter_config.id as a PK with a fixed default (e.g. 'casa'),
    // so we force a stable unique id on insert to avoid duplicate PK errors.
    const inserted = await insertWithSchemaFallback({ id: shelterId, ...basePayload })
    setConfig(inserted)
    return inserted
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


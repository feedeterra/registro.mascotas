import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useShelterConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shelter_config')
      .select('*')
      .eq('id', 'casa')
      .single()

    if (!error && data) setConfig(data)
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

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAppConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('app_config').select('*').single()
      .then(({ data }) => { setConfig(data); setLoading(false) })
  }, [])

  const update = async (fields) => {
    const { data, error } = await supabase
      .from('app_config')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select()
      .single()
    if (!error) setConfig(data)
    return { error }
  }

  return { config, loading, update }
}

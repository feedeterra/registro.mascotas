import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAppConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('app_config').select('*').single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setConfig(data)
        setLoading(false)
      })
  }, [])

  const update = async (fields) => {
    const { data, error: err } = await supabase
      .from('app_config')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', config?.id)
      .select()
      .single()
    if (err) return { error: err }
    if (!data) return { error: new Error('No se actualizó la configuración') }
    setConfig(data)
    return { error: null }
  }

  return { config, loading, error, update }
}

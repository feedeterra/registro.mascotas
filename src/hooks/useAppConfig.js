import { useEffect, useState } from 'react'
import { supabase, deleteStorageObjectsFromUrls } from '../lib/supabase'

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
    const prevHero =
      Object.prototype.hasOwnProperty.call(fields, 'hero_image_url')
        ? config?.hero_image_url
        : null

    const { data, error: err } = await supabase
      .from('app_config')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', config?.id)
      .select()
      .single()
    if (err) return { error: err }
    if (!data) return { error: new Error('No se actualizó la configuración') }
    setConfig(data)

    if (prevHero != null && Object.prototype.hasOwnProperty.call(fields, 'hero_image_url')) {
      const nextHero = data.hero_image_url || null
      if (prevHero && prevHero !== nextHero) {
        try {
          await deleteStorageObjectsFromUrls([prevHero])
        } catch (_) { /* best-effort */ }
      }
    }

    return { error: null }
  }

  return { config, loading, error, update }
}

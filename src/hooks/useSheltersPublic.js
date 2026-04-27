import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSheltersPublic({ page = 1, pageSize = 10, fetchAll = false } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPage = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const base = supabase
        .from('shelters')
        .select('id, slug, name, city, lat, lng, is_active, shelter_config(shelter_image_url, province), pets(count)', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const query = fetchAll
        ? base
        : base.range(
          Math.max(0, (page - 1) * pageSize),
          Math.max(0, (page - 1) * pageSize) + pageSize - 1
        )

      const { data, error: err, count } = await query

      if (err) throw err
      setItems(data ?? [])
      setTotal(count ?? 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, fetchAll])

  useEffect(() => { fetchPage() }, [fetchPage])

  return { items, total, loading, error, fetchPage }
}


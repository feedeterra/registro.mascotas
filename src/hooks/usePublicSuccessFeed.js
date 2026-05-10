import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSuccessStoriesForPublicFeed } from '../services/successStories'

/**
 * Feed público de finales felices: solo filas de `success_stories`.
 * Las adopciones completadas crean historia + borran el pet vía RPC `finalize_adoption` (atómico en BD).
 */
export function usePublicSuccessFeed(options = {}) {
  const limit = options.limit ?? 200

  const { data: tableRows = [], isLoading: loading, error } = useQuery({
    queryKey: ['success_stories', 'public_feed', limit],
    queryFn: async () => {
      const r = await fetchSuccessStoriesForPublicFeed({ limit })
      if (r.error) throw r.error
      return r.data || []
    },
  })

  const stories = useMemo(() => {
    const rows = tableRows || []
    return [...rows].sort((a, b) => {
      const ta = new Date(a.adoptedDate || 0).getTime()
      const tb = new Date(b.adoptedDate || 0).getTime()
      return tb - ta
    })
  }, [tableRows])

  return { stories, loading, error }
}

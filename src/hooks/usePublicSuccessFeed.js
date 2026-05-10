import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePetsContext } from '../context/PetsContext'
import {
  fetchSuccessStoriesForPublicFeed,
  mapAdoptedPetToStoryVm,
} from '../services/successStories'

/**
 * Historias para feed público: tabla `success_stories` + fallback de `pets` adoptados
 * (hasta ejecutar backfill y quitar adoptados de `pets`).
 */
export function usePublicSuccessFeed(options = {}) {
  const limit = options.limit ?? 200
  const { pets, loading: petsLoading } = usePetsContext()

  const { data: tableRows = [], isLoading: tableLoading, error } = useQuery({
    queryKey: ['success_stories', 'public_feed', limit],
    queryFn: async () => {
      const r = await fetchSuccessStoriesForPublicFeed({ limit })
      if (r.error) throw r.error
      return r.data || []
    },
  })

  const loading = petsLoading || tableLoading

  const stories = useMemo(() => {
    const fromTable = tableRows || []
    const adopted = (pets || []).filter(
      (p) => p.adoptionStatus === 'adopted' || p.adoption_status === 'adopted'
    )
    const legacy = new Set(fromTable.map((s) => s.legacyPetId).filter(Boolean))
    /** Evita duplicar la misma adopción si ya hay fila en `success_stories` (aunque falte legacy_pet_id). */
    const tableSlugNameKeys = new Set(
      fromTable.map((s) => {
        const slug = (s.shelterSlug || '').toLowerCase()
        const name = (s.petName || '').trim().toLowerCase()
        return `${slug}|${name}`
      })
    )
    const fromPetsFallback = adopted
      .filter((p) => !legacy.has(p.id))
      .filter((p) => {
        const slug = (p.shelterSlug || '').toLowerCase()
        const name = (p.name || '').trim().toLowerCase()
        if (!name) return true
        return !tableSlugNameKeys.has(`${slug}|${name}`)
      })
      .map(mapAdoptedPetToStoryVm)

    const all = [...fromTable, ...fromPetsFallback]
    all.sort((a, b) => {
      const ta = new Date(a.adoptedDate || 0).getTime()
      const tb = new Date(b.adoptedDate || 0).getTime()
      return tb - ta
    })
    return all
  }, [tableRows, pets])

  return { stories, loading, error }
}

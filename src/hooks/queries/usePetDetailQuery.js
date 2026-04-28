import { useQuery } from '@tanstack/react-query'
import { fetchPetDetail } from '../../lib/petsDb'

/**
 * Detalle de una mascota (incluye profiles y sightings).
 * @param {string|undefined} id
 * @param {{ enabled?: boolean }} [options]
 */
export function usePetDetailQuery(id, options = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 2,
  })
}

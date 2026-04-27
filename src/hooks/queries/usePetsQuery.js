import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchPetsList } from '../../lib/petsDb'

/**
 * Listado paginado de mascotas (campos mínimos, sin sightings).
 * @param {object} opts
 * @param {number} opts.page
 * @param {number} opts.pageSize
 * @param {object} opts.filters — mismos filtros que `fetchPets` en usePets (type, excludeAdopted, shelterId, etc.)
 * @param {boolean} [opts.enabled=true]
 */
export function usePetsListQuery({ page, pageSize, filters, enabled = true }) {
  return useQuery({
    queryKey: ['pets', { page, pageSize, filters }],
    queryFn: () => fetchPetsList({ page, pageSize, filters, fetchAll: false }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  })
}

/** Alias opcional acorde al nombre del archivo. */
export const usePetsQuery = usePetsListQuery

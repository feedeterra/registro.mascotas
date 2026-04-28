import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchPetsList } from '../../lib/petsDb'

export function usePetsListQuery({ page, pageSize, filters, enabled = true }) {
  return useQuery({
    queryKey: ['pets', { page, pageSize, filters }],
    queryFn: () => fetchPetsList({ page, pageSize, filters, fetchAll: false }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  })
}

export const usePetsQuery = usePetsListQuery

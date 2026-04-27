import { useQuery } from '@tanstack/react-query'
import { listActiveShelters } from '../../services/shelters'

/**
 * @param {{ page?: number, pageSize?: number, fetchAll?: boolean }} params
 */
export function useSheltersPublicQuery({ page = 1, pageSize = 10, fetchAll = false } = {}) {
  return useQuery({
    queryKey: ['shelters', { page, pageSize, fetchAll }],
    queryFn: async () => {
      const { data, error } = await listActiveShelters({ page, pageSize, fetchAll })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}

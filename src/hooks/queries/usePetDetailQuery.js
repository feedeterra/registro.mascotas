import { useQuery } from '@tanstack/react-query'
import { fetchPetDetail } from '../../lib/petsDb'

export function usePetDetailQuery(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id),
    enabled: enabled && Boolean(id),
    staleTime: 1000 * 60 * 2,
  })
}

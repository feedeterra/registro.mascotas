import { useQuery } from '@tanstack/react-query'
import { countShelterFollowers, getShelterBySlug } from '../../services/shelters'

export function useShelterQuery(slug = 'casa') {
  return useQuery({
    queryKey: ['shelter', slug],
    queryFn: async () => {
      const { data, error } = await getShelterBySlug(slug)
      if (error) throw error
      if (!data) return { shelter: null, followers: 0 }
      const { count, error: countErr } = await countShelterFollowers(data.id)
      if (countErr) throw countErr
      return { shelter: data, followers: count ?? 0 }
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 2,
  })
}

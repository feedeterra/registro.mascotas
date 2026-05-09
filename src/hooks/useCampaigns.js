import { useQuery } from '@tanstack/react-query'
import { listCampaignsPublic, listShelterCampaignsForPublic } from '../services/shelters'

export function usePublicCampaigns({ limit = 12 } = {}) {
  return useQuery({
    queryKey: ['campaigns', 'public', limit],
    queryFn: async () => {
      const { data, error } = await listCampaignsPublic({ limit })
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60,
  })
}

/** Listado paginado + filtros opcionales (urgencia, refugio). */
export function usePublicCampaignsPaged({
  page = 1,
  pageSize = 12,
  urgency = null,
  shelterId = null,
} = {}) {
  const u =
    urgency === 'all' || urgency === '' || urgency === undefined ? null : urgency
  const sid =
    shelterId === 'all' || shelterId === '' || !shelterId ? null : shelterId

  return useQuery({
    queryKey: ['campaigns', 'public', 'paged', page, pageSize, u, sid],
    queryFn: async () => {
      const { data, error, total } = await listCampaignsPublic({
        page,
        pageSize,
        urgency: u,
        shelterId: sid,
      })
      if (error) throw error
      return { items: data || [], total: total ?? 0 }
    },
    staleTime: 1000 * 60,
  })
}

export function useShelterCampaignsPublic(shelterId, { limit = 10 } = {}) {
  return useQuery({
    queryKey: ['campaigns', 'public', 'shelter', shelterId, limit],
    queryFn: async () => {
      const { data, error } = await listShelterCampaignsForPublic(shelterId, { limit })
      if (error) throw error
      return data || []
    },
    enabled: !!shelterId,
    staleTime: 1000 * 60,
  })
}


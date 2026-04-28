import { useSheltersPublicQuery } from './queries/useSheltersPublicQuery'

/** @deprecated Prefer useSheltersPublicQuery; se mantiene para compatibilidad. */
export function useSheltersPublic({ page = 1, pageSize = 10, fetchAll = false } = {}) {
  const q = useSheltersPublicQuery({ page, pageSize, fetchAll })
  return {
    items: q.data?.items ?? [],
    total: q.data?.total ?? 0,
    loading: q.isLoading,
    error: q.error?.message ?? null,
    fetchPage: q.refetch,
  }
}

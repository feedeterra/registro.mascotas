import { supabase } from '../lib/supabase'

/**
 * Normaliza la respuesta JSON de get_public_volunteer_stats().
 * @param {unknown} raw
 * @returns {{ total: number, byShelter: Record<string, number> }}
 */
export function parsePublicVolunteerStats(raw) {
  if (!raw || typeof raw !== 'object') return { total: 0, byShelter: {} }
  const o = /** @type {{ total?: unknown, by_shelter?: unknown }} */ (raw)
  const by = o.by_shelter && typeof o.by_shelter === 'object' && !Array.isArray(o.by_shelter)
    ? /** @type {Record<string, number>} */ (o.by_shelter)
    : {}
  return {
    total: Number(o.total) || 0,
    byShelter: by,
  }
}

/**
 * Totales y conteos por refugio vía RPC (sin leer filas de volunteer_subscriptions desde el cliente).
 */
export async function fetchPublicVolunteerStats() {
  const { data, error } = await supabase.rpc('get_public_volunteer_stats')
  if (error) throw error
  return parsePublicVolunteerStats(data)
}

/**
 * Fetches all necessary data for the Home dashboard in a single call (or parallelized)
 * to be used with React Query for caching and performance.
 */
export async function fetchHomeDashboard() {
  const [volStats, shRes, adoptedRes] = await Promise.all([
    fetchPublicVolunteerStats().catch(() => ({ total: 0, byShelter: {} })),
    supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('pets').select('id', { count: 'exact', head: true }).eq('adoption_status', 'adopted'),
  ])

  if (shRes.error) throw shRes.error
  if (adoptedRes.error) throw adoptedRes.error

  return {
    volunteers: volStats.total,
    shelters: shRes.count ?? 0,
    adopted: adoptedRes.count ?? 0,
    perShelterVolunteers: { ...volStats.byShelter },
  }
}

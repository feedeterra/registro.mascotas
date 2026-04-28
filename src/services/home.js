import { supabase } from '../lib/supabase'

/**
 * Fetches all necessary data for the Home dashboard in a single call (or parallelized)
 * to be used with React Query for caching and performance.
 */
export async function fetchHomeDashboard() {
  const [volRes, shRes, adoptedRes, subsRes] = await Promise.all([
    supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('pets').select('id', { count: 'exact', head: true }).eq('adoption_status', 'adopted'),
    supabase.from('volunteer_subscriptions').select('shelter_id'),
  ])

  if (volRes.error) throw volRes.error
  if (shRes.error) throw shRes.error
  if (adoptedRes.error) throw adoptedRes.error
  if (subsRes.error) throw subsRes.error

  const counts = {}
  subsRes.data?.forEach(s => {
    counts[s.shelter_id] = (counts[s.shelter_id] || 0) + 1
  })

  return {
    volunteers: volRes.count ?? 0,
    shelters: shRes.count ?? 0,
    adopted: adoptedRes.count ?? 0,
    perShelterVolunteers: counts,
  }
}

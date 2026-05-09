import { supabase } from '../lib/supabase'

/**
 * Fetches all necessary data for the Home dashboard in a single call (or parallelized)
 * to be used with React Query for caching and performance.
 */
export async function fetchHomeDashboard() {
  const [volRes, shRes, storiesRes, subsRes] = await Promise.all([
    supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('success_stories').select('id', { count: 'exact', head: true }),
    supabase.from('volunteer_subscriptions').select('shelter_id'),
  ])

  if (volRes.error) throw volRes.error
  if (shRes.error) throw shRes.error
  if (storiesRes.error) throw storiesRes.error
  if (subsRes.error) throw subsRes.error

  const counts = {}
  subsRes.data?.forEach(s => {
    counts[s.shelter_id] = (counts[s.shelter_id] || 0) + 1
  })

  return {
    volunteers: volRes.count ?? 0,
    shelters: shRes.count ?? 0,
    adopted: storiesRes.count ?? 0,
    perShelterVolunteers: counts,
  }
}

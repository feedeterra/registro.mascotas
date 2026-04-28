import { supabase } from '../lib/supabase'
import { PETS_LIST_SELECT, dbToPet } from './pets'

/**
 * Carga agregada para el dashboard de Home (stats + listados cortos).
 * Mantiene el shape usado por `Home.jsx` y centraliza el fetch para cacheo (React Query).
 *
 * @returns {Promise<{ data: {
 *  globalStats: { volunteers: number, shelters: number, adopted: number, perShelterVolunteers: Record<string, number> },
 *  totalAdoptable: number,
 *  recentPets: object[],
 *  urgentPets: object[],
 *  successStories: { id: string, petName: string, shelterSlug: string|null, photoAfter: string|null, quote: string|null }[],
 * }|null, error: Error|null }>}
 */
export async function fetchHomeDashboard() {
  const [
    volRes,
    shRes,
    adoptedRes,
    subsRes,
    adoptCnt,
    recentRes,
    urgentRes,
    storiesRes,
  ] = await Promise.all([
    supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('pets').select('id', { count: 'exact', head: true }).eq('adoption_status', 'adopted'),
    supabase.from('volunteer_subscriptions').select('shelter_id'),
    supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'stray')
      .neq('adoption_status', 'adopted'),
    supabase
      .from('pets')
      .select(PETS_LIST_SELECT)
      .eq('type', 'stray')
      .neq('adoption_status', 'adopted')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('pets')
      .select(PETS_LIST_SELECT)
      .eq('type', 'stray')
      .eq('adoption_status', 'urgent')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('pets')
      .select(PETS_LIST_SELECT)
      .eq('adoption_status', 'adopted')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const firstError =
    volRes.error ||
    shRes.error ||
    adoptedRes.error ||
    subsRes.error ||
    adoptCnt.error ||
    recentRes.error ||
    urgentRes.error ||
    storiesRes.error

  if (firstError) return { data: null, error: firstError }

  const perShelterVolunteers = {}
  subsRes.data?.forEach(s => {
    if (!s?.shelter_id) return
    perShelterVolunteers[s.shelter_id] = (perShelterVolunteers[s.shelter_id] || 0) + 1
  })

  const recentPets = (recentRes.data ?? []).map(dbToPet)
  const urgentPets = (urgentRes.data ?? []).map(dbToPet)
  const adoptedRows = (storiesRes.data ?? []).map(dbToPet)
  const successStories = adoptedRows.map(p => {
    const photos = Array.isArray(p.photos) ? p.photos : []
    return {
      id: p.id,
      petName: p.name,
      shelterSlug: p.shelterSlug || null,
      photoAfter: photos[photos.length - 1] || photos[0] || null,
      quote: p.adopterQuote || null,
    }
  })

  return {
    data: {
      globalStats: {
        volunteers: volRes.count ?? 0,
        shelters: shRes.count ?? 0,
        adopted: adoptedRes.count ?? 0,
        perShelterVolunteers,
      },
      totalAdoptable: adoptCnt.count ?? 0,
      recentPets,
      urgentPets,
      successStories,
    },
    error: null,
  }
}


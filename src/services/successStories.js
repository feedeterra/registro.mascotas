import { supabase } from '../lib/supabase'
import { generatePetStory } from '../utils'

export const SUCCESS_STORY_SELECT = `
  id,
  shelter_id,
  pet_name,
  sex,
  story,
  photos_before,
  photo_positions,
  primary_photo_idx,
  photo_after_url,
  photo_after_position,
  adopter_name,
  adopter_quote,
  adopted_at,
  legacy_pet_id,
  created_at,
  updated_at,
  shelters ( name, slug )
`

function normalizePhotoArray(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw || '[]')
      return Array.isArray(p) ? p.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

/** URLs en Storage asociadas a un registro `pets` (para limpieza al borrar). */
export function collectPetStorageUrls(petRow) {
  if (!petRow) return []
  const urls = [...normalizePhotoArray(petRow.photos)]
  if (petRow.adopted_photo_url) urls.push(petRow.adopted_photo_url)
  return [...new Set(urls)]
}

/** URLs en Storage asociadas a una fila `success_stories`. */
export function collectSuccessStoryStorageUrls(row) {
  if (!row) return []
  const urls = [...normalizePhotoArray(row.photos_before)]
  if (row.photo_after_url) urls.push(row.photo_after_url)
  return [...new Set(urls)]
}

/**
 * URLs que siguen referenciadas en historias del refugio (o en todas si shelterId es null).
 * Sirve para no borrar en Storage al eliminar un pet cuando una historia reutiliza las mismas URLs.
 */
export async function fetchSuccessStoryReferencedUrlSet(shelterId = null) {
  const set = new Set()
  const pageSize = 500
  let from = 0
  for (;;) {
    let q = supabase
      .from('success_stories')
      .select('photos_before, photo_after_url')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (shelterId) q = q.eq('shelter_id', shelterId)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    for (const row of data) {
      for (const u of collectSuccessStoryStorageUrls(row)) set.add(u)
    }
    if (data.length < pageSize) break
    from += pageSize
  }
  return set
}

/**
 * VM unificada para Home / SuccessStories / cards (alinea con ex‑map desde pets adoptados).
 */
export function mapSuccessStoryRow(row) {
  const photos = normalizePhotoArray(row.photos_before)
  const idx = Math.min(Math.max(0, Number(row.primary_photo_idx) || 0), Math.max(0, photos.length - 1))
  const shelter = Array.isArray(row.shelters) ? row.shelters[0] : row.shelters
  const photoAfter = row.photo_after_url || photos[0] || null
  return {
    id: row.id,
    legacyPetId: row.legacy_pet_id ?? null,
    source: 'story',
    petName: row.pet_name,
    photosBefore: photos,
    shelterName: shelter?.name ?? null,
    shelterSlug: shelter?.slug ?? null,
    photoBefore: photos[idx] || photos[0] || null,
    photoAfter,
    photoAfterIdx: row.photo_after_url ? -1 : 0,
    photoPositions: Array.isArray(row.photo_positions) ? row.photo_positions : [],
    adoptedPhotoPosition: row.photo_after_position || '50% 50%',
    adopterName: row.adopter_name || 'Su nueva familia',
    quote: row.adopter_quote || 'Le dimos un hogar y nos cambió la vida.',
    adoptedDate: row.adopted_at,
    story: row.story || '',
    sex: row.sex,
    primaryPhotoIdx: Number(row.primary_photo_idx) || 0,
  }
}

export function mapAdoptedPetToStoryVm(p) {
  let photos = []
  if (Array.isArray(p.photos)) photos = p.photos
  else if (typeof p.photos === 'string') {
    try { photos = JSON.parse(p.photos || '[]') } catch { photos = [] }
  }
  return {
    id: p.id,
    legacyPetId: null,
    source: 'pet',
    petName: p.name,
    petSlug: p.slug ?? null,
    shelterName: p.shelterName || null,
    shelterSlug: p.shelterSlug || null,
    photoBefore: photos[0],
    photoAfter: p.adoptedPhotoUrl || p.adopted_photo_url || photos[0],
    photoAfterIdx: (p.adoptedPhotoUrl || p.adopted_photo_url) ? -1 : 0,
    photoPositions: (p.adoption_status === 'adopted' && (p.adoptedPhotoUrl || p.adopted_photo_url))
      ? [p.adopted_photo_position || p.adoptedPhotoPosition || '50% 50%']
      : (p.photo_positions || p.photoPositions || []),
    adoptedPhotoPosition: p.adopted_photo_position || p.adoptedPhotoPosition || '50% 50%',
    adopterName: p.adopter_name || p.adopterName || 'Su nueva familia',
    quote: p.adopter_quote || p.adopterQuote || 'Le dimos un hogar y nos cambió la vida.',
    adoptedDate: p.updated_at || p.adoptedAt,
    story: p.adopter_story || p.adopterStory || generatePetStory(p),
    sex: p.sex,
  }
}

export async function fetchSuccessStoriesForShelter(shelterId, limit = 24) {
  if (!shelterId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('success_stories')
    .select(SUCCESS_STORY_SELECT)
    .eq('shelter_id', shelterId)
    .order('adopted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }
  return { data: (data || []).map(mapSuccessStoryRow), error: null }
}

export async function fetchSuccessStoriesPage({ shelterId = null, page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let query = supabase
    .from('success_stories')
    .select(SUCCESS_STORY_SELECT, { count: 'exact' })
    .order('adopted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (shelterId) query = query.eq('shelter_id', shelterId)

  const { data, error, count } = await query
  if (error) return { data: null, error, total: 0 }
  return {
    data: (data || []).map(mapSuccessStoryRow),
    error: null,
    total: typeof count === 'number' ? count : (data?.length ?? 0),
  }
}

export async function fetchSuccessStoriesForPublicFeed({ limit = 200 } = {}) {
  const { data, error } = await supabase
    .from('success_stories')
    .select(SUCCESS_STORY_SELECT)
    .order('adopted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }
  return { data: (data || []).map(mapSuccessStoryRow), error: null }
}


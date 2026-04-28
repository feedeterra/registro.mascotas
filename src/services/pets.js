import { supabase } from '../lib/supabase'

export const PETS_LIST_SELECT = `
  id,
  shelter_id,
  owner_id,
  name,
  species,
  breed,
  color,
  size,
  sex,
  neutered,
  type,
  status,
  adoption_status,
  photos,
  primary_photo_idx,
  photo_positions,
  tags,
  age,
  waiting_number,
  waiting_unit,
  created_at,
  neighborhood,
  notes,
  adopted_at,
  adopted_photo_url,
  adopter_name,
  adopter_quote,
  adopter_story,
  shelters ( name, slug )
`

export const PET_DETAIL_SELECT = '*, profiles(display_name, phone), sightings(*)'

export function dbToSighting(row) {
  return {
    id:            row.id,
    petId:         row.pet_id,
    reporterId:    row.reporter_id,
    text:          row.description,
    location:      row.location_text,
    lat:           row.lat,
    lng:           row.lng,
    photoUrl:      row.photo_url,
    date:          row.created_at,
  }
}

export function dbToPet(row) {
  if (!row) return null
  return {
    id:                row.id,
    shelterId:         row.shelter_id ?? null,
    ownerId:           row.owner_id,
    name:              row.name,
    species:           row.species,
    breed:             row.breed && !['no', 'n/a', '-', 'none'].includes(row.breed.trim().toLowerCase()) ? row.breed.trim() : null,
    color:             row.color,
    size:              row.size,
    sex:               row.sex,
    age:               row.age ?? null,
    neutered:          row.neutered,
    photos:            row.photos ?? [],
    primaryPhotoIdx:   row.primary_photo_idx ?? 0,
    photoPositions:    row.photo_positions ?? [],
    type:              row.type,
    status:            row.status,
    adoptionStatus:    row.adoption_status,
    hasCollar:         row.has_collar,
    collarColor:       row.collar_color,
    hasChip:           row.has_chip,
    neighborhood:      row.neighborhood,
    lostSince:         row.lost_since,
    lastSeenLocation:  row.last_seen_location,
    foundAt:           row.found_at,
    notes:             row.notes,
    createdAt:         row.created_at,
    adoptedAt:         row.adopted_at ?? null,
    adoptedPhotoUrl:   row.adopted_photo_url ?? null,
    adopterName:       row.adopter_name ?? null,
    adopterQuote:      row.adopter_quote ?? null,
    adopterStory:      row.adopter_story ?? null,
    tags:              row.tags ?? [],
    waiting_number:    row.waiting_number ?? null,
    waiting_unit:      row.waiting_unit ?? null,
    ownerName:         row.profiles?.display_name ?? row.owner_name ?? '—',
    ownerPhone:        row.profiles?.phone ?? row.owner_phone ?? '',
    shelterName:       row.shelters?.name ?? null,
    shelterSlug:       row.shelters?.slug ?? null,
    sightings:         (row.sightings ?? []).map(dbToSighting),
  }
}

export function applyListFilters(query, f) {
  if (!f || typeof f !== 'object') return query
  if (f.type) query = query.eq('type', f.type)
  if (f.excludeAdopted) query = query.neq('adoption_status', 'adopted')
  if (f.shelterId) query = query.eq('shelter_id', f.shelterId)
  if (f.adoptionStatus != null && f.adoptionStatus !== '' && f.adoptionStatus !== 'all') {
    query = query.eq('adoption_status', f.adoptionStatus)
  }
  const raw = f.search && String(f.search).trim()
  if (raw) {
    const t = raw.replace(/%/g, '').replace(/,/g, '')
    if (t) {
      const w = `%${t}%`
      query = query.or(`name.ilike.${w},breed.ilike.${w},color.ilike.${w}`)
    }
  }
  return query
}

export function petFormToRow(pet) {
  const row = {
    owner_id:           pet.ownerId ?? null,
    name:               pet.name,
    species:            pet.species ?? 'dog',
    breed:              pet.breed ?? null,
    color:              pet.color ?? null,
    size:               pet.size ?? null,
    sex:                pet.sex ?? 'unknown',
    neutered:           pet.neutered ?? null,
    photos:             pet.photos ?? [],
    primary_photo_idx:  pet.primaryPhotoIdx ?? 0,
    photo_positions:    pet.photoPositions ?? [],
    type:               pet.type ?? 'owned',
    status:             pet.status ?? 'found',
    adoption_status:    pet.adoptionStatus ?? null,
    has_collar:         pet.hasCollar ?? null,
    collar_color:       pet.collarColor ?? null,
    has_chip:           pet.hasChip ?? null,
    neighborhood:       pet.neighborhood ?? null,
    lost_since:         pet.lostSince ?? null,
    last_seen_location: pet.lastSeenLocation ?? null,
    notes:              pet.notes ?? null,
    tags:               pet.tags ?? [],
    age:                pet.age ?? null,
    waiting_number:     pet.waiting_number ? parseInt(pet.waiting_number) : null,
    waiting_unit:       pet.waiting_unit ?? null,
    registered_via:     pet.registeredVia ?? 'organic',
    found_at:           pet.foundAt ?? null,
    adopted_at:         pet.adoptedAt ?? null,
    adopted_photo_url:  pet.adoptedPhotoUrl ?? null,
    adopter_name:       pet.adopterName ?? null,
    adopter_quote:      pet.adopterQuote ?? null,
    adopter_story:      pet.adopterStory ?? null,
  }
  if (Object.prototype.hasOwnProperty.call(pet, 'shelterId')) {
    row.shelter_id = pet.shelterId ?? null
  }
  return row
}

export async function fetchPetsList({ page = 1, pageSize = 20, filters = {}, fetchAll = false }) {
  if (filters.invalidShelter) {
    return { data: { pets: [], totalCount: 0 }, error: null }
  }

  const orderBy = typeof filters?.orderBy === 'string' && filters.orderBy.trim()
    ? filters.orderBy.trim()
    : 'created_at'
  const orderAscending = Boolean(filters?.orderAscending)
  const select = typeof filters?.select === 'string' && filters.select.trim()
    ? filters.select.trim()
    : PETS_LIST_SELECT

  let query = supabase
    .from('pets')
    .select(select, { count: 'exact' })

  query = applyListFilters(query, filters)
  query = query.order(orderBy, { ascending: orderAscending })

  if (!fetchAll) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error }

  return {
    data: {
      pets: (data ?? []).map(dbToPet),
      totalCount: typeof count === 'number' ? count : (data?.length ?? 0),
    },
    error: null,
  }
}

export async function fetchPetDetail(id) {
  const { data, error } = await supabase
    .from('pets')
    .select(PET_DETAIL_SELECT)
    .eq('id', id)
    .single()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: null }

  return {
    data: {
      ...dbToPet(data),
      ownerName: data.profiles?.display_name ?? '',
      ownerPhone: data.profiles?.phone ?? '',
    },
    error: null,
  }
}

export async function insertPetRow(dbPayload) {
  return supabase.from('pets').insert(dbPayload).select().single()
}

export async function updatePetPhotos(petId, photos) {
  return supabase.from('pets').update({ photos }).eq('id', petId)
}

export async function updatePetRow(id, row, select = PET_DETAIL_SELECT) {
  return supabase.from('pets').update(row).eq('id', id).select(select).single()
}

export async function deletePetRow(id) {
  return supabase.from('pets').delete().eq('id', id)
}

export async function insertSightingRow(payload) {
  return supabase.from('sightings').insert(payload).select().single()
}

export async function listPetsByShelterId(shelterId) {
  const { data, error } = await supabase
    .from('pets')
    .select(PETS_LIST_SELECT)
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }
  return { data: (data ?? []).map(dbToPet), error: null }
}

export async function fetchFeaturedPets(opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 10
  
  // 1. Priorizar urgentes
  const { data: urgentData, error: urgentError } = await supabase
    .from('pets')
    .select(PETS_LIST_SELECT)
    .eq('type', 'stray')
    .eq('adoption_status', 'urgent')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (urgentError) return { data: null, error: urgentError }

  let results = urgentData || []

  // 2. Completar con los más viejos si no llegamos al límite
  if (results.length < limit) {
    const { data: normalData, error: normalError } = await supabase
      .from('pets')
      .select(PETS_LIST_SELECT)
      .eq('type', 'stray')
      .neq('adoption_status', 'adopted')
      .neq('adoption_status', 'urgent')
      .order('created_at', { ascending: true })
      .limit(limit - results.length)

    if (normalError) return { data: null, error: normalError }
    results = [...results, ...(normalData || [])]
  }

  const mapped = results.map(dbToPet)
  return { data: mapped, error: null }
}

export function createPetsRealtimeChannel() {
  return supabase.channel('pets-realtime')
}

export function removeRealtimeChannel(channel) {
  return supabase.removeChannel(channel)
}

/**
 * Acceso a datos: refugios, config, seguidores, anuncios y eventos.
 * Todas las funciones devuelven `{ data, error }` salvo que se indique lo contrario.
 */
import { supabase } from '../lib/supabase'

// ─── shelters (tabla principal) ───────────────────────────────────

export async function getShelterBySlug(slug) {
  return supabase.from('shelters').select('*').eq('slug', slug).single()
}

export async function getShelterById(id) {
  return supabase.from('shelters').select('*').eq('id', id).maybeSingle()
}

export async function countShelterFollowers(shelterId) {
  return supabase
    .from('shelter_followers')
    .select('*', { count: 'exact', head: true })
    .eq('shelter_id', shelterId)
}

export async function listActiveShelters({ page = 1, pageSize = 10, fetchAll = false }) {
  const base = supabase
    .from('shelters')
    .select('id, slug, name, city, province, address, lat, lng, is_active', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const query = fetchAll
    ? base
    : base.range(
      Math.max(0, (page - 1) * pageSize),
      Math.max(0, (page - 1) * pageSize) + pageSize - 1
    )

  const { data, error, count } = await query
  if (error) return { data: null, error }
  return { data: { items: data ?? [], total: count ?? 0 }, error: null }
}

export async function listAllSheltersAdmin() {
  return supabase.from('shelters').select('*').order('created_at', { ascending: false })
}

export async function insertShelterRow(payload) {
  return supabase.from('shelters').insert({ ...payload, is_active: payload.is_active ?? true }).select().single()
}

export async function updateShelterRow(id, changes) {
  return supabase
    .from('shelters')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ─── shelter_followers ───────────────────────────────────────────

export async function getShelterFollowerRow(userId, shelterId) {
  return supabase
    .from('shelter_followers')
    .select('id')
    .eq('user_id', userId)
    .eq('shelter_id', shelterId)
    .maybeSingle()
}

export async function insertShelterFollower(userId, shelterId) {
  return supabase.from('shelter_followers').insert({ user_id: userId, shelter_id: shelterId })
}

export async function deleteShelterFollower(userId, shelterId) {
  return supabase
    .from('shelter_followers')
    .delete()
    .eq('user_id', userId)
    .eq('shelter_id', shelterId)
}

// ─── shelter_config ─────────────────────────────────────────────

export async function getShelterConfigByLegacyId(legacyId) {
  return supabase.from('shelter_config').select('*').eq('id', legacyId).maybeSingle()
}

export async function getShelterConfigByShelterId(shelterId) {
  return supabase.from('shelter_config').select('*').eq('shelter_id', shelterId).maybeSingle()
}

export async function getShelterConfigById(configId) {
  return supabase.from('shelter_config').select('*').eq('id', configId).maybeSingle()
}

export async function selectShelterRowBySlug(slug) {
  return supabase.from('shelters').select('id, slug, name, city, lat, lng').eq('slug', slug).maybeSingle()
}

export async function updateShelterConfigByCasaId(changes) {
  return supabase
    .from('shelter_config')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', 'casa')
    .select()
    .single()
}

export async function selectShelterConfigIdsByShelterId(shelterId) {
  return supabase
    .from('shelter_config')
    .select('id')
    .eq('shelter_id', shelterId)
    .order('updated_at', { ascending: false })
    .limit(1)
}

export async function insertShelterConfigRow(payload) {
  return supabase.from('shelter_config').insert(payload).select().maybeSingle()
}

export async function updateShelterConfigById(configId, payload) {
  return supabase.from('shelter_config').update(payload).eq('id', configId).select().maybeSingle()
}

function removeMissingColumnFromPayload(payload, err) {
  const msg = (err?.message || '').toString()
  const m = msg.match(/Could not find the '([^']+)' column/i)
  if (!m?.[1]) return null
  const col = m[1]
  if (!Object.prototype.hasOwnProperty.call(payload, col)) return null
  const next = { ...payload }
  delete next[col]
  return next
}

/**
 * Upsert de configuración con tolerancia a columnas faltantes (misma lógica que el hook admin).
 * @param {string} shelterId
 * @param {object} changes
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export async function upsertShelterConfigForShelter(shelterId, changes) {
  const basePayload = { shelter_id: shelterId, ...changes, updated_at: new Date().toISOString() }

  const updateWithSchemaFallback = async (id, payload) => {
    let current = { ...payload }
    for (let i = 0; i < 12; i++) {
      const { data, error } = await updateShelterConfigById(id, current)
      if (!error) return { data, error: null }
      const next = removeMissingColumnFromPayload(current, error)
      if (next) {
        current = next
        continue
      }
      return { data: null, error }
    }
    return { data: null, error: new Error('No pudimos guardar la configuración (schema mismatch).') }
  }

  const insertWithSchemaFallback = async (payload) => {
    let current = { ...payload }
    for (let i = 0; i < 12; i++) {
      const { data, error } = await insertShelterConfigRow(current)
      if (!error) return { data, error: null }
      if ((error?.message || '').includes('duplicate key value violates unique constraint "shelter_config_pkey"')) {
        return updateWithSchemaFallback(shelterId, current)
      }
      const next = removeMissingColumnFromPayload(current, error)
      if (next) {
        current = next
        continue
      }
      return { data: null, error }
    }
    return { data: null, error: new Error('No pudimos crear la configuración (schema mismatch).') }
  }

  const { data: existing, error: existingErr } = await selectShelterConfigIdsByShelterId(shelterId)
  if (existingErr) return { data: null, error: existingErr }

  const existingId = Array.isArray(existing) && existing.length ? existing[0]?.id : null
  if (existingId) {
    return updateWithSchemaFallback(existingId, basePayload)
  }

  return insertWithSchemaFallback({ id: shelterId, ...basePayload })
}

// ─── shelter_announcements (panel + público) ────────────────────

export async function listShelterAnnouncementsPage(shelterId, page, pageSize) {
  return supabase
    .from('shelter_announcements')
    .select('*', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })
    .range(
      Math.max(0, (page - 1) * pageSize),
      Math.max(0, (page - 1) * pageSize) + pageSize - 1
    )
}

export async function listActiveAnnouncementsForShelter(shelterId, limit = 5) {
  return supabase
    .from('shelter_announcements')
    .select('*')
    .eq('shelter_id', shelterId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function getLatestShelterAnnouncement(shelterId) {
  return supabase
    .from('shelter_announcements')
    .select('*')
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function listPublicAnnouncementsPaged(shelterId, page, pageSize) {
  return supabase
    .from('shelter_announcements')
    .select('*', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })
    .range(
      Math.max(0, (page - 1) * pageSize),
      Math.max(0, (page - 1) * pageSize) + pageSize - 1
    )
}

export async function insertShelterAnnouncement(payload) {
  return supabase
    .from('shelter_announcements')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single()
}

export async function updateShelterAnnouncement(id, changes) {
  return supabase
    .from('shelter_announcements')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteShelterAnnouncement(id) {
  return supabase.from('shelter_announcements').delete().eq('id', id)
}

// ─── shelter_events ─────────────────────────────────────────────

export async function listShelterEventsPage(shelterId, page, pageSize) {
  return supabase
    .from('shelter_events')
    .select('*', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('event_at', { ascending: true })
    .range(
      Math.max(0, (page - 1) * pageSize),
      Math.max(0, (page - 1) * pageSize) + pageSize - 1
    )
}

export async function getNextShelterEventFromDate(shelterId, nowIso) {
  return supabase
    .from('shelter_events')
    .select('*')
    .eq('shelter_id', shelterId)
    .gte('event_at', nowIso)
    .order('event_at', { ascending: true })
    .limit(1)
    .maybeSingle()
}

export async function getLastShelterEvent(shelterId) {
  return supabase
    .from('shelter_events')
    .select('*')
    .eq('shelter_id', shelterId)
    .order('event_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function listPublicShelterEventsFromDate(shelterId, todayIso, page, pageSize) {
  return supabase
    .from('shelter_events')
    .select('*', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .gte('event_at', todayIso)
    .order('event_at', { ascending: true })
    .range(
      Math.max(0, (page - 1) * pageSize),
      Math.max(0, (page - 1) * pageSize) + pageSize - 1
    )
}

export async function insertShelterEvent(payload) {
  return supabase
    .from('shelter_events')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single()
}

export async function updateShelterEvent(id, changes) {
  return supabase
    .from('shelter_events')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteShelterEvent(id) {
  return supabase.from('shelter_events').delete().eq('id', id)
}

// ─── shelter_campaigns (colectas) ───────────────────────────────

export async function listShelterCampaignsForPublic(shelterId, { limit = 10 } = {}) {
  if (!shelterId) return { data: [], error: null }
  const { data, error } = await supabase
    .from('shelter_campaigns')
    .select(`
      id,
      shelter_id,
      status,
      urgency,
      title,
      description,
      image_mode,
      image_url,
      image_position,
      pet_id,
      use_shelter_accounts,
      transfer_accounts_override,
      updated_at,
      pets ( id, name, slug, photos, adoption_status )
    `)
    .eq('shelter_id', shelterId)
    .eq('status', 'active')
    .order('urgency', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) return { data: null, error }
  return { data: data ?? [], error: null }
}

export async function listCampaignsPublic(opts = {}) {
  const {
    limit = 12,
    page: pageOpt,
    pageSize = 12,
    urgency,
    shelterId,
  } = opts

  const selectCols = `
      id,
      shelter_id,
      status,
      urgency,
      title,
      description,
      image_mode,
      image_url,
      image_position,
      pet_id,
      use_shelter_accounts,
      transfer_accounts_override,
      updated_at,
      shelters ( id, slug, name, city ),
      pets ( id, name, slug, photos, adoption_status )
    `

  const usePaging = pageOpt !== undefined && pageOpt !== null

  let q = supabase
    .from('shelter_campaigns')
    .select(selectCols, usePaging ? { count: 'exact' } : {})
    .eq('status', 'active')

  if (urgency != null && urgency !== '' && urgency !== 'all') {
    const u = Number(urgency)
    if ([1, 2, 3].includes(u)) q = q.eq('urgency', u)
  }
  if (shelterId) {
    q = q.eq('shelter_id', shelterId)
  }

  q = q.order('urgency', { ascending: false }).order('updated_at', { ascending: false })

  if (usePaging) {
    const p = Math.max(1, Number(pageOpt) || 1)
    const ps = Math.min(50, Math.max(1, Number(pageSize) || 12))
    const from = (p - 1) * ps
    const to = from + ps - 1
    q = q.range(from, to)
  } else {
    q = q.limit(limit)
  }

  const { data, error, count } = await q
  if (error) return { data: null, error, total: usePaging ? null : undefined }
  return {
    data: data ?? [],
    error: null,
    total: usePaging ? count ?? 0 : undefined,
  }
}

export async function listShelterCampaignsAdmin(shelterId, { page = 1, pageSize = 10 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('shelter_campaigns')
    .select(`
      id,
      shelter_id,
      status,
      urgency,
      title,
      description,
      image_mode,
      image_url,
      image_position,
      pet_id,
      use_shelter_accounts,
      transfer_accounts_override,
      created_at,
      updated_at,
      pets ( id, name, slug, photos, adoption_status )
    `, { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('updated_at', { ascending: false })
    .range(from, to)
  if (error) return { data: null, error, total: 0 }
  return { data: data ?? [], error: null, total: typeof count === 'number' ? count : (data?.length ?? 0) }
}

export async function insertShelterCampaign(payload) {
  return supabase
    .from('shelter_campaigns')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single()
}

export async function updateShelterCampaign(id, changes) {
  return supabase
    .from('shelter_campaigns')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteShelterCampaign(id) {
  return supabase.from('shelter_campaigns').delete().eq('id', id)
}

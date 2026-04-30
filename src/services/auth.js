/**
 * Acceso a datos: perfiles, voluntariados y métodos de auth que no son sesión.
 * Sesión, getSession y onAuthStateChange permanecen en `useAuth`.
 * @module services/auth
 */
import { supabase } from '../lib/supabase'

/**
 * @param {string} userId
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export function fetchProfileByUserId(userId) {
  return supabase
    .from('profiles')
    .select('*, shelter:shelters(slug)')
    .eq('id', userId)
    .single()
}

/**
 * @param {string} userId
 * @param {object} payload — columnas permitidas de `profiles` (no usar para is_admin / shelter_id / shelter_role; eso va por RPC)
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export function updateProfileRow(userId, payload) {
  return supabase.from('profiles').update(payload).eq('id', userId).select().single()
}

/**
 * @param {string} userId
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 */
export function fetchVolunteerSubscriptions(userId) {
  return supabase
    .from('volunteer_subscriptions')
    .select('*, shelter:shelters(id, name, slug, city)')
    .eq('user_id', userId)
}

/**
 * @param {{ user_id: string, shelter_id: string, roles?: string[] }} row
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export function upsertVolunteerSubscription(row) {
  return supabase
    .from('volunteer_subscriptions')
    .upsert(row, { onConflict: 'user_id,shelter_id' })
    .select('*, shelter:shelters(id, name, slug, city)')
    .single()
}

/**
 * @param {string} userId
 * @param {string} shelterId
 * @returns {Promise<{ data: null, error: Error|null }>}
 */
export function deleteVolunteerSubscription(userId, shelterId) {
  return supabase
    .from('volunteer_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('shelter_id', shelterId)
}

/**
 * @param {string} userId
 * @returns {Promise<{ data: null, error: Error|null }>}
 */
export function deleteProfileRow(userId) {
  return supabase.from('profiles').delete().eq('id', userId)
}

/**
 * RPC para borrar el usuario autenticado.
 * @returns {Promise<{ data: unknown, error: Error|null }>}
 */
export function rpcDeleteOwnUser() {
  return supabase.rpc('delete_own_user')
}

/** @param {{ email: string, password: string }} creds */
export function authSignInWithPassword(creds) {
  return supabase.auth.signInWithPassword(creds)
}

/** @param {import('@supabase/supabase-js').SignUpWithPasswordCredentials} payload */
export function authSignUp(payload) {
  return supabase.auth.signUp(payload)
}

/** @param {import('@supabase/supabase-js').SignInWithOAuthCredentials} opts */
export function authSignInWithOAuth(opts) {
  return supabase.auth.signInWithOAuth(opts)
}

export function authSignOut() {
  return supabase.auth.signOut()
}

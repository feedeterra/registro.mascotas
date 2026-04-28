import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Load initial session ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch profile ────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, shelter:shelters(slug)')
      .eq('id', userId)
      .single()

    if (!error) setProfile(data)
    setLoading(false)
  }, [])

  // ── Email/Password login ─────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  // ── Email/Password signup ────────────────────────────────────
  const signUpWithEmail = useCallback(async (email, password, displayName, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: displayName,
          phone: phone
        } 
      },
    })
    if (error) throw error
    return data
  }, [])

  // ── Google OAuth ─────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  // ── Update profile ───────────────────────────────────────────
  const updateProfile = useCallback(async (changes) => {
    if (!session?.user) return

    const payload = {}
    if (changes.displayName !== undefined) payload.display_name = changes.displayName
    if (changes.phone !== undefined) payload.phone = changes.phone
    if (changes.neighborhood !== undefined) payload.neighborhood = changes.neighborhood
    if (changes.avatarUrl !== undefined) payload.avatar_url = changes.avatarUrl
    if (changes.avatarPosition !== undefined) payload.avatar_position = changes.avatarPosition
    if (changes.canTransit !== undefined) payload.can_transit = changes.canTransit
    if (changes.wantsToAdopt !== undefined) payload.wants_to_adopt = changes.wantsToAdopt
    if (changes.wantsToVolunteer !== undefined) payload.wants_to_volunteer = changes.wantsToVolunteer
    if (changes.volunteerRoles !== undefined) payload.volunteer_roles = changes.volunteerRoles
    if (changes.phone !== undefined) payload.phone = changes.phone
    if (changes.email !== undefined) payload.email = changes.email

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }, [session])

  // ── Volunteer subscriptions ──────────────────────────────────
  const [volunteerSubs, setVolunteerSubs] = useState([])

  const fetchVolunteerSubs = useCallback(async (userId) => {
    const { data } = await supabase
      .from('volunteer_subscriptions')
      .select('*, shelter:shelters(id, name, slug, city)')
      .eq('user_id', userId)
    setVolunteerSubs(data || [])
  }, [])

  useEffect(() => {
    if (session?.user) fetchVolunteerSubs(session.user.id)
    else setVolunteerSubs([])
  }, [session, fetchVolunteerSubs])

  const subscribeToShelter = useCallback(async (shelterId, roles = []) => {
    if (!session?.user) return
    const { data, error } = await supabase
      .from('volunteer_subscriptions')
      .upsert({ user_id: session.user.id, shelter_id: shelterId, roles }, { onConflict: 'user_id,shelter_id' })
      .select('*, shelter:shelters(id, name, slug, city)')
      .single()
    if (error) throw error
    setVolunteerSubs(prev => {
      const idx = prev.findIndex(s => s.shelter_id === shelterId)
      return idx >= 0 ? prev.map((s, i) => i === idx ? data : s) : [...prev, data]
    })
    return data
  }, [session])

  const unsubscribeFromShelter = useCallback(async (shelterId) => {
    if (!session?.user) return
    const { error } = await supabase
      .from('volunteer_subscriptions')
      .delete()
      .eq('user_id', session.user.id)
      .eq('shelter_id', shelterId)
    if (error) throw error
    setVolunteerSubs(prev => prev.filter(s => s.shelter_id !== shelterId))
  }, [session])

  // ── Delete account ───────────────────────────────────────────
  const deleteAccount = useCallback(async () => {
    if (!session?.user) return
    // Delete profile first (cascades subscriptions), then auth user via RPC
    await supabase.from('profiles').delete().eq('id', session.user.id)
    await supabase.rpc('delete_own_user')
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setVolunteerSubs([])
  }, [session])

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setVolunteerSubs([])
  }, [])

  // ── Derived state ────────────────────────────────────────────
  const isAdmin = profile?.is_admin === true
  const userId = session?.user?.id ?? null
  const isLogged = !!session?.user
  const shelterId = profile?.shelter_id ?? null
  const shelterSlug = profile?.shelter?.slug ?? null
  const isShelterStaff = !!shelterId && (profile?.shelter_role === 'staff' || profile?.shelter_role === 'owner')
  const isShelterOwner = profile?.shelter_role === 'owner'

  return {
    session,
    profile,
    loading,
    userId,
    isAdmin,
    isLogged,
    shelterId,
    shelterSlug,
    isShelterStaff,
    isShelterOwner,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    updateProfile,
    logout,
    fetchProfile,
    volunteerSubs,
    fetchVolunteerSubs,
    subscribeToShelter,
    unsubscribeFromShelter,
    deleteAccount,
  }
}

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
      .select('*')
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
  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    })
    if (error) throw error
    return data
  }, [])

  // ── Update profile ───────────────────────────────────────────
  const updateProfile = useCallback(async (changes) => {
    if (!session?.user) return

    const payload = {}
    if (changes.displayName !== undefined) payload.display_name = changes.displayName
    if (changes.phone !== undefined) payload.phone = changes.phone
    if (changes.neighborhood !== undefined) payload.neighborhood = changes.neighborhood
    if (changes.avatarUrl !== undefined) payload.avatar_url = changes.avatarUrl
    if (changes.isVolunteer !== undefined) payload.is_volunteer = changes.isVolunteer
    if (changes.canTransit !== undefined) payload.can_transit = changes.canTransit
    if (changes.wantsToAdopt !== undefined) payload.wants_to_adopt = changes.wantsToAdopt

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

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  // ── Derived state ────────────────────────────────────────────
  const isAdmin = profile?.is_admin === true
  const userId = session?.user?.id ?? null
  const isLogged = !!session?.user

  return {
    session,
    profile,
    loading,
    userId,
    isAdmin,
    isLogged,
    loginWithEmail,
    signUpWithEmail,
    updateProfile,
    logout,
    fetchProfile,
  }
}

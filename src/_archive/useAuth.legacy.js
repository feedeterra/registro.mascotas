// src/hooks/useAuth.js
// ─── Hook: useAuth ────────────────────────────────────────────────
// Maneja sesión, perfil y login/logout.
// El flujo actual del app usa WhatsApp como identidad → acá lo
// mapeamos a Supabase Auth con OTP por teléfono (o anónimo).

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Cargar sesión inicial ──────────────────────────────────────
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

  // ── Fetch profile desde tabla public.profiles ──────────────────
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error) setProfile(data)
    setLoading(false)
  }, [])

  // ── Login anónimo ──────────────────────────────────────────────
  // Mantiene compatibilidad con el flujo actual (sin forzar registro).
  // El usuario anónimo puede registrar mascotas; si pone su teléfono
  // más tarde, se vincula con linkPhone().
  const loginAnonymous = useCallback(async () => {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return data
  }, [])

  // ── Login con OTP por teléfono (WhatsApp flow futuro) ──────────
  const sendOtp = useCallback(async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
  }, [])

  const verifyOtp = useCallback(async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
    return data
  }, [])

  // ── Update profile ─────────────────────────────────────────────
  const updateProfile = useCallback(async (changes) => {
    if (!session?.user) return

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: changes.displayName,
        phone:        changes.phone,
        neighborhood: changes.neighborhood,
        avatar_url:   changes.avatarUrl,
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }, [session])

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  // ── Helpers de conveniencia ────────────────────────────────────
  const isAdmin  = profile?.is_admin === true
  const userId   = session?.user?.id ?? null
  const isLogged = !!session?.user && !session.user.is_anonymous

  return {
    session,
    profile,
    loading,
    userId,
    isAdmin,
    isLogged,
    loginAnonymous,
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
    fetchProfile,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useShelter(slug = 'casa') {
  const [shelter, setShelter] = useState(null)
  const [followers, setFollowers] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Fetch shelter by slug ────────────────────────────────────
  const fetchShelter = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shelters')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!error && data) {
      setShelter(data)
      // Get follower count
      const { count } = await supabase
        .from('shelter_followers')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', data.id)
      setFollowers(count ?? 0)
    }
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchShelter() }, [fetchShelter])

  // ── Check if user follows ────────────────────────────────────
  const checkFollowing = useCallback(async (userId) => {
    if (!userId || !shelter?.id) { setIsFollowing(false); return }
    const { data } = await supabase
      .from('shelter_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('shelter_id', shelter.id)
      .maybeSingle()
    setIsFollowing(!!data)
  }, [shelter?.id])

  // ── Follow shelter ───────────────────────────────────────────
  const followShelter = useCallback(async (userId) => {
    if (!userId || !shelter?.id) return
    const { error } = await supabase
      .from('shelter_followers')
      .insert({ user_id: userId, shelter_id: shelter.id })
    if (!error) {
      setIsFollowing(true)
      setFollowers(prev => prev + 1)
    }
    return !error
  }, [shelter?.id])

  // ── Unfollow shelter ─────────────────────────────────────────
  const unfollowShelter = useCallback(async (userId) => {
    if (!userId || !shelter?.id) return
    const { error } = await supabase
      .from('shelter_followers')
      .delete()
      .eq('user_id', userId)
      .eq('shelter_id', shelter.id)
    if (!error) {
      setIsFollowing(false)
      setFollowers(prev => Math.max(0, prev - 1))
    }
  }, [shelter?.id])

  return {
    shelter,
    followers,
    isFollowing,
    loading,
    fetchShelter,
    checkFollowing,
    followShelter,
    unfollowShelter,
  }
}

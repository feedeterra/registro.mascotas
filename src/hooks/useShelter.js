import { useState, useEffect, useCallback } from 'react'
import { useShelterQuery } from './queries/useShelterQuery'
import {
  deleteShelterFollower,
  getShelterFollowerRow,
  insertShelterFollower,
} from '../services/shelters'

export function useShelter(slug = 'casa') {
  const { data, isLoading: loading, refetch: fetchShelter, error } = useShelterQuery(slug)
  const shelter = data?.shelter ?? null
  const [followers, setFollowers] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (data?.followers != null) setFollowers(data.followers)
  }, [data?.followers])

  const checkFollowing = useCallback(async (userId) => {
    if (!userId || !shelter?.id) { setIsFollowing(false); return }
    const { data: row } = await getShelterFollowerRow(userId, shelter.id)
    setIsFollowing(!!row)
  }, [shelter?.id])

  const followShelter = useCallback(async (userId) => {
    if (!userId || !shelter?.id) return
    const { error: err } = await insertShelterFollower(userId, shelter.id)
    if (!err) {
      setIsFollowing(true)
      setFollowers(prev => prev + 1)
    }
    return !err
  }, [shelter?.id])

  const unfollowShelter = useCallback(async (userId) => {
    if (!userId || !shelter?.id) return
    const { error: err } = await deleteShelterFollower(userId, shelter.id)
    if (!err) {
      setIsFollowing(false)
      setFollowers(prev => Math.max(0, prev - 1))
    }
  }, [shelter?.id])

  return {
    shelter,
    followers,
    isFollowing,
    loading,
    error: error?.message ?? null,
    fetchShelter,
    checkFollowing,
    followShelter,
    unfollowShelter,
  }
}

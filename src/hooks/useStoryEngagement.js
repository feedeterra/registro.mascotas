import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'
import { validateStoryCommentContent } from '../constants/storyEngagement'

/** Solo corazón en UI; filas legacy en BD con otros tipos no suman al contador. */
export const STORY_REACTION_TYPES = ['heart']

const INITIAL_COMMENTS = 2
const MORE_COMMENTS = 10
/** Ventana deslizante: hasta este número de comentarios por historia… */
const COMMENT_BURST_MAX = 3
/** …en este intervalo (cliente; la BD replica la regla). */
const COMMENT_BURST_WINDOW_MS = 30 * 60 * 1000

function emptyCounts() {
  return { heart: 0 }
}

function mapCommentRow(row) {
  const prof = row.profiles && !Array.isArray(row.profiles) ? row.profiles : row.profiles?.[0]
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    user_id: row.user_id,
    user: {
      display_name: prof?.display_name?.trim() || 'Usuario',
      avatar_url: prof?.avatar_url || null,
    },
  }
}

/**
 * Reacciones y comentarios para una fila de `success_stories`.
 * @param {string | null} storyId — uuid de success_stories; null desactiva fetch.
 */
export function useStoryEngagement(storyId) {
  const { session, profile } = useAuthContext()
  const userId = session?.user?.id ?? null

  const [reactions, setReactions] = useState(emptyCounts)
  const [userReactionTypes, setUserReactionTypes] = useState([])
  const [comments, setComments] = useState([])
  const [totalComments, setTotalComments] = useState(0)
  const [nextRangeStart, setNextRangeStart] = useState(0)
  const [isLoadingReactions, setIsLoadingReactions] = useState(!!storyId)
  const [isLoadingComments, setIsLoadingComments] = useState(!!storyId)
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  /** Timestamps de envíos exitosos en esta historia (sesión actual) para el burst local. */
  const commentBurstTimesRef = useRef([])

  useEffect(() => {
    commentBurstTimesRef.current = []
  }, [storyId])

  const hasMoreComments = useMemo(
    () => comments.length < totalComments,
    [comments.length, totalComments]
  )

  const loadReactions = useCallback(async () => {
    if (!storyId) return
    setIsLoadingReactions(true)
    try {
      const { data: rows, error } = await supabase
        .from('story_reactions')
        .select('reaction_type, user_id')
        .eq('story_id', storyId)

      if (error) throw error

      const counts = emptyCounts()
      const mine = new Set()
      for (const r of rows || []) {
        if (r.reaction_type === 'heart') {
          counts.heart++
          if (userId && r.user_id === userId) mine.add('heart')
        }
      }
      setReactions(counts)
      setUserReactionTypes([...mine])
    } finally {
      setIsLoadingReactions(false)
    }
  }, [storyId, userId])

  const loadCommentsInitial = useCallback(async () => {
    if (!storyId) return
    setIsLoadingComments(true)
    try {
      const { count, error: countErr } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
      if (countErr) throw countErr
      setTotalComments(typeof count === 'number' ? count : 0)

      const { data, error } = await supabase
        .from('story_comments')
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          profiles ( display_name, avatar_url )
        `
        )
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .range(0, INITIAL_COMMENTS - 1)

      if (error) throw error
      setComments((data || []).map(mapCommentRow))
      setNextRangeStart(INITIAL_COMMENTS)
    } finally {
      setIsLoadingComments(false)
    }
  }, [storyId])

  useEffect(() => {
    if (!storyId) {
      setReactions(emptyCounts())
      setUserReactionTypes([])
      setComments([])
      setTotalComments(0)
      setNextRangeStart(0)
      setIsLoadingReactions(false)
      setIsLoadingComments(false)
      return
    }
    loadReactions()
    loadCommentsInitial()
  }, [storyId, loadReactions, loadCommentsInitial])

  const toggleReaction = useCallback(
    async (type) => {
      if (!STORY_REACTION_TYPES.includes(type)) return {}
      if (!userId) return { requiresAuth: true }
      if (!storyId) return {}

      const had = userReactionTypes.includes(type)
      const prevCounts = { ...reactions }
      const prevUser = [...userReactionTypes]

      setReactions((c) => ({
        ...c,
        [type]: Math.max(0, (c[type] || 0) + (had ? -1 : 1)),
      }))
      setUserReactionTypes((u) => (had ? u.filter((x) => x !== type) : [...u, type]))

      try {
        if (had) {
          const { error } = await supabase
            .from('story_reactions')
            .delete()
            .eq('story_id', storyId)
            .eq('user_id', userId)
            .eq('reaction_type', type)
          if (error) throw error
        } else {
          const { error } = await supabase.from('story_reactions').insert({
            story_id: storyId,
            user_id: userId,
            reaction_type: type,
          })
          if (error) throw error
        }
        return {}
      } catch {
        setReactions(prevCounts)
        setUserReactionTypes(prevUser)
        return { error: true }
      }
    },
    [storyId, userId, reactions, userReactionTypes]
  )

  const loadMoreComments = useCallback(async () => {
    if (!storyId || !hasMoreComments || isLoadingMoreComments) return
    setIsLoadingMoreComments(true)
    try {
      const from = nextRangeStart
      const to = nextRangeStart + MORE_COMMENTS - 1
      const { data, error } = await supabase
        .from('story_comments')
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          profiles ( display_name, avatar_url )
        `
        )
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      const mapped = (data || []).map(mapCommentRow)
      setComments((prev) => {
        const ids = new Set(prev.map((c) => c.id))
        const merged = [...prev]
        for (const c of mapped) {
          if (!ids.has(c.id)) merged.push(c)
        }
        return merged
      })
      setNextRangeStart(from + MORE_COMMENTS)
    } finally {
      setIsLoadingMoreComments(false)
    }
  }, [storyId, hasMoreComments, isLoadingMoreComments, nextRangeStart])

  const addComment = useCallback(
    async (content) => {
      const v = validateStoryCommentContent(content)
      if (!v.ok) {
        return { validationError: true, code: v.code }
      }
      const trimmed = v.value
      if (!userId) return { requiresAuth: true }
      if (!storyId) return {}

      const now = Date.now()
      const cutoff = now - COMMENT_BURST_WINDOW_MS
      commentBurstTimesRef.current = commentBurstTimesRef.current.filter((t) => t >= cutoff)
      if (commentBurstTimesRef.current.length >= COMMENT_BURST_MAX) {
        const oldest = Math.min(...commentBurstTimesRef.current)
        return {
          rateLimited: true,
          retryAfterMs: COMMENT_BURST_WINDOW_MS - (now - oldest),
        }
      }

      const optimisticId = `temp-${Date.now()}`
      const optimistic = {
        id: optimisticId,
        content: trimmed,
        created_at: new Date().toISOString(),
        user_id: userId,
        user: {
          display_name: profile?.display_name?.trim() || 'Vos',
          avatar_url: profile?.avatar_url || null,
        },
        _optimistic: true,
      }

      setComments((prev) => [optimistic, ...prev])
      setTotalComments((n) => n + 1)
      setIsSubmitting(true)

      try {
        const { data, error } = await supabase
          .from('story_comments')
          .insert({
            story_id: storyId,
            user_id: userId,
            content: trimmed,
          })
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            profiles ( display_name, avatar_url )
          `
          )
          .single()

        if (error) throw error
        commentBurstTimesRef.current.push(Date.now())
        const mapped = mapCommentRow(data)
        setComments((prev) =>
          prev.map((c) => (c.id === optimisticId ? { ...mapped, _optimistic: false } : c))
        )
        return {}
      } catch (err) {
        const msg = err?.message || String(err)
        if (/Ya publicaste|Probá más tarde|Límite|Esperá/i.test(msg)) {
          setComments((prev) => prev.filter((c) => c.id !== optimisticId))
          setTotalComments((n) => Math.max(0, n - 1))
          return { rateLimitedServer: true, serverMessage: msg, restoreText: trimmed }
        }
        setComments((prev) => prev.filter((c) => c.id !== optimisticId))
        setTotalComments((n) => Math.max(0, n - 1))
        return { error: true, restoreText: trimmed }
      } finally {
        setIsSubmitting(false)
      }
    },
    [storyId, userId, profile]
  )

  const deleteComment = useCallback(
    async (commentId) => {
      if (!userId || !storyId || !commentId || String(commentId).startsWith('temp-')) return

      let removed = null
      setComments((prev) => {
        removed = prev.find((c) => c.id === commentId)
        return prev.filter((c) => c.id !== commentId)
      })
      setTotalComments((n) => Math.max(0, n - 1))

      try {
        const { error } = await supabase.from('story_comments').delete().eq('id', commentId)
        if (error) throw error
        return {}
      } catch {
        if (removed) {
          setComments((prev) => {
            const next = [...prev, removed]
            next.sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            return next
          })
          setTotalComments((n) => n + 1)
        }
        return { error: true }
      }
    },
    [userId, storyId]
  )

  const userReactions = useMemo(() => new Set(userReactionTypes), [userReactionTypes])

  return {
    reactions,
    userReactionTypes,
    userReactions,
    toggleReaction,
    comments,
    totalComments,
    addComment,
    deleteComment,
    loadMoreComments,
    isLoadingReactions,
    isLoadingComments,
    isLoadingMoreComments,
    isSubmitting,
    hasMoreComments,
  }
}

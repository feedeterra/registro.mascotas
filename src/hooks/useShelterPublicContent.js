import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function isBetween(now, start, end) {
  if (start && now < new Date(start)) return false
  if (end && now > new Date(end)) return false
  return true
}

export function useActiveShelterAnnouncement(shelterId) {
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setAnnouncement(null); setLoading(false); return }
      setLoading(true)
      const { data, error } = await supabase
        .from('shelter_announcements')
        .select('*')
        .eq('shelter_id', shelterId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (cancelled) return

      if (error || !data?.length) {
        setAnnouncement(null)
        setLoading(false)
        return
      }

      const now = new Date()
      const active = data.find(a => isBetween(now, a.starts_at, a.ends_at)) || null
      setAnnouncement(active)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [shelterId])

  return { announcement, loading }
}

export function useLatestShelterAnnouncement(shelterId) {
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setAnnouncement(null); setLoading(false); return }
      setLoading(true)
      const { data, error } = await supabase
        .from('shelter_announcements')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) { setAnnouncement(null); setLoading(false); return }
      setAnnouncement(data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [shelterId])

  return { announcement, loading }
}

export function useNextShelterEvent(shelterId) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setEvent(null); setLoading(false); return }
      setLoading(true)

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const nowIso = startOfToday.toISOString()
      const { data, error } = await supabase
        .from('shelter_events')
        .select('*')
        .eq('shelter_id', shelterId)
        .gte('event_at', nowIso)
        .order('event_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      // If there's no upcoming event (or schema/RLS quirks), fallback to the most recent one.
      if (error || !data) {
        const { data: last } = await supabase
          .from('shelter_events')
          .select('*')
          .eq('shelter_id', shelterId)
          .order('event_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        setEvent(last || null)
        setLoading(false)
        return
      }

      setEvent(data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [shelterId])

  const eventDate = useMemo(() => (event?.event_at ? new Date(event.event_at) : null), [event?.event_at])
  return { event, eventDate, loading }
}

export function usePublicShelterAnnouncements(shelterId, { page = 1, pageSize = 5 } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setItems([]); setTotal(0); setLoading(false); return }
      setLoading(true); setError(null)
      try {
        const { data, error: err, count } = await supabase
          .from('shelter_announcements')
          .select('*', { count: 'exact' })
          .eq('shelter_id', shelterId)
          .order('created_at', { ascending: false })
          .range(
            Math.max(0, (page - 1) * pageSize),
            Math.max(0, (page - 1) * pageSize) + pageSize - 1
          )
        if (cancelled) return
        if (err) throw err
        setItems(data ?? [])
        setTotal(count ?? 0)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shelterId, page, pageSize])

  return { items, total, loading, error }
}

export function usePublicShelterEvents(shelterId, { page = 1, pageSize = 5 } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setItems([]); setTotal(0); setLoading(false); return }
      setLoading(true); setError(null)
      try {
        // Use UTC midnight to avoid timezone mismatches hiding "today" events
        const now = new Date()
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        const todayIso = todayUtc.toISOString()
        const { data, error: err, count } = await supabase
          .from('shelter_events')
          .select('*', { count: 'exact' })
          .eq('shelter_id', shelterId)
          .gte('event_at', todayIso)
          .order('event_at', { ascending: true })
          .range(
            Math.max(0, (page - 1) * pageSize),
            Math.max(0, (page - 1) * pageSize) + pageSize - 1
          )
        if (cancelled) return
        if (err) throw err
        setItems(data ?? [])
        setTotal(count ?? 0)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [shelterId, page, pageSize])

  return { items, total, loading, error }
}


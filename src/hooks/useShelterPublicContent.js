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

export function useNextShelterEvent(shelterId) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!shelterId) { setEvent(null); setLoading(false); return }
      setLoading(true)

      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('shelter_events')
        .select('*')
        .eq('shelter_id', shelterId)
        .gte('event_at', nowIso)
        .order('event_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setEvent(null)
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


// TODO: migrar anuncios/eventos públicos a TanStack Query (useQuery + keys por shelterId).
import { useEffect, useMemo, useState } from 'react'
import {
  getLastShelterEvent,
  getLatestShelterAnnouncement,
  getNextShelterEventFromDate,
  listActiveAnnouncementsForShelter,
  listPublicAnnouncementsPaged,
  listPublicShelterEventsFromDate,
} from '../services/shelters'

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
      const { data, error } = await listActiveAnnouncementsForShelter(shelterId, 5)

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
      const { data, error } = await getLatestShelterAnnouncement(shelterId)

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
      const { data, error } = await getNextShelterEventFromDate(shelterId, nowIso)

      if (cancelled) return

      if (error || !data) {
        const { data: last } = await getLastShelterEvent(shelterId)

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
        const { data, error: err, count } = await listPublicAnnouncementsPaged(shelterId, page, pageSize)
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
        const now = new Date()
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
        const todayIso = todayUtc.toISOString()
        const { data, error: err, count } = await listPublicShelterEventsFromDate(shelterId, todayIso, page, pageSize)
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

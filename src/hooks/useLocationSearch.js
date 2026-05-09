import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'Registro Perros/1.0 (contacto vía app)'
const DEBOUNCE_MS = 400
const MIN_QUERY = 3

export function buildLocationLabelFromNominatim(result) {
  const a = result.address || {}
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.city_district ||
    a.county ||
    ''
  const state = a.state || ''
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  const dn = result.display_name || ''
  const parts = dn.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`
  return dn || 'Ubicación'
}

/**
 * Búsqueda de localidades (Nominatim, Argentina). La selección final la maneja el padre (prop value).
 */
export function useLocationSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  const reset = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setIsSearching(false)
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const q = query.trim()
    if (q.length < MIN_QUERY) {
      setSuggestions([])
      setIsSearching(false)
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      return undefined
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setIsSearching(true)
      try {
        const url = new URL(NOMINATIM)
        url.searchParams.set('q', q)
        url.searchParams.set('format', 'json')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('limit', '5')
        url.searchParams.set('countrycodes', 'ar')

        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          headers: { Accept: 'application/json', 'User-Agent': UA },
        })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!Array.isArray(data)) {
          setSuggestions([])
          return
        }
        const next = data
          .map((row) => ({
            label: buildLocationLabelFromNominatim(row),
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lon),
          }))
          .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng))
        setSuggestions(next)
      } catch (e) {
        if (e?.name === 'AbortError') return
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return useMemo(
    () => ({
      query,
      setQuery,
      suggestions,
      isSearching,
      reset,
    }),
    [query, setQuery, suggestions, isSearching, reset]
  )
}

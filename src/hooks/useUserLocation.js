import { useCallback, useState } from 'react'

export function useUserLocation() {
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err?.message || 'No se pudo obtener tu ubicación')
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  const clear = useCallback(() => {
    setCoords(null)
    setError(null)
    setLoading(false)
  }, [])

  return { coords, loading, error, request, clear }
}


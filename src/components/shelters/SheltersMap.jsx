import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useT, RS } from '../../theme'

import 'leaflet/dist/leaflet.css'
import '../../styles/leaflet-overrides.css'

const ARG_CENTER = [-38.416097, -63.616672]
const ARG_ZOOM = 5

function MapFocus({ target, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const z = zoom ?? map.getZoom()
    map.flyTo(target, z, { duration: 0.55 })
  }, [target?.[0], target?.[1], zoom, map])
  return null
}

/**
 * @param {{
 *   shelters: Array<{ id: string, name: string, address?: string, lat?: number | null, lng?: number | null, logoUrl?: string | null, slug: string, inAdoptionCount?: number }>,
 *   userLocation: { lat: number, lng: number } | null,
 *   highlightedId?: string | null,
 *   focusCenter?: { lat: number, lng: number } | null,
 *   focusZoom?: number | null,
 * }} props
 */
export default function SheltersMap({
  shelters,
  userLocation,
  highlightedId = null,
  focusCenter = null,
  focusZoom = null,
}) {
  const T = useT()

  const withCoords = useMemo(
    () =>
      shelters.filter((s) => {
        const la = Number(s.lat)
        const ln = Number(s.lng)
        return Number.isFinite(la) && Number.isFinite(ln)
      }),
    [shelters]
  )

  const flyTarget = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng]
    if (focusCenter) return [focusCenter.lat, focusCenter.lng]
    return null
  }, [userLocation?.lat, userLocation?.lng, focusCenter?.lat, focusCenter?.lng])

  const flyZoom = userLocation ? 11 : focusCenter ? (focusZoom ?? 10) : null

  const initialCenter = flyTarget || ARG_CENTER
  const initialZoom = flyTarget ? (userLocation ? 11 : focusZoom ?? 10) : ARG_ZOOM

  return (
    <div style={{ borderRadius: RS, overflow: 'hidden', border: `1.5px solid ${T.borderLt}`, background: T.borderLt }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', minHeight: 360 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus target={flyTarget} zoom={flyZoom} />

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={11}
            pathOptions={{
              color: '#1d4ed8',
              fillColor: '#3b82f6',
              fillOpacity: 0.35,
              weight: 3,
            }}
          >
            <Popup>
              <strong>Tu ubicación</strong>
            </Popup>
          </CircleMarker>
        )}

        {withCoords.map((s) => {
          const lat = Number(s.lat)
          const lng = Number(s.lng)
          const hi = highlightedId === s.id
          return (
            <CircleMarker
              key={s.id}
              center={[lat, lng]}
              radius={hi ? 14 : 9}
              pathOptions={{
                color: hi ? T.accentDk : T.accent,
                fillColor: T.accent,
                fillOpacity: hi ? 0.45 : 0.3,
                weight: hi ? 4 : 2,
              }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.name}</div>
                  {s.address ? (
                    <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>{s.address}</div>
                  ) : null}
                  {typeof s.inAdoptionCount === 'number' ? (
                    <div style={{ fontSize: 12, marginBottom: 8 }}>
                      {s.inAdoptionCount} en adopción
                    </div>
                  ) : null}
                  <Link
                    to={`/refugio/${s.slug}`}
                    style={{
                      display: 'inline-block',
                      fontSize: 12,
                      fontWeight: 800,
                      color: T.accent,
                    }}
                  >
                    Ver refugio →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

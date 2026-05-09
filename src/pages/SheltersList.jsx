import { useMemo, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Building, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react'
import { useT, RS } from '../theme'
import { Card, ShelterCardSkeleton } from '../components/ui'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { DEFAULT_WHATSAPP_ADMIN } from '../lib/constants'
import { getWhatsAppLink } from '../utils'
import { I } from '../components/ui/Icons'
import LocationInput from '../components/shared/LocationInput'
import { getDistanceKm } from '../utils/geo'
import { useToast } from '../context/ToastContext'

const SheltersMap = lazy(() => import('../components/shelters/SheltersMap'))

const PAGE_SIZE = 10

const RADIUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
]

function hasValidCoords(s) {
  const la = Number(s.lat)
  const ln = Number(s.lng)
  return Number.isFinite(la) && Number.isFinite(ln)
}

export default function SheltersList() {
  const T = useT()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [nameQuery, setNameQuery] = useState('')
  const [filterLocationValue, setFilterLocationValue] = useState(null)
  const [userPin, setUserPin] = useState(null)
  const [radiusKm, setRadiusKm] = useState('all')
  const [highlightedId, setHighlightedId] = useState(null)

  const { items, loading, error } = useSheltersPublic({
    page: 1,
    pageSize: PAGE_SIZE,
    fetchAll: true,
  })

  /** Punto de referencia para ordenar / filtrar por distancia */
  const geoAnchor = userPin ||
    (filterLocationValue ? { lat: filterLocationValue.lat, lng: filterLocationValue.lng } : null)

  const filteredShelters = useMemo(() => {
    let list = [...(items || [])]
    const qq = nameQuery.trim().toLowerCase()
    if (qq) {
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(qq) ||
          (s.city || '').toLowerCase().includes(qq) ||
          (s.slug || '').toLowerCase().includes(qq) ||
          (s.address || '').toLowerCase().includes(qq)
      )
    }

    const anchor = geoAnchor
    const withCoords = []
    const withoutCoords = []

    for (const s of list) {
      if (!hasValidCoords(s)) {
        withoutCoords.push(s)
        continue
      }
      const la = Number(s.lat)
      const ln = Number(s.lng)
      const d = anchor ? getDistanceKm(anchor.lat, anchor.lng, la, ln) : null
      if (anchor && radiusKm !== 'all' && d != null && d > radiusKm) continue
      withCoords.push({ ...s, _d: d })
    }

    if (anchor) {
      withCoords.sort((a, b) => (a._d ?? 0) - (b._d ?? 0))
    } else {
      withCoords.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    }
    withoutCoords.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
    return [...withCoords, ...withoutCoords]
  }, [items, nameQuery, geoAnchor, radiusKm])

  const mapMarkersPayload = useMemo(
    () =>
      filteredShelters.filter(hasValidCoords).map((s) => {
        const config = Array.isArray(s.shelter_config) ? s.shelter_config[0] : s.shelter_config
        const inAdoptionCount = (s.pets || []).filter(
          (p) => (p.adoption_status || '').toLowerCase() !== 'adopted'
        ).length
        return {
          id: s.id,
          name: s.name,
          address: (s.address && String(s.address).trim()) || [s.city, config?.province].filter(Boolean).join(', '),
          lat: s.lat,
          lng: s.lng,
          slug: s.slug,
          logoUrl: config?.shelter_image_url || null,
          inAdoptionCount,
        }
      }),
    [filteredShelters]
  )

  const pages = Math.max(1, Math.ceil(filteredShelters.length / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE
    return filteredShelters.slice(from, from + PAGE_SIZE)
  }, [filteredShelters, page])

  const onFilterLocationChange = (loc) => {
    setFilterLocationValue(loc)
    if (loc) {
      setUserPin(null)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.push({
        type: 'warn',
        title: 'Ubicación',
        message: 'Tu navegador no permite obtener la ubicación.',
      })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPin(p)
        setFilterLocationValue(null)
      },
      () => {
        toast.push({
          type: 'info',
          title: 'Ubicación',
          message: 'No pudimos acceder a tu ubicación. Revisá los permisos del navegador.',
        })
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    )
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: T.txt,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Building size={24} /> Refugios
      </h1>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
        Conocé refugios y ayudá con adopciones, donaciones o voluntariado.
      </p>

      <Card style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
              Filtrar por nombre / ciudad
            </div>
            <input
              value={nameQuery}
              onChange={(e) => {
                setNameQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Ej: CASA, Rosario..."
            />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>Ubicación en el mapa</div>
            <LocationInput value={filterLocationValue} onChange={onFilterLocationChange} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn-press"
                onClick={useMyLocation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: RS,
                  border: `1.5px solid ${T.borderLt}`,
                  background: T.bg,
                  fontWeight: 800,
                  fontSize: 13,
                  color: T.txt,
                  cursor: 'pointer',
                }}
              >
                <Crosshair size={16} /> Usar mi ubicación
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: T.muted }}>
                Radio
                <select
                  value={radiusKm}
                  onChange={(e) => {
                    const v = e.target.value
                    setRadiusKm(v === 'all' ? 'all' : Number(v))
                    setPage(1)
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: RS,
                    border: `1.5px solid ${T.borderLt}`,
                    background: T.card,
                    color: T.txt,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {RADIUS_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {radiusKm !== 'all' && !geoAnchor && (
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
                Elegí una ciudad o usá tu ubicación para filtrar por distancia.
              </div>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Card style={{ padding: 14, marginBottom: 12, background: T.dangerLt, border: `1px solid ${T.danger}20` }}>
          <div style={{ color: T.danger, fontWeight: 700, fontSize: 13 }}>{error}</div>
        </Card>
      )}

      <style>{`
        .shelters-map-layout { display: flex; flex-direction: column; gap: 16px; }
        @media (min-width: 900px) {
          .shelters-map-layout { flex-direction: row; align-items: flex-start; }
          .shelters-map-layout__list { flex: 0 0 30%; max-width: 30%; min-width: 260px; }
          .shelters-map-layout__map {
            flex: 1; min-width: 0; width: 100%; min-height: 420px;
            position: sticky; top: 72px;
            height: calc(100vh - 72px);
            max-height: 900px;
          }
        }
      `}</style>

      <div className="shelters-map-layout">
        <div className="shelters-map-layout__list">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <ShelterCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div
              className="desktop-cards-grid desktop-cards-grid--fixed"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {pages > 1 && (
                <Card style={{ padding: '8px 16px', marginBottom: 4, border: `1.5px solid ${T.borderLt}` }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
                      Página {page} / {pages} · {filteredShelters.length} refugios
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        background: T.bg,
                        borderRadius: 10,
                        padding: 2,
                        border: `1.5px solid ${T.borderLt}`,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-press"
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1))
                          window.scrollTo(0, 0)
                        }}
                        disabled={page <= 1}
                        style={{
                          padding: '8px 10px',
                          border: 'none',
                          background: 'transparent',
                          cursor: page <= 1 ? 'not-allowed' : 'pointer',
                          opacity: page <= 1 ? 0.5 : 1,
                          color: T.txt,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn-press"
                        onClick={() => {
                          setPage((p) => Math.min(pages, p + 1))
                          window.scrollTo(0, 0)
                        }}
                        disabled={page >= pages}
                        style={{
                          padding: '8px 10px',
                          border: 'none',
                          background: 'transparent',
                          cursor: page >= pages ? 'not-allowed' : 'pointer',
                          opacity: page >= pages ? 0.5 : 1,
                          color: T.txt,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              )}
              {pageItems.map((s, i) => {
                const config = Array.isArray(s.shelter_config) ? s.shelter_config[0] : s.shelter_config
                const img = config?.shelter_image_url || null
                const noMap = !hasValidCoords(s)
                const locationLabel =
                  (s.address && s.address.trim()) || [s.city, config?.province].filter(Boolean).join(', ') || '—'
                const volCount = s.volunteer_subscriptions?.[0]?.count ?? 0
                const inAdoptionCount = (s.pets || []).filter(
                  (p) => (p.adoption_status || '').toLowerCase() !== 'adopted'
                ).length
                const mediaH = 140

                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHighlightedId(s.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                  >
                    <Link to={`/refugio/${s.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <Card
                        interactive
                        className={`anim d${(i % 4) + 1}`}
                        style={{ overflow: 'hidden', padding: 0, marginBottom: 12 }}
                      >
                        <div style={{ position: 'relative', height: mediaH, overflow: 'hidden', background: T.accentLt }}>
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: T.sage,
                              zIndex: 0,
                              pointerEvents: 'none',
                            }}
                          >
                            {I.Paw(44)}
                          </div>
                          {img && (
                            <img
                              src={img}
                              alt={s.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 1,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              zIndex: 2,
                              background:
                                'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              zIndex: 4,
                              background: '#fff',
                              borderRadius: 20,
                              padding: '5px 11px',
                              fontSize: 10,
                              color: T.txt,
                              fontWeight: 800,
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            Ver refugio →
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, padding: '10px' }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: '#fff',
                                fontSize: 15,
                                lineHeight: 1.2,
                                marginBottom: 4,
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                              }}
                            >
                              {s.name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.92)',
                                flexWrap: 'wrap',
                              }}
                            >
                              <MapPin size={12} /> {locationLabel}
                              {noMap && (
                                <span
                                  style={{
                                    marginLeft: 4,
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.2)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                >
                                  Ubicación no disponible
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                                marginTop: 6,
                                background: 'rgba(255,255,255,0.16)',
                                backdropFilter: 'blur(6px)',
                                borderRadius: 20,
                                padding: '4px 10px',
                                fontSize: 10,
                                color: '#fff',
                                fontWeight: 600,
                                lineHeight: 1.35,
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {I.Users(11)} {volCount} voluntario{volCount !== 1 ? 's' : ''}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                · {I.Dog(11)} {inAdoptionCount} en adopción
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )
              })}

              {pageItems.length === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>
                    {nameQuery.trim() || geoAnchor ? 'No hay resultados con estos filtros.' : 'Todavía no hay refugios publicados.'}
                  </div>
                </Card>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              gap: 10,
            }}
          >
            <button
              type="button"
              className="btn-press"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: `1.5px solid ${T.borderLt}`,
                background: page <= 1 ? T.borderLt : T.bg,
                color: page <= 1 ? T.muted : T.txt,
                fontWeight: 800,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                minWidth: 108,
              }}
            >
              Anterior
            </button>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
              Página {page} / {pages}
            </div>
            <button
              type="button"
              className="btn-press"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: `1.5px solid ${T.borderLt}`,
                background: page >= pages ? T.borderLt : T.bg,
                color: page >= pages ? T.muted : T.txt,
                fontWeight: 800,
                cursor: page >= pages ? 'not-allowed' : 'pointer',
                minWidth: 108,
              }}
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="shelters-map-layout__map">
          <Suspense
            fallback={
              <div
                style={{
                  height: 420,
                  borderRadius: RS,
                  background: T.borderLt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: T.muted,
                  fontWeight: 700,
                }}
              >
                Cargando mapa…
              </div>
            }
          >
            <SheltersMap
              shelters={mapMarkersPayload}
              userLocation={userPin}
              focusCenter={!userPin && filterLocationValue ? filterLocationValue : null}
              highlightedId={highlightedId}
            />
          </Suspense>
        </div>
      </div>

      <a
        href={
          getWhatsAppLink(
            DEFAULT_WHATSAPP_ADMIN,
            'Hola! Tengo un refugio y me gustaría sumarlo a la app Perritos y Refugios.'
          ) || '#'
        }
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}
      >
        <Card style={{ padding: '20px 18px', border: `1.5px solid ${T.border}` }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: T.txt, marginBottom: 6 }}>¿Tenés un refugio?</div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>
            Sumá tu refugio a la app y llegá a más personas que quieren adoptar, donar o ser voluntarios.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: `1px solid ${T.borderLt}`,
            }}
          >
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Es gratis y sin compromiso.</div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 14px',
                borderRadius: 50,
                background: T.accent,
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              Escribinos →
            </div>
          </div>
        </Card>
      </a>
    </div>
  )
}

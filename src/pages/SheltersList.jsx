import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Building, ChevronLeft, ChevronRight } from 'lucide-react'
import { useT, RS } from '../theme'
import { Card, Btn, Skeleton } from '../components/ui'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { useUserLocation } from '../hooks/useUserLocation'
import { haversineKm } from '../utils'
import { DEFAULT_WHATSAPP_ADMIN } from '../lib/constants'
import { I } from '../components/ui/Icons'

const PAGE_SIZE = 10

export default function SheltersList() {
  const T = useT()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [useLocation, setUseLocation] = useState(false)
  const loc = useUserLocation()

  const { items, total, loading, error } = useSheltersPublic({
    page,
    pageSize: PAGE_SIZE,
    fetchAll: useLocation || !!q.trim(),
  })

  const processed = useMemo(() => {
    let list = items
    const qq = q.trim().toLowerCase()
    if (qq) {
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(qq) ||
        (s.city || '').toLowerCase().includes(qq) ||
        (s.slug || '').toLowerCase().includes(qq)
      )
    }
    if (useLocation && loc.coords) {
      const { lat, lng } = loc.coords
      const withDist = list.map(s => {
        const has = Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))
        return {
          ...s,
          _distKm: has ? haversineKm(lat, lng, Number(s.lat), Number(s.lng)) : null,
        }
      })
      withDist.sort((a, b) => {
        if (a._distKm == null && b._distKm == null) return 0
        if (a._distKm == null) return 1
        if (b._distKm == null) return -1
        return a._distKm - b._distKm
      })
      list = withDist
    }
    return list
  }, [items, q, useLocation, loc.coords])

  const pages = useMemo(() => {
    const base = (useLocation || q.trim()) ? processed.length : (total || 0)
    return Math.max(1, Math.ceil(base / PAGE_SIZE))
  }, [processed.length, total, useLocation, q])

  const pageItems = useMemo(() => {
    if (useLocation || q.trim()) {
      const from = (page - 1) * PAGE_SIZE
      return processed.slice(from, from + PAGE_SIZE)
    }
    return processed
  }, [processed, page, useLocation, q])

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Building size={24} /> Refugios</h1>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
        Conocé refugios y ayudá con adopciones, donaciones o voluntariado.
      </p>

      {/* Filters */}
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>Filtrar por nombre / ciudad</div>
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Ej: Capilla, Pilar, CASA..." />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn
              v={useLocation ? 'success' : 'secondary'}
              onClick={() => {
                if (!useLocation) {
                  setUseLocation(true)
                  loc.request()
                } else {
                  setUseLocation(false)
                  loc.clear()
                }
                setPage(1)
              }}
            >
              {useLocation ? <><MapPin size={14} /> Ubicación activa</> : <><MapPin size={14} /> Usar mi ubicación</>}
            </Btn>
            {useLocation && !loc.coords && !loc.loading && (
              <Btn v="secondary" onClick={loc.request}>Reintentar</Btn>
            )}
            {useLocation && loc.loading && (
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, alignSelf: 'center' }}>
                Obteniendo ubicación...
              </div>
            )}
          </div>

          {useLocation && loc.error && (
            <div style={{
              padding: '10px 12px', borderRadius: RS,
              background: T.dangerLt, color: T.danger,
              fontSize: 12, fontWeight: 700,
            }}>
              {loc.error}
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Card style={{ padding: 14, marginBottom: 12, background: T.dangerLt, border: `1px solid ${T.danger}20` }}>
          <div style={{ color: T.danger, fontWeight: 700, fontSize: 13 }}>{error}</div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} height={140} style={{ borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <div className="desktop-cards-grid desktop-cards-grid--fixed" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pages > 1 && (
            <Card style={{ padding: '8px 16px', marginBottom: 12, border: `1.5px solid ${T.borderLt}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
                  Página {page} / {pages}
                </span>
                <div style={{ display: 'flex', background: T.bg, borderRadius: 10, padding: 2, border: `1.5px solid ${T.borderLt}` }}>
                  <button
                    type="button"
                    className="btn-press"
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0,0); }}
                    disabled={page <= 1}
                    style={{
                      padding: '8px 10px', border: 'none', background: 'transparent',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      opacity: page <= 1 ? 0.5 : 1, color: T.txt, borderRadius: 8,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-press"
                    onClick={() => { setPage(p => Math.min(pages, p + 1)); window.scrollTo(0,0); }}
                    disabled={page >= pages}
                    style={{
                      padding: '8px 10px', border: 'none', background: 'transparent',
                      cursor: page >= pages ? 'not-allowed' : 'pointer',
                      opacity: page >= pages ? 0.5 : 1, color: T.txt, borderRadius: 8,
                      display: 'flex', alignItems: 'center',
                    }}
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
            const locationLabel = [s.city, config?.province].filter(Boolean).join(', ') || '—'
            const volCount = s.volunteer_subscriptions?.[0]?.count ?? 0
            const inAdoptionCount = (s.pets || []).filter(p => p.adoption_status !== 'adopted').length
            const rescuedCount = 120 // Fixed as requested
            
            return (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none' }}>
                <Card interactive className={`anim d${(i % 4) + 1}`} style={{ overflow: 'hidden', padding: 0, marginBottom: 12 }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: T.accentLt }}>
                    {img && (
                      <img src={img} alt={s.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: img
                        ? 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)',
                    }} />
                    {/* Text */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px 12px' }}>
                      <div style={{ fontWeight: 900, color: '#fff', fontSize: 16, lineHeight: 1.2, marginBottom: 4, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                        {s.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                        <MapPin size={12} /> {locationLabel}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                          borderRadius: 20, padding: '3px 8px',
                          fontSize: 11, color: '#fff', fontWeight: 600,
                        }}>
                          {I.Users(12)} {volCount} voluntario{volCount !== 1 ? 's' : ''}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                          borderRadius: 20, padding: '3px 8px',
                          fontSize: 11, color: '#fff', fontWeight: 600,
                        }}>
                          {I.Dog(12)} {inAdoptionCount} en adopción
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                          borderRadius: 20, padding: '3px 8px',
                          fontSize: 11, color: '#fff', fontWeight: 600,
                        }}>
                          {I.Heart(12)} +{rescuedCount} rescatados
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          marginLeft: 'auto',
                          background: '#fff', borderRadius: 20, padding: '5px 12px',
                          fontSize: 11, color: T.txt, fontWeight: 800, flexShrink: 0,
                        }}>
                          Ver refugio →
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}

          {pageItems.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: T.muted }}>{q.trim() ? 'No hay resultados.' : 'Todavía no hay refugios publicados.'}</div>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, gap: 10,
      }}>
        <Btn v="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
          ← Anterior
        </Btn>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
          Página {page} / {pages}
        </div>
        <Btn v="secondary" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>
          Siguiente →
        </Btn>
      </div>

      {/* CTA sumar refugio */}
      <a
        href={`https://wa.me/${DEFAULT_WHATSAPP_ADMIN}?text=Hola%21+Tengo+un+refugio+y+me+gustar%C3%ADa+sumarlo+a+la+app+Perritos+y+Refugios.`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}
      >
        <Card style={{ padding: '20px 18px', border: `1.5px solid ${T.border}` }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: T.txt, marginBottom: 6 }}>
            ¿Tenés un refugio?
          </div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>
            Sumá tu refugio a la app y llegá a más personas que quieren adoptar, donar o ser voluntarios.
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 14, borderTop: `1px solid ${T.borderLt}`,
          }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
              Es gratis y sin compromiso.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '8px 14px', borderRadius: 50,
              background: T.accent, color: '#fff',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              Escribinos →
            </div>
          </div>
        </Card>
      </a>
    </div>
  )
}


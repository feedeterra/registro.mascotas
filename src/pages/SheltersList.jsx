import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { Card, Btn, Skeleton } from '../components/ui'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { useUserLocation } from '../hooks/useUserLocation'
import { haversineKm } from '../utils'

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
      <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 6 }}>🏘️ Refugios</h1>
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
              {useLocation ? '📍 Ubicación activa' : '📍 Usar mi ubicación'}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Card key={i} style={{ padding: 16 }}>
              <Skeleton width="55%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={12} />
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pageItems.map((s, i) => (
            <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none' }}>
              <Card interactive className={`anim d${(i % 4) + 1}`} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: T.purpleLt, color: T.purple,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, flexShrink: 0,
                  }}>
                    🏠
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: T.txt, fontSize: 14, lineHeight: 1.2 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                      📍 {s.city || '—'}
                      {useLocation && s._distKm != null && (
                        <span style={{ marginLeft: 8, color: T.purple, fontWeight: 800 }}>
                          · {s._distKm < 10 ? s._distKm.toFixed(1) : Math.round(s._distKm)} km
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 10px', borderRadius: RS,
                    background: T.accentLt, color: T.accent,
                    fontSize: 12, fontWeight: 800,
                  }}>
                    Ver →
                  </div>
                </div>
              </Card>
            </Link>
          ))}

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

      {/* Quick CTA */}
      <div style={{ marginTop: 16, borderRadius: R, overflow: 'hidden' }}>
        <Link to="/refugio/casa" style={{ textDecoration: 'none' }}>
          <Card interactive style={{ padding: 16, textAlign: 'center', background: `linear-gradient(135deg, ${T.accentLt}, ${T.purpleLt})` }}>
            <div style={{ fontWeight: 900, color: T.txt }}>💜 ¿Querés conocer el refugio?</div>
            <div style={{ marginTop: 4, fontSize: 12, color: T.muted }}>Entrá al detalle y mirá cómo ayudar.</div>
          </Card>
        </Link>
      </div>
    </div>
  )
}


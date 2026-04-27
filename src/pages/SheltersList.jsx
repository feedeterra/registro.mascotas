import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Building } from 'lucide-react'
import { useT } from '../theme'
import { Card, Btn, Skeleton } from '../components/ui'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { DEFAULT_WHATSAPP } from '../lib/constants'

const PAGE_SIZE = 10

export default function SheltersList() {
  const T = useT()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const { items, total, loading, error } = useSheltersPublic({
    page,
    pageSize: PAGE_SIZE,
    fetchAll: !!q.trim(),
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
    return list
  }, [items, q])

  const pages = useMemo(() => {
    const base = q.trim() ? processed.length : (total || 0)
    return Math.max(1, Math.ceil(base / PAGE_SIZE))
  }, [processed.length, total, q])

  const pageItems = useMemo(() => {
    if (q.trim()) {
      const from = (page - 1) * PAGE_SIZE
      return processed.slice(from, from + PAGE_SIZE)
    }
    return processed
  }, [processed, page, q])

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pageItems.map((s, i) => {
            const img = s.shelter_config?.shelter_image_url
            const petsCount = s.pets?.[0]?.count ?? null
            return (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none' }}>
                <div className={`anim d${(i % 4) + 1}`} style={{
                  position: 'relative', borderRadius: 16, overflow: 'hidden',
                  height: 140, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                }}>
                  {img && (
                    <img src={img} alt={s.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {/* Gradient overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
                  {/* Text */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, lineHeight: 1.2, marginBottom: 4, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {s.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                          borderRadius: 20, padding: '3px 8px',
                          fontSize: 11, color: '#fff', fontWeight: 600,
                        }}>
                          <MapPin size={10} /> {s.city || '—'}
                        </div>
                        {petsCount !== null && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                            borderRadius: 20, padding: '3px 8px',
                            fontSize: 11, color: '#fff', fontWeight: 600,
                          }}>
                            🐾 {petsCount}
                          </div>
                        )}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: '#fff', borderRadius: 20, padding: '5px 12px',
                        fontSize: 12, color: T.txt, fontWeight: 800, flexShrink: 0,
                      }}>
                        Ver refugio →
                      </div>
                    </div>
                  </div>
                </div>
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
        href={`https://wa.me/${DEFAULT_WHATSAPP}?text=Hola%21+Tengo+un+refugio+y+me+gustar%C3%ADa+sumarlo+a+la+app+Perritos+y+Refugios.`}
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


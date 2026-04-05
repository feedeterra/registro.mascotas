import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePets } from '../hooks/usePets'
import { fuzzyMatch, waitingMessage, sizeLabel, sexLabel } from '../utils'
import { Card, Badge, SponsorZone, Skeleton } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'

import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'
const WHATSAPP = DEFAULT_WHATSAPP
const DONATION_LINK = DEFAULT_DONATION_LINK

export default function Adopt() {
  const T = useT()
  const navigate = useNavigate()
  const { pets, loading } = usePets()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const lastInteraction = useRef(0)

  const adoptablePets = useMemo(() => {
    let filtered = pets.filter(p => p.type === 'stray')
    if (filter === 'urgent') filtered = filtered.filter(p => p.adoptionStatus === 'urgent')
    else if (filter === 'shelter') filtered = filtered.filter(p => p.adoptionStatus === 'shelter')
    else if (filter === 'transit') filtered = filtered.filter(p => p.adoptionStatus === 'transit')
    if (search.trim()) {
      filtered = filtered.filter(p =>
        fuzzyMatch(search, p.name) || fuzzyMatch(search, p.breed) ||
        fuzzyMatch(search, p.color) || fuzzyMatch(search, sizeLabel(p.size)) ||
        fuzzyMatch(search, sexLabel(p.sex))
      )
    }
    return filtered.sort((a, b) => {
      if (a.adoptionStatus === 'urgent' && b.adoptionStatus !== 'urgent') return -1
      if (b.adoptionStatus === 'urgent' && a.adoptionStatus !== 'urgent') return 1
      return 0
    })
  }, [pets, filter, search])

  const featured = useMemo(() =>
    pets.filter(d => d.type === 'stray')
      .sort((a, b) => {
        if (a.adoptionStatus === 'urgent' && b.adoptionStatus !== 'urgent') return -1
        if (b.adoptionStatus === 'urgent' && a.adoptionStatus !== 'urgent') return 1
        return new Date(a.createdAt) - new Date(b.createdAt)
      }),
    [pets]
  )

  // Auto-advance carousel
  useEffect(() => {
    if (featured.length <= 1) return
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 10000) {
        setCarouselIdx(i => i + 1)
        setNotesExpanded(false)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [featured.length])

  const curr = featured.length > 0 ? featured[carouselIdx % featured.length] : null

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'urgent', label: '🚨 Urgentes' },
    { key: 'shelter', label: '🏥 En refugio' },
    { key: 'transit', label: '🏠 En transito' },
  ]

  const handleSwipeStart = (e) => { setTouchStart(e.touches[0].clientX); lastInteraction.current = Date.now() }
  const handleSwipeEnd = (e) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 30) {
      lastInteraction.current = Date.now()
      if (diff > 0) { setCarouselIdx(i => i + 1); setNotesExpanded(false) }
      else if (carouselIdx > 0) { setCarouselIdx(i => i - 1); setNotesExpanded(false) }
    }
    setTouchStart(null)
  }

  const handleCarouselNext = () => {
    lastInteraction.current = Date.now()
    setCarouselIdx(carouselIdx + 1)
    setNotesExpanded(false)
  }

  const getDaysWaiting = (createdAt) => {
    if (!createdAt) return 0
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  }

  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>

      {/* Header */}
      <div className="anim" style={{ textAlign: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt }}>
          🐾 Perritos en adopcion
        </h1>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
          Cada uno fue rescatado de la calle. Elegí al que mas te llame y cambia su vida.
        </p>
      </div>

      {/* ═══ Carousel grande ═══ */}
      {curr && (
        <div className="anim d1" style={{ marginBottom: 20 }}>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
            {featured.slice(0, Math.min(featured.length, 10)).map((_, i) => (
              <div
                key={i}
                onClick={() => { setCarouselIdx(i); lastInteraction.current = Date.now(); setNotesExpanded(false) }}
                style={{
                  width: carouselIdx % featured.length === i ? 18 : 6,
                  height: 6, borderRadius: 3, cursor: 'pointer',
                  background: carouselIdx % featured.length === i ? T.accent : T.border,
                  transition: 'all .3s',
                }}
              />
            ))}
          </div>

          <div key={carouselIdx} className="anim">
            <Card
              style={{
                overflow: 'hidden', borderRadius: 20,
                border: `2px solid ${curr.adoptionStatus === 'urgent' ? T.urgent : T.purple}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
              onTouchStart={handleSwipeStart}
              onTouchEnd={handleSwipeEnd}
            >
              {/* Photo */}
              <div style={{ position: 'relative' }}>
                {(() => {
                  const photo = curr.photos?.[curr.primaryPhotoIdx ?? 0] || curr.photo
                  return photo
                    ? <img src={photo} alt={curr.name} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block', maxHeight: 400 }} fetchpriority="high" />
                    : <div style={{ width: '100%', aspectRatio: '4/5', maxHeight: 400, background: T.purpleLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}>{I.Dog(80)}</div>
                })()}

                {/* Badges */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                  <span style={{
                    background: curr.adoptionStatus === 'urgent' ? T.urgent : T.purple,
                    color: '#fff', padding: '5px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}>
                    {curr.adoptionStatus === 'urgent' ? '🚨 URGENTE' : curr.adoptionStatus === 'transit' ? '🏠 EN TRANSITO' : '🏥 EN REFUGIO'}
                  </span>
                </div>

                {/* Days waiting badge */}
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <span style={{
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    padding: '5px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                  }}>
                    ⏳ Esperando hace {getDaysWaiting(curr.createdAt)} dias
                  </span>
                </div>

                {/* Name overlay */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                  padding: '60px 20px 16px', color: '#fff',
                }}>
                  <h3 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{curr.name}</h3>
                  <p style={{ fontSize: 14, opacity: .95, margin: '4px 0 0', fontWeight: 500 }}>
                    {[curr.breed, sexLabel(curr.sex), sizeLabel(curr.size)].filter(Boolean).join(' · ')}
                  </p>
                  {curr.neighborhood && (
                    <p style={{ fontSize: 13, opacity: .8, margin: '2px 0 0' }}>📍 {curr.neighborhood}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {curr.notes && (
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.borderLt}` }}>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                    {notesExpanded || curr.notes.length <= 120
                      ? curr.notes
                      : curr.notes.slice(0, 120) + '...'}
                    {curr.notes.length > 120 && (
                      <button
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4 }}
                      >
                        {notesExpanded ? 'Ver menos' : 'Ver mas'}
                      </button>
                    )}
                  </p>
                </div>
              )}

              {/* Primary actions - Siguiente + Conocer */}
              <div style={{ padding: '12px 14px 0', display: 'flex', gap: 10, background: T.bg }}>
                <button
                  className="btn-press"
                  onClick={handleCarouselNext}
                  style={{
                    flex: '0 0 auto', padding: '12px 18px', borderRadius: 14,
                    border: `2px solid ${T.border}`, background: 'transparent',
                    color: T.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  Siguiente →
                </button>
                <button
                  className="btn-press"
                  onClick={() => navigate(`/perro/${curr.id}`)}
                  style={{
                    flex: 1, padding: 12, borderRadius: 14,
                    border: 'none',
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                    color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: `0 6px 16px ${T.accent}40`,
                  }}
                >
                  💜 Conoce a {curr.name || 'este perrito'}
                </button>
              </div>

              {/* Secondary actions - Apadrinar + Donar un plato */}
              <div style={{
                padding: '10px 14px 14px', display: 'flex', gap: 10, background: T.bg,
              }}>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola! Quiero apadrinar a ${curr.name} del refugio.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-press"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '10px 8px',
                    background: 'linear-gradient(135deg, #f5e6c8, #e8d5a8)',
                    color: '#8a6d3b', borderRadius: 12, fontWeight: 700, fontSize: 12,
                    textDecoration: 'none', border: '1px solid #e8d5a8',
                  }}
                >
                  💛 Apadrinar
                </a>
                <a
                  href={DONATION_LINK}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-press"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '10px 8px',
                    background: T.okLt, color: T.ok,
                    borderRadius: 12, fontWeight: 700, fontSize: 12,
                    textDecoration: 'none', border: `1px solid ${T.ok}30`,
                  }}
                >
                  🍽️ Donar un plato de comida
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ Sponsor ═══ */}
      <SponsorZone tier="gold" style={{ marginBottom: 16 }} />

      {/* ═══ Search & Filters ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>
          Todos los perritos
        </h2>
        {!loading && (
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
            {adoptablePets.length} esperando
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>
          {I.Search()}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, raza, color..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div style={{
        display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto',
        paddingBottom: 4, WebkitOverflowScrolling: 'touch',
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            className="btn-press"
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px', borderRadius: 20,
              border: filter === f.key ? `2px solid ${T.accent}` : `1.5px solid ${T.border}`,
              background: filter === f.key ? T.accentLt : 'transparent',
              color: filter === f.key ? T.accent : T.muted,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all .2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ═══ Pet Grid ═══ */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {[0,1,2,3].map(i => (
            <Card key={i} style={{ overflow: 'hidden' }}>
              <Skeleton height={0} style={{ paddingBottom: '100%' }} radius={0} />
              <div style={{ padding: '10px 12px' }}>
                <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="50%" height={12} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {adoptablePets.map((pet, i) => (
            <PetCard key={pet.id} pet={pet} delay={i % 4} />
          ))}
        </div>
      )}

      <SponsorZone tier="standard" style={{ marginTop: 16 }} />

      {!loading && adoptablePets.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <p style={{ color: T.muted, fontWeight: 600, marginBottom: 12 }}>
            {search ? 'No encontramos perritos con esa busqueda.' : 'No hay perritos en esta categoria.'}
          </p>
          {search && (
            <button
              className="btn-press"
              onClick={() => { setSearch(''); setFilter('all') }}
              style={{
                background: T.accentLt, color: T.accent, border: 'none',
                borderRadius: RS, padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Ver todos los perritos
            </button>
          )}
        </Card>
      )}
    </div>
  )
}

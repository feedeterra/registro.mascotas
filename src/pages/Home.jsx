import { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, R } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { getPetPhoto } from '../utils'
import { Card, Skeleton, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { supabase } from '../lib/supabase'

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(ease * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return val
}

function StatPill({ icon, value, label }) {
  const T = useT()
  const count = useCountUp(value ?? 0, 1200)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '12px 4px' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: T.borderLt, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: T.muted, marginBottom: 6,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 18, fontWeight: 900, color: T.txt, lineHeight: 1 }}>
        {value == null ? '—' : count}
      </span>
      <span style={{ fontSize: 10, color: T.muted, marginTop: 3, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

export default function Home() {
  const T = useT()
  const navigate = useNavigate()
  const { pets, loading } = usePets()
  const { items: shelters } = useSheltersPublic({ page: 1, pageSize: 6 })

  const [globalStats, setGlobalStats] = useState({ volunteers: null, shelters: null, adopted: null, perShelterVolunteers: {} })
  useEffect(() => {
    Promise.all([
      supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('adoption_status', 'adopted'),
      supabase.from('volunteer_subscriptions').select('shelter_id'),
    ]).then(([volRes, shRes, adoptedRes, subsRes]) => {
      const counts = {}
      subsRes.data?.forEach(s => {
        counts[s.shelter_id] = (counts[s.shelter_id] || 0) + 1
      })
      setGlobalStats({
        volunteers: volRes.count ?? 0,
        shelters: shRes.count ?? 0,
        adopted: adoptedRes.count ?? 0,
        perShelterVolunteers: counts,
      })
    })
  }, [])

  const totalAdoptable = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted').length

  const recentPets = useMemo(() =>
    pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4),
    [pets]
  )

  const urgentPets = useMemo(() =>
    pets.filter(p => p.type === 'stray' && p.adoptionStatus === 'urgent').slice(0, 6),
    [pets]
  )

  const successStories = useMemo(() =>
    pets.filter(p => p.adoption_status === 'adopted' || p.adoptionStatus === 'adopted').slice(0, 6)
      .map(p => {
        const photos = Array.isArray(p.photos) ? p.photos : []
        return {
          id: p.id, petName: p.name,
          photoAfter: photos[photos.length - 1] || photos[0],
          quote: p.adopter_quote || p.adopterQuote || null,
        }
      }),
    [pets]
  )

  const getDaysWaiting = (createdAt) => {
    if (!createdAt) return 0
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 80 }}>

      {/* ══ HERO — plataforma, no un refugio específico ══ */}
      <div className="anim" style={{
        borderRadius: R, marginTop: 8, padding: '28px 20px 22px',
        background: T.card, border: `1px solid ${T.borderLt}`, boxShadow: T.shadow,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: T.accentLt, opacity: 0.6, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: T.sagePale, opacity: 0.7, pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: T.txt, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 10 }}>
            La red de refugios de tu comunidad.{' '}
            <span style={{ color: T.accent }}>♡</span>
          </h1>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
            Encontrá tu compañero ideal, apoyá un refugio cercano o sumate como voluntario.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-press"
              onClick={() => navigate('/adoptar')}
              style={{
                flex: 1, padding: '13px 16px',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: '#fff', borderRadius: 14, border: 'none',
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: `0 4px 20px ${T.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {I.Dog(16)} Ver perros
            </button>
            <button
              className="btn-press"
              onClick={() => navigate('/refugios')}
              style={{
                flex: 1, padding: '13px 16px',
                background: 'transparent', color: T.txt,
                border: `1.5px solid ${T.border}`, borderRadius: 14,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {I.Building()} Refugios
            </button>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 16, fontSize: 12, color: T.sage, fontWeight: 700,
            background: T.sageLt, borderRadius: 20, padding: '5px 12px',
          }}>
            {I.Check()} Red verificada · sin fines de lucro
          </div>
        </div>
      </div>

      {/* ══ STATS GLOBALES ══ */}
      <div className="anim d1" style={{
        display: 'flex', marginTop: 12,
        background: T.card, borderRadius: R,
        border: `1px solid ${T.borderLt}`, boxShadow: T.shadow,
        padding: '6px 4px',
      }}>
        <StatPill icon={I.Paw(18)} value={totalAdoptable} label="En adopción" />
        <StatPill icon={I.Home()} value={globalStats.adopted} label="Adoptados" />
        <StatPill icon={<UserGroupIcon />} value={globalStats.volunteers} label="Voluntarios" />
        <StatPill icon={I.Building()} value={globalStats.shelters} label="Refugios" />
      </div>

      {/* ══ SPONSOR — alta visibilidad ══ */}
      <SponsorZone tier="gold" style={{ marginTop: 14 }} />

      {/* ══ REFUGIOS ACTIVOS ══ */}
      {shelters?.length > 0 && (
        <div className="anim d1" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: T.txt }}>Refugios activos</h2>
            <Link to="/refugios" style={{ fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {shelters.map(s => {
              const cover = s.cover_photo || `https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400`
              const volCount = globalStats.perShelterVolunteers?.[s.id] || 0
              return (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none' }}>
                <Card interactive style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                    <img src={cover} alt={s.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                    }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 10px' }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>{s.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                        {I.Loc()} {s.city || '—'}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                        borderRadius: 20, padding: '3px 8px',
                        fontSize: 10, fontWeight: 700, color: '#fff',
                      }}>
                        {I.Users(12)} {volCount} voluntario{volCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ PERROS DISPONIBLES (de toda la red) ══ */}
      <div className="anim d2" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: T.txt }}>Perros disponibles</h2>
          <Link to="/adoptar" style={{ fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
            Ver todos →
          </Link>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recentPets.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} delay={i % 4} />
            ))}
          </div>
        )}
      </div>

      {/* ══ URGENTES ══ */}
      {urgentPets.length > 0 && (
        <div className="anim d2" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: T.urgent, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>Necesitan hogar urgente</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
            {urgentPets.map(pet => {
              const photo = getPetPhoto(pet)
              return (
                <Link key={pet.id} to={`/perro/${pet.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <Card interactive style={{ width: 150, overflow: 'hidden' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                      {photo ? (
                        <img src={photo} alt={pet.name} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: T.urgentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.urgent }}>
                          {I.Dog(36)}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: T.urgent, color: '#fff',
                        padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                      }}>URGENTE</div>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>{pet.name}</div>
                      <div style={{ fontSize: 11, color: T.urgent, fontWeight: 600, marginTop: 2 }}>
                        {getDaysWaiting(pet.createdAt)} días
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ SPONSOR ══ */}
      <SponsorZone tier="standard" style={{ marginTop: 20 }} />

      {/* ══ FINALES FELICES ══ */}
      {successStories.length > 0 && (
        <div className="anim d3" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>Finales felices</h2>
            <Link to="/historias" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {successStories.map(story => (
              <Link key={story.id} to="/historias" style={{ textDecoration: 'none' }}>
                <Card style={{ overflow: 'hidden' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}>
                    {story.photoAfter ? (
                      <img src={story.photoAfter} alt={story.petName} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: T.sageLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sage }}>
                        {I.Paw(32)}
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(255,255,255,0.92)', borderRadius: 20,
                      padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 800, color: T.ok,
                    }}>
                      {I.Check()} ADOPTADO
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      padding: '24px 10px 8px',
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{story.petName}</span>
                    </div>
                  </div>
                  {story.quote && (
                    <div style={{ padding: '8px 10px 10px' }}>
                      <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                        {story.quote}
                      </p>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══ CTA SUMARME ══ */}
      <div className="anim d4" style={{ marginTop: 24 }}>
        <Card style={{ padding: '20px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: T.txt, marginBottom: 6 }}>
            ¿Querés ayudar?
          </h2>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>
            Elegí un refugio y sumate como voluntario, hacé una donación o apadriná un perrito.
          </p>
          <button
            className="btn-press"
            onClick={() => navigate('/refugios')}
            style={{
              width: '100%', padding: '13px 20px',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff', borderRadius: 14, border: 'none',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {I.Building()} Ver refugios y sumarme
          </button>
        </Card>
      </div>

      {/* ══ SPONSOR PREMIUM ══ */}
      <SponsorZone tier="premium" style={{ marginTop: 20 }} />

    </div>
  )
}

function UserGroupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

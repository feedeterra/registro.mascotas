import { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, RS, RM, R } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { getPetPhoto, getPetUrl, getStoryUrl, generatePetStory } from '../utils'
import { Card, SponsorZone, Skeleton, PetCardSkeleton, PageLoader } from '../components/ui'
import { I } from '../components/ui/Icons'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { useAppConfig } from '../hooks/useAppConfig'
import PetCard from '../components/PetCard'
import { useQuery } from '@tanstack/react-query'
import { fetchHomeDashboard } from '../services/home'

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
        width: 38, height: 38, borderRadius: RS,
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
  const { config: appConfig } = useAppConfig()
  const heroImage = appConfig?.hero_image_url

  const { data: globalStatsData, error: statsErrorData, isLoading: statsLoading } = useQuery({
    queryKey: ['home-stats'],
    queryFn: fetchHomeDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const globalStats = globalStatsData || { volunteers: null, shelters: null, adopted: null, perShelterVolunteers: {} }
  const statsError = statsErrorData ? 'No se pudieron cargar las estadísticas' : null

  const totalAdoptable = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted').length
  const petsPerShelter = useMemo(() => {
    const counts = {}
    pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted' && p.shelterId)
      .forEach(p => { counts[p.shelterId] = (counts[p.shelterId] || 0) + 1 })
    return counts
  }, [pets])

  const urgentPets = useMemo(() =>
    pets.filter(p => p.type === 'stray' && p.adoptionStatus === 'urgent').slice(0, 10),
    [pets]
  )

  const successStories = useMemo(() => {
    const adopted = pets.filter(p => p.adoptionStatus === 'adopted' || p.adoption_status === 'adopted')
    
    const targetNames = ['pepe', 'horacio', 'colo']
    const priorityPets = []

    const remaining = [...adopted]
    targetNames.forEach(target => {
      const idx = remaining.findIndex(p => p.name?.toLowerCase() === target)
      if (idx !== -1) {
        priorityPets.push(remaining.splice(idx, 1)[0])
      }
    })

    const final = [...priorityPets, ...remaining]

    return final.slice(0, 3).map(p => {
      const photos = Array.isArray(p.photos) ? p.photos : (typeof p.photos === 'string' ? JSON.parse(p.photos || '[]') : [])
      return {
        id: p.id,
        petName: p.name,
        shelterSlug: p.shelterSlug || null,
        shelterName: p.shelterName || null,
        photoAfter: photos[0],
        photoPositions: p.photoPositions || p.photo_positions || [],
        story: p.adopterStory || p.adopter_story || generatePetStory(p),
      }
    })
  }, [pets])

  const isInitialLoading = loading
  
  if (isInitialLoading) return <PageLoader message="Preparando todo para vos..." />

  return (
    <div style={{ paddingTop: 8, paddingBottom: 80 }}>

      {/* ══ HERO ══ */}
      <div className="anim" style={{
        borderRadius: R, marginTop: 8, overflow: 'hidden',
        position: 'relative', minHeight: heroImage ? 320 : 'auto',
        background: heroImage ? 'transparent' : T.card,
        border: heroImage ? 'none' : `1px solid ${T.borderLt}`,
        boxShadow: T.shadow,
      }}>
        {heroImage && (
          <>
            <img src={heroImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)' }} />
          </>
        )}

        {!heroImage && <>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: T.accentLt, opacity: 0.6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: T.sagePale, opacity: 0.7, pointerEvents: 'none' }} />
        </>}

        <div style={{ position: 'relative', padding: heroImage ? '140px 20px 24px' : '28px 20px 22px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 10, color: heroImage ? '#fff' : T.txt }}>
            Elegí a tu compañero para siempre.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, color: heroImage ? 'rgba(255,255,255,0.85)' : T.muted }}>
            Dale una oportunidad… y cambiá su vida (y la tuya).
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-press"
              onClick={() => navigate('/adoptar')}
              style={{
                flex: 1, padding: '13px 16px',
                background: heroImage ? '#fff' : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: heroImage ? T.accent : '#fff',
                borderRadius: RM, border: 'none',
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: heroImage ? '0 4px 20px rgba(0,0,0,0.2)' : `0 4px 20px ${T.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {I.Dog(16)} Conocé los perritos
            </button>
            <button
              className="btn-press"
              onClick={() => navigate('/refugios')}
              style={{
                flex: 1, padding: '13px 16px',
                background: heroImage ? 'rgba(255,255,255,0.15)' : 'transparent',
                backdropFilter: heroImage ? 'blur(8px)' : undefined,
                color: heroImage ? '#fff' : T.txt,
                border: heroImage ? '1.5px solid rgba(255,255,255,0.4)' : `1.5px solid ${T.border}`,
                borderRadius: RM, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {I.Building()} Refugios
            </button>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 16, fontSize: 12, fontWeight: 700,
            color: heroImage ? 'rgba(255,255,255,0.85)' : T.sage,
            background: heroImage ? 'rgba(255,255,255,0.15)' : T.sageLt,
            backdropFilter: heroImage ? 'blur(6px)' : undefined,
            borderRadius: RS, padding: '5px 12px',
          }}>
            {I.Check()} Red de refugios verificados
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
        <StatPill icon={I.Paw(18)} value={loading ? null : totalAdoptable} label="En adopción" />
        <StatPill icon={I.Heart()} value={globalStats.adopted} label="Adoptados" />
        <StatPill icon={<UserGroupIcon />} value={globalStats.volunteers} label="Voluntarios" />
        <StatPill icon={I.Building()} value={globalStats.shelters} label="Refugios" />
      </div>
      {statsError && globalStats.volunteers === null && globalStats.shelters === null && globalStats.adopted === null && (
        <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 4 }}>{statsError}</p>
      )}

      {/* ══ SPONSOR ══ */}
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
          <div style={{ display: 'grid', gridTemplateColumns: shelters.length === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
            {shelters.map(s => {
              const cfg = Array.isArray(s.shelter_config) ? s.shelter_config[0] : s.shelter_config
              const cover = cfg?.shelter_image_url || null
              const locationLabel = [s.city, cfg?.province].filter(Boolean).join(', ') || '—'
              const volCount = globalStats.perShelterVolunteers?.[s.id] || 0
              return (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none' }}>
                <Card interactive style={{ overflow: 'hidden', padding: 0 }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: T.accentLt }}>
                    {cover && <img src={cover} alt={s.name} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: cover
                        ? 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                        : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)',
                    }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 12px 10px' }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>{s.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                        {I.Loc()} {locationLabel}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                          borderRadius: RS, padding: '3px 8px',
                          fontSize: 10, fontWeight: 700, color: '#fff',
                        }}>
                          {I.Users(12)} {volCount} voluntario{volCount !== 1 ? 's' : ''}
                        </div>
                        {(petsPerShelter[s.id] || 0) > 0 && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                            borderRadius: RS, padding: '3px 8px',
                            fontSize: 10, fontWeight: 700, color: '#fff',
                          }}>
                            {I.Dog(12)} {petsPerShelter[s.id]} en adopción
                          </div>
                        )}
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

      {/* Sección: Urgentes */}
      <div style={{ marginTop: 24 }} className="home-urgent-carousel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
            {I.Alert(18)} Necesitan hogar hoy
          </h2>
          <Link to="/adoptar?estado=urgent" className="btn-press" style={{ 
            fontSize: 12, fontWeight: 800, color: T.accent, textDecoration: 'none',
            background: T.accentLt, padding: '6px 12px', borderRadius: 20
          }}>
            Ver todos →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', margin: '0 -14px', padding: '4px 14px 16px', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
          {urgentPets.length > 0 ? (
            urgentPets.map((pet, i) => (
              <div key={pet.id} style={{ width: 240, flexShrink: 0, scrollSnapAlign: 'start', display: 'flex' }}>
                <div style={{ flex: 1 }}>
                  <PetCard pet={pet} delay={i % 4} />
                </div>
              </div>
            ))
          ) : (
            [1, 2, 3].map(i => <div key={i} style={{ width: 240, height: 320, background: T.borderLt, borderRadius: RM, flexShrink: 0 }} />)
          )}
          <div style={{ width: 1, flexShrink: 0 }} />
        </div>
      </div>

      {/* Sección: Historias */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
            {I.Heart(18)} Finales felices
          </h2>
          <Link to="/historias" style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Leer más</Link>
        </div>
        <div className="desktop-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {successStories.map((story, i) => (
            <Link key={story.id} to={getStoryUrl(story)} style={{ textDecoration: 'none', display: 'block' }}>
              <Card interactive className={`anim d${i % 4} home-story-card`} style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ position: 'relative' }} className="home-story-card__body">
                  {story.photoAfter ? (
                    <img
                      src={story.photoAfter}
                      alt={story.petName}
                      loading="lazy"
                      style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: story.photoPositions[0] ?? 'center 20%', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: T.sageLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sage }}>
                      {I.Paw(48)}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff',
                      padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)',
                      fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <span style={{ color: T.ok }}>{I.Heart(14)}</span> Ya tiene familia
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    padding: '50px 20px 16px', color: '#fff',
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {story.petName}
                    </div>
                  </div>
                </div>
                {story.story && (
                  <div style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: 13, color: T.txt, lineHeight: 1.5, margin: 0, fontStyle: 'italic', opacity: 0.8 }}>
                      "{story.story.slice(0, 100)}..."
                    </p>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Sección: Todos los perritos */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
            {I.Dog(18)} Buscan una familia
          </h2>
          <Link to="/adoptar" style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Ver todos</Link>
        </div>
        <div className="desktop-cards-grid desktop-cards-grid--tight" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted').slice(0, 8).map((pet, i) => (
            <PetCard key={pet.id} pet={pet} delay={i % 4} />
          ))}
        </div>
      </div>

      {/* ══ CTA SUMARME ══ */}
      <div className="anim d4" style={{ marginTop: 24 }}>
        <Card style={{ padding: '20px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: T.accent }}>
            {I.Handshake(36)}
          </div>
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
              color: '#fff', borderRadius: RM, border: 'none',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {I.Building()} Ver refugios y sumarme
          </button>
        </Card>
      </div>

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

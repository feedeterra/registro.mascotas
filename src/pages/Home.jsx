import { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { getPetPhoto } from '../utils'
import { Card, Skeleton, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import { DEFAULT_DONATION_LINK } from '../lib/constants'
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: 1, padding: '12px 4px',
    }}>
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
      <span style={{ fontSize: 10, color: T.muted, marginTop: 3, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )
}

export default function Home() {
  const T = useT()
  const navigate = useNavigate()
  const { pets, loading } = usePets()
  const { items: shelters } = useSheltersPublic({ page: 1, pageSize: 8 })

  const [globalStats, setGlobalStats] = useState({ volunteers: null, shelters: null, adopted: null })
  useEffect(() => {
    Promise.all([
      supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('success_stories').select('id', { count: 'exact', head: true }),
    ]).then(([volRes, shRes, adoptedRes]) => {
      setGlobalStats({
        volunteers: volRes.count ?? 0,
        shelters: shRes.count ?? 0,
        adopted: adoptedRes.count ?? 0,
      })
    })
  }, [])

  const totalAdoptable = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted').length

  const longestWaiting = useMemo(() =>
    pets.filter(p => p.type === 'stray')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 4),
    [pets]
  )

  const urgentPets = useMemo(() =>
    pets.filter(p => p.type === 'stray' && p.adoptionStatus === 'urgent').slice(0, 4),
    [pets]
  )

  const successStories = useMemo(() =>
    pets.filter(p => p.adoptionStatus === 'adopted').slice(0, 4)
      .map(p => ({
        id: p.id, petName: p.name,
        photoAfter: p.photos?.[p.photos.length - 1] || p.photos?.[0],
        quote: 'Le dimos un hogar y nos cambió la vida.',
      })),
    [pets]
  )

  const getDaysWaiting = (createdAt) => {
    if (!createdAt) return 0
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  }

  const petOfDay = useMemo(() => {
    const adoptable = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')
    if (!adoptable.length) return null
    const now = new Date()
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
    return adoptable[dayOfYear % adoptable.length]
  }, [pets])

  return (
    <div style={{ paddingTop: 8, paddingBottom: 80 }}>

      {/* ══ HERO ══ */}
      <div className="anim" style={{
        borderRadius: R,
        marginTop: 8, padding: '28px 20px 22px',
        background: T.card,
        border: `1px solid ${T.borderLt}`,
        boxShadow: T.shadow,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
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
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: T.txt, lineHeight: 1.15,
            letterSpacing: -0.5, marginBottom: 10,
          }}>
            Cada perro merece un hogar lleno de amor.{' '}
            <span style={{ color: T.accent }}>♡</span>
          </h1>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 20 }}>
            Rescatamos, cuidamos y encontramos familias para perros que lo necesitan.
          </p>

          <button
            className="btn-press"
            onClick={() => navigate('/adoptar')}
            style={{
              width: '100%', padding: '14px 20px',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff', borderRadius: 14, border: 'none',
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: `0 4px 20px ${T.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {I.Dog(18)} Conocé a nuestros perros
          </button>
          <button
            className="btn-press"
            onClick={() => navigate('/sumarme')}
            style={{
              width: '100%', padding: '12px 20px', marginTop: 10,
              background: 'transparent', color: T.txt,
              border: `1.5px solid ${T.border}`, borderRadius: 14,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            Cómo podés ayudar <span style={{ color: T.accent }}>♡</span>
          </button>

          {/* Verified badge — sage, not green */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 16, fontSize: 12, color: T.sage, fontWeight: 700,
            background: T.sageLt, borderRadius: 20, padding: '5px 12px',
          }}>
            {I.Check()} Refugio verificado y sin fines de lucro
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
            Transparencia · Compromiso · Bienestar animal
          </div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <div className="anim d1" style={{
        display: 'flex', marginTop: 12,
        background: T.card, borderRadius: R,
        border: `1px solid ${T.borderLt}`, boxShadow: T.shadow,
        padding: '6px 4px',
      }}>
        <StatPill icon={I.Paw(18)} value={totalAdoptable} label="En adopción" />
        <StatPill icon={I.Home()} value={globalStats.adopted} label="Adoptados" />
        <StatPill icon={<UserGroupIcon />} value={globalStats.volunteers} label="Voluntarios" />
        <StatPill icon={I.HeartFill(16)} value={globalStats.shelters} label="Refugios" />
      </div>

      {/* ══ SPONSOR — alta visibilidad, justo debajo del hero ══ */}
      <SponsorZone tier="gold" style={{ marginTop: 14 }} />

      {/* ══ PERROS DISPONIBLES ══ */}
      <div className="anim d2" style={{ marginTop: 22 }}>
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
            {longestWaiting.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} delay={i % 4} />
            ))}
          </div>
        )}
      </div>

      {/* ══ TU AYUDA HACE LA DIFERENCIA ══ */}
      <div className="anim d2" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: T.txt, marginBottom: 12 }}>
          Tu ayuda hace la diferencia
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              icon: <HeartActionIcon />, iconBg: T.accentLt, iconColor: T.accent,
              title: 'Hacé una donación', desc: 'Ayudá con comida, atención veterinaria y más.', to: '/sumarme?step=donar',
            },
            {
              icon: <HandsIcon />, iconBg: T.sageLt, iconColor: T.sage,
              title: 'Sé voluntario', desc: 'Tu tiempo puede cambiar una vida.', to: '/voluntario',
            },
            {
              icon: I.Home(), iconBg: T.borderLt, iconColor: T.muted,
              title: 'Ofrecé un hogar temporal', desc: 'Brindá refugio y amor por un tiempo.', to: '/sumarme',
            },
          ].map((item, i) => (
            <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>
              <Card interactive className={`anim d${i+1}`} style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: item.iconBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: item.iconColor, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.3 }}>{item.desc}</div>
                </div>
                <div style={{ color: T.muted, fontSize: 20, flexShrink: 0, fontWeight: 300 }}>›</div>
              </Card>
            </Link>
          ))}
        </div>
        <Link to="/sumarme" style={{
          display: 'block', textAlign: 'right', marginTop: 10,
          fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none',
        }}>
          Conocé más formas de ayudar →
        </Link>
      </div>

      {/* ══ SPONSOR — después de las formas de ayudar ══ */}
      <SponsorZone tier="standard" style={{ marginTop: 20 }} />

      {/* ══ PERRITO DEL DÍA ══ */}
      {petOfDay && !loading && (
        <Link to={`/perro/${petOfDay.id}`} style={{ textDecoration: 'none' }}>
          <div className="anim d1" style={{ marginTop: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: T.accent, boxShadow: `0 0 0 3px ${T.accentLt}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
                Perrito del día
              </span>
            </div>

            <Card style={{ overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: 130, flexShrink: 0, position: 'relative', minHeight: 130 }}>
                {getPetPhoto(petOfDay) ? (
                  <img
                    src={getPetPhoto(petOfDay)} alt={petOfDay.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', minHeight: 130,
                    background: T.accentLt, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: T.accent,
                  }}>
                    {I.Dog(40)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.txt, lineHeight: 1.1, marginBottom: 6 }}>
                  {petOfDay.name || 'Sin nombre'}
                </div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4, marginBottom: 12 }}>
                  {getDaysWaiting(petOfDay.createdAt) > 0
                    ? `${getDaysWaiting(petOfDay.createdAt)} días esperando hogar`
                    : 'Recién rescatado'}
                </div>
                <div style={{
                  alignSelf: 'flex-start',
                  background: T.accent, color: '#fff',
                  padding: '8px 16px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700,
                }}>
                  Conocelo →
                </div>
              </div>
            </Card>
          </div>
        </Link>
      )}

      {/* ══ URGENTES ══ */}
      {urgentPets.length > 0 && (
        <div className="anim d2" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: T.urgent,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>
                Necesitan hogar urgente
              </h2>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {urgentPets.map(pet => {
              const photo = getPetPhoto(pet)
              return (
                <Link key={pet.id} to={`/perro/${pet.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <Card interactive style={{ width: 160, overflow: 'hidden' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                      {photo ? (
                        <img src={photo} alt={pet.name} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: T.urgentLt, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: T.urgent,
                        }}>
                          {I.Dog(36)}
                        </div>
                      )}
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: T.urgent, color: '#fff',
                        padding: '3px 9px', borderRadius: 8,
                        fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
                      }}>
                        URGENTE
                      </div>
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

      {/* ══ REFUGIOS ══ */}
      {shelters?.length > 0 && (
        <div className="anim d2" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>Refugios activos</h2>
            <Link to="/refugios" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {shelters.map((s) => (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <Card interactive style={{ width: 160, padding: '14px 14px 12px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: T.sageLt,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.sage, marginBottom: 10,
                  }}>
                    {I.Building()}
                  </div>
                  <div style={{ fontWeight: 800, color: T.txt, fontSize: 13, lineHeight: 1.2, marginBottom: 3 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{s.city || '—'}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══ FINALES FELICES ══ */}
      {successStories.length > 0 && (
        <div className="anim d3" style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>Finales felices</h2>
            <Link to="/historias" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {successStories.map(story => (
              <Card key={story.id} style={{
                minWidth: 160, maxWidth: 160, overflow: 'hidden', flexShrink: 0,
              }}>
                <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}>
                  {story.photoAfter ? (
                    <img src={story.photoAfter} alt={story.petName} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: T.sageLt, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: T.sage, fontSize: 32,
                    }}>
                      {I.Paw(32)}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                    padding: '20px 10px 8px',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{story.petName}</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: T.sageLt, borderRadius: 8, padding: '4px 10px',
                    fontSize: 10, fontWeight: 700, color: T.sage, marginBottom: 6,
                  }}>
                    {I.Check()} Adoptado
                  </div>
                  <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                    "{story.quote.slice(0, 55)}…"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══ COMUNIDAD CTA ══ */}
      <div className="anim d4" style={{ marginTop: 24 }}>
        <Link to="/refugios" style={{ textDecoration: 'none' }}>
          <div style={{
            borderRadius: R, overflow: 'hidden',
            background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDk} 100%)`,
            padding: '20px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Comunidad
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginTop: 4 }}>
                Conocé los refugios
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                {globalStats.shelters != null ? `${globalStats.shelters} activos en la red` : 'Ver refugios activos'}
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              {I.Building()}
            </div>
          </div>
        </Link>
      </div>

      {/* ══ SPONSOR PREMIUM — al final, alta permanencia ══ */}
      <SponsorZone tier="premium" style={{ marginTop: 20 }} />

    </div>
  )
}

// Inline SVG icons used only in Home
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
function HeartActionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function HandsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 12H3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3"/>
      <path d="m15 12 2.387-2.387A1.733 1.733 0 0 1 19.614 12v0a1.733 1.733 0 0 1-1.227 2.841L15 17"/>
      <path d="M14 21v-6.786a1 1 0 0 0-.26-.685L11 11l.26-.364A2 2 0 0 1 13 10h0a2 2 0 0 1 1.999 2.102L15 15"/>
      <path d="M6 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1"/>
    </svg>
  )
}

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

// Animated counter hook
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

function StatPill({ value, label, accent }) {
  const T = useT()
  const count = useCountUp(value ?? 0, 1200)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 14px', borderRadius: 14,
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.18)',
      minWidth: 70,
    }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -0.5 }}>
        {value == null ? '—' : count}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function HeroNumber({ value }) {
  const count = useCountUp(value, 800)
  if (!value) return <span style={{ opacity: 0.3 }}>...</span>
  return <>{count}</>
}

export default function Home() {
  const T = useT()
  const navigate = useNavigate()
  const { pets, loading } = usePets()
  const DONATION_LINK = DEFAULT_DONATION_LINK
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

  const heroBg = null
  const totalAdoptable = pets.filter(p => p.type === 'stray').length

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
    <div style={{ paddingTop: 8, paddingBottom: 40 }}>

      {/* ══ HERO ══ */}
      <div className="anim" style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20,
        marginTop: 8,
        background: heroBg
          ? `linear-gradient(160deg, rgba(27,67,50,0.88) 0%, rgba(20,50,38,0.96) 100%), url('${heroBg}') center/cover`
          : 'linear-gradient(160deg, #1b4332 0%, #0d2b1f 100%)',
        padding: '0 0 24px',
      }}>
        {/* Decorative grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }} />
        {/* Decorative arc */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          border: '40px solid rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -40,
          width: 160, height: 160, borderRadius: '50%',
          border: '28px solid rgba(255,255,255,0.03)',
          pointerEvents: 'none',
        }} />

        {/* Top tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '18px 20px 0',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
            color: '#7dcfa0', textTransform: 'uppercase',
          }}>
            Argentina
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(125,207,160,0.25)' }} />
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          }}>
            {new Date().getFullYear()}
          </div>
        </div>

        {/* Big number + copy */}
        <div style={{ padding: '8px 20px 0', textAlign: 'center' }}>
          <div style={{
            fontSize: 96, fontWeight: 900, lineHeight: 0.9,
            color: '#fff', letterSpacing: -5,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <HeroNumber value={totalAdoptable} />
          </div>
          <h1 style={{
            fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.4, marginTop: 8,
          }}>
            perritos esperan{' '}
            <span style={{ color: '#7dcfa0', fontWeight: 800 }}>una familia como la tuya</span>
          </h1>
        </div>

        {/* CTA */}
        <div style={{ padding: '18px 20px 0' }}>
          <button
            className="btn-press"
            onClick={() => navigate('/adoptar')}
            style={{
              width: '100%',
              background: '#fff', color: '#1b4332',
              borderRadius: 12, padding: '13px 16px',
              fontWeight: 800, fontSize: 14,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              letterSpacing: -0.2,
            }}
          >
            Encontrar un compañero →
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 20px 0',
        }}>
          <StatPill value={globalStats.adopted} label="Adoptados" />
          <StatPill value={globalStats.shelters} label="Refugios" />
          <StatPill value={globalStats.volunteers} label="Voluntarios" />
        </div>

        {/* Footer links */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16, padding: '14px 20px 0',
          fontSize: 12,
        }}>
          <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer"
            style={{ color: '#7dcfa0', fontWeight: 700, textDecoration: 'none' }}>
            Donar →
          </a>
          <Link to="/refugios" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textDecoration: 'none' }}>
            Ver refugios
          </Link>
        </div>
      </div>

      {/* ══ CÓMO AYUDAR ══ */}
      <div className="anim d1" style={{ marginTop: 20 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[
            { emoji: '🐾', title: 'Adoptar', desc: 'Dale un hogar permanente', to: '/adoptar', color: T.accent, bg: T.accentLt },
            { emoji: '🤝', title: 'Voluntario', desc: 'Sumate al equipo', to: '/voluntario', color: T.purple, bg: T.purpleLt },
            { emoji: '💛', title: 'Apadrinar', desc: 'Cubrí su alimento mensual', to: '/adoptar?apadrinar=1', color: '#8a6d3b', bg: '#fdf8ec' },
            { emoji: '🎁', title: 'Donar', desc: 'Alimento o materiales', to: '/sumarme?step=donar', color: T.blue, bg: T.blueLt },
          ].map((item, i) => (
            <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>
              <div className={`anim d${i + 1}`} style={{
                padding: '16px 14px', borderRadius: 16,
                background: item.bg,
                border: `1.5px solid ${item.color}18`,
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'transform .15s, box-shadow .15s',
              }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</span>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.txt, marginTop: 4 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.3 }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ REFUGIOS ══ */}
      {shelters?.length > 0 && (
        <div className="anim d2" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt, letterSpacing: -0.3 }}>
              Refugios activos
            </h2>
            <Link to="/refugios" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {shelters.map((s, i) => (
              <Link key={s.id} to={`/refugio/${s.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: 160, padding: '14px 14px 12px',
                  borderRadius: 16, background: T.card,
                  border: `1.5px solid ${T.border}`,
                  boxShadow: T.shadow,
                  transition: 'transform .15s',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `linear-gradient(135deg, #1b4332, #2d6a4f)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, marginBottom: 10,
                  }}>
                    🏠
                  </div>
                  <div style={{ fontWeight: 800, color: T.txt, fontSize: 13, lineHeight: 1.2, marginBottom: 3 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {s.city || '—'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══ SPONSOR ══ */}
      <SponsorZone tier="standard" style={{ marginTop: 20 }} />

      {/* ══ PERRITO DEL DÍA ══ */}
      {petOfDay && !loading && (
        <Link to={`/perro/${petOfDay.id}`} style={{ textDecoration: 'none' }}>
          <div className="anim d1" style={{ marginTop: 20 }}>
            {/* Label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginBottom: 10,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: T.accent, boxShadow: `0 0 0 3px ${T.accentLt}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: T.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
                Perrito del día
              </span>
            </div>

            <div style={{
              borderRadius: 18, overflow: 'hidden',
              background: T.card, border: `1.5px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: 'flex',
            }}>
              <div style={{ width: 140, flexShrink: 0, position: 'relative', minHeight: 140 }}>
                {getPetPhoto(petOfDay) ? (
                  <img
                    src={getPetPhoto(petOfDay)} alt={petOfDay.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', minHeight: 140,
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
                  padding: '7px 14px', borderRadius: 10,
                  fontSize: 12, fontWeight: 700,
                }}>
                  Conocelo →
                </div>
              </div>
            </div>
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
              <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt, letterSpacing: -0.3 }}>
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
                  <div style={{
                    width: 160, borderRadius: 16, overflow: 'hidden',
                    background: T.card, border: `1.5px solid ${T.urgent}30`,
                    boxShadow: T.shadow,
                  }}>
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
                        position: 'absolute', top: 7, left: 7,
                        background: T.urgent, color: '#fff',
                        padding: '3px 8px', borderRadius: 8,
                        fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                      }}>
                        URGENTE
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: T.txt }}>{pet.name}</div>
                      <div style={{ fontSize: 11, color: T.urgent, fontWeight: 600, marginTop: 2 }}>
                        {getDaysWaiting(pet.createdAt)} días
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ MÁS TIEMPO ESPERANDO ══ */}
      <div className="anim d2" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt, letterSpacing: -0.3 }}>
            Más tiempo esperando
          </h2>
          <Link to="/adoptar" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
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

      {/* ══ FINALES FELICES ══ */}
      {successStories.length > 0 && (
        <div className="anim d3" style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.txt, letterSpacing: -0.3 }}>
              Finales felices
            </h2>
            <Link to="/historias" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {successStories.map(story => (
              <div key={story.id} style={{
                minWidth: 170, maxWidth: 170, borderRadius: 16,
                overflow: 'hidden', flexShrink: 0,
                background: T.card, border: `1.5px solid ${T.border}`,
                boxShadow: T.shadow,
              }}>
                <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}>
                  {story.photoAfter ? (
                    <img src={story.photoAfter} alt={story.petName} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: T.okLt, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: T.ok, fontSize: 32,
                    }}>
                      🐾
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
                    background: T.okLt, borderRadius: 6, padding: '3px 8px',
                    fontSize: 10, fontWeight: 700, color: T.ok, marginBottom: 6,
                  }}>
                    ✓ Adoptado
                  </div>
                  <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                    "{story.quote.slice(0, 55)}…"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ REFUGIOS CTA ══ */}
      <div className="anim d4" style={{ marginTop: 24 }}>
        <Link to="/refugios" style={{ textDecoration: 'none' }}>
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: `linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)`,
            padding: '20px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7dcfa0', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Comunidad
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                Conocé los refugios
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                {globalStats.shelters != null ? `${globalStats.shelters} activos en la red` : 'Ver refugios activos'}
              </div>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              🏘️
            </div>
          </div>
        </Link>
      </div>

      {/* ══ SPONSOR 2 ══ */}
      <SponsorZone tier="premium" style={{ marginTop: 20 }} />

      {/* Dev reset */}
      <button
        onClick={() => { try { localStorage.removeItem('registro-mascotas-welcomed') } catch {} window.location.href = '/' }}
        style={{
          marginTop: 28, width: '100%', padding: '8px 0',
          background: 'none', border: '1px dashed #ccc', borderRadius: 8,
          color: '#ccc', fontSize: 11, cursor: 'pointer',
        }}
      >
        🔁 Ver pantalla de bienvenida
      </button>

    </div>
  )
}

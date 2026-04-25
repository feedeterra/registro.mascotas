import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { waitingMessage, sizeLabel, sexLabel, generatePetStory, getPetPhoto, getWhatsAppLink } from '../utils'
import { Card, SponsorZone, Skeleton } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

export default function Home() {
  const T = useT()
  const navigate = useNavigate()
  const { pets, loading } = usePets()
  const ctx = useShelterConfig()
  const config = ctx?.config
  const heroBg = config?.hero_image_url || null
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK

  const totalAdoptable = pets.filter(p => p.type === 'stray').length

  // Animacion count-up
  const [displayCount, setDisplayCount] = useState(0)
  useEffect(() => {
    if (!totalAdoptable) return
    let start = 0
    const step = Math.ceil(totalAdoptable / 30)
    const timer = setInterval(() => {
      start += step
      if (start >= totalAdoptable) { setDisplayCount(totalAdoptable); clearInterval(timer) }
      else setDisplayCount(start)
    }, 40)
    return () => clearInterval(timer)
  }, [totalAdoptable])

  // Perritos que mas tiempo llevan esperando (top 4)
  const longestWaiting = useMemo(() =>
    pets
      .filter(p => p.type === 'stray')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 4),
    [pets]
  )

  // Urgentes primero
  const urgentPets = useMemo(() =>
    pets.filter(p => p.type === 'stray' && p.adoptionStatus === 'urgent').slice(0, 3),
    [pets]
  )

  const successStories = useMemo(() =>
    pets
      .filter(p => p.adoptionStatus === 'adopted')
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        petName: p.name,
        photoAfter: p.photos?.[p.photos.length - 1] || p.photos?.[0],
        adopterName: p.adopterName || 'Su nueva familia',
        quote: p.adopterQuote || 'Le dimos un hogar y nos cambio la vida.',
      })),
    [pets]
  )

  const getDaysWaiting = (createdAt) => {
    if (!createdAt) return 0
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  }

  // Perrito del dia: determinista por fecha, rota cada dia automaticamente
  const petOfDay = useMemo(() => {
    const adoptable = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')
    if (!adoptable.length) return null
    const now = new Date()
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
    return adoptable[dayOfYear % adoptable.length]
  }, [pets])

  return (
    <div style={{ paddingTop: 14, paddingBottom: 24 }}>

      {/* ═══ Sponsor Gold ═══ */}
      <SponsorZone tier="gold" whatsapp={WHATSAPP} style={{ marginBottom: 14 }} />

      {/* ═══ Hero ═══ */}
      <div className="anim" style={{
        background: heroBg
          ? `linear-gradient(to bottom, rgba(27,67,50,0.75), rgba(27,67,50,0.92)), url('${heroBg}')`
          : 'linear-gradient(to bottom, #1b4332, #2d6a4f)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: R,
        padding: '36px 20px 28px', marginTop: 12, textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1, marginBottom: 4, letterSpacing: -4 }}>
          {totalAdoptable > 0 ? displayCount || totalAdoptable : '...'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, opacity: 0.95 }}>
          perritos sueñan con tener una familia
        </h1>
        <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 280, margin: '0 auto 20px' }}>
          Cada uno fue rescatado de la calle. Hoy esperan por vos.
        </p>

        <button
          className="btn-press"
          onClick={() => navigate('/adoptar')}
          style={{
            background: '#fff', color: '#1b4332', borderRadius: RS,
            padding: '12px 28px', fontWeight: 800, fontSize: 15,
            border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}
        >
          Encontra tu compañero →
        </button>

        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.8 }}>
          <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer"
            style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}>
            Donar
          </a>
          <span style={{ margin: '0 8px' }}>·</span>
          <Link to="/refugio/casa" style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}>
            Ser voluntario
          </Link>
        </div>
      </div>


      {/* ═══ Perrito del dia ═══ */}
      {petOfDay && !loading && (
        <Link to={`/perro/${petOfDay.id}`} style={{ textDecoration: 'none' }}>
          <div className="anim d1" style={{
            marginTop: 16, borderRadius: R, overflow: 'hidden',
            background: `linear-gradient(135deg, ${T.accentLt}, ${T.purpleLt})`,
            border: `1.5px solid ${T.accent}30`,
          }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Foto */}
              <div style={{ width: 130, flexShrink: 0, position: 'relative' }}>
                {getPetPhoto(petOfDay) ? (
                  <img
                    src={getPetPhoto(petOfDay)}
                    alt={petOfDay.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 130 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 130, background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                    {I.Dog(48)}
                  </div>
                )}
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: T.accent, color: '#fff',
                  padding: '3px 8px', borderRadius: 10,
                  fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                }}>
                  ⭐ HOY
                </div>
              </div>
              {/* Info */}
              <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Perrito del dia
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.txt, lineHeight: 1.1, marginBottom: 6 }}>
                  {petOfDay.name || 'Sin nombre'}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 1.4 }}>
                  {getDaysWaiting(petOfDay.createdAt) > 0
                    ? `Lleva ${getDaysWaiting(petOfDay.createdAt)} dias esperando una familia`
                    : 'Recien rescatado, busca un hogar'}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: T.accent, color: '#fff',
                  padding: '6px 12px', borderRadius: RS,
                  fontSize: 12, fontWeight: 700, alignSelf: 'flex-start',
                }}>
                  Conocelo →
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ═══ Urgentes ═══ */}
      {urgentPets.length > 0 && (
        <div className="anim d1" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>🚨 Necesitan hogar urgente</h2>
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {urgentPets.map(pet => {
              const photo = getPetPhoto(pet)
              return (
                <Link key={pet.id} to={`/perro/${pet.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <Card interactive style={{ width: 180, overflow: 'hidden' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                      {photo ? (
                        <img src={photo} alt={pet.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: T.urgentLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.urgent }}>{I.Dog(48)}</div>
                      )}
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: T.urgent, color: '#fff',
                        padding: '3px 8px', borderRadius: 10,
                        fontSize: 10, fontWeight: 800,
                      }}>
                        🚨 URGENTE
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>{pet.name}</div>
                      <div style={{ fontSize: 11, color: T.urgent, fontWeight: 600, marginTop: 2 }}>
                        Esperando hace {getDaysWaiting(pet.createdAt)} dias
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ Mas tiempo esperando ═══ */}
      <div className="anim d2" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>💜 Mas tiempo esperando</h2>
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

      {/* ═══ Sponsor Silver ═══ */}
      <SponsorZone tier="silver" whatsapp={WHATSAPP} style={{ marginTop: 20 }} />

      {/* ═══ Quick Actions ═══ */}
      <div className="anim d3" style={{ marginTop: 20 }}>
        <Link
          to="/refugio/casa"
          className="tap"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', border: `1.5px solid ${T.purple}`,
            background: 'transparent', color: T.purple,
            borderRadius: RS, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}
        >
          💜 Conocer el refugio
        </Link>
      </div>

      {/* ═══ Finales Felices Teaser ═══ */}
      {successStories.length > 0 && (
        <div className="anim d3" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>🎉 Finales felices</h2>
            <Link to="/historias" style={{ fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            paddingBottom: 4, WebkitOverflowScrolling: 'touch',
          }}>
            {successStories.map(story => (
              <Card key={story.id} style={{
                minWidth: 200, maxWidth: 200, overflow: 'hidden', flexShrink: 0,
              }}>
                <div style={{
                  width: '100%', aspectRatio: '4/3', overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={story.photoAfter}
                    alt={story.petName}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                    padding: '20px 10px 8px', color: '#fff',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{story.petName}</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: T.ok, fontWeight: 700, marginBottom: 4 }}>
                    ✅ Adoptado
                  </div>
                  <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                    "{story.quote.length > 60 ? story.quote.slice(0, 60) + '...' : story.quote}"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Sponsor Standard ═══ */}
      <SponsorZone tier="standard" whatsapp={WHATSAPP} style={{ marginTop: 20 }} />

      {/* ═══ Como ayudar ═══ */}
      <div className="anim d4" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, marginBottom: 12 }}>🤝 Como podes ayudar</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { emoji: '🐾', title: 'Adoptar', desc: 'Dale un hogar', to: '/adoptar', color: T.accent, bg: T.accentLt },
            { emoji: '💛', title: 'Apadrinar', desc: 'Cuida su alimento', href: DONATION_LINK, color: '#8a6d3b', bg: '#fdf8ec' },
            { emoji: '🎁', title: 'Donar', desc: 'Alimento o materiales', href: getWhatsAppLink(WHATSAPP, 'Hola! Quiero donar materiales o alimento al refugio.'), color: T.blue, bg: T.blueLt },
            { emoji: '🤝', title: 'Voluntario', desc: 'Sumate al equipo', to: '/refugio/casa', color: T.purple, bg: T.purpleLt },
          ].map((item, i) => {
            const inner = (
              <Card interactive key={i} style={{ padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{item.desc}</div>
              </Card>
            )
            if (item.to) return <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>{inner}</Link>
            return <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
          })}
        </div>
      </div>

    </div>
  )
}

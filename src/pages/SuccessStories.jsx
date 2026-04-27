import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { waitingMessage, generatePetStory, sizeLabel, sexLabel, getPetPhoto, getWhatsAppLink, getPetUrl, getStoryUrl } from '../utils'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card, Skeleton } from '../components/ui'
import { Clock, Dog, Check } from 'lucide-react'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

export default function SuccessStories() {
  const T = useT()
  const { pets, loading } = usePets()
  const ctx = useShelterConfig()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK

  const [shelterFilter, setShelterFilter] = useState(null)

  const adoptedPets = useMemo(() =>
    pets.filter(p => p.adoption_status === 'adopted' || p.adoptionStatus === 'adopted'),
    [pets]
  )

  const shelterNames = useMemo(() => {
    const names = adoptedPets.map(p => p.shelterName).filter(Boolean)
    return [...new Set(names)].sort()
  }, [adoptedPets])

  const successStories = useMemo(() => {
    const source = shelterFilter
      ? adoptedPets.filter(p => p.shelterName === shelterFilter)
      : adoptedPets
    return source.map(p => {
      const photos = Array.isArray(p.photos) ? p.photos : JSON.parse(p.photos || '[]')
      return {
        id: p.id,
        petName: p.name,
        shelterName: p.shelterName || null,
        photoBefore: photos[0],
        photoAfter: photos[photos.length - 1] || photos[0],
        adopterName: p.adopter_name || p.adopterName || 'Su nueva familia',
        quote: p.adopter_quote || p.adopterQuote || 'Le dimos un hogar y nos cambió la vida.',
        adoptedDate: p.updated_at || p.adoptedAt,
        story: p.adopter_story || p.adopterStory || generatePetStory(p),
      }
    })
  }, [adoptedPets, shelterFilter])

  // Waiting pets: sorted by longest wait first
  const waitingPets = useMemo(() =>
    pets
      .filter(p => p.type === 'stray' && p.adoption_status !== 'adopted' && p.adoptionStatus !== 'adopted')
      .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt)),
    [pets]
  )

  const maxWaitDays = waitingPets.length > 0
    ? Math.floor((Date.now() - new Date(waitingPets[0]?.created_at || waitingPets[0]?.createdAt).getTime()) / 86400000)
    : 90

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>

      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: T.txt, letterSpacing: -0.5 }}>
          Historias del refugio
        </h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
          Cada adopción es un final feliz. Cada perrito esperando es una historia por escribir.
        </p>
      </div>

      {/* Filtro por refugio */}
      {shelterNames.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          marginBottom: 20, scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => setShelterFilter(null)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none',
              background: !shelterFilter ? T.accent : T.borderLt,
              color: !shelterFilter ? '#fff' : T.muted,
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >
            Todos
          </button>
          {shelterNames.map(name => (
            <button
              key={name}
              onClick={() => setShelterFilter(name === shelterFilter ? null : name)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none',
                background: shelterFilter === name ? T.accent : T.borderLt,
                color: shelterFilter === name ? '#fff' : T.muted,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* ═══ Finales Felices ═══ */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12 }}>
        Finales felices
      </h2>

      {!loading && successStories.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ color: T.muted, fontWeight: 600 }}>
            Los primeros finales felices aparecerán acá pronto.
          </p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {successStories.map((story, i) => (
          <Card key={story.id} className={`anim d${Math.min(i + 1, 4)}`} style={{ overflow: 'hidden' }}>
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              {story.photoAfter && (
                <img
                  src={story.photoAfter}
                  alt={story.petName}
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none' }}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  background: T.ok, color: '#fff',
                  padding: '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 800,
                }}>
                  <span style={{display:'flex', alignItems:'center', gap:4}}><Check size={11}/> Adoptado</span>
                </div>
                {story.shelterName && (
                  <div style={{
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    color: '#fff', padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {story.shelterName}
                  </div>
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                padding: '40px 16px 12px', color: '#fff',
              }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{story.petName}</h3>
                <p style={{ fontSize: 12, opacity: 0.85, margin: '2px 0 0' }}>
                  Adoptado por {story.adopterName}
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 16px' }}>
              {/* Quote */}
              <div style={{
                background: T.okLt, borderRadius: RS, padding: '12px 14px',
                borderLeft: `3px solid ${T.ok}`, marginBottom: 12,
              }}>
                <p style={{ fontSize: 13, color: T.txt, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  "{story.quote}"
                </p>
                <p style={{ fontSize: 11, color: T.muted, margin: '6px 0 0', fontWeight: 600 }}>
                  — {story.adopterName}
                </p>
              </div>

              {/* Story */}
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
                {story.story}
              </p>

                  {story.waitedDays && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  marginTop: 10, fontSize: 12, color: T.purple, fontWeight: 600,
                }}>
                  <Clock size={14} /> Esperó {story.waitedDays} días buscando su hogar
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ CTA intermedio ═══ */}
      <div style={{
        margin: '28px 0',
        padding: '20px 16px',
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
        borderRadius: R,
      }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          Vos también podés escribir un final feliz
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 1.4 }}>
          Adoptá, apadriná o doná. Cada acción cuenta.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            to="/adoptar"
            className="btn-press"
            style={{
              background: '#fff', color: T.accent,
              borderRadius: RS, padding: '12px 16px', fontWeight: 800,
              fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dog size={18} /> Ver perritos en adopción</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={getWhatsAppLink(WHATSAPP, 'Hola! Me interesa adoptar un perrito del refugio.')}
              target="_blank" rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: RS, padding: '11px 16px', fontWeight: 700,
                fontSize: 14, textDecoration: 'none', textAlign: 'center',
              }}
            >
              WhatsApp
            </a>
            <a
              href={DONATION_LINK}
              target="_blank" rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: RS, padding: '11px 16px', fontWeight: 700,
                fontSize: 14, textDecoration: 'none', textAlign: 'center',
              }}
            >
              Donar
            </a>
          </div>
        </div>
      </div>

      {/* ═══ Esperando su familia ═══ */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
        Esperando su familia
      </h2>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Estos perritos llevan más tiempo esperando. Cada día cuenta.
      </p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0,1,2].map(i => (
            <Card key={i} style={{ padding: 16, display: 'flex', gap: 14 }}>
              <Skeleton width={80} height={80} radius={12} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={18} style={{ marginBottom: 6 }} />
                <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={10} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waitingPets.map((pet, i) => {
            const photo = getPetPhoto(pet)
            const days = Math.floor((Date.now() - new Date(pet.createdAt).getTime()) / 86400000)
            const barWidth = Math.min(100, (days / Math.max(maxWaitDays, 1)) * 100)
            const story = generatePetStory(pet)
            const petName = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')

            return (
              <Link key={pet.id} to={shelterSlug ? `/refugio/${shelterSlug}/adoptar/${pet.id}` : `/perro/${pet.id}`} style={{ textDecoration: 'none' }}>
                <Card interactive className={`anim d${Math.min(i + 1, 4)}`} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 14, padding: 14 }}>
                    {/* Photo */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                      flexShrink: 0, background: T.accentLt,
                    }}>
                      {photo ? (
                        <img src={photo} alt={petName} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                          <Dog size={40} strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>{petName}</span>
                        {pet.adoptionStatus === 'urgent' && (
                          <span style={{
                            background: T.urgentLt, color: T.urgent,
                            padding: '2px 8px', borderRadius: 10,
                            fontSize: 10, fontWeight: 800,
                          }}>
                            URGENTE
                          </span>
                        )}
                      </div>

                      <p style={{
                        fontSize: 12, color: T.muted, lineHeight: 1.4,
                        margin: '0 0 8px', overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {story}
                      </p>

                      {/* Wait bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 4, background: T.borderLt, borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${barWidth}%`, height: '100%',
                            background: days > 60 ? T.urgent : days > 30 ? T.accent : T.purple,
                            borderRadius: 2, transition: 'width .5s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                          color: days > 60 ? T.urgent : days > 30 ? T.accent : T.purple,
                        }}>
                          {days}d
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {!loading && waitingPets.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: T.muted, fontWeight: 600 }}>
            ¡Todos los perritos encontraron familia!
          </p>
        </Card>
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePets } from '../hooks/usePets'
import { waitingMessage, generatePetStory, sizeLabel, sexLabel } from '../utils'
import { Card, Skeleton } from '../components/ui'
import { I } from '../components/ui/Icons'
import { MOCK_STORIES } from '../data/mockStories'

import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'
const WHATSAPP = DEFAULT_WHATSAPP
const DONATION_LINK = DEFAULT_DONATION_LINK

export default function SuccessStories() {
  const T = useT()
  const { pets, loading } = usePets()

  // Success stories: from Supabase (adopted pets) or mock data
  const adoptedPets = useMemo(() =>
    pets.filter(p => p.adoptionStatus === 'adopted'),
    [pets]
  )
  const successStories = adoptedPets.length > 0
    ? adoptedPets.map(p => ({
        id: p.id,
        petName: p.name,
        photoBefore: p.photos?.[0],
        photoAfter: p.photos?.[p.photos.length - 1] || p.photos?.[0],
        adopterName: p.adopterName || 'Su nueva familia',
        quote: p.adopterQuote || 'Le dimos un hogar y nos cambio la vida.',
        adoptedDate: p.adoptedAt,
        story: generatePetStory(p),
      }))
    : MOCK_STORIES

  // Waiting pets: sorted by longest wait first
  const waitingPets = useMemo(() =>
    pets
      .filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [pets]
  )

  const maxWaitDays = waitingPets.length > 0
    ? Math.floor((Date.now() - new Date(waitingPets[0]?.createdAt).getTime()) / 86400000)
    : 90

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>

      {/* ═══ Header ═══ */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt }}>Historias del refugio</h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
          Cada adopcion es un final feliz. Cada perrito esperando es una historia por escribir.
        </p>
      </div>

      {/* ═══ Finales Felices ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, marginBottom: 12 }}>
        🎉 Finales felices
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {successStories.map((story, i) => (
          <Card key={story.id} className={`anim d${Math.min(i + 1, 4)}`} style={{ overflow: 'hidden' }}>
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              <img
                src={story.photoAfter}
                alt={story.petName}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: T.ok, color: '#fff',
                padding: '4px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 800,
              }}>
                ✅ Adoptado
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
                  {I.Clock()} Espero {story.waitedDays} dias por su familia
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ CTA intermedio ═══ */}
      <div style={{
        textAlign: 'center', margin: '28px 0',
        padding: '20px 16px', background: T.accentLt, borderRadius: R,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💜</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
          Vos tambien podes escribir un final feliz
        </p>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Adopta, apadrina o dona. Cada accion cuenta.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Me interesa adoptar un perrito del refugio.')}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-press"
            style={{
              background: T.accent, color: '#fff', border: 'none',
              borderRadius: RS, padding: '10px 20px', fontWeight: 700,
              fontSize: 14, textDecoration: 'none',
            }}
          >
            Adoptar
          </a>
          <a
            href={DONATION_LINK}
            target="_blank" rel="noopener noreferrer"
            className="btn-press"
            style={{
              background: 'transparent', color: T.accent,
              border: `1.5px solid ${T.accent}`, borderRadius: RS,
              padding: '10px 20px', fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Donar
          </a>
        </div>
      </div>

      {/* ═══ Esperando su familia ═══ */}
      <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
        💜 Esperando su familia
      </h2>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
        Estos perritos llevan mas tiempo esperando. Cada dia cuenta.
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
            const photo = pet.photos?.[pet.primaryPhotoIdx ?? 0] || pet.photo
            const days = Math.floor((Date.now() - new Date(pet.createdAt).getTime()) / 86400000)
            const barWidth = Math.min(100, (days / Math.max(maxWaitDays, 1)) * 100)
            const story = generatePetStory(pet)
            const petName = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')

            return (
              <Link key={pet.id} to={`/perro/${pet.id}`} style={{ textDecoration: 'none' }}>
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
                          {I.Dog(40)}
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
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <p style={{ color: T.muted, fontWeight: 600 }}>
            Todos los perritos encontraron familia. Increible!
          </p>
        </Card>
      )}
    </div>
  )
}

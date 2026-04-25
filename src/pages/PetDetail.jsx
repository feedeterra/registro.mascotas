import { useState, useEffect } from 'react'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useParams, useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { supabase } from '../lib/supabase'
import { elapsedStr, waitingMessage, sizeLabel, sexLabel, inferTraits, PERSONALITY_TRAITS, generatePetStory, getPetPhoto, getWhatsAppLink } from '../utils'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Btn, Card, Badge, Skeleton, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const T = useT()
  const { isLogged, profile } = useAuthContext()
  const { config } = useShelterConfig()
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    async function fetchPet() {
      const { data, error } = await supabase
        .from('pets')
        .select('*, profiles(display_name, phone)')
        .eq('id', id)
        .single()

      if (!error && data) {
        setPet({
          ...data,
          ownerName: data.profiles?.display_name ?? '',
          ownerPhone: data.profiles?.phone ?? '',
        })
        setPhotoIdx(data.primary_photo_idx ?? 0)
      }
      setLoading(false)
    }
    fetchPet()
  }, [id])

  if (loading) return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <Skeleton width={80} height={18} style={{ marginBottom: 12 }} />
      <Card style={{ overflow: 'hidden' }}>
        <Skeleton height={0} style={{ paddingBottom: '75%' }} radius={0} />
        <div style={{ padding: '16px 20px' }}>
          <Skeleton width="50%" height={24} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[0,1,2,3].map(i => <Skeleton key={i} height={50} />)}
          </div>
        </div>
      </Card>
    </div>
  )

  if (!pet) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <p style={{ color: T.txt, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Este perrito ya no esta disponible</p>
      <p style={{ color: T.muted, fontWeight: 500, fontSize: 14, marginBottom: 16 }}>Puede que haya encontrado un hogar.</p>
      <Btn onClick={() => navigate('/')}>Ver otros perritos</Btn>
    </div>
  )

  const photos = pet.photos?.length ? pet.photos : []
  const currentPhoto = photos[photoIdx] || getPetPhoto(pet)
  const { handleTouchStart: handlePhotoSwipeStart, handleTouchEnd: handlePhotoSwipeEnd } = usePhotoSwipe(
    photos.length,
    () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1)),
    () => setPhotoIdx(i => Math.max(0, i - 1))
  )
  const isStray = pet.type === 'stray'
  const petName = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')

  // WhatsApp messages with context
  const userName = isLogged && profile?.display_name ? profile.display_name : ''
  const adoptMsg = userName
    ? `Hola! Soy ${userName} y me interesa adoptar a ${petName}. Vi su perfil en la app: ${window.location.href}`
    : `Hola! Me interesa adoptar a ${petName}. Vi su perfil en la app: ${window.location.href}`
  const sponsorMsg = `Hola! Quiero apadrinar a ${petName} del refugio.`
  const shareText = `Conoce a ${petName} 🐾 ${waitingMessage(pet.created_at)}. Cada compartida es una oportunidad mas.`
  const shareUrl = window.location.href

  const storedTags = pet.tags?.length > 0 ? pet.tags : []
  const inferred = storedTags.length > 0 ? [] : inferTraits(pet)
  const traits = [...new Set([...storedTags, ...inferred])]
  const story = pet.notes || generatePetStory({
    name: pet.name, sex: pet.sex, breed: pet.breed, size: pet.size,
    neighborhood: pet.neighborhood, createdAt: pet.created_at, notes: pet.notes,
  })

  const infoItems = [
    pet.breed && ['🐕 Raza', pet.breed],
    pet.color && ['🎨 Color', pet.color],
    pet.size && ['📏 Tamaño', sizeLabel(pet.size)],
    pet.sex && pet.sex !== 'unknown' && ['⚥ Sexo', sexLabel(pet.sex)],
    pet.neutered != null && ['💉 Castrado/a', pet.neutered ? 'Si' : 'No'],
    pet.neighborhood && ['📍 Zona', pet.neighborhood],
  ].filter(Boolean)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Conoce a ${petName}`, text: shareText, url: shareUrl })
      } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')
    }
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Back */}
      <button
        className="btn-press"
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: T.muted, fontWeight: 600, fontSize: 14, marginBottom: 12, padding: 0,
        }}
      >
        {I.Back()} Volver
      </button>

      {/* Photo Gallery */}
      <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{
            width: '100%', aspectRatio: '4/3', overflow: 'hidden',
            background: T.accentLt, position: 'relative',
          }}
          onTouchStart={handlePhotoSwipeStart}
          onTouchEnd={handlePhotoSwipeEnd}
        >
          {currentPhoto ? (
            <img src={currentPhoto} alt={petName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: T.accent,
            }}>
              {I.Dog(80)}
            </div>
          )}

          {pet.adoption_status === 'urgent' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            </div>
          )}
          {pet.adoption_status === 'shelter' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg="rgba(45,106,79,0.9)" color="#fff">Refugio CASA</Badge>
            </div>
          )}

          {/* Gallery nav */}
          {photos.length > 1 && (
            <>
              {photoIdx > 0 && (
                <button className="btn-press" onClick={() => setPhotoIdx(i => i - 1)} style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {I.ChevronLeft(18)}
                </button>
              )}
              {photoIdx < photos.length - 1 && (
                <button className="btn-press" onClick={() => setPhotoIdx(i => i + 1)} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {I.ChevronRight(18)}
                </button>
              )}
              {/* Dots */}
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={() => setPhotoIdx(i)} style={{
                    width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                    background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                    transition: 'background .2s',
                  }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Name + time waiting */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{petName}</h1>
            {pet.created_at && (
              <span style={{ fontSize: 12, color: T.purple, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                {elapsedStr(pet.created_at)}
              </span>
            )}
          </div>

          {/* Story / narrative */}
          <div style={{
            background: T.accentLt, borderRadius: RS, padding: '14px 16px',
            marginBottom: 16, borderLeft: `3px solid ${T.accent}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 6 }}>
              📖 Sobre {petName}
            </div>
            <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              "{story}"
            </p>
          </div>

          {/* Personality traits */}
          {traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {traits.map((trait, i) => (
                <span key={trait} className={`anim d${i + 1}`} style={{
                  padding: '6px 12px', borderRadius: 20,
                  background: T.purpleLt, color: T.purple,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {PERSONALITY_TRAITS[trait]
                    ? `${PERSONALITY_TRAITS[trait].emoji} ${PERSONALITY_TRAITS[trait].label}`
                    : trait.includes(':') ? trait.replace(':', ' ') : trait
                  }
                </span>
              ))}
            </div>
          )}

          {/* Waiting message */}
          {pet.created_at && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 16, fontSize: 13, color: T.purple, fontWeight: 600,
            }}>
              {I.Clock()} {waitingMessage(pet.created_at)}
            </div>
          )}

          {/* Info grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16,
          }}>
            {infoItems.map(([label, value]) => (
              <div key={label} style={{
                background: T.bg, borderRadius: RS, padding: '8px 12px',
              }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ═══ CTAs ═══ */}
          {isStray && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* CTA 1: Adoptar */}
              <a
                href={getWhatsAppLink(WHATSAPP, adoptMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press"
                style={{
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', borderRadius: R,
                  padding: '16px 20px', fontWeight: 800, fontSize: 16,
                  textDecoration: 'none', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 6px 20px ${T.accent}40`,
                }}
              >
                💜 Quiero darle un hogar a {pet.name || 'este perrito'}
              </a>

              {/* CTA 2: Apadrinar */}
              <a
                href={getWhatsAppLink(WHATSAPP, sponsorMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #f5e6c8, #e8d5a8)',
                  color: '#8a6d3b', borderRadius: RS,
                  padding: '14px 16px', fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', border: '1.5px solid #e8d5a8',
                }}
              >
                💛 Apadrinar a {pet.name || 'este perrito'}
              </a>

              {/* CTA 3: Donar un plato de comida */}
              <a
                href={DONATION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: T.okLt, color: T.ok,
                  borderRadius: RS, padding: '14px 16px',
                  fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', border: `1.5px solid ${T.ok}30`,
                }}
              >
                🍽️ Donar un plato de comida para {pet.name || 'este perrito'}
              </a>

              {/* CTA 3: Compartir */}
              <button
                onClick={handleShare}
                className="btn-press"
                style={{
                  background: T.bg, color: T.txt,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: RS, padding: '12px 16px', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                📤 Compartir — cada compartida es una oportunidad
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Adoption process */}
      {isStray && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: T.txt }}>
            ¿Como es el proceso de adopcion?
          </h3>
          {[
            { step: '1', title: 'Escribinos por WhatsApp', desc: 'Contanos sobre vos y tu hogar. Te respondemos rapido.' },
            { step: '2', title: 'Te enviamos un formulario', desc: 'Unas preguntas simples para conocerte mejor.' },
            { step: '3', title: 'Coordinamos una visita', desc: 'Conoces al perrito y te enamoras.' },
            { step: '4', title: 'Adopcion responsable', desc: 'Firmamos el compromiso y tu nuevo compañero va a casa.' },
          ].map((item, i) => (
            <div key={item.step} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: T.accentLt, color: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{item.title}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{item.desc}</div>
              </div>
            </div>
          ))}

          {/* Direct WhatsApp link after process */}
          <a
            href={getWhatsAppLink(WHATSAPP, adoptMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 16, padding: '10px 16px',
              background: '#25D366', color: '#fff',
              borderRadius: RS, fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            💬 Escribinos ahora
          </a>
        </Card>
      )}

      {/* Sponsor contextual */}
      <SponsorZone tier="standard" style={{ marginTop: 16 }} />
    </div>
  )
}

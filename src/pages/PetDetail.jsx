import { useState, useEffect } from 'react'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useParams, useNavigate } from 'react-router-dom'
import { useT, RS, R } from '../theme'
import { supabase } from '../lib/supabase'
import { waitingLabel, sizeLabel, sexLabel, inferTraits, generatePetStory, getPetPhoto, getWhatsAppLink, PERSONALITY_TRAITS } from '../utils'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card, Skeleton, Btn, Badge, PageLoader, SponsorZone } from '../components/ui'
import DonationButton from '../components/DonationButton'
import { I } from '../components/ui/Icons'
import { optimizeImage } from '../utils/images'
import SEO from '../components/SEO'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'
import { Dog, MapPin, Utensils, Heart, Star, Share2, MessageCircle, BookOpen, Palette, Ruler, ChevronRight, Bone, Coffee, Shield, Baby, Cat, GraduationCap, Users, Tag, PawPrint, EyeOff } from 'lucide-react'

const TraitIcon = { Heart, Bone, Coffee, Shield, Baby, Dog, Cat, GraduationCap, Users, PawPrint, EyeOff }

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const T = useT()
  const { isLogged, profile } = useAuthContext()
  const ctx = useShelterConfig()
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchPet() {
      setLoading(true)
      const { data, error } = await supabase
        .from('pets')
        .select('*, profiles(display_name, phone), shelters(id, name, city, slug, shelter_config(*))')
        .eq('id', id)
        .single()

      if (cancelled) return

      if (!error && data) {
        setPet({
          ...data,
          ownerName: data.profiles?.display_name ?? '',
          ownerPhone: data.profiles?.phone ?? '',
          photos: (data.adoption_status === 'adopted' && data.adopted_photo_url) 
            ? [data.adopted_photo_url]
            : (data.photos || []),
          photoPositions: (data.adoption_status === 'adopted' && data.adopted_photo_url)
            ? [{ x: 50, y: 50 }]
            : (data.photo_positions || [])
        })
        setPhotoIdx(0)
      }
      setLoading(false)
    }
    fetchPet()
    return () => { cancelled = true }
  }, [id])

  const seo = (
    <SEO 
      title={`Adoptá a ${name}`}
      description={description}
      image={image}
      type="article"
    />
  )

  if (loading) return (
    <div style={{ padding: 20, paddingTop: 40 }}>
      {seo}

      <Skeleton width="60%" height={20} style={{ marginBottom: 16 }} />
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <Skeleton height={350} radius={0} />
        <div style={{ padding: 20 }}>
          <Skeleton width="40%" height={24} style={{ marginBottom: 12 }} />
          <Skeleton width="90%" height={60} style={{ marginBottom: 20 }} />
          <Skeleton height={50} radius={R} />
        </div>
      </Card>
    </div>
  )

  if (!pet) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      {seo}
      <div style={{ color: T.ok, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{I.Heart(48)}</div>
      <p style={{ color: T.txt, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Este perrito no está disponible</p>
      <p style={{ color: T.muted, fontWeight: 500, fontSize: 14, marginBottom: 16 }}>Puede que haya encontrado un hogar o el link sea incorrecto.</p>
      <Btn onClick={() => navigate('/')}>Ver otros perritos</Btn>
    </div>
  )

  const isStray = pet.type === 'stray'
  const petName = name

  const photos = pet.photos?.length ? pet.photos : []
  const currentPhoto = photos[photoIdx] || getPetPhoto(pet)
  const { handleTouchStart: handlePhotoSwipeStart, handleTouchEnd: handlePhotoSwipeEnd } = usePhotoSwipe(
    photos.length,
    () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1)),
    () => setPhotoIdx(i => Math.max(0, i - 1))
  )

  useEffect(() => {
    if (pet.name) {
      document.title = `Adoptá a ${pet.name} | Perritos y Refugios`
    }
  }, [pet.name])

  // WhatsApp messages with context
  const userName = isLogged && profile?.display_name ? profile.display_name : ''
  const shareUrl = `${window.location.origin}/perro/${pet.id}`
  const adoptMsg = userName 
    ? `Hola! Soy ${userName} y me interesa adoptar a ${petName}. Vi su perfil en la app: ${shareUrl}`
    : `Hola! Me interesa adoptar a ${petName}. Vi su perfil en la app: ${shareUrl}`
  const sponsorMsg = `Hola! Quiero apadrinar a ${petName} del refugio.`
  const shareText = `Conocé a ${petName} ${waitingLabel(pet) ? `Lleva ${waitingLabel(pet)} esperando.` : ''} Cada compartida es una oportunidad más.`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Conocé a ${petName}`, text: shareText, url: shareUrl })
      } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')
    }
  }

  const storedTags = pet.tags?.length > 0 ? pet.tags : []
  const inferred = storedTags.length > 0 ? [] : inferTraits(pet)
  const traits = [...new Set([...storedTags, ...inferred])]
  const story = pet.notes || generatePetStory(pet, pet.shelters?.name)

  const infoItems = [
    pet.breed && pet.breed.toUpperCase() !== 'NO' && [<span style={{display:'flex', alignItems:'center', gap:4}}><Dog size={14} /> Raza</span>, pet.breed],
    pet.color && [<span style={{display:'flex', alignItems:'center', gap:4}}><Palette size={14}/> Color</span>, pet.color],
    pet.size && [<span style={{display:'flex', alignItems:'center', gap:4}}><Ruler size={14}/> Tamaño</span>, sizeLabel(pet.size)],
    pet.sex && pet.sex !== 'unknown' && ['Sexo', sexLabel(pet.sex)],
    pet.neutered != null && ['Castrado/a', pet.neutered ? 'Sí' : 'No'],
    pet.neighborhood && [<span style={{display:'flex', alignItems:'center', gap:4}}><MapPin size={14} /> Zona</span>, pet.neighborhood],
  ].filter(Boolean)

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {seo}

      {/* Back */}
      <button
        className="btn-press"
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', color: T.muted,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          marginBottom: 16, padding: 0
        }}
      >
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Volver
      </button>

      <Card style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {/* Photo gallery */}
        <div
          onTouchStart={handlePhotoSwipeStart}
          onTouchEnd={handlePhotoSwipeEnd}
          style={{ position: 'relative', width: '100%', aspectRatio: '1', background: T.bg }}
        >
          {currentPhoto ? (
            <img
              src={optimizeImage(currentPhoto, { width: 800 })}
              alt={pet.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: pet.photo_positions?.[photoIdx] ? `${pet.photo_positions[photoIdx].x}% ${pet.photo_positions[photoIdx].y}%` : 'center'
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
              <Dog size={64} strokeWidth={1} />
            </div>
          )}

          {/* Indicators */}
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 20, backdropFilter: 'blur(4px)'
            }}>
              {photos.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all .2s'
                }} />
              ))}
            </div>
          )}

          {/* Urgency Badge */}
          {pet.adoption_status === 'urgent' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            </div>
          )}
          {pet.adoption_status === 'adopted' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg={T.ok} color="#fff">ADOPTADO/A</Badge>
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.txt }}>{petName}</h1>
            {pet.shelterName && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: 'uppercase' }}>Refugio</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{pet.shelterName}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, color: T.muted, fontSize: 13, fontWeight: 600 }}>
            <MapPin size={14} /> {pet.neighborhood || pet.shelters?.city || 'Zona desconocida'}
          </div>

          {/* Traits */}
          {traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {traits.map((trait, i) => {
                const def = PERSONALITY_TRAITS[trait]
                if (!def) return null
                const Icon = TraitIcon[def.iconName] || Tag
                return (
                  <span key={trait} className={`anim d${i + 1}`} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 20,
                    border: `1.5px solid ${T.border}`,
                    background: 'transparent', color: T.txt,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    <Icon size={13} />{def.label}
                  </span>
                )
              })}
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
          {!isStray && (
            <a
              href={getWhatsAppLink(WHATSAPP, `Hola! Vi a ${pet.name || 'este perrito'} en la app y quería consultar.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press"
              style={{
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: '#fff', borderRadius: RS,
                padding: '16px 20px', fontWeight: 800, fontSize: 16,
                textDecoration: 'none', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 6px 20px ${T.accent}40`,
              }}
            >
              Consultar por {pet.name || 'este perrito'}
            </a>
          )}
          {isStray && pet.adoption_status !== 'adopted' && (
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
                <Heart size={18}/> Adoptar a {pet.name || 'este perrito'}
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
                <Star size={18} fill="currentColor"/> Apadrinar a {pet.name || 'este perrito'}
              </a>

              {/* CTA 3: Donar un plato de comida */}
              <DonationButton
                as="a"
                shelterSlug={pet.shelters?.slug}
                label="Donar un plato de comida"
                className="btn-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: T.okLt, color: T.ok,
                  borderRadius: RS, padding: '14px 16px',
                  fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', border: `1.5px solid ${T.ok}30`,
                  cursor: 'pointer'
                }}
              />

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
                <Share2 size={16}/> Compartir — cada compartida es una oportunidad
              </button>
            </div>
          )}
          {pet.adoption_status === 'adopted' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: T.ok, marginBottom: 8 }}>{I.HeartFill(32)}</div>
              <p style={{ fontWeight: 800, color: T.txt }}>¡{pet.name} ya tiene familia!</p>
              <p style={{ fontSize: 13, color: T.muted }}>Gracias a todos por compartir.</p>
              <button onClick={handleShare} style={{ 
                marginTop: 12, background: 'none', border: 'none', color: T.accent, 
                fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' 
              }}>
                Compartir historia
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Adoption process */}
      {isStray && pet.adoption_status !== 'adopted' && (
        <Card style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: T.txt }}>
            ¿Cómo es el proceso de adopción?
          </h3>
          {[
            { step: '1', title: 'Escribinos por WhatsApp', desc: 'Contanos sobre vos y tu hogar. Te respondemos rapido.' },
            { step: '2', title: 'Te enviamos un formulario', desc: 'Unas preguntas simples para conocerte mejor.' },
            { step: '3', title: 'Coordinamos una visita', desc: 'Vas al refugio, lo conocés en persona y ahí decidís.' },
            { step: '4', title: 'Adopción responsable', desc: 'Firmamos el compromiso y tu nuevo compañero va a casa.' },
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
            {I.WhatsApp(18)} Quiero empezar el proceso
          </a>
        </Card>
      )}

      {/* Story section */}
      <Card style={{ padding: 20, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: T.txt }}>
          <BookOpen size={18} style={{ verticalAlign: 'middle', marginRight: 6, color: T.accent }} /> 
          Historia de {petName}
        </h3>
        <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {story}
        </p>
      </Card>

      <SponsorZone tier="premium" style={{ marginTop: 20 }} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useParams, useNavigate } from 'react-router-dom'
import { useT, RS, R } from '../theme'
import { supabase } from '../lib/supabase'
import { waitingLabel, sizeLabel, sexLabel, inferTraits, generatePetStory, getPetPhoto, getWhatsAppLink, PERSONALITY_TRAITS } from '../utils'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card, Skeleton, Btn, Badge, PageLoader, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'
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
      const { data, error } = await supabase
        .from('pets')
        .select('*, profiles(display_name, phone)')
        .eq('id', id)
        .single()

      if (cancelled) return

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
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!pet) return

    const APP_URL = import.meta.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app'
    const name = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')
    const breedClean = pet.breed && pet.breed.toUpperCase() !== 'NO' ? ` · ${pet.breed}` : ''
    const zone = pet.neighborhood ? ` en ${pet.neighborhood}` : ''
    const title = `${name}${breedClean} — en adopción${zone}`
    const description = pet.notes
      ? pet.notes.slice(0, 160)
      : `${name} está esperando un hogar. Adoptalo responsablemente a través de nuestra red de refugios.`
    const image = (pet.photos?.[pet.primary_photo_idx ?? 0]) || (pet.photos?.[0]) || `${APP_URL}/og-default.jpg`
    const url = `${APP_URL}/perro/${pet.id}`

    const setMeta = (sel, val) => {
      const el = document.querySelector(sel)
      if (el) el.setAttribute('content', val)
    }

    const prev = {
      title: document.title,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDesc: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
      twTitle: document.querySelector('meta[name="twitter:title"]')?.content,
      twDesc: document.querySelector('meta[name="twitter:description"]')?.content,
      twImage: document.querySelector('meta[name="twitter:image"]')?.content,
    }

    document.title = title
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:image"]', image)
    setMeta('meta[property="og:url"]', url)
    setMeta('meta[property="og:type"]', 'article')
    setMeta('meta[name="twitter:title"]', title)
    setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[name="twitter:image"]', image)

    return () => {
      document.title = prev.title
      if (prev.ogTitle) setMeta('meta[property="og:title"]', prev.ogTitle)
      if (prev.ogDesc) setMeta('meta[property="og:description"]', prev.ogDesc)
      if (prev.ogImage) setMeta('meta[property="og:image"]', prev.ogImage)
      if (prev.ogUrl) setMeta('meta[property="og:url"]', prev.ogUrl)
      setMeta('meta[property="og:type"]', 'website')
      if (prev.twTitle) setMeta('meta[name="twitter:title"]', prev.twTitle)
      if (prev.twDesc) setMeta('meta[name="twitter:description"]', prev.twDesc)
      if (prev.twImage) setMeta('meta[name="twitter:image"]', prev.twImage)
    }
  }, [pet])

  const photos = pet?.photos?.length ? pet.photos : []
  const currentPhoto = photos[photoIdx] || (pet ? getPetPhoto(pet) : null)
  const { handleTouchStart: handlePhotoSwipeStart, handleTouchEnd: handlePhotoSwipeEnd } = usePhotoSwipe(
    photos.length,
    () => setPhotoIdx(i => Math.min(photos.length - 1, i + 1)),
    () => setPhotoIdx(i => Math.max(0, i - 1))
  )

  if (loading) return <PageLoader message="Cargando perfil del perrito..." />

  if (!pet) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: T.ok, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{I.Heart(48)}</div>
      <p style={{ color: T.txt, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Este perrito ya no está disponible</p>
      <p style={{ color: T.muted, fontWeight: 500, fontSize: 14, marginBottom: 16 }}>Puede que haya encontrado un hogar.</p>
      <Btn onClick={() => navigate('/')}>Ver otros perritos</Btn>
    </div>
  )

  const isStray = pet.type === 'stray'
  const petName = pet.name || (pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado')

  // WhatsApp messages with context
  const userName = isLogged && profile?.display_name ? profile.display_name : ''
  const adoptMsg = userName
    ? `Hola! Soy ${userName} y me interesa adoptar a ${petName}. Vi su perfil en la app: ${window.location.href}`
    : `Hola! Me interesa adoptar a ${petName}. Vi su perfil en la app: ${window.location.href}`
  const sponsorMsg = `Hola! Quiero apadrinar a ${petName} del refugio.`
  const shareText = `Conocé a ${petName} ${waitingLabel(pet) ? `Lleva ${waitingLabel(pet)} esperando.` : ''} Cada compartida es una oportunidad más.`
  const shareUrl = window.location.href

  const storedTags = pet.tags?.length > 0 ? pet.tags : []
  const inferred = storedTags.length > 0 ? [] : inferTraits(pet)
  const traits = [...new Set([...storedTags, ...inferred])]
  const story = pet.notes || generatePetStory({
    name: pet.name, sex: pet.sex, breed: pet.breed, size: pet.size,
    neighborhood: pet.neighborhood, createdAt: pet.createdAt, notes: pet.notes,
  })

  const infoItems = [
    pet.breed && pet.breed.toUpperCase() !== 'NO' && [<span style={{display:'flex', alignItems:'center', gap:4}}><Dog size={14} /> Raza</span>, pet.breed],
    pet.color && [<span style={{display:'flex', alignItems:'center', gap:4}}><Palette size={14}/> Color</span>, pet.color],
    pet.size && [<span style={{display:'flex', alignItems:'center', gap:4}}><Ruler size={14}/> Tamaño</span>, sizeLabel(pet.size)],
    pet.sex && pet.sex !== 'unknown' && ['Sexo', sexLabel(pet.sex)],
    pet.neutered != null && ['Castrado/a', pet.neutered ? 'Sí' : 'No'],
    pet.neighborhood && [<span style={{display:'flex', alignItems:'center', gap:4}}><MapPin size={14} /> Zona</span>, pet.neighborhood],
  ].filter(Boolean)

  const handleShare = async () => {
      if (navigator.share) {
      try {
        await navigator.share({ title: `Conocé a ${petName}`, text: shareText, url: shareUrl })
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

          {pet.adoptionStatus === 'urgent' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            </div>
          )}
           {pet.adoptionStatus === 'shelter' && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <Badge bg="rgba(45,106,79,0.9)" color="#fff">{pet.shelterName || 'Verificado'}</Badge>
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
                  <ChevronRight size={18} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: T.txt }}>{petName}</h1>
            {waitingLabel(pet) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: T.urgentLt, color: T.urgent,
                borderRadius: 20, padding: '5px 14px',
                fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap',
                boxShadow: `0 2px 8px ${T.urgent}14`
              }}>
                {waitingLabel(pet)}
              </span>
            )}
          </div>

          {/* Story / narrative */}
          <div style={{
            background: T.urgentLt,
            borderRadius: RS,
            padding: '18px 20px',
            marginBottom: 20,
            borderLeft: `5px solid ${T.accent}`,
            boxShadow: `0 4px 12px ${T.accent}0D`
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.accent,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <BookOpen size={14} strokeWidth={2.5}/> Sobre {petName}
            </div>
            <p style={{ 
              fontSize: 15, 
              color: T.txt, 
              lineHeight: 1.6, 
              fontStyle: 'italic', 
              margin: 0,
              opacity: 0.9
            }}>
              "{story}"
            </p>
          </div>

          {/* Personality traits */}
          {traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                <Utensils size={16} /> Ponerle un plato a {pet.name || 'este perrito'}
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
                <Share2 size={16}/> Compartir — cada compartida es una oportunidad
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Adoption process */}
      {isStray && (
        <Card style={{ padding: 20 }}>
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
            <MessageCircle size={16}/> Escribinos ahora
          </a>
        </Card>
      )}

      {/* Sponsor contextual */}
      <SponsorZone tier="standard" style={{ marginTop: 16 }} />
    </div>
  )
}

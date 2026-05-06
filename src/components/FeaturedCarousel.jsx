import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useT, RS, RM, R } from '../theme'
import { sizeLabel, sexLabel, getPetPhoto, getWhatsAppLink } from '../utils'
import { Card } from './ui'
import { I } from './ui/Icons'
import { Dog, MapPin, Utensils, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { DEFAULT_WHATSAPP } from '../lib/constants'
import { supabase } from '../lib/supabase'
import DonationButton from './DonationButton'

export default function FeaturedCarousel({ pets, compact = false }) {
  const T = useT()
  const photoMaxH = compact ? 220 : 400
  const titleFont = compact ? 20 : 28
  const gradPad = compact ? '36px 14px 12px' : '60px 20px 16px'
  const navBtn = compact ? 30 : 36
  const cardShadow = compact ? '0 6px 20px rgba(0,0,0,0.08)' : '0 12px 40px rgba(0,0,0,0.12)'
  const navigate = useNavigate()
  const ctx = useShelterConfigContext()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const transferAccounts = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []

  const [carouselIdx, setCarouselIdx] = useState(0)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const lastInteraction = useRef(Date.now())

  useEffect(() => {
    if (pets.length <= 0) { setCarouselIdx(0); return }
    setCarouselIdx(i => Math.max(0, Math.min(i, pets.length - 1)))
  }, [pets.length])

  useEffect(() => {
    if (pets.length <= 1) return
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 10000) {
        setCarouselIdx(i => (i + 1) % pets.length)
        setNotesExpanded(false)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [pets.length])

  const { handleTouchStart: handleSwipeStart, handleTouchEnd: handleSwipeEnd } = usePhotoSwipe(
    pets.length,
    () => { lastInteraction.current = Date.now(); setCarouselIdx(i => (i + 1) % pets.length); setNotesExpanded(false) },
    () => { lastInteraction.current = Date.now(); setCarouselIdx(i => (i - 1 + pets.length) % pets.length); setNotesExpanded(false) },
    30
  )

  const handleCarouselNext = () => {
    lastInteraction.current = Date.now()
    setCarouselIdx(i => (i + 1) % pets.length)
    setNotesExpanded(false)
  }

  const handleCarouselPrev = () => {
    lastInteraction.current = Date.now()
    setCarouselIdx(i => (i - 1 + pets.length) % pets.length)
    setNotesExpanded(false)
  }

  const curr = pets.length > 0 ? pets[carouselIdx % pets.length] : null

  if (!curr) return null

  return (
    <>
      <div className="anim d1" style={{ marginBottom: 20 }}>
        {/* Dots + position indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          {pets.slice(0, Math.min(pets.length, 10)).map((_, i) => (
            <div
              key={i}
              onClick={() => { setCarouselIdx(i); lastInteraction.current = Date.now(); setNotesExpanded(false) }}
              style={{
                width: carouselIdx % pets.length === i ? 18 : 6,
                height: 6, borderRadius: 3, cursor: 'pointer',
                background: carouselIdx % pets.length === i ? T.accent : T.border,
                transition: 'all .3s',
              }}
            />
          ))}
          {pets.length > 1 && (
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginLeft: 6 }}>
              {(carouselIdx % pets.length) + 1}/{pets.length}
            </span>
          )}
        </div>

        <div key={carouselIdx} className="anim">
          <Card
            style={{
              overflow: 'hidden', borderRadius: R,
              border: curr.adoptionStatus === 'urgent' ? `2px solid ${T.urgent}` : `1.5px solid ${T.borderLt}`,
              boxShadow: cardShadow,
            }}
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              {(() => {
                const photoIdx = curr.primaryPhotoIdx ?? 0
                const photo = curr.photos?.[photoIdx] || curr.photo
                const pos = curr.photoPositions?.[photoIdx]
                const objectPosition = !pos ? 'center' : typeof pos === 'string' ? pos : (pos.x != null && pos.y != null ? `${pos.x}% ${pos.y}%` : 'center')
                return photo
                  ? <img src={photo} alt={curr.name} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', objectPosition, display: 'block', maxHeight: photoMaxH }} decoding="async" loading="lazy" />
                  : <div style={{ width: '100%', aspectRatio: '4/5', maxHeight: photoMaxH, background: T.purpleLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}>{I.Dog(compact ? 48 : 80)}</div>
              })()}

              {/* Badges */}
              <div style={{ position: 'absolute', top: compact ? 8 : 14, left: compact ? 8 : 14, zIndex: 4, display: 'flex', gap: 8 }}>
                <span style={{
                  background: curr.adoptionStatus === 'urgent' ? T.urgent : 'rgba(0,0,0,0.45)',
                  backdropFilter: curr.adoptionStatus !== 'urgent' ? 'blur(6px)' : undefined,
                  color: '#fff', padding: compact ? '3px 9px' : '5px 12px', borderRadius: RS,
                  fontSize: compact ? 10 : 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {curr.adoptionStatus === 'urgent' ? 'URGENTE' : curr.adoptionStatus === 'transit' ? 'En tránsito' : 'En refugio'}
                </span>
              </div>

              {/* Name overlay (pointer-events none para no tapar flechas) */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                padding: gradPad, color: '#fff', pointerEvents: 'none',
              }}>
                <h3 style={{ fontSize: titleFont, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.5px' }}>{curr.name}</h3>
                <p style={{ fontSize: compact ? 12 : 14, opacity: .95, margin: 0, fontWeight: 500 }}>
                  {[curr.age ? `${curr.age} años` : (curr.breed && curr.breed.toUpperCase() !== 'NO' ? curr.breed : null), sexLabel(curr.sex), sizeLabel(curr.size)].filter(Boolean).join(' · ')}
                </p>
                {curr.waiting_number && curr.waiting_unit && (
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: 'rgba(255,200,150,0.95)' }}>
                    {curr.waiting_number} {curr.waiting_unit} esperando una familia
                  </p>
                )}
              </div>

              {pets.length > 1 && (
                <>
                  <button
                    type="button"
                    className="btn-press"
                    aria-label="Anterior"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCarouselPrev() }}
                    style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 6,
                      width: navBtn, height: navBtn, borderRadius: '50%', border: 'none',
                      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={compact ? 18 : 22} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    className="btn-press"
                    aria-label="Siguiente"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCarouselNext() }}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 6,
                      width: navBtn, height: navBtn, borderRadius: '50%', border: 'none',
                      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={compact ? 18 : 22} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>

            {/* Info + description */}
            <div style={{ padding: compact ? '8px 14px' : '12px 20px', borderBottom: `1px solid ${T.borderLt}` }}>
              {curr.neighborhood && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: curr.notes ? 8 : 0 }}>
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {curr.neighborhood}</span>
                </div>
              )}
              {curr.notes && (
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                  {notesExpanded || curr.notes.length <= 120
                    ? curr.notes
                    : curr.notes.slice(0, 120) + '...'}
                  {curr.notes.length > 120 && (
                    <button
                      onClick={() => setNotesExpanded(!notesExpanded)}
                      style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4 }}
                    >
                      {notesExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Primary CTA */}
            <div style={{ padding: compact ? '8px 12px 6px' : '12px 14px 8px', background: T.bg }}>
              <button
                className="btn-press"
                onClick={() => navigate(`/perro/${curr.id}`)}
                style={{
                  width: '100%', padding: compact ? 10 : 14, borderRadius: RM, border: 'none',
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontSize: compact ? 13 : 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: `0 4px 14px ${T.accent}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Dog size={18}/> Ver ficha de {curr.name || 'este perrito'}
              </button>
            </div>

            {/* Secondary chips */}
            <div style={{ padding: compact ? '0 12px 10px' : '0 14px 14px', background: T.bg, display: 'flex', gap: 8 }}>
              <a
                href={getWhatsAppLink(WHATSAPP, `Hola! Quiero apadrinar a ${curr.name} del refugio.`)}
                target="_blank" rel="noopener noreferrer"
                className="btn-press"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 6px', background: T.accentLt,
                  color: T.accent, borderRadius: RS, fontWeight: 700, fontSize: 13,
                  textDecoration: 'none', border: `1px solid ${T.accent}25`,
                }}
              >
                <Star size={14}/> Apadrinar
              </a>
              <DonationButton
                shelterSlug={curr?.shelterSlug || shelterSlug}
                className="btn-press"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 6px', background: T.borderLt,
                  color: T.muted, borderRadius: RS, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${T.border}`, cursor: 'pointer',
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

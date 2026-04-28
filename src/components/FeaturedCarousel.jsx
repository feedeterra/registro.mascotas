import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useT, RS, RM, R } from '../theme'
import { sizeLabel, sexLabel, getPetPhoto, getWhatsAppLink } from '../utils'
import { Card } from './ui'
import { I } from './ui/Icons'
import { Dog, MapPin, Utensils, Star } from 'lucide-react'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { DEFAULT_WHATSAPP } from '../lib/constants'
import { supabase } from '../lib/supabase'

export default function FeaturedCarousel({ pets }) {
  const T = useT()
  const navigate = useNavigate()
  const ctx = useShelterConfigContext()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const transferAccounts = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []

  const [carouselIdx, setCarouselIdx] = useState(0)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [foodModalAccounts, setFoodModalAccounts] = useState([])
  const [copiedField, setCopiedField] = useState(null)
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
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            }}
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              {(() => {
                const photo = getPetPhoto(curr)
                return photo
                  ? <img src={photo} alt={curr.name} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block', maxHeight: 400 }} decoding="async" />
                  : <div style={{ width: '100%', aspectRatio: '4/5', maxHeight: 400, background: T.purpleLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}>{I.Dog(80)}</div>
              })()}

              {/* Badges */}
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                <span style={{
                  background: curr.adoptionStatus === 'urgent' ? T.urgent : 'rgba(0,0,0,0.45)',
                  backdropFilter: curr.adoptionStatus !== 'urgent' ? 'blur(6px)' : undefined,
                  color: '#fff', padding: '5px 12px', borderRadius: RS,
                  fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {curr.adoptionStatus === 'urgent' ? 'URGENTE' : curr.adoptionStatus === 'transit' ? 'En tránsito' : 'En refugio'}
                </span>
              </div>

              {/* Nav arrows */}
              {pets.length > 1 && (<>
                <button
                  className="btn-press"
                  onClick={handleCarouselPrev}
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                    color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >‹</button>
                <button
                  className="btn-press"
                  onClick={handleCarouselNext}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                    color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >›</button>
              </>)}

              {/* Name overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                padding: '60px 20px 16px', color: '#fff',
              }}>
                <h3 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.5px' }}>{curr.name}</h3>
                <p style={{ fontSize: 14, opacity: .95, margin: 0, fontWeight: 500 }}>
                  {[curr.age ? `${curr.age} años` : curr.breed, sexLabel(curr.sex), sizeLabel(curr.size)].filter(Boolean).join(' · ')}
                </p>
                {curr.waiting_number && curr.waiting_unit && (
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: 'rgba(255,200,150,0.95)' }}>
                    {curr.waiting_number} {curr.waiting_unit} esperando una familia
                  </p>
                )}
              </div>
            </div>

            {/* Info + description */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.borderLt}` }}>
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
            <div style={{ padding: '12px 14px 8px', background: T.bg }}>
              <button
                className="btn-press"
                onClick={() => navigate(shelterSlug ? `/refugio/${shelterSlug}/adoptar/${curr.id}` : `/perro/${curr.id}`)}
                style={{
                  width: '100%', padding: 14, borderRadius: RM, border: 'none',
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: `0 4px 14px ${T.accent}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Dog size={18}/> Ver ficha de {curr.name || 'este perrito'}
              </button>
            </div>

            {/* Secondary chips */}
            <div style={{ padding: '0 14px 14px', background: T.bg, display: 'flex', gap: 8 }}>
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
              <button
                onClick={async () => {
                  const slug = curr?.shelterSlug || shelterSlug
                  try {
                    if (slug) {
                      const { data: shelter } = await supabase.from('shelters').select('id').eq('slug', slug).single()
                      if (shelter?.id) {
                        const { data } = await supabase.from('shelter_config').select('transfer_accounts').eq('shelter_id', shelter.id).single()
                        setFoodModalAccounts(Array.isArray(data?.transfer_accounts) ? data.transfer_accounts : [])
                      } else {
                        setFoodModalAccounts(transferAccounts)
                      }
                    } else {
                      setFoodModalAccounts(transferAccounts)
                    }
                  } catch {
                    setFoodModalAccounts(transferAccounts)
                  }
                  setShowFoodModal(true)
                }}
                className="btn-press"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 6px', background: T.borderLt,
                  color: T.muted, borderRadius: RS, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${T.border}`, cursor: 'pointer',
                }}
              >
                <Utensils size={14}/> Ponerle un plato
              </button>
            </div>
          </Card>
        </div>
      </div>

      {showFoodModal && createPortal(
        <div
          onClick={() => setShowFoodModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, background: T.card, borderRadius: 24,
              padding: '24px 20px 28px', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ color: T.accent, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <Utensils size={48} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 6px' }}>Dale de comer hoy</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: '0 0 4px' }}>
                Con $5.000 {curr?.name || 'este perrito'} ya come toda una semana.
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                Tu donación va directo al refugio para comida y cuidados.
              </p>
            </div>

            {foodModalAccounts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {foodModalAccounts.map((acc, idx) => (
                  <Card key={idx} style={{ padding: 14, border: `1px solid ${T.borderLt}` }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.txt, marginBottom: 8 }}>
                      {acc.label || `Cuenta ${idx + 1}`}
                    </div>
                    {[
                      acc.titular && { label: 'Titular', value: acc.titular },
                      acc.alias && { label: 'Alias', value: acc.alias },
                      acc.cbu && { label: 'CBU', value: acc.cbu },
                      acc.cvu && { label: 'CVU', value: acc.cvu },
                    ].filter(Boolean).map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}: </span>
                          <span style={{ fontSize: 13, color: T.txt, fontWeight: 700 }}>{value}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(value)
                            setCopiedField(`${idx}-${label}`)
                            setTimeout(() => setCopiedField(null), 2000)
                          }}
                          style={{
                            background: copiedField === `${idx}-${label}` ? T.okLt : T.borderLt,
                            border: 'none', borderRadius: 8, padding: '4px 10px',
                            fontSize: 11, fontWeight: 700,
                            color: copiedField === `${idx}-${label}` ? T.ok : T.muted,
                            cursor: 'pointer', flexShrink: 0, marginLeft: 8,
                          }}
                        >
                          {copiedField === `${idx}-${label}` ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            ) : (
              <a
                href={getWhatsAppLink(WHATSAPP, `Hola! Quiero donar comida para los perritos del refugio.`)}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 18px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none',
                }}
              >
                Coordinar por WhatsApp
              </a>
            )}

            <button
              onClick={() => setShowFoodModal(false)}
              style={{
                width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12,
                background: T.borderLt, border: 'none', color: T.muted,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

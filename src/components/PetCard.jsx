import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../theme'
import { sizeLabel, waitingLabel, getWhatsAppLink, getPetUrl, getOptimizedPhoto } from '../utils'
import { Badge, Card, Skeleton } from './ui'
import { Heart, Dog, Star } from 'lucide-react'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { DEFAULT_WHATSAPP } from '../lib/constants'

const LS_FAVS = 'rm-pet-favs'

function getFavs() {
  try { return JSON.parse(localStorage.getItem(LS_FAVS)) || [] } catch { return [] }
}

function toggleFav(id) {
  const favs = getFavs()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem(LS_FAVS, JSON.stringify(next))
  return next
}

export default function PetCard({ pet, delay = 0, showSponsor = false, variant = 'default' }) {
  const T = useT()
  const ctx = useShelterConfigContext()
  const WHATSAPP = ctx?.config?.whatsapp_number || DEFAULT_WHATSAPP
  const petUrl = getPetUrl(pet)
  const isUrgent = pet.adoptionStatus === 'urgent'
  const photo = getOptimizedPhoto(pet.photos?.[pet.primaryPhotoIdx ?? 0] || pet.photo, 400)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isFav, setIsFav] = useState(() => getFavs().includes(pet.id))
  const [heartPop, setHeartPop] = useState(false)

  const isCompact = variant === 'compact'

  const handleFav = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleFav(pet.id)
    setIsFav(next.includes(pet.id))
    setHeartPop(true)
    setTimeout(() => setHeartPop(false), 300)
  }

  const fallbackName = pet.sex === 'female' ? 'Perrita rescatada' : 'Perrito rescatado'
  const sexIcon = pet.sex === 'female' ? '♀' : pet.sex === 'male' ? '♂' : null
  const sexColor = pet.sex === 'female' ? '#D4658A' : '#5B8CC0'

  return (
    <Link to={petUrl} style={{ textDecoration: 'none', width: isCompact ? 150 : 'auto', flexShrink: 0 }}>
      <Card
        interactive
        className={`anim d${delay}`}
        style={{
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: isUrgent ? `2px solid ${T.urgent}` : `1px solid ${T.borderLt}`,
        }}
      >
        {/* Photo Container */}
        <div style={{
          width: '100%', aspectRatio: isCompact ? '4/3' : '1', overflow: 'hidden',
          background: T.accentLt, position: 'relative',
        }}>
          {photo ? (
            <>
              <img
                src={photo}
                alt={pet.name}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: imgLoaded ? 1 : 0, transition: 'opacity .4s ease-out',
                }}
              />
              {!imgLoaded && <Skeleton height="100%" style={{ position: 'absolute', inset: 0 }} radius={0} />}
            </>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.accent, opacity: 0.5
            }}>
              <Dog size={isCompact ? 40 : 64} strokeWidth={1} />
            </div>
          )}

          {/* Status badge */}
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            {isUrgent ? (
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            ) : (
              <Badge bg="rgba(0,0,0,0.45)" color="#fff" style={{ backdropFilter: 'blur(4px)' }}>
                En adopción
              </Badge>
            )}
          </div>

          {/* Heart button */}
          {!isCompact && (
            <button
              onClick={handleFav}
              className={heartPop ? 'heart-pop' : ''}
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 44, height: 44,
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 2
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isFav ? T.accent : T.muted,
                transition: 'all .15s',
                transform: heartPop ? 'scale(1.2)' : 'scale(1)',
              }}>
                <Heart size={14} fill={isFav ? 'currentColor' : 'none'} stroke={isFav ? 'none' : 'currentColor'} />
              </div>
            </button>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: isCompact ? '10px' : '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: isCompact ? 14 : 15, color: T.txt }}>
              {pet.name || fallbackName}
            </span>
            {sexIcon && (
              <span style={{ fontSize: 13, color: sexColor, fontWeight: 700 }}>{sexIcon}</span>
            )}
          </div>

          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, fontWeight: 500 }}>
            {[pet.age ? `${pet.age} años` : null, sizeLabel(pet.size), pet.neutered ? (pet.sex === 'female' ? 'Castrada' : 'Castrado') : null].filter(Boolean).join(' · ')}
          </div>

          {!isCompact && waitingLabel(pet) && (
            <div style={{ fontSize: 10, fontWeight: 700, color: T.urgent, marginBottom: 4 }}>
              {waitingLabel(pet)} esperando una familia
            </div>
          )}

          {showSponsor && !isCompact && (
            <a
              href={getWhatsAppLink(WHATSAPP, `Hola! Quiero apadrinar a ${pet.name || 'este perrito'} del refugio.`)}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '7px 10px', borderRadius: 10, marginTop: 10,
                background: T.sponsorLt, border: `1px solid ${T.sponsorBorder}`,
                color: '#8a6d3b', fontWeight: 700, fontSize: 11,
                textDecoration: 'none',
              }}
            >
              <Star size={13} fill="currentColor" /> Apadrinar
            </a>
          )}
        </div>
      </Card>
    </Link>
  )
}

export { getFavs }

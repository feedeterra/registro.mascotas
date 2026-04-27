import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../theme'
import { waitingMessage, sizeLabel, getWhatsAppLink, getPetUrl } from '../utils'
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

export default function PetCard({ pet, delay = 0, showSponsor = false }) {
  const T = useT()
  const ctx = useShelterConfigContext()
  const WHATSAPP = ctx?.config?.whatsapp_number || DEFAULT_WHATSAPP
  const petUrl = getPetUrl(pet)
  const isUrgent = pet.adoptionStatus === 'urgent'
  const photo = pet.photos?.[pet.primaryPhotoIdx ?? 0] || pet.photo
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isFav, setIsFav] = useState(() => getFavs().includes(pet.id))
  const [heartPop, setHeartPop] = useState(false)

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

  // Simple trait inference for display
  const displayTraits = (pet.tags?.length > 0)
    ? pet.tags.slice(0, 2)
    : (pet.energy === 'high' ? ['Energética'] : pet.energy === 'low' ? ['Tranquilo'] : [])

  return (
    <Link to={petUrl} style={{ textDecoration: 'none' }}>
      <Card
        interactive
        className={`anim d${delay}`}
        style={{
          overflow: 'hidden',
          border: isUrgent ? `2px solid ${T.urgent}` : undefined,
        }}
      >
        {/* Photo */}
        <div style={{
          width: '100%', aspectRatio: '1', overflow: 'hidden',
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
                  opacity: imgLoaded ? 1 : 0, transition: 'opacity .3s',
                }}
              />
              {!imgLoaded && <Skeleton height="100%" style={{ position: 'absolute', inset: 0 }} radius={0} />}
            </>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.accent,
            }}>
              <Dog size={64} strokeWidth={1} />
            </div>
          )}

          {/* Status badge */}
          {isUrgent ? (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            </div>
          ) : (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <Badge bg={`${T.sage}CC`} color="#fff">En adopción</Badge>
            </div>
          )}

          {/* Heart/fav button — 44×44 touch target */}
          <button
            onClick={handleFav}
            className={heartPop ? 'heart-pop' : ''}
            style={{
              position: 'absolute', top: 0, right: 0,
              width: 44, height: 44,
              background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isFav ? T.accent : T.muted,
              transition: 'color .15s, transform .15s',
              transform: heartPop ? 'scale(1.2)' : 'scale(1)',
            }}>
              <Heart size={14} fill={isFav ? 'currentColor' : 'none'} stroke={isFav ? 'none' : 'currentColor'} />
            </div>
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: T.txt }}>
              {pet.name || fallbackName}
            </span>
            {sexIcon && (
              <span style={{ fontSize: 14, color: sexColor, fontWeight: 700 }}>{sexIcon}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
            {[pet.breed, sizeLabel(pet.size)].filter(Boolean).join(' · ')}
          </div>
          {/* Tiempo esperando */}
          {pet.createdAt && (
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginBottom: 6 }}>
              {waitingMessage(pet.createdAt)}
            </div>
          )}
          {/* Trait chips */}
          {displayTraits.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {displayTraits.map((trait, i) => (
                <span key={i} style={{
                  padding: '3px 8px', borderRadius: 8,
                  background: T.borderLt, color: T.muted,
                  fontSize: 10, fontWeight: 600,
                }}>
                  {trait}
                </span>
              ))}
            </div>
          )}
          {showSponsor && (
            <a
              href={getWhatsAppLink(WHATSAPP, `Hola! Quiero apadrinar a ${pet.name || 'este perrito'} del refugio.`)}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 10, marginTop: 8,
                background: T.sponsorLt, border: `1px solid ${T.sponsorBorder}`,
                color: '#8a6d3b', fontWeight: 700, fontSize: 12,
                textDecoration: 'none',
              }}
            >
              <Star size={14} fill="currentColor" /> Apadrinar
            </a>
          )}
        </div>
      </Card>
    </Link>
  )
}

export { getFavs }

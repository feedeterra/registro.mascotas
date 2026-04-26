import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT, R } from '../theme'
import { waitingMessage, sizeLabel, getWhatsAppLink } from '../utils'
import { Badge, Card, Skeleton } from './ui'
import { I } from './ui/Icons'
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

  return (
    <Link to={`/perro/${pet.id}`} style={{ textDecoration: 'none' }}>
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
              {I.Dog(64)}
            </div>
          )}

          {/* Urgency badge */}
          {isUrgent && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <Badge bg={T.urgent} color="#fff">URGENTE</Badge>
            </div>
          )}

          {pet.adoptionStatus === 'shelter' && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <Badge bg="rgba(45,106,79,0.9)" color="#fff">Refugio</Badge>
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
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isFav ? T.accent : T.muted,
              transition: 'color .15s, transform .15s',
              transform: heartPop ? 'scale(1.2)' : 'scale(1)',
            }}>
              {isFav ? I.HeartFill(14) : I.Heart()}
            </div>
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.txt, marginBottom: 2 }}>
            {pet.name || fallbackName}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
            {[pet.breed, sizeLabel(pet.size)].filter(Boolean).join(' · ')}
          </div>
          {pet.createdAt && (
            <div style={{ fontSize: 11, color: T.purple, fontWeight: 600, marginBottom: showSponsor ? 8 : 0 }}>
              {waitingMessage(pet.createdAt)}
            </div>
          )}
          {showSponsor && (
            <a
              href={getWhatsAppLink(WHATSAPP, `Hola! Quiero apadrinar a ${pet.name || 'este perrito'} del refugio.`)}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 8,
                background: '#fdf8ec', border: '1px solid #e8d48b',
                color: '#8a6d3b', fontWeight: 700, fontSize: 12,
                textDecoration: 'none',
              }}
            >
              🌟 Apadrinar
            </a>
          )}
        </div>
      </Card>
    </Link>
  )
}

export { getFavs }

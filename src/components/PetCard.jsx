import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT, R } from '../theme'
import { waitingMessage, sizeLabel } from '../utils'
import { Badge, Card, Skeleton } from './ui'
import { I } from './ui/Icons'

const LS_FAVS = 'refugio-casa-favs'

function getFavs() {
  try { return JSON.parse(localStorage.getItem(LS_FAVS)) || [] } catch { return [] }
}

function toggleFav(id) {
  const favs = getFavs()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem(LS_FAVS, JSON.stringify(next))
  return next
}

export default function PetCard({ pet, delay = 0 }) {
  const T = useT()
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

          {/* Heart/fav button */}
          <button
            onClick={handleFav}
            className={heartPop ? 'heart-pop' : ''}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              color: isFav ? T.accent : T.muted,
              transition: 'color .2s',
            }}
          >
            {isFav ? I.HeartFill(14) : I.Heart()}
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
            <div style={{ fontSize: 11, color: T.purple, fontWeight: 600 }}>
              {waitingMessage(pet.createdAt)}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

export { getFavs }

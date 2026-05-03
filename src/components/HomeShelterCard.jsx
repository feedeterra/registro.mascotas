import { Link } from 'react-router-dom'
import { useT, RS } from '../theme'
import { Card } from './ui'
import { I } from './ui/Icons'
import { optimizeImage } from '../utils/images'

const MEDIA_H = 180

/** Card de refugio (misma UI que "Refugios activos" en Home). `footer` opcional: pie dentro del mismo borde. */
export default function HomeShelterCard({
  to,
  name,
  city,
  province,
  coverUrl,
  volCount = 0,
  adoptableCount = 0,
  mediaHeight = MEDIA_H,
  footer = null,
}) {
  const T = useT()
  const locationLabel = [city, province].filter(Boolean).join(', ') || '—'
  return (
    <Card interactive style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ position: 'relative', height: mediaHeight, overflow: 'hidden', background: T.accentLt }}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.sage, zIndex: 0, pointerEvents: 'none',
          }}>
            {I.Paw(54)}
          </div>
          {coverUrl && (
            <img
              src={optimizeImage(coverUrl, { width: 600, height: 320 })}
              alt={name}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)',
          }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, padding: '11px 13px 11px' }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', marginBottom: 2, lineHeight: 1.2 }}>{name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
              {I.Loc()} {locationLabel}
            </div>
            <div style={{
              marginTop: 5,
              display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)',
              borderRadius: RS, padding: '4px 9px',
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {I.Users(11)} {volCount} voluntario{volCount !== 1 ? 's' : ''}
              </span>
              {adoptableCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, opacity: 0.95 }}>
                  · {I.Dog(11)} {adoptableCount} en adopción
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      {footer != null && (
        <div
          style={{
            borderTop: `1px solid ${T.borderLt}`,
            padding: '10px 12px 12px',
            background: T.card,
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      )}
    </Card>
  )
}

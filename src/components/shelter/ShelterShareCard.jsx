import { forwardRef } from 'react'
import { FONT } from '../../theme'

const ACCENT = '#C0542D'
const FONT_STACK = `${FONT}`

function normalizeText(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}

/**
 * Tarjeta para captura html-to-image (compartir refugio en redes).
 * @param {object} props
 * @param {string} props.shelterName
 * @param {string|null} props.photoSrc — data URL o null
 * @param {string} props.blurb — texto corto (misión / descripción)
 * @param {string|null} props.locationLabel
 * @param {'square'|'story'} props.format
 * @param {boolean} props.forExport
 * @param {string|null} [props.shelterUrlLabel]
 * @param {string} [props.photoObjectPosition]
 */
const ShelterShareCard = forwardRef(function ShelterShareCard(
  {
    shelterName,
    photoSrc,
    blurb,
    locationLabel = null,
    format,
    forExport,
    shelterUrlLabel = null,
    photoObjectPosition = '50% 50%',
  },
  ref
) {
  const scale = forExport ? 1 : format === 'square' ? 0.4 : 0.22
  const W = 1080
  const H = format === 'square' ? 1080 : 1920
  const gradientStart = format === 'square' ? '45%' : '50%'

  const title = normalizeText(shelterName) || 'Refugio'
  const body = normalizeText(blurb)
  const loc = normalizeText(locationLabel)

  const card = (
    <div
      ref={ref}
      data-shelter-share-root
      style={{
        width: W,
        height: H,
        fontFamily: FONT_STACK,
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#0b0b0b',
      }}
    >
      {photoSrc ? (
        <img
          alt=""
          src={photoSrc}
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: photoObjectPosition,
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 32,
            fontWeight: 700,
            background: `linear-gradient(145deg, ${ACCENT}, #7a3018)`,
          }}
        >
          Perritos y Refugios
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${gradientStart}, rgba(0,0,0,0.92) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 36,
          paddingBottom: format === 'story' ? 48 : 36,
          boxSizing: 'border-box',
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: -0.5,
            marginBottom: 0,
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: ACCENT,
            marginTop: 10,
            lineHeight: 1.15,
            whiteSpace: 'normal',
          }}
        >
          Adoptá, apadriná o sumate como voluntario
        </div>

        {body ? (
          <div
            style={{
              marginTop: 18,
              fontSize: 38,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.82)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
            }}
          >
            {body}
          </div>
        ) : null}

        {loc ? (
          <div
            style={{
              marginTop: 14,
              fontSize: 30,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.2,
            }}
          >
            {loc}
          </div>
        ) : null}

        {shelterUrlLabel ? (
          <div
            style={{
              marginTop: 26,
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            🐾 {shelterUrlLabel}
          </div>
        ) : null}
      </div>
    </div>
  )

  if (forExport) return card

  return (
    <div
      style={{
        width: Math.round(W * scale),
        height: Math.round(H * scale),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {card}
      </div>
    </div>
  )
})

export default ShelterShareCard

import { forwardRef } from 'react'
import { FONT } from '../../theme'

const ACCENT = '#C0542D'
const FONT_STACK = `${FONT}`

function normalizeText(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}

/**
 * Molde visual para captura con html-to-image: solo estilos inline y valores fijos.
 * @param {object} props
 * @param {string} props.petName
 * @param {string|null} props.petPhotoSrc — data URL o null
 * @param {string} props.storyText
 * @param {string|null} props.shelterName
 * @param {'square'|'story'} props.format
 * @param {boolean} props.forExport
 * @param {string|null} [props.shelterUrlLabel] — URL del refugio (dominio + `/refugio/:slug`)
 * @param {string} [props.photoObjectPosition]
 */
const StoryShareCard = forwardRef(function StoryShareCard(
  {
    petName,
    petPhotoSrc,
    storyText,
    shelterName,
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

  const name = petName || 'Historia'
  const story = normalizeText(storyText)
  const shelter = normalizeText(shelterName)

  const card = (
    <div
      ref={ref}
      data-story-share-root
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
      {petPhotoSrc ? (
        <img
          alt=""
          src={petPhotoSrc}
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
            background: '#191919',
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
            fontSize: 52,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: -0.5,
            marginBottom: 0,
            wordBreak: 'break-word',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: ACCENT,
            marginTop: 8,
            lineHeight: 1.15,
            whiteSpace: 'normal',
          }}
        >
          Encontró su hogar para siempre
        </div>

        {story ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.80)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
            }}
          >
            {story}
          </div>
        ) : null}

        {shelter ? (
          <div
            style={{
              marginTop: 12,
              fontSize: 22,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.2,
            }}
          >
            {shelter}
          </div>
        ) : null}

        {shelterUrlLabel ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 20,
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

export default StoryShareCard

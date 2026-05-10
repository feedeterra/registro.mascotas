import { Share2, CircleCheckBig } from 'lucide-react'
import { useT } from '../../theme'
import { Card } from '../ui'
import { optimizeImage } from '../../utils/images'
import { I } from '../ui/Icons'
import StoryEngagementSection from './StoryEngagementSection'

function heroObjectPosition(story) {
  if (story.photoAfterIdx === -1) return story.adoptedPhotoPosition || '50% 50%'
  const pos = Array.isArray(story.photoPositions) ? story.photoPositions[story.photoAfterIdx] : null
  if (typeof pos === 'string') return pos
  if (pos && typeof pos.x === 'number') return `${pos.x}% ${pos.y ?? 50}%`
  return '50% 50%'
}

/**
 * Card pública de historia de adopción (Home + /historias).
 * @param {{ story: object, onShare: (s: object) => void, className?: string, variant?: 'home' | 'historias' }} props
 */
export default function PublicSuccessStoryCard({ story, onShare, className = '', variant = 'home' }) {
  const T = useT()
  const paddingX = variant === 'home' ? '20px' : '16px'
  const imgOpts = variant === 'historias' ? { width: 600, quality: 85 } : { width: 600 }
  const adoptedBadgeLabel =
    story.sex === 'female' ? 'Adoptada' : story.sex === 'male' ? 'Adoptado' : 'Adoptado/a'

  const objectPosition = heroObjectPosition(story)

  return (
    <Card
      className={className}
      style={{ overflow: 'visible', padding: 0, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ position: 'relative' }}>
        {story.photoAfter ? (
          <img
            src={optimizeImage(story.photoAfter, imgOpts)}
            alt={story.petName}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{
              width: '100%',
              aspectRatio: '4/3',
              objectFit: 'cover',
              objectPosition,
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '4/3',
              background: T.sageLt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.sage,
            }}
          >
            {I.Paw(48)}
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <CircleCheckBig size={14} strokeWidth={2.5} color={T.ok} aria-hidden />
            {adoptedBadgeLabel}
          </div>
          {story.shelterName ? (
            <div
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                padding: variant === 'historias' ? '3px 10px' : '4px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                width: 'fit-content',
              }}
            >
              {story.shelterName}
            </div>
          ) : null}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            padding: '50px 20px 16px',
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 4,
              lineHeight: 1.1,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {story.petName}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            Encontró su hogar para siempre
          </div>
        </div>
      </div>

      {story.source === 'story' ? (
        <StoryEngagementSection
          storyId={story.id}
          petName={story.petName}
          paddingX={paddingX}
          onShare={() => onShare(story)}
          shareTitle={`Compartir historia de ${story.petName}`}
          quoteSlot={
            story.story ? (
              <div
                className={variant === 'home' ? 'home-story-card__body' : undefined}
                style={{ padding: 0 }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: T.txt,
                    lineHeight: variant === 'home' ? 1.5 : 1.6,
                    margin: 0,
                    fontStyle: 'italic',
                    ...(variant === 'historias' ? { opacity: 0.85 } : {}),
                  }}
                >
                  "{story.story}"
                </p>
              </div>
            ) : null
          }
        />
      ) : (
        <div
          style={{
            padding: `12px ${paddingX} 16px`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-press"
            aria-label={`Compartir historia de ${story.petName}`}
            onClick={() => onShare(story)}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 10,
              border: `1px solid ${T.borderLt}`,
              background: T.bg,
              color: T.txt,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Share2 size={15} aria-hidden />
            Compartir
          </button>
          <p style={{ margin: 0, fontSize: 10, color: T.muted, fontWeight: 600, lineHeight: 1.35 }}>
            Esta ficha sale del listado clásico de adoptados. Las historias del panel «Finales felices» permiten reacciones y comentarios en la web.
          </p>
        </div>
      )}
    </Card>
  )
}

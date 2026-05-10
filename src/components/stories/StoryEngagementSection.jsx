import { Share2 } from 'lucide-react'
import { useT } from '../../theme'
import { useStoryEngagement } from '../../hooks/useStoryEngagement'
import StoryReactions from './StoryReactions'
import StoryComments from './StoryComments'

/**
 * Reacciones + comentarios para `success_stories`.
 * @param {{ storyId: string, quoteSlot?: import('react').ReactNode, paddingX?: string, onShare?: () => void, shareTitle?: string, petName?: string }} props
 * Orden: corazón + compartir → descripción → comentarios.
 */
export default function StoryEngagementSection({
  storyId,
  quoteSlot = null,
  paddingX = '20px',
  onShare = null,
  shareTitle = 'Compartir',
  petName = '',
}) {
  const T = useT()
  const engagement = useStoryEngagement(storyId)

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 4,
        padding: `8px ${paddingX} 20px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <StoryReactions
          reactions={engagement.reactions}
          userReactionTypes={engagement.userReactionTypes}
          toggleReaction={engagement.toggleReaction}
          isLoadingReactions={engagement.isLoadingReactions}
        />
        {typeof onShare === 'function' ? (
          <button
            type="button"
            className="btn-press"
            aria-label={shareTitle}
            onClick={onShare}
            style={{
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
              flexShrink: 0,
            }}
          >
            <Share2 size={15} aria-hidden />
            Compartir
          </button>
        ) : null}
      </div>

      {quoteSlot ? (
        <div style={{ marginTop: 16 }}>{quoteSlot}</div>
      ) : null}

      <div
        style={{
          height: 1,
          background: T.borderLt,
          margin: '16px 0 10px',
          opacity: 0.85,
        }}
        aria-hidden
      />

      <StoryComments
        petName={petName}
        comments={engagement.comments}
        totalComments={engagement.totalComments}
        addComment={engagement.addComment}
        deleteComment={engagement.deleteComment}
        loadMoreComments={engagement.loadMoreComments}
        isLoadingComments={engagement.isLoadingComments}
        isLoadingMoreComments={engagement.isLoadingMoreComments}
        isSubmitting={engagement.isSubmitting}
        hasMoreComments={engagement.hasMoreComments}
      />
    </div>
  )
}

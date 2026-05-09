import { Trash2 } from 'lucide-react'
import { useT } from '../../theme'
import { formatRelativeTimeEs } from '../../utils/relativeTime'

function initials(name) {
  if (!name || typeof name !== 'string') return '?'
  const p = name.trim().split(/\s+/).slice(0, 2)
  return p.map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

/**
 * @param {{ comment: object, currentUserId?: string | null, onDelete?: (id: string) => void, contentLineClamp?: number }} props
 * `contentLineClamp`: recorta visualmente el texto en la card (modal: sin clamp).
 */
export default function StoryCommentRow({ comment, currentUserId, onDelete, contentLineClamp }) {
  const T = useT()
  const isMine = currentUserId && comment.user_id === currentUserId
  const url = comment.user?.avatar_url

  const clamp = typeof contentLineClamp === 'number' && contentLineClamp > 0
  const contentStyle = clamp
    ? {
        margin: '4px 0 0',
        fontSize: 13,
        color: T.txt,
        lineHeight: 1.4,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: contentLineClamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : {
        margin: '4px 0 0',
        fontSize: 13,
        color: T.txt,
        lineHeight: 1.4,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }

  return (
    <li
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        paddingBottom: 0,
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          width={32}
          height={32}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            border: `1px solid ${T.borderLt}`,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: T.accentLt,
            color: T.accent,
            fontWeight: 800,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${T.borderLt}`,
          }}
        >
          {initials(comment.user?.display_name)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: T.txt }}>
            {comment.user?.display_name || 'Usuario'}
          </span>
          <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>
            {formatRelativeTimeEs(comment.created_at)}
          </span>
        </div>
        <p style={contentStyle}>{comment.content}</p>
      </div>
      {isMine && onDelete && (
        <button
          type="button"
          className="btn-press"
          onClick={() => onDelete(comment.id)}
          aria-label="Borrar mi comentario"
          style={{
            padding: 6,
            border: 'none',
            background: 'transparent',
            color: T.muted,
            cursor: 'pointer',
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      )}
    </li>
  )
}

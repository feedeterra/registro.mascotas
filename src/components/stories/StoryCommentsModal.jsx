import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { MessageCircle, Send, X } from 'lucide-react'
import { useT, RS } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { useAuthContext } from '../../context/AuthContext'
import { STORY_COMMENT_MAX_LENGTH, validateStoryCommentContent } from '../../constants/storyEngagement'
import StoryCommentRow from './StoryCommentRow'

/**
 * Modal con todos los comentarios, paginación y compositor (misma lógica que la card).
 */
export default function StoryCommentsModal({
  open,
  onClose,
  petName,
  comments,
  totalComments,
  addComment,
  deleteComment,
  loadMoreComments,
  isLoadingComments,
  isLoadingMoreComments,
  isSubmitting,
  hasMoreComments,
}) {
  const T = useT()
  const toast = useToast()
  const { session } = useAuthContext()
  const uid = session?.user?.id ?? null

  const [text, setText] = useState('')
  const [composerFocus, setComposerFocus] = useState(false)
  const maxLen = STORY_COMMENT_MAX_LENGTH
  const len = text.length

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const remainingToLoad =
    typeof totalComments === 'number' && Array.isArray(comments)
      ? Math.max(0, totalComments - comments.length)
      : 0

  const submit = useCallback(async () => {
    if (isSubmitting) return
    const v = validateStoryCommentContent(text)
    if (!v.ok) {
      if (v.code === 'too_long') {
        toast.push({
          type: 'info',
          title: 'Comentario muy largo',
          message: `El máximo es ${STORY_COMMENT_MAX_LENGTH} caracteres.`,
        })
      }
      return
    }
    const prev = text
    const r = await addComment(v.value)
    if (r?.validationError) {
      if (r.code === 'too_long') {
        toast.push({
          type: 'info',
          title: 'Comentario muy largo',
          message: `El máximo es ${STORY_COMMENT_MAX_LENGTH} caracteres.`,
        })
      }
      return
    }
    if (r?.requiresAuth) {
      toast.push({
        type: 'info',
        title: 'Iniciá sesión',
        message: 'Registrate o iniciá sesión para comentar las historias.',
      })
      return
    }
    if (r?.rateLimited) {
      const ms = r.retryAfterMs || 0
      const mins = Math.max(1, Math.ceil(ms / 60000))
      const sec = Math.max(15, Math.ceil(ms / 1000))
      toast.push({
        type: 'info',
        title: 'Límite de comentarios',
        message:
          ms < 90_000
            ? `Esperá ${sec} segundos antes de comentar de nuevo en esta historia.`
            : `Ya enviaste 3 comentarios en esta historia en poco tiempo. Podés escribir otro en unos ${mins} minutos.`,
      })
      return
    }
    if (r?.rateLimitedServer) {
      setText(r.restoreText ?? prev)
      toast.push({
        type: 'info',
        title: 'Límite de comentarios',
        message: r.serverMessage || 'Probá más tarde.',
      })
      return
    }
    if (r?.error && r?.restoreText !== undefined) {
      setText(r.restoreText)
      toast.notifyError(new Error('comment'), {
        message: 'No se pudo publicar el comentario. Intentá de nuevo.',
      })
      return
    }
    setText('')
  }, [text, isSubmitting, addComment, toast])

  const onDelete = useCallback(
    async (commentId) => {
      const r = await deleteComment(commentId)
      if (r?.error) {
        toast.notifyError(new Error('delete'), {
          message: 'No se pudo borrar el comentario.',
        })
      }
    },
    [deleteComment, toast]
  )

  if (!open) return null

  const title =
    typeof totalComments === 'number'
      ? `Comentarios (${totalComments})`
      : 'Comentarios'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-comments-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-left))',
        background: 'rgba(0,0,0,0.45)',
      }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          maxHeight: 'min(85vh, 640px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: T.card,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          border: `1px solid ${T.borderLt}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            borderBottom: `1px solid ${T.borderLt}`,
            flexShrink: 0,
          }}
        >
          <h2
            id="story-comments-modal-title"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 900,
              color: T.txt,
              lineHeight: 1.2,
            }}
          >
            {title}
            {petName ? (
              <span style={{ fontWeight: 700, color: T.muted }}> · {petName}</span>
            ) : null}
          </h2>
          <button
            type="button"
            className="btn-press"
            aria-label="Cerrar"
            onClick={onClose}
            style={{
              padding: 8,
              borderRadius: RS,
              border: `1px solid ${T.borderLt}`,
              background: T.bg,
              color: T.txt,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '12px 16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoadingComments && comments.length === 0 ? (
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Cargando comentarios…</p>
          ) : comments.length === 0 ? (
            <div
              role="status"
              style={{
                padding: '28px 16px',
                borderRadius: RS,
                border: `1.5px dashed ${T.borderLt}`,
                background: T.card,
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: T.muted }}>
                <MessageCircle size={28} strokeWidth={2} aria-hidden />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.txt }}>Todavía no hay comentarios</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.45 }}>
                Escribí el primero abajo.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map((c) => (
                <StoryCommentRow key={c.id} comment={c} currentUserId={uid} onDelete={onDelete} />
              ))}
            </ul>
          )}

          {hasMoreComments && remainingToLoad > 0 && (
            <button
              type="button"
              className="btn-press"
              onClick={() => loadMoreComments()}
              disabled={isLoadingMoreComments}
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: RS,
                border: `1.5px solid ${T.borderLt}`,
                background: T.bg,
                color: T.accent,
                fontWeight: 800,
                fontSize: 13,
                cursor: isLoadingMoreComments ? 'wait' : 'pointer',
                width: '100%',
              }}
            >
              {isLoadingMoreComments
                ? 'Cargando…'
                : `Cargar más${remainingToLoad > 0 ? ` (${remainingToLoad})` : ''}`}
            </button>
          )}
        </div>

        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: `1px solid ${T.borderLt}`,
            flexShrink: 0,
            background: T.bg,
          }}
        >
          {!uid ? (
            <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.45 }}>
              <Link to="/login" style={{ color: T.accent, fontWeight: 800 }}>
                Iniciá sesión
              </Link>
              {' '}para comentar.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 2px 2px 10px',
                  borderRadius: 999,
                  border: `1.5px solid ${composerFocus ? T.accent : T.borderLt}`,
                  background: T.card,
                  boxShadow: composerFocus ? `0 0 0 3px ${T.accentLt}` : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <input
                  aria-label="Escribí un comentario"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, maxLen))}
                  placeholder={`Comentar (máx. ${maxLen} caracteres)…`}
                  onFocus={() => setComposerFocus(true)}
                  onBlur={() => setComposerFocus(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: T.txt,
                    outline: 'none',
                    boxShadow: 'none',
                    padding: '8px 0',
                  }}
                />
                <button
                  type="button"
                  className="btn-press"
                  disabled={!text.trim() || isSubmitting}
                  onClick={() => void submit()}
                  aria-label="Enviar comentario"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: 'none',
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !text.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: !text.trim() || isSubmitting ? 0.45 : 1,
                    flexShrink: 0,
                  }}
                >
                  <Send size={17} aria-hidden />
                </button>
              </div>
              {len >= maxLen - 50 && (
                <div style={{ fontSize: 10, color: len >= maxLen ? T.danger : T.muted, fontWeight: 600, marginTop: 6, paddingLeft: 12 }}>
                  {maxLen - len} caracteres
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

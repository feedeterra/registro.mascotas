import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import { useT, RS } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { useAuthContext } from '../../context/AuthContext'
import { STORY_COMMENT_MAX_LENGTH, validateStoryCommentContent } from '../../constants/storyEngagement'
import StoryCommentRow from './StoryCommentRow'
import StoryCommentsModal from './StoryCommentsModal'

/** Comentarios visibles en la card; el resto va al modal. */
const INLINE_MAX = 2

export default function StoryComments({
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
  const [modalOpen, setModalOpen] = useState(false)
  const maxLen = STORY_COMMENT_MAX_LENGTH
  const len = text.length

  const remainingToLoad =
    typeof totalComments === 'number' && Array.isArray(comments)
      ? Math.max(0, totalComments - comments.length)
      : 0

  const showList = !(isLoadingComments && comments.length === 0)
  const inlineComments = comments.slice(0, INLINE_MAX)

  const showOpenModalBtn =
    typeof totalComments === 'number' && totalComments > INLINE_MAX

  const isEmpty =
    showList &&
    typeof totalComments === 'number' &&
    totalComments === 0

  const openCommentsModal = useCallback(async () => {
    setModalOpen(true)
    if (remainingToLoad > 0 && !isLoadingMoreComments) {
      await loadMoreComments()
    }
  }, [remainingToLoad, isLoadingMoreComments, loadMoreComments])

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

  return (
    <div style={{ padding: '4px 0 8px' }}>
      {!showList ? (
        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 12px' }}>Cargando comentarios…</p>
      ) : isEmpty ? (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            marginBottom: 2,
            borderRadius: RS,
            border: `1.5px dashed ${T.borderLt}`,
            background: T.bg,
          }}
        >
          <MessageCircle size={18} strokeWidth={2} aria-hidden style={{ flexShrink: 0, color: T.muted }} />
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: T.txt, lineHeight: 1.25 }}>
              Sin comentarios aún
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted, lineHeight: 1.35 }}>
              Sé el primero en comentar.
            </p>
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inlineComments.map((c) => (
            <StoryCommentRow
              key={c.id}
              comment={c}
              currentUserId={uid}
              onDelete={onDelete}
              contentLineClamp={4}
            />
          ))}
        </ul>
      )}

      {showOpenModalBtn && (
        <button
          type="button"
          className="btn-press"
          onClick={() => void openCommentsModal()}
          disabled={isLoadingMoreComments}
          style={{
            marginTop: showList && inlineComments.length ? 8 : 0,
            marginBottom: 0,
            padding: '8px 12px',
            borderRadius: RS,
            border: `1.5px solid ${T.borderLt}`,
            background: T.bg,
            color: T.accent,
            fontWeight: 800,
            fontSize: 12,
            cursor: isLoadingMoreComments ? 'wait' : 'pointer',
            width: '100%',
          }}
        >
          {isLoadingMoreComments
            ? 'Cargando…'
            : `Ver todos los comentarios${typeof totalComments === 'number' ? ` (${totalComments})` : ''}`}
        </button>
      )}

      <StoryCommentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        petName={petName}
        comments={comments}
        totalComments={totalComments}
        addComment={addComment}
        deleteComment={deleteComment}
        loadMoreComments={loadMoreComments}
        isLoadingComments={isLoadingComments}
        isLoadingMoreComments={isLoadingMoreComments}
        isSubmitting={isSubmitting}
        hasMoreComments={hasMoreComments}
      />

      {!uid ? (
        <p style={{ fontSize: 12, color: T.muted, margin: '12px 0 0', lineHeight: 1.45 }}>
          <Link to="/login" style={{ color: T.accent, fontWeight: 800 }}>
            Iniciá sesión
          </Link>
          {' '}para comentar.
        </p>
      ) : (
        <div style={{ marginTop: inlineComments.length || showOpenModalBtn || isEmpty ? 12 : 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 2px 2px 10px',
              borderRadius: 999,
              border: `1.5px solid ${composerFocus ? T.accent : T.borderLt}`,
              background: T.bg,
              boxShadow: composerFocus ? `0 0 0 3px ${T.accentLt}` : 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <input
              aria-label="Escribí un comentario"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxLen))}
              placeholder="Comentar…"
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
                fontSize: 12,
                fontFamily: 'inherit',
                color: T.txt,
                outline: 'none',
                boxShadow: 'none',
                padding: '6px 0',
              }}
            />
            <button
              type="button"
              className="btn-press"
              disabled={!text.trim() || isSubmitting}
              onClick={() => void submit()}
              aria-label="Enviar comentario"
              style={{
                width: 34,
                height: 34,
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
              <Send size={16} aria-hidden />
            </button>
          </div>
          {len >= maxLen - 50 && (
            <div style={{ fontSize: 10, color: len >= maxLen ? T.danger : T.muted, fontWeight: 600, marginTop: 4, paddingLeft: 12 }}>
              {maxLen - len} caracteres
            </div>
          )}
        </div>
      )}
    </div>
  )
}

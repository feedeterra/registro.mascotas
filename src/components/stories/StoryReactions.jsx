import { useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useT, RS } from '../../theme'
import { useToast } from '../../context/ToastContext'

/** Solo me gusta (corazón) — coherente con historias de adopción. */
export default function StoryReactions({
  reactions,
  userReactionTypes,
  toggleReaction,
  isLoadingReactions,
}) {
  const T = useT()
  const toast = useToast()

  const count = reactions?.heart ?? 0
  const active = userReactionTypes?.includes('heart')

  const onPick = useCallback(async () => {
    const r = await toggleReaction('heart')
    if (r?.requiresAuth) {
      toast.push({
        type: 'info',
        title: 'Crea una cuenta',
        message: 'Registrate para reaccionar a las historias.',
      })
      return
    }
    if (r?.error) {
      toast.notifyError(new Error('reaction'), {
        message: 'No se pudo guardar la reacción. Intentá de nuevo.',
      })
    }
  }, [toggleReaction, toast])

  return (
    <button
      type="button"
      disabled={isLoadingReactions}
      aria-label={`Me encanta${count ? `, ${count}` : ''}`}
      aria-pressed={active}
      className="btn-press"
      onClick={onPick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '8px 14px',
        borderRadius: RS,
        border: `1px solid ${active ? T.accent : T.borderLt}`,
        background: active ? T.accentLt : T.bg,
        color: T.txt,
        cursor: isLoadingReactions ? 'wait' : 'pointer',
        flexShrink: 0,
      }}
    >
      <Heart
        size={18}
        strokeWidth={2.25}
        color={active ? T.accent : T.muted}
        aria-hidden
        fill={active ? T.accent : 'none'}
      />
      <span
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: 13,
          fontWeight: 800,
          color: count ? T.txt : T.muted,
        }}
      >
        {count}
      </span>
    </button>
  )
}

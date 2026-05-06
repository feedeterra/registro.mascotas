import { useState, useCallback } from 'react'
import { MessageCircle, X, PawPrint, Check } from 'lucide-react'
import { useT, RS, R } from '../theme'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../context/AuthContext'

/** Altura aproximada de la barra inferior + safe area (Navbar bottom nav) */
const FAB_BOTTOM_OFFSET = 'calc(12px + 52px + 6px + max(env(safe-area-inset-bottom, 0px), 6px))'

const LS_ANON = 'rm_feedback_anon_v1'
const MESSAGE_MAX = 500
const MESSAGE_MIN = 10

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Algo no funciona' },
  { value: 'idea', label: 'Idea' },
  { value: 'mejora', label: 'Mejora' },
  { value: 'otro', label: 'Otro' },
]

function getOrCreateAnonId() {
  try {
    let id = localStorage.getItem(LS_ANON)
    if (!id || id.length < 8) {
      id = crypto.randomUUID()
      localStorage.setItem(LS_ANON, id)
    }
    return id
  } catch {
    return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

function mapSubmitError(code) {
  const c = (code || '').toLowerCase()
  if (c.includes('cooldown')) return 'Ya enviaste feedback recientemente. Podés volver a hacerlo en unos días.'
  if (c.includes('rate_limit')) return 'Demasiados envíos desde esta red. Probá más tarde.'
  if (c.includes('invalid_message')) return `El mensaje debe tener entre ${MESSAGE_MIN} y ${MESSAGE_MAX} caracteres.`
  if (c.includes('invalid')) return 'Revisá los datos e intentá de nuevo.'
  return 'No pudimos enviar el feedback. Probá de nuevo más tarde.'
}

export default function FeedbackFloatingButton() {
  const T = useT()
  const { isLogged, profile } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('idea')
  const [rating, setRating] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState(null)
  const [done, setDone] = useState(false)

  const reset = useCallback(() => {
    setType('idea')
    setRating('')
    setHoverRating(0)
    setMessage('')
    setFormError(null)
    setDone(false)
  }, [])

  const close = () => {
    setOpen(false)
    reset()
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError(null)
    const msg = message.trim()
    if (msg.length < MESSAGE_MIN) {
      setFormError(`Escribí al menos ${MESSAGE_MIN} caracteres.`)
      return
    }
    if (msg.length > MESSAGE_MAX) {
      setFormError(`El mensaje puede tener como mucho ${MESSAGE_MAX} caracteres.`)
      return
    }

    const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!base || !anon) {
      setFormError('Falta configurar Supabase.')
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const anonId = getOrCreateAnonId()
      const payload = {
        anon_id: anonId,
        type,
        message: msg,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }
      if (rating !== '' && rating != null) {
        const n = Number(rating)
        if (n >= 1 && n <= 5) payload.rating = n
      }

      const res = await fetch(`${base}/functions/v1/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${token ?? anon}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(mapSubmitError(data.error || data.message || String(res.status)))
        return
      }
      setDone(true)
      setTimeout(() => close(), 1600)
    } catch (err) {
      setFormError(mapSubmitError(err.message))
    } finally {
      setSending(false)
    }
  }

  const ratingNum = rating === '' ? 0 : Number(rating)
  const pawsActive = hoverRating || ratingNum

  return (
    <>
      <style>{`
        .feedback-fab-wrap {
          position: fixed;
          right: 14px;
          bottom: ${FAB_BOTTOM_OFFSET};
          z-index: 850;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }
        .feedback-fab-wrap > * {
          pointer-events: auto;
        }
        .feedback-fab-hint {
          font-size: 12px;
          font-weight: 800;
          color: ${T.txt};
          background: ${T.card};
          border: 1.5px solid ${T.borderLt};
          padding: 8px 12px;
          border-radius: 12px;
          box-shadow: ${T.shadow};
          max-width: 200px;
          line-height: 1.35;
          text-align: left;
          display: block;
        }
        @media (min-width: 900px) {
          .feedback-fab-hint {
            opacity: 0;
            transform: translateX(6px);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .feedback-fab-wrap:hover .feedback-fab-hint {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 899px) {
          .feedback-fab-hint {
            display: none;
          }
          .feedback-fab-wrap {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }
        .feedback-fab-mobile-caption {
          display: none;
        }
        @media (max-width: 899px) {
          .feedback-fab-mobile-caption {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: black;
            text-align: right;
            line-height: 1.2;
            max-width: 76px;
            letter-spacing: 0.02em;
          }
        }
        .feedback-paw-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .feedback-paw-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          width: 100%;
          flex-wrap: nowrap;
        }
        .feedback-paw-btn {
          padding: 4px;
          border: none;
          cursor: pointer;
          border-radius: 12px;
          line-height: 0;
          background: transparent;
          transition: background-color 0.15s ease;
        }
        .feedback-paw-btn:hover {
          background: ${T.bg};
        }
        .feedback-paw-btn:focus-visible {
          outline: 2px solid ${T.accent};
          outline-offset: 2px;
        }
        .feedback-type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 380px) {
          .feedback-type-grid { grid-template-columns: 1fr; }
        }
        .feedback-type-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1.5px solid ${T.borderLt};
          background: ${T.card};
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: ${T.txt};
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .feedback-type-card[data-selected="true"] {
          border-color: ${T.accent};
          background: ${T.accentLt};
          box-shadow: 0 0 0 1px ${T.accent}33;
        }
        .feedback-type-card .feedback-type-check {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid ${T.border};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          background: ${T.card};
        }
        .feedback-type-card[data-selected="true"] .feedback-type-check {
          border-color: ${T.accent};
          background: ${T.accent};
          color: #fff;
        }
      `}</style>

      <div className="feedback-fab-wrap">
        <span className="feedback-fab-hint">
          ¿Ideas, un problema o una mejora?
          <br />
          Tocá, contanos y calificá.
        </span>
        <span className="feedback-fab-mobile-caption">Tu opinión</span>
        <button
          type="button"
          aria-label="Enviá tu opinión: ideas, problemas o mejoras"
          title="Enviá tu opinión"
          className="btn-press fab-pulse"
          onClick={() => { setOpen(true); reset() }}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: T.accent,
            color: '#fff',
            boxShadow: T.shadowLg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageCircle size={26} strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(44,36,23,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(ev) => ev.target === ev.currentTarget && close()}
        >
          <div
            className="anim"
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: 'min(90vh, 640px)',
              overflow: 'auto',
              background: T.card,
              borderRadius: R,
              boxShadow: T.shadowLg,
              border: `1.5px solid ${T.borderLt}`,
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 id="feedback-title" style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>
                  Tu opinión
                </h2>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.4 }}>
                  {isLogged
                    ? `Enviás con tu cuenta${profile?.display_name ? ` (${profile.display_name})` : ''}.`
                    : 'Enviás de forma anónima (guardamos un ID en este dispositivo para evitar spam).'}
                </p>
              </div>
              <button
                type="button"
                className="btn-press"
                aria-label="Cerrar"
                onClick={close}
                style={{
                  border: 'none',
                  background: T.borderLt,
                  borderRadius: RS,
                  padding: 8,
                  cursor: 'pointer',
                  color: T.txt,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {done ? (
              <p style={{ fontSize: 15, fontWeight: 700, color: T.ok, padding: '12px 0' }}>
                ¡Gracias! Recibimos tu mensaje.
              </p>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8 }}>Tipo</span>
                  <div role="radiogroup" aria-label="Tipo de feedback" className="feedback-type-grid">
                    {FEEDBACK_TYPES.map((opt) => {
                      const sel = type === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={sel}
                          data-selected={sel}
                          className="btn-press feedback-type-card"
                          onClick={() => setType(opt.value)}
                        >
                          <span className="feedback-type-check" aria-hidden>
                            {sel ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span style={{ lineHeight: 1.35 }}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>Mensaje</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Contanos qué pasó o qué te gustaría… (mín. ${MESSAGE_MIN}, máx. ${MESSAGE_MAX} caracteres)`}
                    rows={5}
                    maxLength={MESSAGE_MAX}
                  />
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{message.trim().length}/{MESSAGE_MAX}</div>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>
                    Calificación (opcional)
                  </span>
                  <p style={{ fontSize: 11, color: T.muted, marginBottom: 8, lineHeight: 1.35 }}>
                    Del 1 al 5: tocá las huellas de izquierda a derecha.
                  </p>
                  <div className="feedback-paw-stack">
                    <div
                      role="group"
                      aria-label="Calificación de 1 a 5 huellas"
                      className="feedback-paw-row"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((i) => {
                        const filled = i <= pawsActive
                        return (
                          <button
                            key={i}
                            type="button"
                            aria-label={`${i} de 5 huellas`}
                            aria-pressed={ratingNum === i}
                            onClick={() => setRating(ratingNum === i ? '' : String(i))}
                            onMouseEnter={() => setHoverRating(i)}
                            className="btn-press feedback-paw-btn"
                          >
                            <PawPrint
                              size={34}
                              strokeWidth={filled ? 1.75 : 2}
                              fill={filled ? T.accent : 'none'}
                              color={filled ? T.accentDk : T.muted}
                              aria-hidden
                            />
                          </button>
                        )
                      })}
                    </div>
                    {ratingNum > 0 && (
                      <button
                        type="button"
                        onClick={() => setRating('')}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.muted,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '2px 0',
                        }}
                      >
                        Quitar calificación
                      </button>
                    )}
                  </div>
                </div>

                {formError && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.danger, background: T.dangerLt, padding: '10px 12px', borderRadius: RS }}>
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-press"
                  style={{
                    marginTop: 4,
                    padding: '14px 18px',
                    borderRadius: '18px',
                    border: 'none',
                    background: T.accent,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: sending ? 'wait' : 'pointer',
                    opacity: sending ? 0.85 : 1,
                  }}
                >
                  {sending ? 'Enviando…' : 'Enviar feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useT, RS } from '../theme'
import { normalizeError } from '../lib/errors'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const T = useT()
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const tm = timersRef.current.get(id)
    if (tm) { clearTimeout(tm); timersRef.current.delete(id) }
  }, [])

  const push = useCallback((toast) => {
    const id = toast.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const t = {
      id,
      type: toast.type || 'info', // info | success | warn | error
      title: toast.title || '',
      message: toast.message || '',
      durationMs: toast.durationMs ?? 3500,
    }
    setToasts(prev => [t, ...prev].slice(0, 4))
    if (t.durationMs > 0) {
      const tm = setTimeout(() => remove(id), t.durationMs)
      timersRef.current.set(id, tm)
    }
    return id
  }, [remove])

  const notifyError = useCallback((err, opts = {}) => {
    const n = normalizeError(err)
    const type = n.severity === 'warn' ? 'warn' : 'error'
    push({
      type,
      title: opts.title || (type === 'warn' ? 'Atención' : 'Error'),
      message: opts.message || n.userMessage,
      durationMs: opts.durationMs ?? 4500,
    })
    // Keep debug in console for dev
    if (opts.log !== false) console.error('[error]', n.code, n.debugMessage || err)
  }, [push])

  const notifySuccess = useCallback((message, opts = {}) => {
    push({
      type: 'success',
      title: opts.title || 'Listo',
      message: message || opts.message || 'Guardado',
      durationMs: opts.durationMs ?? 2500,
    })
  }, [push])

  const value = useMemo(() => ({
    push,
    remove,
    notifyError,
    notifySuccess,
  }), [push, remove, notifyError, notifySuccess])

  // Catch unhandled async errors to avoid silent app breaks
  useEffect(() => {
    const onRejection = (e) => {
      notifyError(e?.reason || e, { title: 'Error inesperado', durationMs: 5000 })
    }
    window.addEventListener('unhandledrejection', onRejection)
    return () => window.removeEventListener('unhandledrejection', onRejection)
  }, [notifyError])

  const colors = {
    info: { bg: T.card, c: T.txt, b: T.borderLt },
    success: { bg: T.okLt, c: T.ok, b: `${T.ok}20` },
    warn: { bg: T.accentLt, c: T.accent, b: `${T.accent}25` },
    error: { bg: T.dangerLt, c: T.danger, b: `${T.danger}25` },
  }

  return (
    <ToastCtx.Provider value={value}>
      {children}

      <div style={{
        position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 2000, width: 'min(440px, calc(100vw - 24px))',
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const cc = colors[t.type] || colors.info
          return (
            <div key={t.id} className="anim" style={{
              pointerEvents: 'auto',
              background: cc.bg, color: cc.c,
              border: `1px solid ${cc.b}`,
              borderRadius: RS,
              padding: '10px 12px',
              boxShadow: T.shadowLg,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{t.title}</div>}
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35, opacity: 0.95 }}>
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => remove(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', opacity: 0.7, fontSize: 16, padding: 2,
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}


import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { useT, RS, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { DEFAULT_WHATSAPP_ADMIN } from '../lib/constants'

/** Misma base que feedback + espacio para el FAB de opinión debajo (56px + 12px). */
const SUPPORT_FAB_BOTTOM =
  'calc(12px + 52px + 6px + max(env(safe-area-inset-bottom, 0px), 6px) + 80px)'

const MOTIVOS = [
  { value: 'crear_refugio', label: 'Cargar / crear mi refugio' },
  { value: 'sponsor', label: 'Ser sponsor' },
  { value: 'consulta', label: 'Consulta u otro tema' },
]

function sanitizePhoneDigits(raw) {
  return String(raw || '').replace(/\D/g, '')
}

function isValidEmail(s) {
  const t = String(s || '').trim()
  if (t.length < 5) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

function WhatsAppGlyph({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function SupportWhatsAppFloatingButton() {
  const T = useT()
  const { isLogged, profile, session } = useAuthContext()
  const shelterCtx = useShelterConfigContext()
  const config = shelterCtx?.config
  const phoneDigits = sanitizePhoneDigits(
    config?.whatsapp_admin || config?.whatsapp_number || DEFAULT_WHATSAPP_ADMIN
  )

  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('consulta')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [detalle, setDetalle] = useState('')
  const [formError, setFormError] = useState(null)

  const reset = useCallback(() => {
    setMotivo('consulta')
    setNombre('')
    setEmail('')
    setTelefono('')
    setDetalle('')
    setFormError(null)
  }, [])

  const close = () => {
    setOpen(false)
    reset()
  }

  useEffect(() => {
    if (!open || !isLogged) return
    const mail =
      session?.user?.email?.trim() ||
      profile?.email?.trim() ||
      ''
    const tel = profile?.phone?.trim() || ''
    setNombre((prev) => (prev.trim() ? prev : (profile?.display_name?.trim() || '')))
    setEmail((prev) => (prev.trim() ? prev : mail))
    setTelefono((prev) => (prev.trim() ? prev : tel))
  }, [open, isLogged, profile?.display_name, profile?.phone, profile?.email, session?.user?.email])

  const openWhatsApp = (e) => {
    e.preventDefault()
    setFormError(null)
    const n = nombre.trim()
    const em = email.trim()
    const tel = telefono.trim()
    if (n.length < 2) {
      setFormError('Ingresá tu nombre o cómo te llamamos.')
      return
    }
    if (!isValidEmail(em)) {
      setFormError('Ingresá un correo válido.')
      return
    }
    if (tel.length < 6) {
      setFormError('Ingresá un teléfono de contacto (con código de área si aplica).')
      return
    }
    if (!phoneDigits || phoneDigits.length < 8) {
      setFormError('No hay un número de WhatsApp configurado. Escribinos por otra vía.')
      return
    }

    const labelMotivo = MOTIVOS.find((m) => m.value === motivo)?.label || motivo
    const extra = detalle.trim()
    const lines = [
      'Hola, les escribo desde la app *Perritos y refugios* (soporte / contacto).',
      '',
      `*Motivo:* ${labelMotivo}`,
      `*Nombre:* ${n}`,
      `*Email:* ${em}`,
      `*Teléfono:* ${tel}`,
    ]
    if (extra) {
      lines.push('', '*Detalle / consulta:*', extra)
    }

    const text = lines.join('\n')
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    close()
  }

  return (
    <>
      <style>{`
        .support-wa-fab-wrap {
          position: fixed;
          right: 14px;
          bottom: ${SUPPORT_FAB_BOTTOM};
          z-index: 850;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }
        .support-wa-fab-wrap > * {
          pointer-events: auto;
        }
        .support-wa-fab-hint {
          font-size: 12px;
          font-weight: 800;
          color: ${T.txt};
          background: ${T.card};
          border: 1.5px solid ${T.borderLt};
          padding: 8px 12px;
          border-radius: 12px;
          box-shadow: ${T.shadow};
          max-width: 220px;
          line-height: 1.35;
          text-align: left;
          display: block;
        }
        @media (min-width: 900px) {
          .support-wa-fab-hint {
            opacity: 0;
            transform: translateX(6px);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .support-wa-fab-wrap:hover .support-wa-fab-hint {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 899px) {
          .support-wa-fab-hint { display: none; }
          .support-wa-fab-wrap {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }
        .support-wa-fab-mobile-caption {
          display: none;
        }
        @media (max-width: 899px) {
          .support-wa-fab-mobile-caption {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: black;
            text-align: right;
            line-height: 1.2;
            max-width: 90px;
            letter-spacing: 0.02em;
          }
        }
      `}</style>

      <div className="support-wa-fab-wrap">
        <span className="support-wa-fab-hint">
          Soporte y contacto.
        </span>
        <span className="support-wa-fab-mobile-caption">Soporte</span>
        <button
          type="button"
          aria-label="Abrir contacto y soporte por WhatsApp"
          title="Soporte y contacto"
          className="btn-press"
          onClick={() => { setOpen(true); reset() }}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: '#25D366',
            color: '#fff',
            boxShadow: T.shadowLg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <WhatsAppGlyph size={28} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-wa-title"
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
                <h2 id="support-wa-title" style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>
                  Soporte y contacto
                </h2>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.45 }}>
                  Este canal es para hablar con el equipo por{' '}
                  <strong style={{ color: T.txt }}>problemas</strong>,{' '}
                  <strong style={{ color: T.txt }}>consultas</strong>, sumar tu{' '}
                  <strong style={{ color: T.txt }}>refugio</strong> a la app,{' '}
                  <strong style={{ color: T.txt }}>ser sponsor</strong> u otras gestiones.
                  Completá el formulario y se abrirá{' '}
                  <strong style={{ color: T.txt }}>WhatsApp</strong> con el mensaje listo para enviar.
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

            <form onSubmit={openWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
                  Motivo
                </label>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                  {MOTIVOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
                  Nombre <span style={{ color: T.danger }}>*</span>
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Cómo te llamamos"
                  autoComplete="name"
                  maxLength={80}
                />
                {isLogged && profile?.display_name && (
                  <div style={{ fontSize: 11, color: T.ok, marginTop: 4, fontWeight: 600 }}>
                    Nombre desde tu cuenta (podés corregirlo).
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
                  Email <span style={{ color: T.danger }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  maxLength={120}
                  inputMode="email"
                />
                {isLogged && (session?.user?.email || profile?.email) && (
                  <div style={{ fontSize: 11, color: T.ok, marginTop: 4, fontWeight: 600 }}>
                    Si tenés sesión, cargamos el mail de tu cuenta (podés cambiarlo).
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
                  Teléfono <span style={{ color: T.danger }}>*</span>
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Código de área + número"
                  autoComplete="tel"
                  maxLength={40}
                  inputMode="tel"
                />
                {isLogged && profile?.phone && (
                  <div style={{ fontSize: 11, color: T.ok, marginTop: 4, fontWeight: 600 }}>
                    Cargado desde tu perfil (podés editarlo).
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>
                  Detalle (opcional)
                </label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Contanos un poco más: horarios de contacto, nombre del refugio, dudas…"
                  rows={3}
                  maxLength={600}
                />
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{detalle.length}/600</div>
              </div>

              {formError && (
                <div style={{ fontSize: 13, fontWeight: 600, color: T.danger, background: T.dangerLt, padding: '10px 12px', borderRadius: RS }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="btn-press"
                style={{
                  marginTop: 4,
                  padding: '14px 18px',
                  borderRadius: '18px',
                  border: 'none',
                  background: '#25D366',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <WhatsAppGlyph size={22} /> Abrir WhatsApp con el mensaje
              </button>

              <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 2 }}>
                Se abre WhatsApp Web o la app en tu teléfono. Podés editar el mensaje antes de enviar.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

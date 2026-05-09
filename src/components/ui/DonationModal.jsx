import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT, RM, RS } from '../../theme'
import { Card } from './index'

export function DonationModal({
  isOpen,
  onClose,
  accounts = [],
  shelterName,
  loading,
  title = '¡Muchas gracias!',
  message = 'Tu donación ayuda a pagar comida, veterinario y refugio para los perritos que esperan una familia.',
}) {
  const T = useT()
  const [copiedField, setCopiedField] = useState(null)

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
      }}
    >
      <div
        className="modal-scroll"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: T.card, borderRadius: 24,
          padding: '24px 20px 28px',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 6px' }}>{title}</h3>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: T.muted, fontSize: 14 }}>
            Cargando cuentas...
          </div>
        ) : accounts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((acc, idx) => (
              <Card key={idx} style={{ padding: 14, border: `1px solid ${T.borderLt}` }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: T.txt, marginBottom: 8 }}>
                  {acc.label || shelterName || `Cuenta ${idx + 1}`}
                </div>
                {[
                  acc.titular && { label: 'Titular', value: acc.titular },
                  acc.alias && { label: 'Alias', value: acc.alias },
                  acc.cbu && { label: 'CBU', value: acc.cbu },
                  acc.cvu && { label: 'CVU', value: acc.cvu },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}: </span>
                      <span style={{ fontSize: 13, color: T.txt, fontWeight: 700 }}>{value}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(value)
                        setCopiedField(`${idx}-${label}`)
                        setTimeout(() => setCopiedField(null), 2000)
                      }}
                      style={{
                        background: copiedField === `${idx}-${label}` ? T.okLt : T.borderLt,
                        border: 'none', borderRadius: RS, padding: '4px 10px',
                        fontSize: 11, fontWeight: 700,
                        color: copiedField === `${idx}-${label}` ? T.ok : T.muted,
                        cursor: 'pointer', flexShrink: 0, marginLeft: 8,
                      }}
                    >
                      {copiedField === `${idx}-${label}` ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: T.muted, fontSize: 14 }}>
            Este refugio aún no ha configurado sus cuentas para donación.
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12,
            background: T.borderLt, border: 'none', color: T.muted,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  )
}

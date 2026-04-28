import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT, R, RS } from '../../theme'
import { Card, Btn } from '../ui'

export default function EditProfileModal({ profile, onClose, onSave }) {
  const T = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    displayName: profile?.display_name || '',
    phone: profile?.phone || '',
    neighborhood: profile?.neighborhood || ''
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil')
      setLoading(false)
    }
  }

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
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400, background: T.card, borderRadius: 24,
          padding: '24px 20px', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 16px', textAlign: 'center' }}>
          Editar Perfil
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>
              Nombre completo
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="¿Cómo te llamás?"
              style={{ width: '100%', padding: '10px 12px', borderRadius: RS, border: `1px solid ${T.borderLt}` }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ej: +54 9 11 1234 5678"
              style={{ width: '100%', padding: '10px 12px', borderRadius: RS, border: `1px solid ${T.borderLt}` }}
            />
            <p style={{ fontSize: 11, color: T.muted, margin: '4px 0 0' }}>Para que los refugios puedan contactarte rápidamente.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>
              Ciudad / Barrio
            </label>
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              placeholder="Ej: Palermo, CABA"
              style={{ width: '100%', padding: '10px 12px', borderRadius: RS, border: `1px solid ${T.borderLt}` }}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: T.dangerLt, color: T.danger, borderRadius: RS, fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn type="button" v="secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </Btn>
            <Btn type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Btn>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

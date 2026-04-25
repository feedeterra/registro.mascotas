import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { Card, Btn } from '../components/ui'
import { DEFAULT_WHATSAPP } from '../lib/constants'

const ROLES = [
  { id: 'pasear', label: '🦮 Pasear perros', desc: 'Salidas en Capilla del Señor' },
  { id: 'alimentos', label: '🍽️ Donar alimentos', desc: 'Traer bolsas o croquetas' },
  { id: 'redes', label: '📱 Redes sociales', desc: 'Difundir adopciones y eventos' },
  { id: 'transporte', label: '🚗 Transporte', desc: 'Traslado de animales' },
  { id: 'otro', label: '✨ Otro', desc: 'Contanos cómo querés ayudar' },
]

export default function Voluntario() {
  const T = useT()
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form' | 'done'
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')

  const toggleRole = (id) => {
    setRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const handleSubmit = () => {
    if (!nombre.trim()) return setError('Ingresá tu nombre')
    if (!telefono.trim()) return setError('Ingresá tu teléfono o WhatsApp')
    if (roles.length === 0) return setError('Seleccioná al menos una forma de ayudar')
    setError('')

    const rolesText = roles.map(r => ROLES.find(x => x.id === r)?.label || r).join(', ')
    const msg = encodeURIComponent(
      `Hola! Quiero ser voluntario/a en Refugio CASA 🐾\n\nNombre: ${nombre.trim()}\nTeléfono: ${telefono.trim()}\nCómo puedo ayudar: ${rolesText}`
    )
    window.open(`https://wa.me/${DEFAULT_WHATSAPP}?text=${msg}`, '_blank')
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 10 }}>
            ¡Gracias, {nombre.split(' ')[0]}!
          </h1>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 18 }}>
            Te enviamos al chat de WhatsApp para coordinar tu incorporación.
            Pronto te sumamos al grupo de voluntarios del refugio.
          </p>
          <div style={{
            background: T.accentLt, borderRadius: RS,
            padding: '14px 16px', marginBottom: 20,
            fontSize: 13, color: T.accent, fontWeight: 700,
          }}>
            🤝 Ya somos más de 20 voluntarios activos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn sz="lg" onClick={() => navigate('/refugio/casa')}>
              🏠 Ver el refugio
            </Btn>
            <Btn v="secondary" onClick={() => { setStep('form'); setNombre(''); setTelefono(''); setRoles([]) }}>
              Volver al formulario
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
          🤝 Ser voluntario/a
        </h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          Completá este formulario y te contactamos por WhatsApp para coordinar.
        </p>
      </div>

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nombre */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6 }}>
              Nombre completo *
            </label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: María González"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6 }}>
              WhatsApp / Teléfono *
            </label>
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Ej: 2346 123456"
              type="tel"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Roles */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 8 }}>
              ¿Cómo querés ayudar? (elegí uno o más) *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROLES.map(role => {
                const selected = roles.includes(role.id)
                return (
                  <div
                    key={role.id}
                    className="btn-press"
                    onClick={() => toggleRole(role.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: RS, cursor: 'pointer',
                      border: `2px solid ${selected ? T.accent : T.border}`,
                      background: selected ? T.accentLt : T.bg,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? T.accent : T.border}`,
                      background: selected ? T.accent : 'transparent', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{role.label}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{role.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: RS,
              background: T.dangerLt, color: T.danger,
              fontSize: 12, fontWeight: 700,
            }}>
              {error}
            </div>
          )}

          <Btn sz="lg" onClick={handleSubmit}>
            📲 Enviar por WhatsApp
          </Btn>
        </div>
      </Card>

      <Card style={{ padding: 14, background: T.purpleLt, border: 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 4 }}>
          ¿Ya sos voluntario/a?
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          Escribinos al WhatsApp del refugio y te sumamos al grupo.
        </div>
      </Card>
    </div>
  )
}

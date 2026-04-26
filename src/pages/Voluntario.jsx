import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useT, RS } from '../theme'
import { Card, Btn } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { supabase } from '../lib/supabase'

const ROLES = [
  { id: 'pasear', label: '🦮 Pasear perros', desc: 'Salidas en el refugio' },
  { id: 'alimentos', label: '🍽️ Donar alimentos', desc: 'Traer bolsas o croquetas' },
  { id: 'redes', label: '📱 Redes sociales', desc: 'Difundir adopciones y eventos' },
  { id: 'transporte', label: '🚗 Transporte', desc: 'Traslado de animales' },
  { id: 'otro', label: '✨ Otro', desc: 'Contanos cómo querés ayudar' },
]

export default function Voluntario() {
  const T = useT()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLogged, updateProfile, signUpWithEmail, profile, subscribeToShelter } = useAuthContext()
  const ctx = useShelterConfigContext()
  const config = ctx?.config
  const groupUrl = config?.whatsapp_group_link || null
  const groupMsg = config?.volunteer_group_msg || 'Entrá al grupo de WhatsApp para enterarte de todo'

  // Aceptar ?refugio=<shelter_id> para pre-seleccionar
  const shelterIdParam = searchParams.get('refugio') || null

  const [shelters, setShelters] = useState([])
  const [selectedShelterId, setSelectedShelterId] = useState(shelterIdParam || '')
  const [sheltersLoading, setSheltersLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('shelters')
      .select('id, name, city, slug')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setShelters(data || [])
        // Si viene param o solo hay uno, pre-seleccionar
        if (!shelterIdParam && data?.length === 1) {
          setSelectedShelterId(data[0].id)
        }
        setSheltersLoading(false)
      })
  }, [shelterIdParam])

  const [step, setStep] = useState('form') // 'form' | 'register' | 'done'
  const [showGroupPopup, setShowGroupPopup] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [roles, setRoles] = useState([])
  const [formError, setFormError] = useState('')

  // Register step
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const toggleRole = (id) => {
    setRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const saveVolunteerData = async () => {
    await updateProfile({
      isVolunteer: true,
      phone: telefono.trim() || undefined,
      volunteerRoles: roles,
    })
    if (selectedShelterId) {
      await subscribeToShelter(selectedShelterId, roles)
    }
  }

  const handleFormNext = async () => {
    if (!nombre.trim()) return setFormError('Ingresá tu nombre')
    if (roles.length === 0) return setFormError('Seleccioná al menos una forma de ayudar')
    if (!selectedShelterId) return setFormError('Elegí el refugio al que querés sumarte')
    setFormError('')

    if (isLogged) {
      await saveVolunteerData()
      setStep('done')
      if (groupUrl) setShowGroupPopup(true)
    } else {
      setStep('register')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegLoading(true)
    try {
      await signUpWithEmail(email, password, nombre.trim())
      await saveVolunteerData()
      setStep('done')
      if (groupUrl) setShowGroupPopup(true)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already registered')) setRegError('Ese email ya tiene cuenta. Iniciá sesión primero.')
      else setRegError('No pudimos crear tu cuenta. Intentá de nuevo.')
    } finally {
      setRegLoading(false)
    }
  }

  const selectedShelter = shelters.find(s => s.id === selectedShelterId)

  // ── Step: Done ───────────────────────────────────────────────
  if (step === 'done') {
    const displayName = profile?.display_name || nombre.split(' ')[0]
    return (
      <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>

        {showGroupPopup && groupUrl && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 20px',
          }}>
            <div className="anim" style={{
              background: T.card, borderRadius: '20px 20px 16px 16px',
              padding: 24, maxWidth: 440, width: '100%',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>💬</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, textAlign: 'center', marginBottom: 8 }}>
                ¡Sumarte al grupo!
              </h2>
              <p style={{ fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
                {groupMsg}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowGroupPopup(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 0', borderRadius: RS,
                    background: '#25D366', color: '#fff',
                    fontWeight: 800, fontSize: 15, textDecoration: 'none',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.559 4.122 1.532 5.859L0 24l6.335-1.54A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.369l-.36-.214-3.732.907.948-3.635-.235-.373A9.817 9.817 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/>
                  </svg>
                  Entrar al grupo de WhatsApp
                </a>
                <button
                  onClick={() => setShowGroupPopup(false)}
                  style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, cursor: 'pointer', padding: '8px 0' }}
                >
                  Lo hago después
                </button>
              </div>
            </div>
          </div>
        )}

        <Card style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 10 }}>
            ¡Gracias, {displayName}!
          </h1>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 14 }}>
            Ya sos parte del equipo de voluntarios
            {selectedShelter ? ` de ${selectedShelter.name}` : ''}.
            Te vamos a contactar pronto para coordinar.
          </p>
          <div style={{
            background: T.accentLt, borderRadius: RS,
            padding: '14px 16px', marginBottom: 20,
            fontSize: 13, color: T.accent, fontWeight: 700,
          }}>
            🤝 Tu perfil quedó registrado como voluntario
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn sz="lg" onClick={() => navigate('/perfil')}>
              👤 Ver mi perfil
            </Btn>
            {selectedShelter && (
              <Btn v="secondary" onClick={() => navigate(`/refugio/${selectedShelter.slug}`)}>
                🏠 Ver el refugio
              </Btn>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // ── Step: Register ───────────────────────────────────────────
  if (step === 'register') {
    return (
      <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setStep('form')}
            style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            ← Volver
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>Creá tu cuenta</h1>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Tu perfil va a quedar ligado como voluntario{selectedShelter ? ` de ${selectedShelter.name}` : ''}.
          </p>
        </div>

        <Card style={{ padding: 14, marginBottom: 16, background: T.accentLt, border: 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Tu registro:</div>
          <div style={{ fontSize: 13, color: T.txt, fontWeight: 600 }}>{nombre}</div>
          {telefono && <div style={{ fontSize: 12, color: T.muted }}>📞 {telefono}</div>}
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            {roles.map(r => ROLES.find(x => x.id === r)?.label).join(' · ')}
          </div>
          {selectedShelter && (
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>🏠 {selectedShelter.name}</div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <input
              type="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />

            {regError && (
              <div style={{ padding: '10px 12px', borderRadius: RS, background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700 }}>
                {regError}
              </div>
            )}

            <button
              type="submit"
              disabled={regLoading}
              className="btn-press"
              style={{
                width: '100%', padding: '13px 0',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk || T.accent})`,
                color: '#fff', border: 'none', borderRadius: RS,
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}
            >
              {regLoading ? 'Creando cuenta...' : 'Crear cuenta y registrarme'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: T.muted }}>
            ¿Ya tenés cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            >
              Iniciá sesión
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Step: Form ───────────────────────────────────────────────
  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
          🤝 Ser voluntario/a
        </h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          Completá el formulario y creá tu perfil para sumarte al equipo de un refugio.
        </p>
      </div>

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selector de refugio */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6 }}>
              Refugio al que querés sumarte *
            </label>
            {sheltersLoading ? (
              <div style={{ fontSize: 13, color: T.muted }}>Cargando refugios...</div>
            ) : (
              <select
                value={selectedShelterId}
                onChange={e => setSelectedShelterId(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Elegí un refugio</option>
                {shelters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city || ''}</option>
                ))}
              </select>
            )}
          </div>

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

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 6 }}>
              WhatsApp / Teléfono (opcional)
            </label>
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Ej: 2346 123456"
              type="tel"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: 'block', marginBottom: 8 }}>
              ¿Cómo querés ayudar? *
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
                      width: 20, height: 20, borderRadius: 6,
                      border: `2px solid ${selected ? T.accent : T.border}`,
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

          {formError && (
            <div style={{ padding: '10px 12px', borderRadius: RS, background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700 }}>
              {formError}
            </div>
          )}

          <Btn sz="lg" onClick={handleFormNext}>
            Siguiente →
          </Btn>
        </div>
      </Card>

      <Card style={{ padding: 14, background: T.purpleLt, border: 'none' }}>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
          Al continuar vas a poder crear tu cuenta o iniciar sesión para que tu perfil quede registrado como voluntario.
        </div>
      </Card>
    </div>
  )
}

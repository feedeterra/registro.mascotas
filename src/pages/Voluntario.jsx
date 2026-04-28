import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useT, RS } from '../theme'
import { Card, Btn, PageLoader } from '../components/ui'
import { MapPin, Building, Dog, Heart, Settings, Shield, User, MessageCircle, CheckCircle, Check, Phone } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { supabase } from '../lib/supabase'

const ROLES = [
  { id: 'juntadas', label: 'Ir a las juntadas', desc: 'Participar de los encuentros del refugio' },
  { id: 'transporte_personas', label: 'Llevar personas', desc: 'Acercar voluntarios a las juntadas' },
  { id: 'transporte_perros', label: 'Trasladar perros', desc: 'Transportar animales cuando sea necesario' },
]

export default function Voluntario() {
  const T = useT()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLogged, updateProfile, signUpWithEmail, profile, subscribeToShelter, authLoading } = useAuthContext()
  const ctx = useShelterConfigContext()
  const config = ctx?.config
  const groupUrl = config?.whatsapp_group_link || null
  const groupMsg = config?.volunteer_group_msg || 'Entrá al grupo de WhatsApp para enterarte de todo'

  const shelterIdParam = searchParams.get('refugio') || null
  // ctx?.shelter?.id disponible cuando venimos de ShelterLayout (/refugio/:slug/voluntario)
  const contextShelterId = ctx?.shelter?.id || null

  const { slug } = useParams()
  const isShelterSubRoute = !!slug

  const [shelters, setShelters] = useState([])
  const [selectedShelterId, setSelectedShelterId] = useState(shelterIdParam || contextShelterId || '')
  const [sheltersLoading, setSheltersLoading] = useState(true)
  const [step, setStep] = useState(() => (shelterIdParam || contextShelterId || isShelterSubRoute) ? 'form' : 'loading')

  if (authLoading) return <PageLoader message="Verificando sesión..." />
  if (step === 'loading' && sheltersLoading) return <PageLoader message="Cargando refugios..." />

  useEffect(() => {
    supabase
      .from('shelters')
      .select('id, name, city, slug, cover_photo')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setShelters(data || [])
        setSheltersLoading(false)
        
        setStep(prev => {
          if (prev !== 'loading') return prev
          // Si estamos en una sub-ruta de refugio, NO podemos ir a pick-shelter bajo ninguna circunstancia
          if (isShelterSubRoute || contextShelterId || shelterIdParam) return 'form'
          
          // Solo si es la ruta global (/voluntario) y hay un solo refugio, lo auto-seleccionamos
          if (data?.length === 1) {
            setSelectedShelterId(data[0].id)
            return 'form'
          }
          return 'pick-shelter'
        })
      })
  }, [contextShelterId, shelterIdParam, isShelterSubRoute])

  // contextShelterId siempre tiene prioridad — sobrescribe cualquier estado previo
  useEffect(() => {
    if (!contextShelterId) return
    setSelectedShelterId(contextShelterId)
    setStep('form')
  }, [contextShelterId])
  const [showGroupPopup, setShowGroupPopup] = useState(false)
  const [nombre, setNombre] = useState(profile?.display_name || '')
  const [telefono, setTelefono] = useState(profile?.phone || '')
  const [roles, setRoles] = useState([])
  const [otraAyuda, setOtraAyuda] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (profile) {
      if (profile.display_name) setNombre(n => n || profile.display_name)
      if (profile.phone) setTelefono(t => t || profile.phone)
    }
  }, [profile])

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
      displayName: nombre.trim() || undefined,
      phone: telefono.trim() || undefined,
      volunteerRoles: roles,
      notes: otraAyuda.trim() || undefined,
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
      try {
        await saveVolunteerData()
        setStep('done')
        if (groupUrl) setShowGroupPopup(true)
      } catch {
        setFormError('Hubo un error al guardar tu registro. Intentá de nuevo.')
      }
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
    || (contextShelterId ? { id: contextShelterId, name: ctx?.shelter?.name || ctx?.config?.name || '', slug: ctx?.shelter?.slug || '' } : null)

  // ── Step: Loading ────────────────────────────────────────────
  if (step === 'loading') {
    if (authLoading) return <PageLoader message="Verificando sesión..." />
    return <PageLoader message="Cargando..." />
  }

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
              <div style={{ display: 'flex', justifyContent: 'center', color: T.purple, marginBottom: 12 }}><MessageCircle size={40}/></div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, textAlign: 'center', marginBottom: 8 }}>
                ¡Ya sos parte del equipo!
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
                  Entro más tarde
                </button>
              </div>
            </div>
          </div>
        )}

        <Card style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: T.ok }}><CheckCircle size={52}/></div>
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
            <span style={{display:'flex', gap:6, alignItems:'center'}}><Check size={16}/> Tu perfil quedó registrado como voluntario</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groupUrl ? (
              <a
                href={groupUrl}
                target="_blank" rel="noopener noreferrer"
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                  padding: '16px 20px', borderRadius: RS, 
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk || T.accent})`, 
                  color: '#fff', fontWeight: 900, fontSize: 16, textDecoration: 'none', 
                  boxShadow: `0 8px 24px ${T.accent}40`,
                  transition: 'transform 0.2s ease'
                }}
                className="btn-press"
              >
                <MessageCircle size={20} /> Entrar al grupo de WhatsApp
              </a>
            ) : config?.whatsapp_number ? (
              <a
                href={`https://wa.me/${config.whatsapp_admin || config.whatsapp_number}?text=${encodeURIComponent('Hola! Me registré como voluntario y quiero saber cómo sumarme.')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                  padding: '16px 20px', borderRadius: RS, 
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk || T.accent})`, 
                  color: '#fff', fontWeight: 900, fontSize: 16, textDecoration: 'none',
                  boxShadow: `0 8px 24px ${T.accent}40`
                }}
                className="btn-press"
              >
                <MessageCircle size={20} /> Escribile al refugio
              </a>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              {selectedShelter && (
                <button
                  className="btn-press"
                  onClick={() => navigate(`/refugio/${selectedShelter.slug}`)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '14px 10px', borderRadius: RS, border: `1.5px solid ${T.border}`,
                    background: '#fff', color: T.accent, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Building size={20} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Ver refugio</span>
                </button>
              )}
              
              <button
                className="btn-press"
                onClick={() => navigate(selectedShelter ? `/refugio/${selectedShelter.slug}/adoptar` : '/adoptar')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '14px 10px', borderRadius: RS, border: `1.5px solid ${T.border}`,
                  background: '#fff', color: T.accent, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Dog size={20} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>Ver perritos</span>
              </button>
            </div>

            <button 
              onClick={() => navigate('/perfil')}
              style={{ background: 'none', border: 'none', color: T.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
            >
              Ver mi perfil de voluntario →
            </button>
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
          {telefono && <div style={{ fontSize: 12, color: T.muted, display:'flex', gap:4, alignItems:'center' }}><Phone size={12}/> {telefono}</div>}
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            {roles.map(r => ROLES.find(x => x.id === r)?.label).join(' · ')}
          </div>
          {selectedShelter && (
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Building size={12} /> {selectedShelter.name}</div>
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

  // ── Step: Pick shelter ───────────────────────────────────────
  if (step === 'pick-shelter') {
    return (
      <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.txt, marginBottom: 6 }}>
            ¿A qué refugio querés sumarte?
          </h1>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Elegí el refugio y completá tu perfil de voluntario/a.
          </p>
        </div>
        {sheltersLoading ? (
          <PageLoader message="Cargando refugios..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shelters.map(s => {
              const cover = s.cover_photo || `https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400`
              return (
                <button
                  key={s.id}
                  className="btn-press"
                  onClick={() => { setSelectedShelterId(s.id); setStep('form') }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <Card interactive style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ position: 'relative', height: 130 }}>
                      <img src={cover} alt={s.name} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                      }} />
                      <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{s.name}</div>
                        {s.city && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {s.city}</div>}
                      </div>
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Step: Form ───────────────────────────────────────────────
  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        {!contextShelterId && !shelterIdParam && !isShelterSubRoute && (
          <button
            onClick={() => setStep('pick-shelter')}
            style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'block' }}
          >
            ← Cambiar refugio
          </button>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
          Unite al equipo
        </h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
          Completá el formulario y creá tu perfil para sumarte al equipo de un refugio.
        </p>
      </div>

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Refugio seleccionado */}
          {selectedShelter ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 12,
              background: T.accentLt, border: `1.5px solid ${T.accent}30`,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 2 }}>Refugio seleccionado</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>{selectedShelter.name}</div>
              </div>
              {!contextShelterId && !shelterIdParam && (
                <button
                  onClick={() => setStep('pick-shelter')}
                  style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : null}

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>
              ¿Algo más que quieras agregar? <span style={{ color: T.muted, fontWeight: 500 }}>(opcional)</span>
            </label>
            <textarea
              value={otraAyuda}
              onChange={e => setOtraAyuda(e.target.value)}
              placeholder="Contanos desde qué podés aportar, tu disponibilidad, etc."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: RS,
                border: `1.5px solid ${T.border}`, background: T.bg,
                fontSize: 13, color: T.txt, resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
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

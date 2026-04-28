import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useT, RS, RM, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { Card, Btn, SponsorZone, PageLoader } from '../components/ui'
import { useMyShelterAdmin } from '../hooks/useShelterAdmin'
import { useShelterAnnouncements, useShelterEvents } from '../hooks/useShelterContent'
import { supabase, uploadShelterImage } from '../lib/supabase'
import { compressImageToFile } from '../utils'
import { useToast } from '../context/ToastContext'
import { I } from '../components/ui/Icons'
import ShelterPetsPanel from '../components/ShelterPetsPanel'
import { User, Landmark, Save, Megaphone, CalendarDays, Camera, Loader, ChevronLeft, ChevronRight, Search, Calendar, MapPin } from 'lucide-react'

const TABS = [
  { key: 'pets', label: 'Perritos', icon: 'Dog' },
  { key: 'ann', label: 'Anuncios', icon: 'Megaphone' },
  { key: 'evt', label: 'Eventos', icon: 'Calendar' },
  { key: 'team', label: 'Equipo', icon: 'Users' },
  { key: 'info', label: 'Información', icon: 'Building' },
]

const getTabs = (isOwnerOrAdmin) => {
  if (isOwnerOrAdmin) return TABS
  return TABS.filter(t => t.key !== 'team')
}

export default function MyShelter() {
  const T = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams()
  const { isLogged, loading: authLoading, shelterId: userShelterId, isShelterStaff, isAdmin, profile } = useAuthContext()
  const toast = useToast()

  const queryParams = new URLSearchParams(location.search)
  const [targetId, setTargetId] = useState(queryParams.get('id') || userShelterId)

  // EFFECT: If we have a SLUG in URL but no ID yet, resolve ID from slug
  useEffect(() => {
    if (slug && !queryParams.get('id')) {
      supabase.from('shelters').select('id').eq('slug', slug).maybeSingle()
        .then(({ data }) => {
          if (data?.id) setTargetId(data.id)
        })
    } else if (queryParams.get('id')) {
        setTargetId(queryParams.get('id'))
    } else {
        setTargetId(userShelterId)
    }
  }, [slug, queryParams.get('id'), userShelterId])

  const { shelter, config, loading, shelterName, fetchAll, updateShelter, upsertConfig } = useMyShelterAdmin(targetId)

  const [tab, setTab] = useState('pets')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)
  const [annPage, setAnnPage] = useState(1)
  const [evtPage, setEvtPage] = useState(1)
  const ANN_PAGE_SIZE = 5
  const EVT_PAGE_SIZE = 5

  // Team state
  const [teamSearch, setTeamSearch] = useState('')
  const [teamResults, setTeamResults] = useState([])
  const [teamSearching, setTeamSearching] = useState(false)
  const [currentStaff, setCurrentStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [currentVolunteers, setCurrentVolunteers] = useState([])
  const [volunteersLoading, setVolunteersLoading] = useState(false)

  // Guard
  useEffect(() => {
    if (authLoading) return
    if (!isLogged) {
      navigate('/login', { replace: true, state: { returnTo: location.pathname } })
    } else if (!isShelterStaff && !isAdmin) {
      navigate('/', { replace: true })
    } else if (!isAdmin && targetId && userShelterId && targetId !== userShelterId) {
      // Isolation violation: non-admin trying to access another shelter
      navigate('/mi-refugio', { replace: true })
    }
  }, [authLoading, isLogged, isShelterStaff, isAdmin, targetId, userShelterId, navigate])

  useEffect(() => {
    if (tab === 'team' && targetId) {
      loadCurrentStaff()
      loadCurrentVolunteers()
    }
  }, [tab, targetId])

  const ann = useShelterAnnouncements(targetId, { page: annPage, pageSize: ANN_PAGE_SIZE })
  const evt = useShelterEvents(targetId, { page: evtPage, pageSize: EVT_PAGE_SIZE })
  const { pets, addPet } = usePets()

  // Inline create forms (as requested: keep form, remove "create card/button")
  const [newAnnBody, setNewAnnBody] = useState('')
  const [newAnnActive, setNewAnnActive] = useState(true)
  const [newEvtForm, setNewEvtForm] = useState(() => ({
    title: '',
    event_at: '',
    place: '',
    signup_link: '',
  }))

  const myPets = useMemo(() => {
    if (!targetId) return []
    return pets.filter(p => (p.type === 'stray' || p.shelterId) && p.shelterId === targetId)
  }, [pets, targetId])

  const [infoForm, setInfoForm] = useState(null)

  // Permission: Only owner of target shelter or superadmin can manage team
  const isOwnerOrAdmin = isAdmin || (profile?.shelter_role === 'owner' && profile?.shelter_id === targetId)

  const activeTabs = useMemo(() => getTabs(isOwnerOrAdmin), [isOwnerOrAdmin])

  useEffect(() => {
    if (!infoForm && (shelter || config)) {
      setInfoForm({
        city: shelter?.city || '',
        province: config?.province || '',
        name: config?.name || shelter?.name || '',
        description: config?.description || '',
        mission: config?.mission || '',
        whatsapp_number: config?.whatsapp_number || '',
        instagram_url: config?.instagram_url || '',
        facebook_url: config?.facebook_url || '',
        tiktok_url: config?.tiktok_url || '',
        whatsapp_group_link: config?.whatsapp_group_link || '',
        volunteer_group_msg: config?.volunteer_group_msg || '',
        donation_link: config?.donation_link || '',
        hero_image_url: config?.hero_image_url || '',
        shelter_image_url: config?.shelter_image_url || '',
        email: config?.email || '',
        legal_name: config?.legal_name || '',
        cuit: config?.cuit || '',
        registration_number: config?.registration_number || '',
        transfer_accounts: Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : [],

        // Legacy single-event + announcement-bar fields
        next_event_title: config?.next_event_title || '',
        next_event_date: config?.next_event_date ? config.next_event_date.slice(0, 16) : '',
        next_event_place: config?.next_event_place || '',
        next_event_whatsapp: config?.next_event_whatsapp || '',
        announcement_text: config?.announcement_text || '',
        announcement_active: config?.announcement_active || false,
        announcement_end_date: config?.announcement_end_date ? config.announcement_end_date.slice(0, 16) : '',
      })
    }
  }, [shelter, config, infoForm])

  const loadCurrentStaff = async () => {
    if (!targetId) return
    setStaffLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, phone, is_admin')
      .eq('shelter_id', targetId)
    setCurrentStaff(data || [])
    setStaffLoading(false)
  }

  const loadCurrentVolunteers = async () => {
    if (!targetId) return
    setVolunteersLoading(true)
    const { data } = await supabase
      .from('volunteer_subscriptions')
      .select('roles, user:profiles(id, display_name, phone)')
      .eq('shelter_id', targetId)
    setCurrentVolunteers(data || [])
    setVolunteersLoading(false)
  }

  const searchUsers = async (q) => {
    if (!q.trim()) { setTeamResults([]); return }
    setTeamSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, phone, shelter_id')
      .or(`display_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10)
    setTeamResults(data || [])
    setTeamSearching(false)
  }

  const assignStaff = async (profileId) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ shelter_id: targetId })
      .eq('id', profileId)
    if (err) { setError(err.message); return }
    setTeamResults(prev => prev.filter(p => p.id !== profileId))
    await loadCurrentStaff()
  }

  const removeStaff = async (profileId) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ shelter_id: null })
      .eq('id', profileId)
    if (err) { setError(err.message); return }
    setCurrentStaff(prev => prev.filter(p => p.id !== profileId))
  }

  if (authLoading) return <PageLoader message="Verificando sesión..." />
  if (!isLogged) return null
  if (!isShelterStaff && !isAdmin) return null

  const saveInfo = async () => {
    if (!infoForm) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      const cfgPayload = { ...infoForm }
      // Avoid sending "" to timestamptz fields (it breaks with: invalid input syntax for type timestamp with time zone: "")
      if (cfgPayload.next_event_date === '') cfgPayload.next_event_date = null
      else if (cfgPayload.next_event_date) cfgPayload.next_event_date = new Date(cfgPayload.next_event_date).toISOString()

      if (cfgPayload.announcement_end_date === '') cfgPayload.announcement_end_date = null
      else if (cfgPayload.announcement_end_date) cfgPayload.announcement_end_date = new Date(cfgPayload.announcement_end_date).toISOString()

      await updateShelter({ city: infoForm.city, province: infoForm.province, name: infoForm.name })
      await upsertConfig(cfgPayload)
      setSuccess('Guardado')
      toast?.notifySuccess?.('Refugio guardado')
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      const msg = e?.message || 'Error al guardar'
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level security')) {
        setError('No tenés permisos para guardar la configuración del refugio. Falta configurar RLS en Supabase para `shelter_config`.')
      } else {
        setError(msg)
      }
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  const friendlyRlsError = (err) => {
    const msg = (err?.message || '').toString()
    if (msg.includes('row-level security policy for table "shelter_events"')) {
      return 'No tenés permisos para crear/editar eventos. Falta configurar RLS en Supabase para `shelter_events` (INSERT/UPDATE/DELETE para staff del refugio).'
    }
    if (msg.includes('row-level security policy for table "shelter_announcements"')) {
      return 'No tenés permisos para crear/editar anuncios. Falta configurar RLS en Supabase para `shelter_announcements` (INSERT/UPDATE/DELETE para staff del refugio).'
    }
    if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level security')) {
      return 'Acción bloqueada por RLS en Supabase. Revisá políticas de acceso del refugio.'
    }
    return msg || 'Error'
  }

  const saveConfigOnly = async (changes) => {
    if (!targetId) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      await upsertConfig({ ...changes })
      setSuccess('Guardado')
      toast?.notifySuccess?.('Cambios guardados')
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      const msg = e?.message || 'Error al guardar'
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level security')) {
        setError('No tenés permisos para guardar esa configuración. Falta configurar RLS en Supabase para `shelter_config`.')
      } else {
        setError(msg)
      }
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  const createQuickPet = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const created = await addPet({
        shelterId: targetId,
        type: 'stray',
        status: 'found',
        adoptionStatus: 'shelter',
        name: 'Nuevo perrito',
        notes: '',
      })
      setSuccess(`Creado: ${created.name}`)
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      setError(e.message || 'Error al crear perrito')
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader message="Cargando perfil del perrito..." />

  return (
    <div className="anim" style={{ paddingTop: 12, paddingBottom: 24 }}>
      <h1 style={{ 
        fontSize: 22, fontWeight: 900, color: T.txt, marginBottom: 16, 
        display: 'flex', alignItems: 'center', gap: 10, letterSpacing: -0.5 
      }}>
        {I.Building(24)} Panel {shelterName}
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: T.borderLt, padding: 4, borderRadius: RM,
        border: `1px solid ${T.borderLt}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
      {activeTabs.map(t => (
          <button key={t.key} className="btn-press"
            onClick={() => { setTab(t.key); setError(null); setSuccess(null) }}
            style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              flex: 1, borderRadius: RS,
              background: tab === t.key ? '#fff' : 'transparent', 
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontWeight: 800, fontSize: 13,
              color: tab === t.key ? T.accent : T.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s', whiteSpace: 'nowrap'
            }}>
            {I[t.icon]?.(16)} {t.label}
          </button>
        ))}
      </div>

      {isAdmin && targetId !== userShelterId && (
        <div style={{ padding: '8px 12px', background: T.accentLt, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.accent}30` }}>
          {I.Shield(14)} <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>Modo SuperAdmin: Gestionando refugio ajeno</span>
        </div>
      )}

      {error && (
        <div className="anim" style={{
          padding: '10px 14px', borderRadius: RS, marginBottom: 12,
          background: T.dangerLt, color: T.danger, fontSize: 13, fontWeight: 600,
        }}>{error}</div>
      )}
      {success && (
        <div className="anim" style={{
          padding: '10px 14px', borderRadius: RS, marginBottom: 12,
          background: T.okLt, color: T.ok, fontSize: 13, fontWeight: 600,
        }}>{success}</div>
      )}

      {loading && <PageLoader message="Cargando panel del refugio..." />}

      {/* Info */}
      {tab === 'info' && infoForm && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: T.txt }}>Datos públicos</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Ciudad</label>
                  <input value={infoForm.city} onChange={e => setInfoForm(f => ({ ...f, city: e.target.value }))} placeholder="Ej: Mercedes" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Provincia</label>
                  <input value={infoForm.province} onChange={e => setInfoForm(f => ({ ...f, province: e.target.value }))} placeholder="Ej: Buenos Aires" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Nombre del refugio</label>
                <input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Refugio Casa" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Descripción</label>
                <textarea rows={4} value={infoForm.description} onChange={e => setInfoForm(f => ({ ...f, description: e.target.value }))} placeholder="Contanos sobre el refugio..." />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: T.txt }}>Redes y Contacto</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>WhatsApp (Número)</label>
                  <input value={infoForm.whatsapp_number} onChange={e => setInfoForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="Ej: 549..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Instagram URL</label>
                  <input value={infoForm.instagram_url} onChange={e => setInfoForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Facebook URL</label>
                  <input value={infoForm.facebook_url} onChange={e => setInfoForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>TikTok URL</label>
                  <input value={infoForm.tiktok_url} onChange={e => setInfoForm(f => ({ ...f, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@..." />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Grupo WhatsApp voluntarios</label>
                <input value={infoForm.whatsapp_group_link} onChange={e => setInfoForm(f => ({ ...f, whatsapp_group_link: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt }}>Datos institucionales</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Email</label>
                <input value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Razón social</label>
                <input value={infoForm.legal_name} onChange={e => setInfoForm(f => ({ ...f, legal_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>CUIT</label>
                <input value={infoForm.cuit} onChange={e => setInfoForm(f => ({ ...f, cuit: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Registro</label>
                <input value={infoForm.registration_number} onChange={e => setInfoForm(f => ({ ...f, registration_number: e.target.value }))} />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
              {I.Cam(16)} Imágenes de la app
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <ImageUploadField
                T={T}
                label="Foto del refugio"
                hint="Aparece en la página pública del refugio."
                currentUrl={infoForm.shelter_image_url}
                onUpload={async (file) => {
                  const compressed = await compressImageToFile(file, 1400, 0.8)
                  const url = await uploadShelterImage(compressed, 'shelter', targetId)
                  setInfoForm(f => ({ ...f, shelter_image_url: url }))
                }}
                onRemove={() => setInfoForm(f => ({ ...f, shelter_image_url: '' }))}
                onError={(msg) => setError(msg)}
              />
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt, display:'flex', alignItems:'center', gap:6 }}><Landmark size={16}/> Cuentas para transferencia</div>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Aparecen en la pantalla de “Donar” para que copien alias/CBU/CVU.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {(infoForm.transfer_accounts || []).map((acc, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: RM, background: T.bg, border: `1.5px solid ${T.borderLt}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 13, color: T.txt }}>Cuenta {idx + 1}</strong>
                    <button
                      onClick={() => setInfoForm(f => ({
                        ...f,
                        transfer_accounts: (f.transfer_accounts || []).filter((_, i) => i !== idx),
                      }))}
                      style={{ background: 'none', border: 'none', color: T.danger, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      { key: 'label', label: 'Etiqueta', placeholder: 'Refugio…' },
                      { key: 'titular', label: 'Titular', placeholder: 'Nombre completo' },
                      { key: 'dni', label: 'DNI (opcional)', placeholder: '21709559' },
                      { key: 'alias', label: 'Alias', placeholder: 'mi.alias' },
                      { key: 'cbu', label: 'CBU (opcional)', placeholder: '0070…' },
                      { key: 'cvu', label: 'CVU (opcional)', placeholder: '0000…' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>{field.label}</label>
                        <input
                          value={acc?.[field.key] || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => {
                            const v = e.target.value
                            setInfoForm(f => ({
                              ...f,
                              transfer_accounts: (f.transfer_accounts || []).map((a, i) => i === idx ? { ...a, [field.key]: v } : a),
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setInfoForm(f => ({
                  ...f,
                  transfer_accounts: [...(f.transfer_accounts || []), { label: '', titular: '', alias: '' }],
                }))}
                style={{
                  padding: 10, borderRadius: RS, border: `2px dashed ${T.borderLt}`,
                  background: 'transparent', color: T.muted, fontWeight: 700,
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                + Agregar cuenta
              </button>
            </div>
          </Card>

          <button className="btn-press" onClick={saveInfo} disabled={saving} style={{
            width: '100%', padding: 14, borderRadius: RS, border: 'none',
            background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Guardando...' : <><Save size={14}/> Guardar</>}
          </button>
        </div>
      )}

      {/* Anuncios */}
      {tab === 'ann' && (
        <div className="anim">
          <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Anuncios</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Creá y administrá noticias importantes de tu refugio.</p>

            <textarea
              rows={4}
              placeholder="¿Qué novedades hay hoy? Ej: Mañana hay jornada de adopción..."
              value={newAnnBody}
              onChange={(e) => setNewAnnBody(e.target.value)}
              style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-press"
                onClick={() => setNewAnnActive(v => !v)}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 14, border: 'none', 
                  background: newAnnActive ? T.okLt : T.bg, 
                  color: newAnnActive ? T.ok : T.muted, 
                  fontWeight: 700, fontSize: 13, cursor: 'pointer' 
                }}
              >
                {newAnnActive ? 'Visible al público' : 'Borrador'}
              </button>
              <button 
                className="btn-press"
                onClick={async () => {
                  setSaving(true); setError(null)
                  try {
                    const body = (newAnnBody || '').trim()
                    if (!body) throw new Error('Escribí un anuncio antes de crear.')
                    await ann.create({ body, is_active: !!newAnnActive })
                    setNewAnnBody('')
                    setNewAnnActive(true)
                  } catch (e) { setError(friendlyRlsError(e)); toast?.notifyError?.(e) }
                  finally { setSaving(false) }
                }}
                disabled={saving || !targetId}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 14, border: 'none', 
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, 
                  color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' 
                }}
              >
                Publicar anuncio
              </button>
            </div>
          </Card>

          {ann.loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando anuncios...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ann.items.map(a => (
                <Card key={a.id} style={{ padding: 18, border: `1.5px solid ${T.borderLt}` }}>
                  <textarea
                    rows={2}
                    value={a.body || ''}
                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 14, fontWeight: 500, color: T.txt, resize: 'none', marginBottom: 12 }}
                    onChange={(e) => ann.update(a.id, { body: e.target.value }).catch(err => { setError(err.message) })}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', 
                        padding: '3px 8px', borderRadius: 8,
                        background: a.is_active ? T.okLt : T.bg,
                        color: a.is_active ? T.ok : T.muted
                      }}>
                        {a.is_active ? 'Activo' : 'Oculto'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn-press"
                        onClick={() => ann.update(a.id, { is_active: !a.is_active }).catch(err => { setError(err.message); toast?.notifyError?.(err) })}
                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.bg, color: T.txt, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {a.is_active ? 'Ocultar' : 'Activar'}
                      </button>
                      <button 
                        className="btn-press"
                        onClick={() => ann.remove(a.id).catch(err => { setError(err.message); toast?.notifyError?.(err) })}
                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
              {ann.items.length === 0 && (
                <Card style={{ padding: 40, textAlign: 'center', border: `1.5px dashed ${T.borderLt}` }}>
                  <div style={{ color: T.muted, fontSize: 14 }}>Todavía no publicaste anuncios.</div>
                </Card>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '0 8px' }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
              Página {annPage} de {Math.max(1, Math.ceil((ann.total || 0) / ANN_PAGE_SIZE))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setAnnPage(p => Math.max(1, p - 1))} 
                disabled={annPage <= 1}
                style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: T.card, color: T.txt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setAnnPage(p => Math.min(Math.max(1, Math.ceil((ann.total || 0) / ANN_PAGE_SIZE)), p + 1))} 
                disabled={annPage >= Math.max(1, Math.ceil((ann.total || 0) / ANN_PAGE_SIZE))}
                style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: T.card, color: T.txt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eventos */}
      {tab === 'evt' && (
        <div className="anim">
          <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Eventos</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Organizá colectas, jornadas de adopción o eventos del refugio.</p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Título</label>
                  <input
                    value={newEvtForm.title}
                    onChange={(e) => setNewEvtForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ej: Jornada de Castración"
                    style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={newEvtForm.event_at}
                    onChange={(e) => setNewEvtForm(f => ({ ...f, event_at: e.target.value }))}
                    style={{ padding: '11px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Lugar</label>
                  <input
                    value={newEvtForm.place}
                    onChange={(e) => setNewEvtForm(f => ({ ...f, place: e.target.value }))}
                    placeholder="Ej: Plaza Central"
                    style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Link Formulario</label>
                  <input
                    value={newEvtForm.signup_link}
                    onChange={(e) => setNewEvtForm(f => ({ ...f, signup_link: e.target.value }))}
                    placeholder="Opcional"
                    style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn-press"
              onClick={async () => {
                setSaving(true); setError(null)
                try {
                  const title = (newEvtForm.title || '').trim()
                  if (!title) throw new Error('Falta el título del evento.')
                  if (!newEvtForm.event_at) throw new Error('Falta la fecha y hora del evento.')
                  const iso = new Date(newEvtForm.event_at).toISOString()
                  await evt.create({ title, event_at: iso, place: (newEvtForm.place || '').trim(), signup_link: (newEvtForm.signup_link || '').trim() })
                  setNewEvtForm({ title: '', event_at: '', place: '', signup_link: '' })
                } catch (e) { setError(friendlyRlsError(e)); toast?.notifyError?.(e) }
                finally { setSaving(false) }
              }}
              disabled={saving || !targetId}
              style={{ 
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', 
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, 
                color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' 
              }}
            >
              Crear evento
            </button>
          </Card>

          {evt.loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando eventos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {evt.items.map(e => (
                <Card key={e.id} style={{ padding: 18, border: `1.5px solid ${T.borderLt}` }}>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: T.txt }}>{e.title}</div>
                    <div style={{ fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} /> {new Date(e.event_at).toLocaleString()}
                    </div>
                    {e.place && (
                      <div style={{ fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} /> {e.place}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn-press"
                      onClick={() => evt.remove(e.id).catch(err => { setError(err.message); toast?.notifyError?.(err) })}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Eliminar evento
                    </button>
                  </div>
                </Card>
              ))}
              {evt.items.length === 0 && (
                <Card style={{ padding: 40, textAlign: 'center', border: `1.5px dashed ${T.borderLt}` }}>
                  <div style={{ color: T.muted, fontSize: 14 }}>No hay eventos programados.</div>
                </Card>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '0 8px' }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
              Página {evtPage} de {Math.max(1, Math.ceil((evt.total || 0) / EVT_PAGE_SIZE))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEvtPage(p => Math.max(1, p - 1))} disabled={evtPage <= 1} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: T.card, color: T.txt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setEvtPage(p => Math.min(Math.max(1, Math.ceil((evt.total || 0) / EVT_PAGE_SIZE)), p + 1))} disabled={evtPage >= Math.max(1, Math.ceil((evt.total || 0) / EVT_PAGE_SIZE))} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: T.card, color: T.txt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipo */}
      {tab === 'team' && (
        <div className="anim">
          {/* Staff actual */}
          <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Staff del Refugio</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Personas con acceso total a la gestión del refugio.
            </p>
            {staffLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: T.muted }}><Loader size={20} className="spin" /></div>
            ) : currentStaff.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>Ningún staff asignado todavía.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentStaff.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 16,
                    background: T.bg, border: `1.5px solid ${T.borderLt}`,
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 14,
                      background: `linear-gradient(135deg, ${T.accentLt}, #fff)`, color: T.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, flexShrink: 0,
                    }}>
                      {(p.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>
                        {p.display_name || 'Sin nombre'}
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{p.phone || 'Sin teléfono'}</div>
                    </div>
                    <button
                      className="btn-press"
                      onClick={() => removeStaff(p.id)}
                      style={{
                        fontSize: 12, fontWeight: 800, color: T.danger,
                        background: T.dangerLt, border: 'none',
                        borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Agregar staff */}
          <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Agregar Staff</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Buscá por nombre o teléfono para invitar nuevos administradores.
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Nombre o teléfono..."
                value={teamSearch}
                onChange={e => { setTeamSearch(e.target.value); searchUsers(e.target.value) }}
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: `1.5px solid ${T.borderLt}`, fontSize: 15, boxSizing: 'border-box' }}
              />
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
            </div>

            {teamSearching && <div style={{ padding: 12, fontSize: 12, color: T.muted }}>Buscando...</div>}
            
            {teamResults.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamResults.map(p => {
                  const alreadyStaff = currentStaff.some(s => s.id === p.id)
                  const otherShelter = p.shelter_id && p.shelter_id !== targetId
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, background: T.bg }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.display_name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>
                          {p.phone}
                          {otherShelter && <span style={{ color: T.danger }}> · Otro refugio</span>}
                        </div>
                      </div>
                      {!alreadyStaff && (
                        <button 
                          className="btn-press"
                          onClick={() => assignStaff(p.id)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          {otherShelter ? 'Reasignar' : 'Agregar'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Perritos */}
      {tab === 'pets' && (
        <div className="anim">
          <ShelterPetsPanel />
        </div>
      )}
    </div>
  )
}

function ImageUploadField({ T, label, hint, currentUrl, onUpload, onRemove, onError }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { await onUpload(file) }
    catch (err) { onError?.(err?.message || 'Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{hint}</div>}

      {currentUrl ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', maxHeight: 160 }}>
          <img src={currentUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn-press"
              onClick={() => ref.current?.click()}
              style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Cambiar
            </button>
            <button
              type="button"
              className="btn-press"
              onClick={onRemove}
              style={{ padding: '6px 10px', borderRadius: 16, background: 'rgba(192,57,43,0.85)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '18px 16px', borderRadius: 14,
            border: `2px dashed ${T.borderLt}`, background: T.accentLt,
            color: T.accent, cursor: uploading ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 800,
          }}
        >
          {uploading ? <><Loader size={14} className="spin"/> Subiendo…</> : <><Camera size={14}/> Subir imagen</>}
        </button>
      )}

      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}


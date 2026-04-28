import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useT, RS, RM } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { PageLoader } from '../components/ui'
import { useMyShelterAdmin } from '../hooks/useShelterAdmin'
import { useShelterAnnouncements, useShelterEvents } from '../hooks/useShelterContent'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { I } from '../components/ui/Icons'

// Tab Components
import InfoTab from './myshelter/InfoTab'
import AnnouncementsTab from './myshelter/AnnouncementsTab'
import EventsTab from './myshelter/EventsTab'
import TeamTab from './myshelter/TeamTab'
import PetsTab from './myshelter/PetsTab'

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

  // Resolve ID from slug if needed
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
  }, [slug, location.search, userShelterId])

  const { shelter, config, loading, shelterName, updateShelter, upsertConfig } = useMyShelterAdmin(targetId)

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

  const [newAnnBody, setNewAnnBody] = useState('')
  const [newAnnActive, setNewAnnActive] = useState(true)
  const [newEvtForm, setNewEvtForm] = useState(() => ({
    title: '',
    event_at: '',
    place: '',
    signup_link: '',
  }))

  const [infoForm, setInfoForm] = useState(null)

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
        whatsapp_admin: config?.whatsapp_admin || '',
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
      .select('id, display_name, phone, is_admin, shelter_role')
      .eq('shelter_id', targetId)
    setCurrentStaff(data || [])
    setStaffLoading(false)
  }

  const loadCurrentVolunteers = async () => {
    if (!targetId) return
    setVolunteersLoading(true)
    const { data } = await supabase
      .from('volunteer_subscriptions')
      .select('roles, created_at, user:profiles(id, display_name, phone)')
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

  const saveInfo = async () => {
    if (!infoForm) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      const cfgPayload = { ...infoForm }
      await updateShelter({ city: infoForm.city, province: infoForm.province, name: infoForm.name })
      await upsertConfig(cfgPayload)
      setSuccess('Guardado')
      toast?.notifySuccess?.('Refugio guardado')
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      const msg = e?.message || 'Error al guardar'
      setError(msg)
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  const friendlyRlsError = (err) => {
    const msg = (err?.message || '').toString()
    if (msg.includes('row-level security policy for table "shelter_events"')) {
      return 'No tenés permisos para crear/editar eventos.'
    }
    if (msg.includes('row-level security policy for table "shelter_announcements"')) {
      return 'No tenés permisos para crear/editar anuncios.'
    }
    return msg || 'Error'
  }

  const hasNewVolunteers = useMemo(() => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    return currentVolunteers.some(v => v.created_at && v.created_at > fortyEightHoursAgo)
  }, [currentVolunteers])

  if (authLoading) return <PageLoader message="Verificando sesión..." />

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
      {activeTabs.map(t => {
          const showBadge = t.key === 'team' && hasNewVolunteers
          return (
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
                transition: 'all .2s', whiteSpace: 'nowrap',
                position: 'relative'
              }}>
              {I[t.icon]?.(16)} {t.label}
              {showBadge && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 6, height: 6, borderRadius: '50%',
                  background: T.danger, border: '1px solid #fff'
                }} />
              )}
            </button>
          )
        })}
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

      {tab === 'info' && (
        <InfoTab 
          infoForm={infoForm} 
          setInfoForm={setInfoForm} 
          saveInfo={saveInfo} 
          saving={saving} 
          T={T} 
          targetId={targetId} 
          setError={setError} 
        />
      )}

      {tab === 'ann' && (
        <AnnouncementsTab 
          ann={ann} 
          newAnnBody={newAnnBody} 
          setNewAnnBody={setNewAnnBody} 
          newAnnActive={newAnnActive} 
          setNewAnnActive={setNewAnnActive} 
          annPage={annPage} 
          setAnnPage={setAnnPage} 
          saving={saving} 
          setSaving={setSaving} 
          targetId={targetId} 
          setError={setError} 
          friendlyRlsError={friendlyRlsError} 
          T={T} 
          toast={toast} 
          ANN_PAGE_SIZE={ANN_PAGE_SIZE} 
        />
      )}

      {tab === 'evt' && (
        <EventsTab 
          evt={evt} 
          newEvtForm={newEvtForm} 
          setNewEvtForm={setNewEvtForm} 
          evtPage={evtPage} 
          setEvtPage={setEvtPage} 
          saving={saving} 
          setSaving={setSaving} 
          targetId={targetId} 
          setError={setError} 
          friendlyRlsError={friendlyRlsError} 
          T={T} 
          toast={toast} 
          EVT_PAGE_SIZE={EVT_PAGE_SIZE} 
        />
      )}

      {tab === 'team' && (
        <TeamTab 
          currentStaff={currentStaff} 
          currentVolunteers={currentVolunteers} 
          staffLoading={staffLoading} 
          volunteersLoading={volunteersLoading} 
          teamSearch={teamSearch} 
          setTeamSearch={setTeamSearch} 
          searchUsers={searchUsers} 
          teamSearching={teamSearching} 
          teamResults={teamResults} 
          assignStaff={assignStaff} 
          removeStaff={removeStaff} 
          targetId={targetId} 
          T={T} 
        />
      )}

      {tab === 'pets' && <PetsTab />}
    </div>
  )
}

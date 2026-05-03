import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Building, Shield, Users, Dog, User, Image, Home, MessageCircle, Calendar, Link2, Star, Megaphone } from 'lucide-react'
import { Card, Btn } from '../components/ui'
import { useSheltersAdmin } from '../hooks/useSheltersAdmin'
import { useAppConfig } from '../hooks/useAppConfig'
import { compressImageToFile } from '../utils'

const FEEDBACK_TYPE_LABELS = {
  bug: 'Algo no funciona',
  idea: 'Idea',
  mejora: 'Mejora',
  otro: 'Otro',
}

function slugify(input) {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    // remove accents
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // keep letters/numbers/spaces/hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SuperAdmin() {
  const T = useT()
  const navigate = useNavigate()
  const { isAdmin, isLogged, loading: authLoading, userId } = useAuthContext()

  const [tab, setTab] = useState('metrics') // 'metrics' | 'shelters' | 'team' | 'app' | 'feedback'
  const { config: appConfig, update: updateAppConfig } = useAppConfig()
  const [heroUploading, setHeroUploading] = useState(false)
  const [globalBannerText, setGlobalBannerText] = useState('')
  const [globalBannerActive, setGlobalBannerActive] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  // Team
  const [allProfiles, setAllProfiles] = useState([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')
  const [teamPage, setTeamPage] = useState(1)
  const TEAM_PAGE_SIZE = 10
  const [teamTotal, setTeamTotal] = useState(0)

  const FEEDBACK_PAGE_SIZE = 10
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackTotal, setFeedbackTotal] = useState(0)

  // Shelters
  const sheltersAdmin = useSheltersAdmin(true)
  const [shelterFormNew, setShelterFormNew] = useState({ slug: '', name: '', city: '', lat: '', lng: '' })
  const [editShelterId, setEditShelterId] = useState(null)
  const [editShelterForm, setEditShelterForm] = useState(null)

  // Feedback
  const [feedbackRows, setFeedbackRows] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && isLogged && isAdmin) loadMetrics()
  }, [authLoading, isLogged, isAdmin])

  useEffect(() => {
    if (!appConfig) return
    setGlobalBannerText(appConfig.global_banner_text || '')
    setGlobalBannerActive(!!appConfig.global_banner_active)
  }, [appConfig?.id, appConfig?.updated_at])

  useEffect(() => {
    if (tab === 'team' && isAdmin) loadTeam(teamPage, teamSearch)
  }, [tab, isAdmin, teamPage, teamSearch])

  const loadFeedback = async (page = 1) => {
    setFeedbackLoading(true)
    setError(null)
    const from = (page - 1) * FEEDBACK_PAGE_SIZE
    const to = from + FEEDBACK_PAGE_SIZE - 1

    const { data, error: err, count } = await supabase
      .from('feedback')
      .select(`
        id, created_at, type, rating, message, page_url, anon_id, user_id,
        profiles ( display_name, phone, shelters ( name ) )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (err) {
      setError(err.message || 'No se pudo cargar feedback')
      setFeedbackRows([])
      setFeedbackTotal(0)
      setFeedbackLoading(false)
      return
    }

    const rows = data || []
    const total = count ?? 0

    if (rows.length === 0 && page > 1) {
      const prev = page - 1
      setFeedbackPage(prev)
      setFeedbackLoading(false)
      return loadFeedback(prev)
    }

    setFeedbackRows(rows)
    setFeedbackTotal(total)
    setFeedbackPage(page)
    setFeedbackLoading(false)
  }

  useEffect(() => {
    if (tab === 'feedback' && isAdmin) loadFeedback(feedbackPage)
  }, [tab, isAdmin, feedbackPage])

  useEffect(() => {
    if (!authLoading && (!isLogged || !isAdmin)) navigate('/', { replace: true })
  }, [authLoading, isLogged, isAdmin, navigate])

  const loadMetrics = async () => {
    setMetricsLoading(true)
    const [
      { count: shelterCount },
      { count: petCount },
      { count: volunteerCount },
      { count: userCount },
    ] = await Promise.all([
      supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('type', 'stray'),
      supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    setMetrics({ shelterCount, petCount, volunteerCount, userCount, subCount: volunteerCount })
    setMetricsLoading(false)
  }

  const loadTeam = async (page = 1, search = '') => {
    setTeamLoading(true)
    setError(null)

    const from = (page - 1) * TEAM_PAGE_SIZE
    const to = from + TEAM_PAGE_SIZE - 1

    let query = supabase
      .from('profiles')
      .select('id, display_name, phone, is_admin, shelter_id, shelter_role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    const term = search.trim()
    if (term.length > 0) {
      const esc = term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`display_name.ilike.%${esc}%,phone.ilike.%${esc}%`)
    }

    const { data, error: err, count } = await query.range(from, to)

    if (err) {
      setError(err.message || 'Error al cargar usuarios')
      setAllProfiles([])
      setTeamTotal(0)
      setTeamLoading(false)
      return
    }

    setAllProfiles(data || [])
    setTeamTotal(count ?? (data?.length || 0))
    setTeamLoading(false)
  }

  const toggleAdmin = async (profileId, currentValue) => {
    if (profileId === userId) return
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_admin: !currentValue })
      .eq('id', profileId)
    if (!err) setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_admin: !currentValue } : p))
  }

  const assignShelterToProfile = async (profileId, shelterId) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ shelter_id: shelterId || null, shelter_role: shelterId ? 'staff' : null })
      .eq('id', profileId)
    if (err) { setError(err.message); return }
    setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, shelter_id: shelterId || null, shelter_role: shelterId ? 'staff' : null } : p))
  }

  const assignRoleToProfile = async (profileId, role) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ shelter_role: role || null })
      .eq('id', profileId)
    if (err) { setError(err.message); return }
    setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, shelter_role: role || null } : p))
  }

  const TABS = [
    { key: 'metrics', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Building size={14}/> Métricas</span> },
    { key: 'shelters', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Home size={14}/> Refugios</span> },
    { key: 'team', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Users size={14}/> Usuarios</span> },
    { key: 'feedback', label: <span style={{display:'flex', alignItems:'center', gap:4}}><MessageCircle size={14}/> Feedback</span> },
    { key: 'app', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Dog size={14}/> App</span> },
  ]

  const removeFeedback = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: delErr } = await supabase.from('feedback').delete().eq('id', id)
      if (delErr) throw delErr
      setSuccess('Feedback eliminado')
      await loadFeedback(feedbackPage)
    } catch (e) {
      setError(e.message || 'No se pudo eliminar')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  if (!isLogged || !isAdmin) return null

  return (
    <div style={{ paddingTop: 12, paddingBottom: 40 }}>
      <h1 className="anim" style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
        <span style={{display:'flex', alignItems:'center', gap:8}}><Shield size={24}/> Super Admin</span>
      </h1>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Panel de administración global</p>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        background: T.borderLt, padding: 4, borderRadius: 16,
        position: 'relative'
      }}>
        {TABS.map(t => (
          <button key={t.key} className="btn-press"
            onClick={() => { setTab(t.key); setError(null); setSuccess(null) }}
            style={{
              flex: 1, padding: '10px 12px', border: 'none', cursor: 'pointer',
              borderRadius: 12,
              background: tab === t.key ? T.card : 'transparent',
              fontWeight: 800, fontSize: 13,
              color: tab === t.key ? T.accent : T.muted,
              boxShadow: tab === t.key ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all .25s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="anim" style={{ padding: '10px 14px', borderRadius: RS, marginBottom: 12, background: T.dangerLt, color: T.danger, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="anim" style={{ padding: '10px 14px', borderRadius: RS, marginBottom: 12, background: T.okLt, color: T.ok, fontSize: 13, fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* ═══ METRICS ═══ */}
      {tab === 'metrics' && (
        <div className="anim">
          {metricsLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>
              <div style={{ animation: 'spin 1s linear infinite', marginBottom: 10, display: 'inline-block' }}><Shield size={32} /></div>
              <div style={{ fontWeight: 700 }}>Calculando métricas...</div>
            </div>
          ) : (
            <div className="anim">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <MetricCard T={T} icon={<Building size={22}/>} label="Refugios" value={metrics.shelterCount ?? 0} gradient={`linear-gradient(135deg, ${T.accent}, ${T.accentDk})`} />
                <MetricCard T={T} icon={<Dog size={22}/>} label="Perritos" value={metrics.petCount ?? 0} gradient={`linear-gradient(135deg, ${T.purple || '#9b59b6'}, ${T.accent})`} />
                <MetricCard T={T} icon={<Users size={22}/>} label="Usuarios" value={metrics.userCount ?? 0} gradient={`linear-gradient(135deg, ${T.accent}, #d35400)`} />
                <MetricCard T={T} icon={<Shield size={22}/>} label="Voluntarios" value={metrics.volunteerCount ?? 0} gradient={`linear-gradient(135deg, ${T.ok || '#27ae60'}, ${T.accent})`} />
              </div>

              <Card style={{ 
                padding: '24px 20px', 
                background: `linear-gradient(to right, ${T.accent}08, transparent)`,
                border: `1.5px solid ${T.borderLt}`,
                borderRadius: 24,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}>
                  <Users size={120} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suscripciones activas</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: T.txt, letterSpacing: '-1px' }}>{metrics.subCount ?? 0}</div>
                  <div style={{ fontSize: 14, color: T.accent, fontWeight: 800 }}>+5 esta semana</div>
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginTop: 4 }}>Vínculos creados entre Voluntarios y Refugios</div>
              </Card>

              <button
                onClick={loadMetrics}
                className="btn-press"
                style={{ 
                  marginTop: 20, background: T.accentLt, border: 'none', 
                  color: T.accent, fontWeight: 800, fontSize: 13, 
                  cursor: 'pointer', padding: '10px 20px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                ↻ Actualizar métricas reales
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ SHELTERS ═══ */}
      {tab === 'shelters' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 12 }}>Crear refugio</div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Nombre *</label>
                <input
                  value={shelterFormNew.name}
                  onChange={e => {
                    const name = e.target.value
                    setShelterFormNew(f => ({
                      ...f,
                      name,
                      slug: f.slug?.trim() ? f.slug : slugify(name),
                    }))
                  }}
                  placeholder="Refugio Villa del Parque"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Slug (auto)</label>
                <input
                  value={shelterFormNew.slug}
                  onChange={e => setShelterFormNew(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="villa-del-parque"
                />
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  Se genera desde el nombre. Podés editarlo si necesitás.
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Ciudad / zona</label>
                <input value={shelterFormNew.city} onChange={e => setShelterFormNew(f => ({ ...f, city: e.target.value }))} placeholder="Buenos Aires" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Lat</label>
                  <input value={shelterFormNew.lat} onChange={e => setShelterFormNew(f => ({ ...f, lat: e.target.value }))} placeholder="-34.1234" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Lng</label>
                  <input value={shelterFormNew.lng} onChange={e => setShelterFormNew(f => ({ ...f, lng: e.target.value }))} placeholder="-58.1234" />
                </div>
              </div>
            </div>
            <Btn
              onClick={async () => {
                setSaving(true); setError(null); setSuccess(null)
                try {
                  const name = shelterFormNew.name.trim()
                  const computedSlug = (shelterFormNew.slug || slugify(name)).trim()
                  if (!name) {
                    setError('El nombre es obligatorio'); return
                  }
                  if (!computedSlug) {
                    setError('No pudimos generar el slug. Probá con otro nombre.'); return
                  }
                  await sheltersAdmin.createShelter({
                    slug: computedSlug,
                    name,
                    city: shelterFormNew.city.trim() || null,
                    lat: shelterFormNew.lat.trim() ? Number(shelterFormNew.lat) : null,
                    lng: shelterFormNew.lng.trim() ? Number(shelterFormNew.lng) : null,
                    is_active: true,
                  })
                  setShelterFormNew({ slug: '', name: '', city: '', lat: '', lng: '' })
                  setSuccess('Refugio creado')
                } catch (e) { setError(e.message) }
                finally { setSaving(false) }
              }}
              disabled={saving}
            >
              + Crear refugio
            </Btn>
          </Card>

          {sheltersAdmin.loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando refugios...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(sheltersAdmin.shelters || []).map(s => (
                <Card key={s.id} style={{ padding: 14 }}>
                  {editShelterId === s.id && editShelterForm ? (
                    <>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input value={editShelterForm.slug} onChange={e => setEditShelterForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug" />
                        <input value={editShelterForm.name} onChange={e => setEditShelterForm(f => ({ ...f, name: e.target.value }))} placeholder="nombre" />
                        <input value={editShelterForm.city || ''} onChange={e => setEditShelterForm(f => ({ ...f, city: e.target.value }))} placeholder="ciudad" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input value={editShelterForm.lat || ''} onChange={e => setEditShelterForm(f => ({ ...f, lat: e.target.value }))} placeholder="lat" />
                          <input value={editShelterForm.lng || ''} onChange={e => setEditShelterForm(f => ({ ...f, lng: e.target.value }))} placeholder="lng" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <Btn
                          onClick={async () => {
                            setSaving(true); setError(null)
                            try {
                              await sheltersAdmin.updateShelter(s.id, {
                                slug: editShelterForm.slug.trim(),
                                name: editShelterForm.name.trim(),
                                city: (editShelterForm.city || '').trim() || null,
                                lat: editShelterForm.lat?.trim() ? Number(editShelterForm.lat) : null,
                                lng: editShelterForm.lng?.trim() ? Number(editShelterForm.lng) : null,
                              })
                              setEditShelterId(null); setEditShelterForm(null)
                            } catch (e) { setError(e.message) }
                            finally { setSaving(false) }
                          }}
                          disabled={saving} style={{ flex: 1, justifyContent: 'center' }}
                        >Guardar</Btn>
                        <Btn v="secondary" onClick={() => { setEditShelterId(null); setEditShelterForm(null) }} style={{ flex: 1, justifyContent: 'center' }}>
                          Cancelar
                        </Btn>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: T.txt, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                          <b>{s.slug}</b> · {s.city || '—'}
                          {s.is_active === false && <span style={{ color: T.danger, fontWeight: 700 }}> · Inactivo</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <Btn v="secondary" onClick={() => {
                          setEditShelterId(s.id)
                          setEditShelterForm({ slug: s.slug || '', name: s.name || '', city: s.city || '', lat: s.lat ?? '', lng: s.lng ?? '' })
                        }}>Editar</Btn>
                        <Btn v="secondary" onClick={() => navigate(`/refugio/${s.slug}/gestion`)}>
                          Gestionar
                        </Btn>
                        <Btn
                          v="danger"
                          onClick={() => sheltersAdmin.deactivateShelter(s.id).catch(err => setError(err.message))}
                          disabled={s.slug === 'casa'}
                        >
                          Desactivar
                        </Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              {!(sheltersAdmin.shelters?.length) && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>No hay refugios todavía.</div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TEAM / USUARIOS ═══ */}
      {tab === 'team' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 4 }}>Gestión de usuarios</div>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              Asigná refugio (staff) y permisos de admin a cada usuario.
            </p>
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={teamSearch}
              onChange={e => { setTeamSearch(e.target.value); setTeamPage(1) }}
            />
          </Card>

          {teamLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando usuarios...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allProfiles.map(p => (
                  <Card key={p.id} style={{
                    padding: '12px 14px',
                    background: p.is_admin ? T.accentLt : T.card,
                    border: `1px solid ${p.is_admin ? T.accent + '30' : T.borderLt}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: p.is_admin ? T.accent : T.border,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 2,
                      }}>
                        {p.is_admin ? <Shield size={14}/> : <User size={14}/>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>
                          {p.display_name || 'Sin nombre'}
                          {p.id === userId && <span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}> (vos)</span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.muted }}>
                          {p.phone || 'Sin teléfono'}
                          {p.is_admin && <span style={{ color: T.accent, fontWeight: 700 }}> · Admin</span>}
                        </div>

                         {/* Selector de refugio */}
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>Refugio</span>
                            <select
                              value={p.shelter_id || ''}
                              onChange={e => assignShelterToProfile(p.id, e.target.value || null).catch(err => setError(err.message))}
                              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}` }}
                            >
                              <option value="">Sin refugio</option>
                              {(sheltersAdmin.shelters || []).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          {p.shelter_id && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>Rol</span>
                              <select
                                value={p.shelter_role || ''}
                                onChange={e => assignRoleToProfile(p.id, e.target.value || null).catch(err => setError(err.message))}
                                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: p.shelter_role === 'owner' ? T.accentLt : '#fff' }}
                              >
                                <option value="">Sin rol</option>
                                <option value="staff">Staff</option>
                                <option value="owner">Dueño / Owner</option>
                              </select>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>Privilegios</span>
                            <button
                              className="btn-press"
                              onClick={() => toggleAdmin(p.id, p.is_admin)}
                              disabled={p.id === userId}
                              style={{
                                padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700,
                                border: 'none', cursor: p.id === userId ? 'default' : 'pointer',
                                background: p.is_admin ? T.dangerLt : T.okLt,
                                color: p.is_admin ? T.danger : T.ok,
                                opacity: p.id === userId ? 0.5 : 1,
                              }}
                            >
                              {p.id === userId ? 'Vos' : p.is_admin ? 'Quitar SuperAdmin' : 'Hacer SuperAdmin'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

              {/* Paginación usuarios */}
              {teamTotal > 0 && (
                <Card style={{ padding: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn-press"
                      type="button"
                      onClick={() => setTeamPage(p => Math.max(1, p - 1))}
                      disabled={teamPage <= 1}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${T.borderLt}`,
                        background: teamPage <= 1 ? T.borderLt : T.card,
                        color: teamPage <= 1 ? T.muted : T.txt,
                        cursor: teamPage <= 1 ? 'default' : 'pointer',
                        fontWeight: 800, fontSize: 12,
                      }}
                    >
                      ← Anterior
                    </button>

                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textAlign: 'center', flex: '1 1 140px' }}>
                      Página {teamPage} de {Math.max(1, Math.ceil(teamTotal / TEAM_PAGE_SIZE))}
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                        {teamTotal} usuario{teamTotal !== 1 ? 's' : ''}{teamSearch.trim() ? ' (filtro aplicado)' : ''}
                      </span>
                    </div>

                    <button
                      className="btn-press"
                      type="button"
                      onClick={() => setTeamPage(p => p + 1)}
                      disabled={teamPage * TEAM_PAGE_SIZE >= teamTotal}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${T.borderLt}`,
                        background: teamPage * TEAM_PAGE_SIZE >= teamTotal ? T.borderLt : T.card,
                        color: teamPage * TEAM_PAGE_SIZE >= teamTotal ? T.muted : T.txt,
                        cursor: teamPage * TEAM_PAGE_SIZE >= teamTotal ? 'default' : 'pointer',
                        fontWeight: 800, fontSize: 12,
                      }}
                    >
                      Siguiente →
                    </button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ FEEDBACK ═══ */}
      {tab === 'feedback' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Feedback de usuarios</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Los envíos entran por la Edge Function. Cuando lo resolviste o no aplica, descartalo o marcá hecho: se elimina de la lista.</div>
            </div>
            <Btn v="secondary" onClick={() => loadFeedback(feedbackPage)} disabled={feedbackLoading}>↻ Actualizar</Btn>
          </Card>

          {feedbackLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando feedback…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(feedbackRows || []).map((row) => {
                const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
                const sh = prof?.shelters
                const shelterName = Array.isArray(sh) ? sh[0]?.name : sh?.name
                const typeLabel = FEEDBACK_TYPE_LABELS[row.type] || row.type
                const when = new Date(row.created_at)
                const fechaStr = when.toLocaleString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <Card key={row.id} style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                      padding: '12px 14px',
                      background: `linear-gradient(135deg, ${T.accentLt}, transparent)`,
                      borderBottom: `1px solid ${T.borderLt}`,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          color: T.accent,
                          background: T.card,
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: `1px solid ${T.accent}35`,
                        }}>
                          {typeLabel}
                        </span>
                        {row.rating != null ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 800, color: T.txt }}>
                            <Star size={15} fill={T.accent} color={T.accent} strokeWidth={0} />
                            Calificación: {row.rating}/5
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Sin calificación</span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: T.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} strokeWidth={2} aria-hidden />
                        {fechaStr}
                      </span>
                    </div>

                    <div style={{ padding: '14px 14px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muted, marginBottom: 8 }}>
                        Quién envió
                      </div>
                      {row.user_id ? (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.txt, lineHeight: 1.55 }}>
                          <li><strong>Cuenta registrada</strong> (usuario en la app)</li>
                          {prof?.display_name && (
                            <li>Nombre en perfil: {prof.display_name}</li>
                          )}
                          {prof?.phone && (
                            <li>Teléfono en perfil: {prof.phone}</li>
                          )}
                          {!prof?.display_name && !prof?.phone && (
                            <li>ID usuario: <code style={{ fontSize: 12 }}>{row.user_id}</code></li>
                          )}
                          {shelterName && (
                            <li>Refugio vinculado: <strong>{shelterName}</strong></li>
                          )}
                        </ul>
                      ) : (
                        <div style={{ fontSize: 13, color: T.txt, lineHeight: 1.5 }}>
                          <strong>Invitado / sin cuenta</strong>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                            ID anónimo del dispositivo (solo para soporte interno):{' '}
                            <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{row.anon_id}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '0 14px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muted, marginBottom: 8 }}>
                        Mensaje
                      </div>
                      <div style={{
                        fontSize: 14,
                        color: T.txt,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        padding: '12px 14px',
                        background: T.bg,
                        borderRadius: RS,
                        border: `1px solid ${T.borderLt}`,
                      }}>
                        {row.message}
                      </div>
                    </div>

                    {row.page_url && (
                      <div style={{ padding: '0 14px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link2 size={14} aria-hidden />
                          Página desde la que envió
                        </div>
                        <a
                          href={row.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 13,
                            color: T.accent,
                            fontWeight: 700,
                            wordBreak: 'break-all',
                            display: 'inline-block',
                            maxWidth: '100%',
                          }}
                        >
                          {row.page_url}
                        </a>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      padding: '12px 14px',
                      borderTop: `1px solid ${T.borderLt}`,
                      background: T.bg,
                    }}>
                      <Btn
                        v="secondary"
                        onClick={() => {
                          if (!window.confirm('¿Eliminar este feedback? (marcar como atendido)')) return
                          removeFeedback(row.id)
                        }}
                        disabled={saving}
                      >
                        ✓ Hecho
                      </Btn>
                      <Btn
                        v="danger"
                        onClick={() => {
                          if (!window.confirm('¿Descartar y eliminar este feedback?')) return
                          removeFeedback(row.id)
                        }}
                        disabled={saving}
                      >
                        Descartar
                      </Btn>
                    </div>
                  </Card>
                )
              })}

              {feedbackTotal > 0 && (
                <Card style={{ padding: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-press"
                      onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                      disabled={feedbackPage <= 1 || feedbackLoading}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${T.borderLt}`,
                        background: feedbackPage <= 1 ? T.borderLt : T.card,
                        color: feedbackPage <= 1 ? T.muted : T.txt,
                        cursor: feedbackPage <= 1 ? 'default' : 'pointer',
                        fontWeight: 800, fontSize: 12,
                      }}
                    >
                      ← Anterior
                    </button>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textAlign: 'center', flex: '1 1 140px' }}>
                      Página {feedbackPage} de {Math.max(1, Math.ceil(feedbackTotal / FEEDBACK_PAGE_SIZE))}
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                        {feedbackTotal} mensaje{feedbackTotal !== 1 ? 's' : ''} en total
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-press"
                      onClick={() => setFeedbackPage((p) => p + 1)}
                      disabled={feedbackPage * FEEDBACK_PAGE_SIZE >= feedbackTotal || feedbackLoading}
                      style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: `1px solid ${T.borderLt}`,
                        background: feedbackPage * FEEDBACK_PAGE_SIZE >= feedbackTotal ? T.borderLt : T.card,
                        color: feedbackPage * FEEDBACK_PAGE_SIZE >= feedbackTotal ? T.muted : T.txt,
                        cursor: feedbackPage * FEEDBACK_PAGE_SIZE >= feedbackTotal ? 'default' : 'pointer',
                        fontWeight: 800, fontSize: 12,
                      }}
                    >
                      Siguiente →
                    </button>
                  </div>
                </Card>
              )}

              {!feedbackLoading && !(feedbackRows?.length) && feedbackTotal === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>No hay feedback todavía.</div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ APP ═══ */}
      {tab === 'app' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Megaphone size={16} /> Barra superior global
            </div>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.45 }}>
              Aviso para todo el sitio en la franja superior. No se muestra dentro de páginas de un refugio ni en perros de ese refugio; ahí solo aplica la barra del refugio.
            </p>
            <textarea
              rows={3}
              value={globalBannerText}
              onChange={e => setGlobalBannerText(e.target.value)}
              placeholder="Texto del aviso global…"
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14, marginBottom: 12 }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={globalBannerActive}
                onChange={e => setGlobalBannerActive(e.target.checked)}
                style={{ width: 'auto' }}
              />
              Barra activa
            </label>
            <Btn
              onClick={async () => {
                setSaving(true)
                setError(null)
                setSuccess(null)
                try {
                  const { error: err } = await updateAppConfig({
                    global_banner_text: globalBannerText.trim() || null,
                    global_banner_active: !!globalBannerActive && !!(globalBannerText || '').trim(),
                    global_banner_ends_at: null,
                  })
                  if (err) throw err
                  setSuccess('Barra global guardada')
                } catch (e) {
                  setError(e.message || 'No se pudo guardar')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
            >
              Guardar barra global
            </Btn>
          </Card>

          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Image size={16} /> Imagen hero del inicio
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Esta imagen aparece como fondo en la pantalla de inicio. Recomendado: foto horizontal de buena calidad.
            </div>

            {appConfig?.hero_image_url && (
              <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <img src={appConfig.hero_image_url} alt="Hero actual" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={async () => {
                    const { error } = await updateAppConfig({ hero_image_url: null })
                    if (error) setError(error.message)
                    else setSuccess('Imagen eliminada')
                  }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Eliminar
                </button>
              </div>
            )}

            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 18px', borderRadius: 12, cursor: heroUploading ? 'not-allowed' : 'pointer',
              background: T.accentLt, border: `1.5px dashed ${T.accent}50`,
              color: T.accent, fontWeight: 700, fontSize: 14,
            }}>
              <Image size={16} />
              {heroUploading ? 'Subiendo...' : appConfig?.hero_image_url ? 'Cambiar imagen' : 'Subir imagen'}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                disabled={heroUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setHeroUploading(true)
                  setError(null)
                  try {
                    const compressed = await compressImageToFile(file, 1400, 0.8)
                    const path = `hero/home_hero_${Date.now()}.jpg`
                    const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, { upsert: true })
                    if (upErr) throw upErr
                    const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(path)
                    const { error: saveErr } = await updateAppConfig({ hero_image_url: publicUrl })
                    if (saveErr) throw saveErr
                    setSuccess('Imagen actualizada')
                  } catch (err) {
                    setError(err.message)
                  } finally {
                    setHeroUploading(false)
                    e.target.value = ''
                  }
                }}
              />
            </label>
          </Card>
        </div>
      )}
    </div>
  )
}

function MetricCard({ T, icon, label, value, gradient }) {
  return (
    <Card style={{ 
      padding: '20px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      gap: 12,
      background: '#fff',
      border: `1.5px solid ${T.borderLt}`,
      borderRadius: 24,
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 16, 
        background: gradient, color: '#fff', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: T.txt, letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      </div>
    </Card>
  )
}

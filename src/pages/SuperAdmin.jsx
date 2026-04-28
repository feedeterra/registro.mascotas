import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Building, Shield, Users, Dog, User, Image } from 'lucide-react'
import { Card, Btn } from '../components/ui'
import { useSheltersAdmin } from '../hooks/useSheltersAdmin'
import { useAppConfig } from '../hooks/useAppConfig'
import { compressImageToFile } from '../utils'

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

  const [tab, setTab] = useState('metrics') // 'metrics' | 'shelters' | 'team' | 'app'
  const { config: appConfig, update: updateAppConfig } = useAppConfig()
  const [heroUploading, setHeroUploading] = useState(false)
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

  // Shelters
  const sheltersAdmin = useSheltersAdmin(true)
  const [shelterFormNew, setShelterFormNew] = useState({ slug: '', name: '', city: '', lat: '', lng: '' })
  const [editShelterId, setEditShelterId] = useState(null)
  const [editShelterForm, setEditShelterForm] = useState(null)

  useEffect(() => {
    if (!authLoading && isLogged && isAdmin) loadMetrics()
  }, [authLoading, isLogged, isAdmin])

  useEffect(() => {
    if (tab === 'team' && isAdmin) loadTeam(teamPage)
  }, [tab, isAdmin, teamPage])

  useEffect(() => {
    if (!authLoading && (!isLogged || !isAdmin)) navigate('/', { replace: true })
  }, [authLoading, isLogged, isAdmin, navigate])

  if (authLoading) return <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  if (!isLogged || !isAdmin) return null

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

  const loadTeam = async (page = 1) => {
    setTeamLoading(true)
    setError(null)

    const from = (page - 1) * TEAM_PAGE_SIZE
    const to = from + TEAM_PAGE_SIZE - 1

    const { data, error: err, count } = await supabase
      .from('profiles')
      .select('id, display_name, phone, is_admin, shelter_id, shelter_role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

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
    { key: 'metrics', label: '📊 Métricas' },
    { key: 'shelters', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Building size={14}/> Refugios</span> },
    { key: 'team', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Users size={14}/> Usuarios</span> },
    { key: 'app', label: <span style={{display:'flex', alignItems:'center', gap:4}}><Dog size={14}/> App</span> },
  ]

  return (
    <div style={{ paddingTop: 12, paddingBottom: 40 }}>
      <h1 className="anim" style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
        <span style={{display:'flex', alignItems:'center', gap:8}}><Shield size={24}/> Super Admin</span>
      </h1>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Panel de administración global</p>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        borderBottom: `2px solid ${T.borderLt}`, paddingBottom: 0,
      }}>
        {TABS.map(t => (
          <button key={t.key} className="btn-press"
            onClick={() => { setTab(t.key); setError(null); setSuccess(null) }}
            style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontWeight: 700, fontSize: 13,
              color: tab === t.key ? T.accent : T.muted,
              borderBottom: tab === t.key ? `3px solid ${T.accent}` : '3px solid transparent',
              transition: 'all .2s', marginBottom: -2,
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
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando métricas...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <MetricCard T={T} icon={<Building size={20}/>} label="Refugios activos" value={metrics.shelterCount ?? 0} color={T.accent} />
                <MetricCard T={T} icon={<Dog size={20}/>} label="Perros registrados" value={metrics.petCount ?? 0} color={T.purple} />
                <MetricCard T={T} icon={<Users size={20}/>} label="Usuarios totales" value={metrics.userCount ?? 0} color={T.blue} />
                <MetricCard T={T} icon={<Shield size={20}/>} label="Voluntarios" value={metrics.volunteerCount ?? 0} color={T.ok} />
              </div>
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 8 }}>Suscripciones activas</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.accent }}>{metrics.subCount ?? 0}</div>
                <div style={{ fontSize: 12, color: T.muted }}>Voluntario ↔ Refugio</div>
              </Card>
              <button
                onClick={loadMetrics}
                style={{ marginTop: 12, background: 'none', border: 'none', color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                ↻ Actualizar
              </button>
            </>
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
              {allProfiles
                .filter(p => {
                  if (!teamSearch.trim()) return true
                  const q = teamSearch.toLowerCase()
                  return (
                    (p.display_name || '').toLowerCase().includes(q) ||
                    (p.phone || '').toLowerCase().includes(q)
                  )
                })
                .map(p => (
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
                                <option value="staff">Staff / Voluntario</option>
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

              {/* Paginación */}
              {teamTotal > TEAM_PAGE_SIZE && (
                <Card style={{ padding: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <button
                      className="btn-press"
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

                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
                      Página {teamPage} · {teamTotal} usuarios
                    </div>

                    <button
                      className="btn-press"
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

      {/* ═══ APP ═══ */}
      {tab === 'app' && (
        <div className="anim">
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

function MetricCard({ T, icon, label, value, color }) {
  return (
    <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: T.txt }}>{value}</div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{label}</div>
      </div>
    </Card>
  )
}

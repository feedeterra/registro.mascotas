import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Btn } from '../components/ui'
import { useSheltersAdmin } from '../hooks/useSheltersAdmin'

export default function SuperAdmin() {
  const T = useT()
  const navigate = useNavigate()
  const { isAdmin, isLogged, loading: authLoading, userId } = useAuthContext()

  const [tab, setTab] = useState('metrics') // 'metrics' | 'shelters' | 'team'
  const [metrics, setMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  // Team
  const [allProfiles, setAllProfiles] = useState([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')

  // Shelters
  const sheltersAdmin = useSheltersAdmin(true)
  const [shelterFormNew, setShelterFormNew] = useState({ slug: '', name: '', city: '', lat: '', lng: '' })
  const [editShelterId, setEditShelterId] = useState(null)
  const [editShelterForm, setEditShelterForm] = useState(null)

  useEffect(() => {
    if (!authLoading && isLogged && isAdmin) loadMetrics()
  }, [authLoading, isLogged, isAdmin])

  useEffect(() => {
    if (tab === 'team' && isAdmin) loadTeam()
  }, [tab, isAdmin])

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
      { count: subCount },
    ] = await Promise.all([
      supabase.from('shelters').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('type', 'stray'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_volunteer', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('volunteer_subscriptions').select('id', { count: 'exact', head: true }),
    ])
    setMetrics({ shelterCount, petCount, volunteerCount, userCount, subCount })
    setMetricsLoading(false)
  }

  const loadTeam = async () => {
    setTeamLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, phone, is_admin, shelter_id, is_volunteer, created_at')
      .order('created_at', { ascending: false })
    setAllProfiles(data || [])
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
      .update({ shelter_id: shelterId || null })
      .eq('id', profileId)
    if (err) { setError(err.message); return }
    setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, shelter_id: shelterId || null } : p))
  }

  const TABS = [
    { key: 'metrics', label: '📊 Métricas' },
    { key: 'shelters', label: '🏘️ Refugios' },
    { key: 'team', label: '👥 Usuarios' },
  ]

  return (
    <div style={{ paddingTop: 12, paddingBottom: 40 }}>
      <h1 className="anim" style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
        🛡️ Super Admin
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
                <MetricCard T={T} emoji="🏠" label="Refugios activos" value={metrics.shelterCount ?? 0} color={T.accent} />
                <MetricCard T={T} emoji="🐾" label="Perros registrados" value={metrics.petCount ?? 0} color={T.purple} />
                <MetricCard T={T} emoji="🤝" label="Voluntarios" value={metrics.volunteerCount ?? 0} color={T.ok} />
                <MetricCard T={T} emoji="👤" label="Usuarios totales" value={metrics.userCount ?? 0} color={T.blue} />
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Slug (único) *</label>
                <input value={shelterFormNew.slug} onChange={e => setShelterFormNew(f => ({ ...f, slug: e.target.value }))} placeholder="villa-del-parque" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Nombre *</label>
                <input value={shelterFormNew.name} onChange={e => setShelterFormNew(f => ({ ...f, name: e.target.value }))} placeholder="Refugio Villa del Parque" />
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
                  if (!shelterFormNew.slug.trim() || !shelterFormNew.name.trim()) {
                    setError('Slug y nombre son obligatorios'); return
                  }
                  await sheltersAdmin.createShelter({
                    slug: shelterFormNew.slug.trim(),
                    name: shelterFormNew.name.trim(),
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
              onChange={e => setTeamSearch(e.target.value)}
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
                        {p.is_admin ? '🛡️' : '👤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>
                          {p.display_name || 'Sin nombre'}
                          {p.id === userId && <span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}> (vos)</span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.muted }}>
                          {p.phone || 'Sin teléfono'}
                          {p.is_volunteer && <span style={{ color: T.ok, fontWeight: 700 }}> · Voluntario</span>}
                          {p.is_admin && <span style={{ color: T.accent, fontWeight: 700 }}> · Admin</span>}
                        </div>

                        {/* Selector de refugio */}
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <select
                            value={p.shelter_id || ''}
                            onChange={e => assignShelterToProfile(p.id, e.target.value || null).catch(err => setError(err.message))}
                            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: `1px solid ${T.border}` }}
                          >
                            <option value="">Sin refugio asignado</option>
                            {(sheltersAdmin.shelters || []).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>

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
                            {p.id === userId ? 'Vos' : p.is_admin ? 'Quitar admin' : 'Hacer admin'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ T, emoji, label, value, color }) {
  return (
    <Card style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </Card>
  )
}

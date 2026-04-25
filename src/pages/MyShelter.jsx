import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { Btn, Card } from '../components/ui'
import { useMyShelterAdmin } from '../hooks/useShelterAdmin'
import { useShelterAnnouncements, useShelterEvents } from '../hooks/useShelterContent'

const TABS = [
  { key: 'info', label: '🏠 Refugio' },
  { key: 'ann', label: '📢 Anuncios' },
  { key: 'evt', label: '📅 Eventos' },
  { key: 'pets', label: '🐾 Perritos' },
]

export default function MyShelter() {
  const T = useT()
  const navigate = useNavigate()
  const { isLogged, loading: authLoading, shelterId, isShelterStaff, isAdmin } = useAuthContext()

  const [tab, setTab] = useState('info')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [saving, setSaving] = useState(false)

  // Guard
  useEffect(() => {
    if (authLoading) return
    if (!isLogged) navigate('/login', { replace: true })
    else if (!isShelterStaff && !isAdmin) navigate('/', { replace: true })
  }, [authLoading, isLogged, isShelterStaff, isAdmin, navigate])

  const effectiveShelterId = shelterId || null
  const { shelter, config, loading, shelterName, updateShelter, upsertConfig } = useMyShelterAdmin(effectiveShelterId)

  const ann = useShelterAnnouncements(effectiveShelterId)
  const evt = useShelterEvents(effectiveShelterId)
  const { pets, addPet } = usePets()

  const myPets = useMemo(() => {
    if (!effectiveShelterId) return []
    return pets.filter(p => p.type === 'stray' && p.shelterId === effectiveShelterId)
  }, [pets, effectiveShelterId])

  const [infoForm, setInfoForm] = useState(null)
  useEffect(() => {
    if (!infoForm && (shelter || config)) {
      setInfoForm({
        slug: shelter?.slug || '',
        city: shelter?.city || '',
        name: config?.name || shelter?.name || '',
        mission: config?.mission || '',
        description: config?.description || '',
        whatsapp_number: config?.whatsapp_number || '',
        instagram_url: config?.instagram_url || '',
        whatsapp_group_link: config?.whatsapp_group_link || '',
        donation_link: config?.donation_link || '',
        email: config?.email || '',
        legal_name: config?.legal_name || '',
        cuit: config?.cuit || '',
        registration_number: config?.registration_number || '',
      })
    }
  }, [shelter, config, infoForm])

  if (authLoading) return <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  if (!isLogged) return null
  if (!isShelterStaff && !isAdmin) return null

  const saveInfo = async () => {
    if (!infoForm) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      await updateShelter({ slug: infoForm.slug, city: infoForm.city, name: infoForm.name })
      await upsertConfig({ ...infoForm })
      setSuccess('Guardado')
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const createQuickPet = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const created = await addPet({
        shelterId: effectiveShelterId,
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>
      <h1 className="anim" style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 12 }}>
        🏠 Panel {shelterName}
      </h1>

      {/* Tabs */}
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

      {loading && <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando datos del refugio...</div>}

      {/* Info */}
      {tab === 'info' && infoForm && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt }}>Datos públicos</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Slug</label>
                <input value={infoForm.slug} onChange={e => setInfoForm(f => ({ ...f, slug: e.target.value }))} placeholder="casa" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Ciudad / zona</label>
                <input value={infoForm.city} onChange={e => setInfoForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Nombre</label>
                <input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Misión</label>
                <input value={infoForm.mission} onChange={e => setInfoForm(f => ({ ...f, mission: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Descripción</label>
                <textarea rows={3} value={infoForm.description} onChange={e => setInfoForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </Card>

          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt }}>Contacto / donaciones</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>WhatsApp</label>
                <input value={infoForm.whatsapp_number} onChange={e => setInfoForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="549..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Instagram URL</label>
                <input value={infoForm.instagram_url} onChange={e => setInfoForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Grupo WhatsApp voluntarios</label>
                <input value={infoForm.whatsapp_group_link} onChange={e => setInfoForm(f => ({ ...f, whatsapp_group_link: e.target.value }))} placeholder="https://chat.whatsapp.com/..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Link donaciones</label>
                <input value={infoForm.donation_link} onChange={e => setInfoForm(f => ({ ...f, donation_link: e.target.value }))} placeholder="https://..." />
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

          <button className="btn-press" onClick={saveInfo} disabled={saving} style={{
            width: '100%', padding: 14, borderRadius: RS, border: 'none',
            background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      )}

      {/* Anuncios */}
      {tab === 'ann' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Anuncios</div>
                <div style={{ fontSize: 12, color: T.muted }}>Se mostrarán según tu lógica de UI/RLS.</div>
              </div>
              <Btn
                onClick={async () => {
                  setSaving(true); setError(null)
                  try {
                    await ann.create({ body: 'Nuevo anuncio', is_active: true })
                  } catch (e) { setError(e.message) }
                  finally { setSaving(false) }
                }}
                disabled={saving || !effectiveShelterId}
              >
                + Crear
              </Btn>
            </div>
          </Card>

          {ann.loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando anuncios...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ann.items.map(a => (
                <Card key={a.id} style={{ padding: 14 }}>
                  <textarea
                    rows={2}
                    value={a.body || ''}
                    onChange={(e) => ann.update(a.id, { body: e.target.value }).catch(err => setError(err.message))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
                    <Btn
                      v={a.is_active ? 'success' : 'secondary'}
                      onClick={() => ann.update(a.id, { is_active: !a.is_active }).catch(err => setError(err.message))}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {a.is_active ? 'Activo' : 'Inactivo'}
                    </Btn>
                    <Btn
                      v="danger"
                      onClick={() => ann.remove(a.id).catch(err => setError(err.message))}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Eliminar
                    </Btn>
                  </div>
                </Card>
              ))}
              {ann.items.length === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>No hay anuncios.</div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Eventos */}
      {tab === 'evt' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Eventos</div>
                <div style={{ fontSize: 12, color: T.muted }}>Próximas actividades del refugio.</div>
              </div>
              <Btn
                onClick={async () => {
                  setSaving(true); setError(null)
                  try {
                    const iso = new Date(Date.now() + 7 * 86400000).toISOString()
                    await evt.create({ title: 'Nuevo evento', event_at: iso, place: '', signup_link: '' })
                  } catch (e) { setError(e.message) }
                  finally { setSaving(false) }
                }}
                disabled={saving || !effectiveShelterId}
              >
                + Crear
              </Btn>
            </div>
          </Card>

          {evt.loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Cargando eventos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {evt.items.map(e => (
                <Card key={e.id} style={{ padding: 14 }}>
                  <input
                    value={e.title || ''}
                    onChange={(ev) => evt.update(e.id, { title: ev.target.value }).catch(err => setError(err.message))}
                    placeholder="Título"
                    style={{ marginBottom: 8 }}
                  />
                  <input
                    type="datetime-local"
                    value={e.event_at ? e.event_at.slice(0, 16) : ''}
                    onChange={(ev) => evt.update(e.id, { event_at: new Date(ev.target.value).toISOString() }).catch(err => setError(err.message))}
                    style={{ marginBottom: 8 }}
                  />
                  <input
                    value={e.place || ''}
                    onChange={(ev) => evt.update(e.id, { place: ev.target.value }).catch(err => setError(err.message))}
                    placeholder="Lugar"
                    style={{ marginBottom: 8 }}
                  />
                  <input
                    value={e.signup_link || ''}
                    onChange={(ev) => evt.update(e.id, { signup_link: ev.target.value }).catch(err => setError(err.message))}
                    placeholder="Link para anotarse"
                  />
                  <div style={{ marginTop: 10 }}>
                    <Btn v="danger" onClick={() => evt.remove(e.id).catch(err => setError(err.message))} style={{ width: '100%', justifyContent: 'center' }}>
                      Eliminar
                    </Btn>
                  </div>
                </Card>
              ))}
              {evt.items.length === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>No hay eventos.</div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Perritos */}
      {tab === 'pets' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>Perritos del refugio</div>
                <div style={{ fontSize: 12, color: T.muted }}>{myPets.length} registrados</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn v="secondary" onClick={() => navigate('/admin')} disabled={!effectiveShelterId}>
                  Abrir panel
                </Btn>
                <Btn onClick={createQuickPet} disabled={saving || !effectiveShelterId}>+ Crear rápido</Btn>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPets.map(p => (
              <Card key={p.id} style={{ padding: 14 }}>
                <div style={{ fontWeight: 800, color: T.txt }}>{p.name || 'Sin nombre'}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                  {p.adoptionStatus || '—'} · {p.neighborhood || '—'}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Btn v="secondary" onClick={() => navigate(`/perro/${p.id}`)} style={{ width: '100%', justifyContent: 'center' }}>
                    Ver ficha
                  </Btn>
                </div>
              </Card>
            ))}
            {myPets.length === 0 && (
              <Card style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ color: T.muted }}>Todavía no cargaste perritos.</div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


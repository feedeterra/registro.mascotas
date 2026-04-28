import { useState } from 'react'
import { Calendar, MapPin, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { Card } from '../../components/ui'

export default function EventsTab({
  evt, newEvtForm, setNewEvtForm, evtPage, setEvtPage,
  saving, setSaving, targetId, setError, friendlyRlsError,
  T, toast, EVT_PAGE_SIZE
}) {
  const [confirmDelete, setConfirmDelete] = useState(null) // evt id
  const [editing, setEditing] = useState(null) // { id, title, event_at, place, signup_link }

  const handleDelete = async (id) => {
    try {
      await evt.remove(id)
      setConfirmDelete(null)
    } catch (err) {
      setError(err.message)
      toast?.notifyError?.(err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      const title = (editing.title || '').trim()
      if (!title) throw new Error('Falta el título del evento.')
      if (!editing.event_at) throw new Error('Falta la fecha y hora del evento.')
      await evt.update(editing.id, {
        title,
        event_at: new Date(editing.event_at).toISOString(),
        place: (editing.place || '').trim(),
        signup_link: (editing.signup_link || '').trim(),
      })
      setEditing(null)
    } catch (err) {
      setError(err.message)
      toast?.notifyError?.(err)
    }
  }

  return (
    <div className="anim">
      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Eventos</h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Organizá colectas, jornadas de adopción o eventos del refugio.</p>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Título</label>
              <input value={newEvtForm.title} onChange={(e) => setNewEvtForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Jornada de Castración" style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Fecha y Hora</label>
              <input type="datetime-local" value={newEvtForm.event_at} onChange={(e) => setNewEvtForm(f => ({ ...f, event_at: e.target.value }))} style={{ padding: '11px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Lugar</label>
              <input value={newEvtForm.place} onChange={(e) => setNewEvtForm(f => ({ ...f, place: e.target.value }))} placeholder="Ej: Plaza Central" style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Link Formulario</label>
              <input value={newEvtForm.signup_link} onChange={(e) => setNewEvtForm(f => ({ ...f, signup_link: e.target.value }))} placeholder="Opcional" style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
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
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
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
              {editing?.id === e.id ? (
                <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
                  <input value={editing.title} onChange={ev => setEditing(ed => ({ ...ed, title: ev.target.value }))} placeholder="Título" style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${T.accent}`, fontSize: 14 }} />
                  <input type="datetime-local" value={editing.event_at} onChange={ev => setEditing(ed => ({ ...ed, event_at: ev.target.value }))} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }} />
                  <input value={editing.place} onChange={ev => setEditing(ed => ({ ...ed, place: ev.target.value }))} placeholder="Lugar (opcional)" style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${T.borderLt}`, fontSize: 14 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-press" onClick={handleSaveEdit} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Check size={14} /> Guardar
                    </button>
                    <button className="btn-press" onClick={() => setEditing(null)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: T.bg, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
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
              )}

              {editing?.id !== e.id && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-press"
                    onClick={() => setEditing({ id: e.id, title: e.title, event_at: e.event_at ? new Date(e.event_at).toISOString().slice(0, 16) : '', place: e.place || '', signup_link: e.signup_link || '' })}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: T.accentLt, color: T.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Pencil size={13} /> Editar
                  </button>

                  {confirmDelete === e.id ? (
                    <>
                      <button className="btn-press" onClick={() => handleDelete(e.id)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: T.danger, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                        Confirmar
                      </button>
                      <button className="btn-press" onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: T.bg, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-press" onClick={() => setConfirmDelete(e.id)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
          {evt.items.length === 0 && (
            <Card style={{ padding: 40, textAlign: 'center', border: `1.5px dashed ${T.borderLt}` }}>
              <div style={{ color: T.muted, fontSize: 14 }}>No hay eventos programados.</div>
            </Card>
          )}
        </div>
      )}

      {Math.max(1, Math.ceil((evt.total || 0) / EVT_PAGE_SIZE)) > 1 && (
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
      )}
    </div>
  )
}

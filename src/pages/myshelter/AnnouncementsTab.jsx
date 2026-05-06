import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Check, X, Megaphone, Save } from 'lucide-react'
import { Card } from '../../components/ui'
import { RS } from '../../theme'

export default function AnnouncementsTab({
  ann, newAnnBody, setNewAnnBody, newAnnActive, setNewAnnActive,
  annPage, setAnnPage, saving, setSaving, targetId, setError,
  friendlyRlsError, T, toast, ANN_PAGE_SIZE,
  infoForm, setInfoForm, saveInfo,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null) // ann id
  const [editing, setEditing] = useState(null) // { id, body }

  const handleDelete = async (id) => {
    try {
      await ann.remove(id)
      setConfirmDelete(null)
    } catch (err) {
      setError(err.message)
      toast?.notifyError?.(err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    try {
      await ann.update(editing.id, { body: editing.body.trim() })
      setEditing(null)
    } catch (err) {
      setError(err.message)
      toast?.notifyError?.(err)
    }
  }

  return (
    <div className="anim">
      {infoForm && (
        <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.accent}35` }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6, color: T.txt, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={20} /> Barra superior
          </h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.45 }}>
            Un <strong>texto corto</strong> que corre en la franja superior del sitio cuando está activo.
            En páginas de tu refugio y de tus perros se muestra solo este mensaje (no mezcla con avisos globales).
          </p>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16, lineHeight: 1.45 }}>
            Más abajo, los <strong>anuncios del perfil</strong> son entradas con fecha: se listan en la página pública del refugio y en el perfil de quienes se suscribieron.
          </p>
          <textarea
            rows={3}
            placeholder="Ej: Este finde colecta en el parque…"
            value={infoForm.announcement_text}
            onChange={e => setInfoForm(f => ({ ...f, announcement_text: e.target.value }))}
            style={{ marginBottom: 12, padding: 14, borderRadius: 14, border: `1.5px solid ${T.borderLt}`, fontSize: 14, width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              id="ann-bar-active"
              checked={!!infoForm.announcement_active}
              onChange={e => setInfoForm(f => ({ ...f, announcement_active: e.target.checked }))}
              style={{ width: 'auto' }}
            />
            <label htmlFor="ann-bar-active" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Barra activa</label>
          </div>
          <button
            type="button"
            className="btn-press"
            onClick={() => { setError(null); saveInfo() }}
            disabled={saving || !targetId}
            style={{
              width: '100%', padding: 14, borderRadius: RS, border: 'none',
              background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? 'Guardando…' : <><Save size={16} /> Guardar barra</>}
          </button>
        </Card>
      )}

      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Anuncios en el perfil</h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Noticias que se muestran como tarjetas en la página del refugio y en suscriptos.</p>

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
            <Card key={a.id} style={{ padding: '12px 16px', border: `1.5px solid ${T.borderLt}` }}>
              {editing?.id === a.id ? (
                <div style={{ marginBottom: 10 }}>
                  <textarea
                    rows={4}
                    value={editing.body}
                    onChange={e => setEditing(ed => ({ ...ed, body: e.target.value }))}
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: `1.5px solid ${T.accent}`, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className="btn-press"
                      onClick={handleSaveEdit}
                      style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Check size={14} /> Guardar
                    </button>
                    <button
                      className="btn-press"
                      onClick={() => setEditing(null)}
                      style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: T.bg, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 14, fontWeight: 500, color: T.txt, margin: '0 0 10px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {a.body}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 8,
                  background: a.is_active ? T.okLt : T.bg,
                  color: a.is_active ? T.ok : T.muted
                }}>
                  {a.is_active ? 'Activo' : 'Oculto'}
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  {editing?.id !== a.id && (
                    <button
                      className="btn-press"
                      onClick={() => setEditing({ id: a.id, body: a.body })}
                      style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.accentLt, color: T.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                  <button
                    className="btn-press"
                    onClick={() => ann.update(a.id, { is_active: !a.is_active }).catch(err => { setError(err.message); toast?.notifyError?.(err) })}
                    style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.bg, color: T.txt, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {a.is_active ? 'Ocultar' : 'Activar'}
                  </button>

                  {confirmDelete === a.id ? (
                    <>
                      <button
                        className="btn-press"
                        onClick={() => handleDelete(a.id)}
                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.danger, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Confirmar
                      </button>
                      <button
                        className="btn-press"
                        onClick={() => setConfirmDelete(null)}
                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.bg, color: T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-press"
                      onClick={() => setConfirmDelete(a.id)}
                      style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: T.dangerLt, color: T.danger, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  )}
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

      {Math.max(1, Math.ceil((ann.total || 0) / ANN_PAGE_SIZE)) > 1 && (
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
      )}
    </div>
  )
}

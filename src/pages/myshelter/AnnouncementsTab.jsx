import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui'

export default function AnnouncementsTab({ 
  ann, newAnnBody, setNewAnnBody, newAnnActive, setNewAnnActive, 
  annPage, setAnnPage, saving, setSaving, targetId, setError, 
  friendlyRlsError, T, toast, ANN_PAGE_SIZE 
}) {
  return (
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
            <Card key={a.id} style={{ padding: '12px 16px', border: `1.5px solid ${T.borderLt}` }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: T.txt, margin: '0 0 10px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {a.body}
              </p>
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

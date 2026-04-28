import { useState, useRef } from 'react'
import { Landmark, Save, ChevronDown, ChevronUp, Move } from 'lucide-react'
import { Card } from '../../components/ui'
import { I } from '../../components/ui/Icons'
import ImageUploadField from '../../components/ImageUploadField'
import { compressImageToFile } from '../../utils'
import { uploadShelterImage } from '../../lib/supabase'
import { RM, RS } from '../../theme'

function PhotoPositionPicker({ url, position, onChange, T }) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const [active, setActive] = useState(false)

  const posFromEvent = (e) => {
    if (!containerRef.current) return position
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)))
    return `${x}% ${y}%`
  }
  const onStart = (e) => { dragging.current = true; setActive(true); onChange(posFromEvent(e)) }
  const onMove = (e) => { if (!dragging.current) return; if (e.cancelable) e.preventDefault(); onChange(posFromEvent(e)) }
  const onEnd = () => { dragging.current = false; setActive(false) }

  const parts = (position || '50% 50%').split(' ')
  const px = parseFloat(parts[0]) || 50
  const py = parseFloat(parts[1]) || 50

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Move size={12} /> Arrastrá el ● para ajustar el recorte
      </div>
      <div
        ref={containerRef}
        onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchMove={onMove} onTouchEnd={onEnd}
        style={{
          width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden',
          border: `2px solid ${active ? T.accent : T.borderLt}`,
          cursor: 'crosshair', position: 'relative', userSelect: 'none',
          background: T.bg, transition: 'border-color 0.15s',
          touchAction: 'pan-y',
        }}
      >
        <img src={url} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        {/* Zona de táctil ampliada: 60px invisible, con handle visual adentro */}
        <div
          onMouseDown={onStart} onTouchStart={onStart}
          style={{
            position: 'absolute',
            left: `${px}%`, top: `${py}%`,
            transform: 'translate(-50%, -50%)',
            width: 60, height: 60,
            borderRadius: '50%',
            cursor: 'grab',
            zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: T.accent, border: '3px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: active ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.15s ease-out',
            pointerEvents: 'none',
          }}>
            <Move size={14} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InfoTab({ infoForm, setInfoForm, saveInfo, saving, T, targetId, setError }) {
  const [legacyOpen, setLegacyOpen] = useState(false)
  if (!infoForm) return null

  return (
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
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>WhatsApp Adopciones / Perros</label>
              <input value={infoForm.whatsapp_number} onChange={e => setInfoForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="Ej: 549..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>WhatsApp Gestión / Sponsors / Visitas</label>
              <input value={infoForm.whatsapp_admin} onChange={e => setInfoForm(f => ({ ...f, whatsapp_admin: e.target.value }))} placeholder="Ej: 549..." />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Instagram</label>
              <input value={infoForm.instagram_url} onChange={e => setInfoForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="Link o @usuario" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Facebook</label>
              <input value={infoForm.facebook_url} onChange={e => setInfoForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="Link de página" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>TikTok</label>
              <input value={infoForm.tiktok_url} onChange={e => setInfoForm(f => ({ ...f, tiktok_url: e.target.value }))} placeholder="Link o @usuario" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>WhatsApp Voluntarios</label>
              <input value={infoForm.whatsapp_group_link} onChange={e => setInfoForm(f => ({ ...f, whatsapp_group_link: e.target.value }))} placeholder="Link de invitación" />
            </div>
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
          {infoForm.shelter_image_url && (
            <PhotoPositionPicker
              T={T}
              url={infoForm.shelter_image_url}
              position={infoForm.shelter_image_position || '50% 50%'}
              onChange={(pos) => setInfoForm(f => ({ ...f, shelter_image_position: pos }))}
            />
          )}
        </div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
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
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <button
          onClick={() => setLegacyOpen(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            {I.Megaphone(16)} Anuncio en barra superior (Legacy)
          </div>
          {legacyOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
        </button>
        {legacyOpen && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Este anuncio aparece en la parte de arriba de todo el sitio.
              Si creás anuncios nuevos en la pestaña "Anuncios", éstos tendrán prioridad.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <textarea
                placeholder="Texto del anuncio..."
                value={infoForm.announcement_text}
                onChange={e => setInfoForm(f => ({ ...f, announcement_text: e.target.value }))}
                style={{ fontSize: 13 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={infoForm.announcement_active}
                  onChange={e => setInfoForm(f => ({ ...f, announcement_active: e.target.checked }))}
                  style={{ width: 'auto' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Anuncio activo</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <button className="btn-press" onClick={saveInfo} disabled={saving} style={{
        width: '100%', padding: 14, borderRadius: RS, border: 'none',
        background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
        color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
      }}>
        {saving ? 'Guardando...' : <><Save size={14}/> Guardar</>}
      </button>
    </div>
  )
}

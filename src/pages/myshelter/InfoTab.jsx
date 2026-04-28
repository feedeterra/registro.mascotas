import { Landmark, Save } from 'lucide-react'
import { Card } from '../../components/ui'
import { I } from '../../components/ui/Icons'
import ImageUploadField from '../../components/ImageUploadField'
import { compressImageToFile } from '../../utils'
import { uploadShelterImage } from '../../lib/supabase'

const RM = 16
const RS = 12

export default function InfoTab({ infoForm, setInfoForm, saveInfo, saving, T, targetId, setError }) {
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
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
          {I.Megaphone(16)} Anuncio en barra superior (Legacy)
        </div>
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

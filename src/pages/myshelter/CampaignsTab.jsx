import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Save, Image as ImgIcon, Dog } from 'lucide-react'
import { Card } from '../../components/ui'
import { RM, RS } from '../../theme'
import ImageUploadField from '../../components/ImageUploadField'
import PhotoPositionPicker from '../../components/PhotoPositionPicker'
import { compressImageToFile } from '../../utils'
import { uploadShelterImage, deleteStorageObjectsFromUrls, supabase } from '../../lib/supabase'
import {
  deleteShelterCampaign,
  insertShelterCampaign,
  listShelterCampaignsAdmin,
  updateShelterCampaign,
} from '../../services/shelters'
import { campaignStatusLabelEs, urgencyLabelEs } from '../../utils/campaigns'

const PAGE_SIZE = 8

const emptyForm = () => ({
  title: '',
  description: '',
  status: 'draft',
  urgency: 2,
  image_mode: 'custom',
  image_url: '',
  image_position: '50% 50%',
  pet_id: '',
  use_shelter_accounts: true,
  transfer_accounts_override: [],
})

function parseAccounts(raw) {
  if (Array.isArray(raw)) return raw
  return []
}

export default function CampaignsTab({ targetId, T, toast, setError }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState('list') // list | edit
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const q = useQuery({
    queryKey: ['campaigns', 'panel', targetId, page],
    queryFn: () => listShelterCampaignsAdmin(targetId, { page, pageSize: PAGE_SIZE }),
    enabled: !!targetId,
  })

  const list = q.data?.data ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const petsQ = useQuery({
    queryKey: ['pets', 'panel', 'campaigns', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, slug, photos, adoption_status')
        .eq('shelter_id', targetId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data || []
    },
    enabled: !!targetId,
    staleTime: 1000 * 30,
  })

  const selectablePets = useMemo(() => {
    const pets = petsQ.data || []
    return pets.filter((p) => (p.adoption_status || '').toLowerCase() !== 'adopted')
  }, [petsQ.data])

  const resetForm = () => {
    setEditId(null)
    setForm(emptyForm())
    setMode('list')
  }

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm())
    setMode('edit')
  }

  const openEdit = (row) => {
    setEditId(row.id)
    setForm({
      title: row.title || '',
      description: row.description || '',
      status: row.status || 'draft',
      urgency: Number(row.urgency) || 2,
      image_mode: row.image_mode || 'custom',
      image_url: row.image_url || '',
      image_position: row.image_position || '50% 50%',
      pet_id: row.pet_id || '',
      use_shelter_accounts: row.use_shelter_accounts !== false,
      transfer_accounts_override: parseAccounts(row.transfer_accounts_override),
    })
    setMode('edit')
  }

  const save = async () => {
    if (!targetId) return
    const title = (form.title || '').trim()
    const description = (form.description || '').trim()
    if (title.length < 3) return setError('El título debe tener al menos 3 caracteres.')
    if (description.length < 10) return setError('La descripción debe tener al menos 10 caracteres.')
    if (form.image_mode === 'pet' && !form.pet_id) return setError('Elegí un perrito o cambiá a imagen propia.')

    setSaving(true)
    setError(null)
    try {
  // Para limpiar imagen vieja si se reemplaza
      let prev = null
      if (editId) {
        const { data } = await supabase.from('shelter_campaigns').select('*').eq('id', editId).maybeSingle()
        prev = data
      }

      const payload = {
        shelter_id: targetId,
        status: form.status,
        urgency: Number(form.urgency) || 2,
        title,
        description,
        image_mode: form.image_mode,
        image_url: form.image_mode === 'custom' ? (form.image_url || null) : null,
        image_position: form.image_position || '50% 50%',
        pet_id: form.image_mode === 'pet' ? form.pet_id : null,
        use_shelter_accounts: form.use_shelter_accounts !== false,
        transfer_accounts_override: form.use_shelter_accounts ? null : (form.transfer_accounts_override || []),
      }

      if (editId) {
        const { error } = await updateShelterCampaign(editId, payload)
        if (error) throw error
        if (prev?.image_url && prev.image_url !== payload.image_url) {
          try { await deleteStorageObjectsFromUrls([prev.image_url]) } catch (_) { /* best-effort */ }
        }
      } else {
        const { error } = await insertShelterCampaign(payload)
        if (error) throw error
      }

      await qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast?.notifySuccess?.(editId ? 'Colecta actualizada' : 'Colecta creada')
      resetForm()
    } catch (e) {
      setError(e?.message || 'Error al guardar')
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { data: row } = await supabase.from('shelter_campaigns').select('*').eq('id', id).maybeSingle()
      if (row?.image_url) {
        try { await deleteStorageObjectsFromUrls([row.image_url]) } catch (_) { /* best-effort */ }
      }
      const { error } = await deleteShelterCampaign(id)
      if (error) throw error
      setConfirmDelete(null)
      await qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast?.notifySuccess?.('Colecta eliminada')
    } catch (e) {
      setError(e?.message || 'Error al eliminar')
      toast?.notifyError?.(e)
    }
  }

  const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }
  const fieldInput = { width: '100%', padding: '10px 12px', borderRadius: RM, border: `1.5px solid ${T.borderLt}`, fontSize: 14, boxSizing: 'border-box' }

  if (mode === 'edit') {
    return (
      <div className="anim">
        <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: T.txt, letterSpacing: -0.5 }}>
              {editId ? 'Editar colecta' : 'Nueva colecta'}
            </div>
            <button
              type="button"
              className="btn-press"
              onClick={resetForm}
              style={{ padding: '8px 12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, background: T.bg, fontWeight: 800, cursor: 'pointer' }}
            >
              Volver
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={fieldLabel}>Título</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={fieldInput} placeholder="Ej: Operación de Lola" />
            </div>
            <div>
              <label style={fieldLabel}>Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...fieldInput, minHeight: 110, resize: 'vertical' }} placeholder="Contá qué necesitan, por qué y cómo ayuda la donación." />
              <div style={{ marginTop: 6, fontSize: 11, color: T.muted, fontWeight: 600 }}>
                Tip: no incluyas dirección exacta ni datos sensibles.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Estado</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={fieldInput}>
                  <option value="draft">Por finalizar</option>
                  <option value="active">Activa</option>
                  <option value="completed">Finalizada</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Urgencia</label>
                <select value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: Number(e.target.value) }))} style={fieldInput}>
                  <option value={1}>Baja</option>
                  <option value={2}>Media</option>
                  <option value={3}>Alta</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-press"
                  onClick={() => setForm((f) => ({ ...f, image_mode: 'custom', pet_id: '' }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: RS,
                    border: `1.5px solid ${form.image_mode === 'custom' ? T.accent : T.borderLt}`,
                    background: form.image_mode === 'custom' ? T.accentLt : T.bg,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ImgIcon size={16} /> Imagen propia
                </button>
                <button
                  type="button"
                  className="btn-press"
                  onClick={() => setForm((f) => ({ ...f, image_mode: 'pet', image_url: '' }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: RS,
                    border: `1.5px solid ${form.image_mode === 'pet' ? T.accent : T.borderLt}`,
                    background: form.image_mode === 'pet' ? T.accentLt : T.bg,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Dog size={16} /> Usar un perrito
                </button>
              </div>

              {form.image_mode === 'custom' ? (
                <>
                  <ImageUploadField
                    T={T}
                    label="Imagen de la colecta"
                    hint="Se muestra en el listado público."
                    currentUrl={form.image_url}
                    onUpload={async (file) => {
                      try {
                        const compressed = await compressImageToFile(file, 1400, 0.8)
                        const url = await uploadShelterImage(compressed, 'campaign', targetId)
                        setForm((f) => ({ ...f, image_url: url }))
                      } catch (e) {
                        setError(e?.message || 'No se pudo subir la imagen')
                      }
                    }}
                    onRemove={() => setForm((f) => ({ ...f, image_url: '' }))}
                    onError={(msg) => setError(msg)}
                  />
                  {form.image_url && (
                    <PhotoPositionPicker
                      T={T}
                      url={form.image_url}
                      position={form.image_position || '50% 50%'}
                      onChange={(pos) => setForm((f) => ({ ...f, image_position: pos }))}
                    />
                  )}
                </>
              ) : (
                <div>
                  <label style={fieldLabel}>Perrito asociado</label>
                  <select value={form.pet_id} onChange={(e) => setForm((f) => ({ ...f, pet_id: e.target.value }))} style={fieldInput}>
                    <option value="">Elegí un perrito…</option>
                    {selectablePets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 6, fontSize: 11, color: T.muted, fontWeight: 600 }}>
                    Usamos su nombre e imagen en la tarjeta pública.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: RM,
                border: `1px solid ${T.accent}28`,
                background: `linear-gradient(165deg, ${T.accent}0a 0%, ${T.bg} 55%)`,
                boxShadow: `0 1px 0 ${T.borderLt}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, color: T.txt, marginBottom: 4, letterSpacing: -0.2 }}>
                Donaciones por transferencia
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: T.muted, fontWeight: 600, lineHeight: 1.45 }}>
                Elegí si los aportes van a las cuentas del refugio o a datos específicos de esta colecta.
              </p>
              <div
                role="group"
                aria-label="Origen de los datos bancarios"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: 4,
                  borderRadius: 12,
                  background: T.borderLt,
                  border: `1px solid ${T.borderLt}`,
                }}
              >
                <button
                  type="button"
                  className="btn-press"
                  onClick={() => setForm((f) => ({ ...f, use_shelter_accounts: true }))}
                  style={{
                    flex: '1 1 140px',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 12,
                    background: form.use_shelter_accounts ? T.card : 'transparent',
                    color: form.use_shelter_accounts ? T.accent : T.muted,
                    boxShadow: form.use_shelter_accounts ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Cuentas del refugio
                </button>
                <button
                  type="button"
                  className="btn-press"
                  onClick={() => setForm((f) => ({ ...f, use_shelter_accounts: false }))}
                  style={{
                    flex: '1 1 140px',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 12,
                    background: !form.use_shelter_accounts ? T.card : 'transparent',
                    color: !form.use_shelter_accounts ? T.accent : T.muted,
                    boxShadow: !form.use_shelter_accounts ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Solo esta colecta
                </button>
              </div>
              {!form.use_shelter_accounts && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Cuentas para esta colecta
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(form.transfer_accounts_override || []).map((acc, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${T.borderLt}`,
                          background: T.card,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: T.txt }}>Cuenta {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({
                              ...f,
                              transfer_accounts_override: (f.transfer_accounts_override || []).filter((_, i) => i !== idx),
                            }))}
                            style={{ background: 'none', border: 'none', color: T.danger, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                          >
                            Quitar
                          </button>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {[
                            { key: 'label', label: 'Etiqueta', placeholder: 'Ej. Colecta veterinaria' },
                            { key: 'titular', label: 'Titular', placeholder: 'Nombre completo' },
                            { key: 'alias', label: 'Alias', placeholder: 'mi.alias' },
                            { key: 'cbu', label: 'CBU (opcional)', placeholder: '0070…' },
                            { key: 'cvu', label: 'CVU (opcional)', placeholder: '0000…' },
                          ].map((field) => (
                            <div key={field.key}>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: T.muted, marginBottom: 4 }}>{field.label}</label>
                              <input
                                value={acc?.[field.key] || ''}
                                placeholder={field.placeholder}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setForm((f) => ({
                                    ...f,
                                    transfer_accounts_override: (f.transfer_accounts_override || []).map((a, i) => i === idx ? { ...a, [field.key]: v } : a),
                                  }))
                                }}
                                style={{ ...fieldInput, padding: '8px 10px', fontSize: 13 }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-press"
                    onClick={() => setForm((f) => ({
                      ...f,
                      transfer_accounts_override: [...(f.transfer_accounts_override || []), { label: '', titular: '', alias: '' }],
                    }))}
                    style={{
                      marginTop: 10,
                      padding: '10px 12px',
                      width: '100%',
                      borderRadius: RS,
                      border: `1.5px dashed ${T.accent}50`,
                      background: T.accentLt,
                      color: T.accent,
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    + Agregar otra cuenta
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-press"
              onClick={save}
              disabled={saving}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: RS,
                border: 'none',
                background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: '#fff',
                fontSize: 14,
                fontWeight: 900,
                cursor: saving ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {saving ? 'Guardando…' : <><Save size={16} /> Guardar colecta</>}
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="anim">
      <Card style={{ padding: 20, marginBottom: 12, border: `1.5px solid ${T.borderLt}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.txt, letterSpacing: -0.3 }}>
              Colectas
            </div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 4, lineHeight: 1.45 }}>
              Publicá objetivos con urgencia y estado. El público solo ve las colectas <strong>Activas</strong>.
            </div>
          </div>
          <button
            type="button"
            className="btn-press"
            onClick={openNew}
            style={{
              padding: '10px 14px',
              borderRadius: RS,
              border: 'none',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={16} /> Nueva colecta
          </button>
        </div>
      </Card>

      {q.isLoading ? (
        <Card style={{ padding: 20 }}>
          <div style={{ color: T.muted, fontWeight: 700 }}>Cargando…</div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((c) => (
            <Card key={c.id} style={{ padding: 16, border: `1.5px solid ${T.borderLt}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: T.txt, fontSize: 14, marginBottom: 4 }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>Estado: <strong style={{ color: T.txt }}>{campaignStatusLabelEs(c.status)}</strong></span>
                    <span>Urgencia: <strong style={{ color: T.txt }}>{urgencyLabelEs(c.urgency)}</strong></span>
                    <span>Imagen: <strong style={{ color: T.txt }}>{c.image_mode === 'pet' ? 'Perrito' : 'Propia'}</strong></span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: T.txt, opacity: 0.92, lineHeight: 1.45 }}>
                    {String(c.description || '').slice(0, 180)}{String(c.description || '').length > 180 ? '…' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn-press"
                    onClick={() => openEdit(c)}
                    style={{ padding: 10, borderRadius: 12, border: `1.5px solid ${T.borderLt}`, background: T.bg, cursor: 'pointer' }}
                    aria-label="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-press"
                    onClick={() => setConfirmDelete(c.id)}
                    style={{ padding: 10, borderRadius: 12, border: `1.5px solid ${T.danger}30`, background: T.dangerLt, cursor: 'pointer', color: T.danger }}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {confirmDelete === c.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.borderLt}` }}>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 10 }}>
                    ¿Eliminar esta colecta? Esta acción no se puede deshacer.
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn-press"
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: RS,
                        border: 'none',
                        background: T.danger,
                        color: '#fff',
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      className="btn-press"
                      onClick={() => setConfirmDelete(null)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: RS,
                        border: `1.5px solid ${T.borderLt}`,
                        background: T.bg,
                        color: T.txt,
                        fontWeight: 900,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {list.length === 0 && (
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ color: T.muted, fontWeight: 700 }}>Todavía no creaste colectas.</div>
            </Card>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10 }}>
          <button
            type="button"
            className="btn-press"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, background: page <= 1 ? T.borderLt : T.bg, fontWeight: 900, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 800 }}>
            Página {page} / {totalPages}
          </div>
          <button
            type="button"
            className="btn-press"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, background: page >= totalPages ? T.borderLt : T.bg, fontWeight: 900, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}


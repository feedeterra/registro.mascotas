import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react'
import { Card, Btn } from '../../components/ui'
import ImageUploadField from '../../components/ImageUploadField'
import PhotoPositionPicker from '../../components/PhotoPositionPicker'
import { supabase, uploadStoryImage, deleteStorageObjectsFromUrls } from '../../lib/supabase'
import { fetchSuccessStoriesPage, collectSuccessStoryStorageUrls } from '../../services/successStories'
import { compressImageToFile } from '../../utils'
import { RM } from '../../theme'

const PAGE_SIZE = 8

const emptyForm = () => ({
  petName: '',
  sex: 'unknown',
  story: '',
  adopterName: '',
  adopterQuote: '',
  adoptedAt: new Date().toISOString().slice(0, 16),
  photoUrl: '',
  photoAfterPosition: '50% 50%',
})

function vmToForm(vm) {
  const before0 = Array.isArray(vm.photosBefore) && vm.photosBefore.length ? vm.photosBefore[0] : ''
  return {
    petName: vm.petName || '',
    sex: vm.sex || 'unknown',
    story: vm.story || '',
    adopterName: vm.adopterName || '',
    adopterQuote: vm.quote || '',
    adoptedAt: vm.adoptedDate
      ? new Date(vm.adoptedDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    photoUrl: vm.photoAfter || before0 || '',
    photoAfterPosition: vm.adoptedPhotoPosition || '50% 50%',
  }
}

export default function StoriesTab({ targetId, T, toast, setError }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState('list') // list | edit
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const q = useQuery({
    queryKey: ['success_stories', 'panel', targetId, page],
    queryFn: () => fetchSuccessStoriesPage({ shelterId: targetId, page, pageSize: PAGE_SIZE }),
    enabled: !!targetId,
  })

  const list = q.data?.data ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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

  const openEdit = (vm) => {
    setEditId(vm.id)
    setForm(vmToForm(vm))
    setMode('edit')
  }

  const save = async () => {
    if (!targetId) return
    const name = (form.petName || '').trim()
    if (!name) {
      setError('El nombre del perrito es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let prevRow = null
      if (editId) {
        const { data } = await supabase.from('success_stories').select('*').eq('id', editId).maybeSingle()
        prevRow = data
      }

      const photoUrl = form.photoUrl || null
      const firstBefore = (row) => {
        const arr = row?.photos_before
        if (!Array.isArray(arr) || !arr.length) return null
        return arr[0]
      }

      const keepLegacyGallery =
        !!editId &&
        !!prevRow &&
        !!photoUrl &&
        Array.isArray(prevRow.photos_before) &&
        prevRow.photos_before.length > 0 &&
        (prevRow.photo_after_url
          ? photoUrl === prevRow.photo_after_url
          : photoUrl === firstBefore(prevRow))

      let photos_before = []
      let photo_positions = []
      let primary_photo_idx = 0
      let photo_after_url = photoUrl

      if (keepLegacyGallery) {
        photos_before = prevRow.photos_before
        photo_positions = Array.isArray(prevRow.photo_positions) ? prevRow.photo_positions : []
        primary_photo_idx = prevRow.primary_photo_idx ?? 0
        photo_after_url = prevRow.photo_after_url || null
      }

      const payload = {
        shelter_id: targetId,
        pet_name: name,
        sex: form.sex === 'unknown' ? null : form.sex,
        story: (form.story || '').trim(),
        photos_before,
        photo_positions,
        primary_photo_idx,
        photo_after_url,
        photo_after_position: form.photoAfterPosition || '50% 50%',
        adopter_name: (form.adopterName || '').trim() || null,
        adopter_quote: (form.adopterQuote || '').trim() || null,
        adopted_at: form.adoptedAt ? new Date(form.adoptedAt).toISOString() : null,
      }

      if (editId) {
        const { error: upErr } = await supabase
          .from('success_stories')
          .update({
            pet_name: payload.pet_name,
            sex: payload.sex,
            story: payload.story,
            photos_before: payload.photos_before,
            photo_positions: payload.photo_positions,
            primary_photo_idx: payload.primary_photo_idx,
            photo_after_url: payload.photo_after_url,
            photo_after_position: payload.photo_after_position,
            adopter_name: payload.adopter_name,
            adopter_quote: payload.adopter_quote,
            adopted_at: payload.adopted_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
        if (upErr) throw upErr
        if (prevRow) {
          const oldUrls = collectSuccessStoryStorageUrls(prevRow)
          const newUrls = new Set([
            ...collectSuccessStoryStorageUrls({
              ...prevRow,
              photos_before: payload.photos_before,
              photo_after_url: payload.photo_after_url,
            }),
          ])
          const orphaned = oldUrls.filter((u) => !newUrls.has(u))
          if (orphaned.length) await deleteStorageObjectsFromUrls(orphaned)
        }
      } else {
        const { error: insErr } = await supabase.from('success_stories').insert(payload)
        if (insErr) throw insErr
      }

      await qc.invalidateQueries({ queryKey: ['success_stories'] })
      toast?.notifySuccess?.(editId ? 'Historia actualizada' : 'Historia creada')
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
      const { data: row } = await supabase.from('success_stories').select('*').eq('id', id).maybeSingle()
      if (row) {
        const urls = collectSuccessStoryStorageUrls(row)
        if (urls.length) await deleteStorageObjectsFromUrls(urls)
      }
      const { error: delErr } = await supabase.from('success_stories').delete().eq('id', id)
      if (delErr) throw delErr
      setConfirmDelete(null)
      await qc.invalidateQueries({ queryKey: ['success_stories'] })
      toast?.notifySuccess?.('Historia eliminada')
    } catch (e) {
      setError(e?.message || 'Error al eliminar')
      toast?.notifyError?.(e)
    }
  }

  const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }
  const fieldInput = { width: '100%', padding: '10px 12px', borderRadius: RM, border: `1.5px solid ${T.borderLt}`, fontSize: 14, boxSizing: 'border-box' }

  if (mode === 'edit') {
    return (
      <div className="anim">
        <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              className="btn-press"
              onClick={resetForm}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                border: `1.5px solid ${T.borderLt}`,
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Volver
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: T.txt }}>
              {editId ? 'Editar historia' : 'Nueva historia'}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <ImageUploadField
              T={T}
              label="Foto de la historia"
              hint="Misma experiencia que en el panel del refugio: aparece en la web y al compartir."
              currentUrl={form.photoUrl || null}
              onUpload={async (file) => {
                const compressed = await compressImageToFile(file, 1400, 0.8)
                const url = await uploadStoryImage(compressed, targetId)
                setForm((f) => ({ ...f, photoUrl: url, photoAfterPosition: '50% 50%' }))
              }}
              onRemove={() => setForm((f) => ({ ...f, photoUrl: '', photoAfterPosition: '50% 50%' }))}
              onError={(msg) => setError(msg)}
            />

            {form.photoUrl ? (
              <PhotoPositionPicker
                T={T}
                url={form.photoUrl}
                aspectRatio="4/3"
                position={form.photoAfterPosition || '50% 50%'}
                onChange={(pos) => setForm((f) => ({ ...f, photoAfterPosition: pos }))}
              />
            ) : null}

            <div>
              <label style={fieldLabel}>Nombre del perrito *</label>
              <input
                value={form.petName}
                onChange={(e) => setForm((f) => ({ ...f, petName: e.target.value }))}
                placeholder="Ej: Canela"
                style={fieldInput}
              />
            </div>

            <div>
              <label style={fieldLabel}>Sexo</label>
              <select
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                style={fieldInput}
              >
                <option value="unknown">Desconocido</option>
                <option value="male">Macho</option>
                <option value="female">Hembra</option>
              </select>
            </div>

            <div>
              <label style={fieldLabel}>Historia</label>
              <textarea
                rows={5}
                value={form.story}
                onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
                placeholder="Contá cómo fue la adopción…"
                style={{ ...fieldInput, resize: 'vertical', minHeight: 100 }}
              />
            </div>

            <div>
              <label style={fieldLabel}>Familia adoptante</label>
              <input
                value={form.adopterName}
                onChange={(e) => setForm((f) => ({ ...f, adopterName: e.target.value }))}
                placeholder="Nombre o cómo presentarse"
                style={fieldInput}
              />
            </div>

            <div>
              <label style={fieldLabel}>Cita o frase (opcional)</label>
              <input
                value={form.adopterQuote}
                onChange={(e) => setForm((f) => ({ ...f, adopterQuote: e.target.value }))}
                placeholder="Ej: Nos eligió a nosotros"
                style={fieldInput}
              />
            </div>

            <div>
              <label style={fieldLabel}>Fecha de adopción</label>
              <input
                type="datetime-local"
                value={form.adoptedAt}
                onChange={(e) => setForm((f) => ({ ...f, adoptedAt: e.target.value }))}
                style={fieldInput}
              />
            </div>

            <Btn onClick={save} disabled={saving} style={{ marginTop: 4 }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Btn>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="anim">
      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: T.txt }}>Historias de adopción</h2>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Gestioná finales felices publicados. Las adopciones nuevas se crean al cerrar el asistente en Perritos.
            </p>
          </div>
          <button
            type="button"
            className="btn-press"
            onClick={openNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} /> Nueva historia
          </button>
        </div>
      </Card>

      {q.isLoading && <p style={{ color: T.muted }}>Cargando…</p>}
      {q.isError && <p style={{ color: T.danger }}>{q.error?.message || 'Error'}</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {list.map((s) => (
          <Card
            key={s.id}
            style={{
              padding: 16,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
              border: `1.5px solid ${T.borderLt}`,
            }}
          >
            {(s.photoAfter || s.photoBefore) ? (
              <img
                src={s.photoAfter || s.photoBefore}
                alt=""
                style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 12, background: T.bg }}
              />
            ) : (
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 12,
                  background: T.borderLt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.muted,
                }}
              >
                Sin foto
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: T.txt }}>{s.petName}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                {s.adoptedDate ? new Date(s.adoptedDate).toLocaleDateString() : '—'}
                {s.legacyPetId ? ' · desde adopción en sistema' : ''}
              </div>
              <Link to={`/historia/${s.id}`} style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginTop: 8, display: 'inline-block' }}>
                Ver público →
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-press"
                onClick={() => openEdit(s)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${T.borderLt}`,
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                className="btn-press"
                onClick={() => setConfirmDelete(s.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${T.danger}40`,
                  background: T.dangerLt,
                  color: T.danger,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: `1.5px solid ${T.borderLt}`,
              background: '#fff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: `1.5px solid ${T.borderLt}`,
              background: '#fff',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <Card style={{ padding: 24, maxWidth: 400, width: '100%' }}>
            <p style={{ fontWeight: 800, marginBottom: 12 }}>¿Eliminar esta historia?</p>
            <p style={{ fontSize: 14, color: T.muted, marginBottom: 20 }}>Se borrarán también las fotos en el almacenamiento del refugio.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn v="ghost" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Btn>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  padding: '12px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: T.danger,
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Eliminar
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

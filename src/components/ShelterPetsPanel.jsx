import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS, R } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { useAuthContext } from '../context/AuthContext'
import { supabase, uploadPetPhoto, deletePetPhoto } from '../lib/supabase'
import { compressImageToFile, fuzzyMatch, sizeLabel, sexLabel, PERSONALITY_TRAITS, parseCsv } from '../utils'
import { Card, Btn } from './ui'
import { I } from './ui/Icons'
import { ADOPTION_STATUSES } from '../lib/constants'
import { useToast } from '../context/ToastContext'

const SIZES = [
  { value: 'small', label: 'Chico' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
]

const SEXES = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Hembra' },
  { value: 'unknown', label: 'Desconocido' },
]

const EMPTY_FORM = {
  name: '', breed: '', color: '', size: 'medium', sex: 'unknown',
  neutered: null, adoptionStatus: 'shelter', neighborhood: '',
  notes: '', tags: [], photos: [], primaryPhotoIdx: 0,
  adopterStory: '',
}

export default function ShelterPetsPanel() {
  const T = useT()
  const navigate = useNavigate()
  const toast = useToast()

  const { shelterId, isShelterStaff } = useAuthContext()
  const { pets, loading, addPet, updatePet, deletePet, fetchPets } = usePets()

  const scopeShelterId = shelterId || null

  const [view, setView] = useState('list') // list | form
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [pendingFiles, setPendingFiles] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [newTagEmoji, setNewTagEmoji] = useState('')
  const [newTagLabel, setNewTagLabel] = useState('')
  const fileInputRef = useRef(null)

  // CSV import
  const [importOpen, setImportOpen] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // { okRows, badRows, rawCount }
  const importFileRef = useRef(null)

  useEffect(() => {
    // Hard guard: this panel is only for staff, and must have shelterId
    if (!isShelterStaff || !scopeShelterId) {
      setError('Tu usuario no tiene refugio asignado.')
    }
  }, [isShelterStaff, scopeShelterId])

  const customTags = useMemo(() => {
    const all = new Map()
    pets.forEach(p => {
      if (p.type !== 'stray') return
      if (scopeShelterId && p.shelterId !== scopeShelterId) return
      ;(p.tags || []).forEach(t => {
        if (!PERSONALITY_TRAITS[t] && t.includes(':')) {
          const [emoji, ...rest] = t.split(':')
          all.set(t, { emoji, label: rest.join(':') })
        }
      })
    })
    return all
  }, [pets, scopeShelterId])

  const filtered = useMemo(() => pets.filter(p => {
    if (p.type !== 'stray') return false
    if (scopeShelterId && p.shelterId !== scopeShelterId) return false
    if (statusFilter !== 'all' && p.adoptionStatus !== statusFilter) return false
    if (search.trim()) {
      return fuzzyMatch(search, p.name) || fuzzyMatch(search, p.breed) || fuzzyMatch(search, p.neighborhood)
    }
    return true
  }), [pets, scopeShelterId, statusFilter, search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, scopeShelterId])

  const totalPages = useMemo(() => {
    const n = Math.ceil((filtered.length || 0) / (pageSize || 1))
    return Math.max(1, n)
  }, [filtered.length, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const counts = useMemo(() => pets.reduce((acc, p) => {
    if (p.type !== 'stray') return acc
    if (scopeShelterId && p.shelterId !== scopeShelterId) return acc
    acc.total++
    acc[p.adoptionStatus] = (acc[p.adoptionStatus] || 0) + 1
    if (!p.photos?.length) acc.noPhoto++
    return acc
  }, { total: 0, noPhoto: 0 }), [pets, scopeShelterId])

  const openNew = () => {
    setForm({ ...EMPTY_FORM })
    setEditId(null)
    setPendingFiles([])
    setError(null)
    setView('form')
  }

  const openImport = () => {
    setImportOpen(true)
    setImportPreview(null)
    setError(null)
    setSuccess(null)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportPreview(null)
  }

  const normalizeAdoptionStatus = (v) => {
    const x = (v || '').toString().trim().toLowerCase()
    if (!x) return 'shelter'
    if (x === 'refugio') return 'shelter'
    if (x === 'transito' || x === 'tránsito') return 'transit'
    if (x === 'urgente') return 'urgent'
    if (x === 'adoptado' || x === 'adopted') return 'adopted'
    if (['shelter', 'transit', 'urgent', 'adopted'].includes(x)) return x
    return null
  }

  const parseBool = (v) => {
    const x = (v || '').toString().trim().toLowerCase()
    if (x === '') return null
    if (['1', 'true', 'si', 'sí', 'yes', 'y'].includes(x)) return true
    if (['0', 'false', 'no', 'n'].includes(x)) return false
    return null
  }

  const onSelectImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setImportPreview(null)
    try {
      const text = await file.text()
      const { rows } = parseCsv(text)
      const okRows = []
      const badRows = []

      rows.forEach((r, idx) => {
        const name = (r.name || r.nombre || '').trim()
        const adoptionStatus = normalizeAdoptionStatus(r.adoption_status || r.adoptionStatus || r.estado_adopcion || r.estado)
        const size = (r.size || r.tamano || r.tamaño || '').trim().toLowerCase() || 'medium'
        const sex = (r.sex || r.sexo || '').trim().toLowerCase() || 'unknown'

        const errors = []
        if (!name) errors.push('Falta name')
        if (!adoptionStatus) errors.push('adoption_status inválido')
        if (!['small', 'medium', 'large'].includes(size)) errors.push('size inválido')
        if (!['male', 'female', 'unknown'].includes(sex)) errors.push('sex inválido')

        const tagsRaw = (r.tags || r.etiquetas || '').trim()
        const tags = tagsRaw ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean) : []
        const photosRaw = (r.photos || r.fotos || '').trim()
        const photos = photosRaw ? photosRaw.split('|').map(u => u.trim()).filter(Boolean) : []

        const petData = {
          name,
          breed: (r.breed || r.raza || '').trim(),
          color: (r.color || '').trim(),
          size,
          sex,
          neutered: parseBool(r.neutered || r.castrado || ''),
          neighborhood: (r.neighborhood || r.barrio || r.zona || '').trim(),
          notes: (r.notes || r.notas || r.descripcion || r.descripción || '').trim(),
          tags,
          photos,
          primaryPhotoIdx: Number.isFinite(Number(r.primary_photo_idx || r.primaryPhotoIdx)) ? Number(r.primary_photo_idx || r.primaryPhotoIdx) : 0,
          type: 'stray',
          status: adoptionStatus === 'adopted' ? 'adopted' : 'found',
          adoptionStatus,
          shelterId: scopeShelterId,
        }

        if (errors.length) badRows.push({ idx: idx + 2, errors, row: r })
        else okRows.push(petData)
      })

      setImportPreview({ okRows, badRows, rawCount: rows.length })
    } catch (err) {
      setError(err.message || 'No pudimos leer el CSV')
      toast?.notifyError?.(err)
    } finally {
      e.target.value = ''
    }
  }

  const runImport = async () => {
    if (!importPreview?.okRows?.length) return
    if (!scopeShelterId) { setError('Falta shelterId'); return }
    setSaving(true); setError(null); setSuccess(null)
    try {
      const CHUNK = 100
      for (let i = 0; i < importPreview.okRows.length; i += CHUNK) {
        const chunk = importPreview.okRows.slice(i, i + CHUNK)
        const { error: err } = await supabase
          .from('pets')
          .insert(chunk.map(p => ({
            shelter_id: scopeShelterId,
            owner_id: null,
            name: p.name,
            species: 'dog',
            breed: p.breed || null,
            color: p.color || null,
            size: p.size,
            sex: p.sex,
            neutered: p.neutered,
            photos: p.photos || [],
            primary_photo_idx: p.primaryPhotoIdx || 0,
            type: 'stray',
            status: p.status,
            adoption_status: p.adoptionStatus,
            neighborhood: p.neighborhood || null,
            notes: p.notes || null,
            tags: p.tags || [],
            registered_via: 'csv',
          })))
        if (err) throw err
      }
      await fetchPets()
      setSuccess(`Importados ${importPreview.okRows.length} perritos`)
      closeImport()
    } catch (e) {
      setError(e.message || 'Error al importar')
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (pet) => {
    setForm({
      name: pet.name || '', breed: pet.breed || '', color: pet.color || '',
      size: pet.size || 'medium', sex: pet.sex || 'unknown', neutered: pet.neutered,
      adoptionStatus: pet.adoptionStatus || 'shelter', neighborhood: pet.neighborhood || '',
      notes: pet.notes || '', tags: pet.tags || [], photos: pet.photos || [],
      primaryPhotoIdx: pet.primaryPhotoIdx || 0,
      adopterStory: '',
    })
    setEditId(pet.id)
    setPendingFiles([])
    setError(null)
    setView('form')
  }

  const openMarkAdopted = (pet) => {
    openEdit(pet)
    setForm(f => ({ ...f, adoptionStatus: 'adopted' }))
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  const addCustomTag = () => {
    const label = newTagLabel.trim()
    const emoji = newTagEmoji.trim()
    if (!label || !emoji) return
    const key = `${emoji}:${label}`
    if (!form.tags.includes(key)) setForm(f => ({ ...f, tags: [...f.tags, key] }))
    setNewTagEmoji(''); setNewTagLabel('')
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) setPendingFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const removePendingFile = (idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))

  const removeExistingPhoto = async (url, idx) => {
    try { await deletePetPhoto(url) } catch {}
    setForm(f => {
      const photos = f.photos.filter((_, i) => i !== idx)
      let pi = f.primaryPhotoIdx
      if (idx === pi) pi = 0
      else if (idx < pi) pi = Math.max(0, pi - 1)
      return { ...f, photos, primaryPhotoIdx: pi }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    if (!scopeShelterId) { setError('Falta shelterId'); return }
    setSaving(true); setError(null)
    try {
      let newPhotoUrls = []
      if (pendingFiles.length > 0) {
        for (let i = 0; i < pendingFiles.length; i++) {
          setUploadProgress(`${i + 1}/${pendingFiles.length}`)
          const compressed = await compressImageToFile(pendingFiles[i])
          if (editId) {
            newPhotoUrls.push(await uploadPetPhoto(compressed, editId))
          } else {
            newPhotoUrls.push(compressed)
          }
        }
      }
      setUploadProgress(null)

      const petData = {
        ...form,
        type: 'stray',
        status: form.adoptionStatus === 'adopted' ? 'adopted' : 'found',
        shelterId: scopeShelterId,
      }

      if (form.adopterStory && !form.notes) petData.notes = form.adopterStory
      else if (form.adopterStory) petData.notes = form.notes + '\n\n' + form.adopterStory
      delete petData.adopterStory

      if (editId) {
        petData.photos = [...form.photos, ...newPhotoUrls]
        await updatePet(editId, petData)
      } else {
        petData.photos = form.photos
        await addPet(petData, newPhotoUrls.length > 0 ? newPhotoUrls : null)
      }
      setPendingFiles([])
      setView('list')
    } catch (e) {
      setError(e.message || 'Error al guardar')
      toast?.notifyError?.(e)
    } finally { setSaving(false); setUploadProgress(null) }
  }

  const handleDelete = async (id) => {
    try { await deletePet(id); setDeleteConfirm(null) }
    catch (e) { setError(e.message); toast?.notifyError?.(e) }
  }

  if (view === 'form') return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>
          {I.Back()}
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt }}>
          {editId ? `Editar: ${form.name || 'Perrito'}` : '➕ Nuevo perrito'}
        </h1>
      </div>

      {error && <Msg T={T} type="error">{error}</Msg>}

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>Datos básicos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Label T={T}>Nombre *</Label>
            <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ej: Canela" />
          </div>
          <div><Label T={T}>Raza</Label><input value={form.breed} onChange={e => setField('breed', e.target.value)} placeholder="Ej: Mestizo" /></div>
          <div><Label T={T}>Color</Label><input value={form.color} onChange={e => setField('color', e.target.value)} placeholder="Ej: Marrón" /></div>
          <div><Label T={T}>Tamaño</Label><select value={form.size} onChange={e => setField('size', e.target.value)}>{SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div><Label T={T}>Sexo</Label><select value={form.sex} onChange={e => setField('sex', e.target.value)}>{SEXES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div><Label T={T}>Castrado/a</Label><select value={form.neutered ?? ''} onChange={e => setField('neutered', e.target.value === '' ? null : e.target.value === 'true')}><option value="">No se sabe</option><option value="true">Sí</option><option value="false">No</option></select></div>
          <div><Label T={T}>Barrio / Zona</Label><input value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} placeholder="Ej: Centro" /></div>
        </div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>Estado de adopción</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ADOPTION_STATUSES.map(s => (
            <ChipBtn key={s.value} active={form.adoptionStatus === s.value} onClick={() => setField('adoptionStatus', s.value)} T={T}>
              {s.label}
            </ChipBtn>
          ))}
        </div>

        {form.adoptionStatus === 'adopted' && (
          <div className="anim" style={{ marginTop: 14, padding: 14, borderRadius: R, background: T.okLt, border: `1px solid ${T.ok}30` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ok, marginBottom: 10 }}>🎉 Registrar adopción</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <Label T={T}>Historia de la adopción</Label>
                <textarea value={form.adopterStory} onChange={e => setField('adopterStory', e.target.value)} rows={3} placeholder="Ej: Lo conocimos en…" />
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>📸 Fotos</SectionTitle>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Se comprimen automáticamente. Hasta 8 fotos por perrito.</p>
        {pendingFiles.length > 0 && (
          <p className="anim" style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 10 }}>
            ⚠️ Hacé clic en “Guardar” abajo para subir las fotos nuevas.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {form.photos.map((url, i) => (
            <PhotoThumb key={i} url={url} isPrimary={form.primaryPhotoIdx === i} T={T}
              onSetPrimary={() => setField('primaryPhotoIdx', i)}
              onRemove={() => removeExistingPhoto(url, i)} />
          ))}
          {pendingFiles.map((file, i) => (
            <PendingThumb key={`p-${i}`} file={file} T={T} onRemove={() => removePendingFile(i)} />
          ))}
          {(form.photos.length + pendingFiles.length) < 8 && (
            <button onClick={() => fileInputRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: 10,
                border: `2px dashed ${T.border}`, background: T.accentLt,
                color: T.accent, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, gap: 2,
              }}>
              {I.Cam(24)} Agregar
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>🏷️ Etiquetas</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {Object.entries(PERSONALITY_TRAITS).map(([key, { emoji, label }]) => (
            <TagChip key={key} active={form.tags.includes(key)} onClick={() => toggleTag(key)} T={T}>
              {emoji} {label}
            </TagChip>
          ))}
        </div>
        {customTags.size > 0 && (
          <>
            <Label T={T}>Etiquetas personalizadas</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {[...customTags.entries()].map(([key, { emoji, label }]) => (
                <TagChip key={key} active={form.tags.includes(key)} onClick={() => toggleTag(key)} T={T}>
                  {emoji} {label}
                </TagChip>
              ))}
            </div>
          </>
        )}
        <Label T={T}>Crear nueva etiqueta</Label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={newTagEmoji} onChange={e => setNewTagEmoji(e.target.value)} placeholder="🐶"
            style={{ width: 50, textAlign: 'center', fontSize: 18, padding: '6px 4px' }} maxLength={4} />
          <input value={newTagLabel} onChange={e => setNewTagLabel(e.target.value)} placeholder="Ej: Le gusta el agua" style={{ flex: 1 }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }} />
          <button className="btn-press" onClick={addCustomTag} disabled={!newTagLabel.trim() || !newTagEmoji.trim()}
            style={{
              padding: '8px 14px', borderRadius: RS,
              background: (newTagLabel.trim() && newTagEmoji.trim()) ? T.purple : T.border,
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 13,
              cursor: (newTagLabel.trim() && newTagEmoji.trim()) ? 'pointer' : 'default', whiteSpace: 'nowrap',
            }}>
            + Crear
          </button>
        </div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <SectionTitle T={T}>📝 Notas / Descripción</SectionTitle>
        <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
          placeholder="Información adicional: personalidad, historia, cuidados especiales..." rows={4} />
      </Card>

      <SaveBtn saving={saving} uploadProgress={uploadProgress} onClick={handleSave} T={T}
        label={editId ? '💾 Guardar cambios' : '🐾 Crear perrito'} />
    </div>
  )

  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>
      {error && <Msg T={T} type="error">{error}</Msg>}
      {success && <Msg T={T} type="success">{success}</Msg>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Btn v="secondary" onClick={openImport} disabled={!scopeShelterId}>Importar CSV</Btn>
        <Btn onClick={openNew} icon={I.Plus()} disabled={!scopeShelterId}>Nuevo perrito</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        <StatCard T={T} label="Total" value={counts.total} color={T.txt} />
        <StatCard T={T} label="Refugio" value={counts.shelter || 0} color={T.blue} />
        <StatCard T={T} label="Urgentes" value={counts.urgent || 0} color={T.urgent} />
        <StatCard T={T} label="Sin foto" value={counts.noPhoto || 0} color={T.danger} />
      </div>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{I.Search()}</div>
        <input type="text" placeholder="Buscar perrito..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
        {[{ key: 'all', label: 'Todos' }, ...ADOPTION_STATUSES].map(s => (
          <ChipBtn key={s.key || s.value} active={statusFilter === (s.key || s.value)}
            onClick={() => setStatusFilter(s.key || s.value)} T={T} small>
            {s.label}
          </ChipBtn>
        ))}
      </div>

      <Card style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
            Mostrando {filtered.length === 0 ? 0 : ((page - 1) * pageSize + 1)}–{Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 20)}
              style={{ padding: '6px 10px', borderRadius: 10, border: `1px solid ${T.borderLt}`, background: T.card, color: T.txt, fontWeight: 700, fontSize: 12 }}
            >
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / pág</option>)}
            </select>
            <button
              className="btn-press"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 10px', borderRadius: 10,
                border: `1px solid ${T.borderLt}`,
                background: page <= 1 ? T.borderLt : T.card,
                color: page <= 1 ? T.muted : T.txt,
                cursor: page <= 1 ? 'default' : 'pointer',
                fontWeight: 800, fontSize: 12,
              }}
            >
              ←
            </button>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 800 }}>
              {page} / {totalPages}
            </div>
            <button
              className="btn-press"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 10px', borderRadius: 10,
                border: `1px solid ${T.borderLt}`,
                background: page >= totalPages ? T.borderLt : T.card,
                color: page >= totalPages ? T.muted : T.txt,
                cursor: page >= totalPages ? 'default' : 'pointer',
                fontWeight: 800, fontSize: 12,
              }}
            >
              →
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando perritos...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: T.muted }}>No se encontraron perritos.</p>
            </Card>
          )}
          {paged.map((pet, i) => (
            <Card key={pet.id} className={`anim d${Math.min(i % 4 + 1, 4)}`} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div onClick={() => openEdit(pet)} style={{
                  width: 80, minHeight: 80, flexShrink: 0, cursor: 'pointer',
                  background: pet.photos?.[pet.primaryPhotoIdx ?? 0]
                    ? `url(${pet.photos[pet.primaryPhotoIdx ?? 0]}) center/cover` : T.purpleLt,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple,
                }}>
                  {!pet.photos?.length && I.Dog(32)}
                </div>
                <div onClick={() => openEdit(pet)} style={{ flex: 1, padding: '10px 12px', cursor: 'pointer', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>{pet.name || 'Sin nombre'}</span>
                    <StatusDot status={pet.adoptionStatus} T={T} />
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>
                    {[pet.breed, sexLabel(pet.sex), sizeLabel(pet.size)].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {!pet.photos?.length && <MicroBadge bg={T.dangerLt} color={T.danger}>Sin foto</MicroBadge>}
                    {pet.photos?.length > 0 && <MicroBadge bg={T.okLt} color={T.ok}>{pet.photos.length} 📸</MicroBadge>}
                    {pet.tags?.length > 0 && <MicroBadge bg={T.purpleLt} color={T.purple}>{pet.tags.length} 🏷️</MicroBadge>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: '8px 10px' }}>
                  {pet.adoptionStatus !== 'adopted' && (
                    <button onClick={() => openMarkAdopted(pet)} title="Marcar adoptado"
                      style={{ width: 32, height: 32, borderRadius: 8, background: T.okLt, border: 'none', color: T.ok, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      🎉
                    </button>
                  )}
                  <button onClick={() => navigate(`/perro/${pet.id}`)} title="Ver ficha"
                    style={{ width: 32, height: 32, borderRadius: 8, background: T.blueLt, border: 'none', color: T.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {I.Eye()}
                  </button>
                  <button onClick={() => setDeleteConfirm(pet)} title="Eliminar"
                    style={{ width: 32, height: 32, borderRadius: 8, background: T.dangerLt, border: 'none', color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {I.Trash()}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {importOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Card className="anim" style={{ padding: 18, maxWidth: 420, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>📄 Importar perritos (CSV)</div>
              <button onClick={closeImport} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 18 }}>✕</button>
            </div>

            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 1.4 }}>
              Columnas recomendadas: <b>name</b>, breed, color, size(small/medium/large), sex(male/female/unknown),
              neutered(si/no), adoption_status(shelter/transit/urgent/adopted), neighborhood, notes, tags(sep |), photos(urls sep |).
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Btn v="secondary" onClick={() => {
                const csv = [
                  'name,breed,color,size,sex,neutered,adoption_status,neighborhood,notes,tags,photos',
                  'Canela,Mestiza,Marrón claro,medium,female,si,urgent,Centro,"Muy cariñosa","affectionate|playful","https://...|https://..."',
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'plantilla-perritos.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}>Descargar plantilla</Btn>
              <Btn onClick={() => importFileRef.current?.click()}>Elegir archivo</Btn>
              <input ref={importFileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onSelectImportFile} />
            </div>

            {importPreview && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
                  Preview: {importPreview.okRows.length} OK · {importPreview.badRows.length} con errores · {importPreview.rawCount} filas
                </div>
                {importPreview.badRows.length > 0 && (
                  <div style={{ maxHeight: 140, overflow: 'auto', background: T.dangerLt, border: `1px solid ${T.danger}20`, borderRadius: RS, padding: 10, marginBottom: 10, fontSize: 12, color: T.danger, fontWeight: 600 }}>
                    {importPreview.badRows.slice(0, 10).map(b => <div key={b.idx}>Fila {b.idx}: {b.errors.join(', ')}</div>)}
                    {importPreview.badRows.length > 10 && <div>… y {importPreview.badRows.length - 10} más</div>}
                  </div>
                )}
                <Btn v="success" onClick={runImport} disabled={saving || importPreview.okRows.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
                  {saving ? 'Importando...' : `Importar ${importPreview.okRows.length}`}
                </Btn>
              </div>
            )}
          </Card>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Card className="anim" style={{ padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ color: T.txt, marginBottom: 8 }}>Eliminar a {deleteConfirm.name}?</h3>
            <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn v="secondary" onClick={() => setDeleteConfirm(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn v="danger" onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1 }}>Eliminar</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ T, children }) {
  return <h3 style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 10 }}>{children}</h3>
}
function Label({ T, children }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>{children}</label>
}
function StatCard({ T, label, value, color }) {
  return (
    <Card style={{ padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{label}</div>
    </Card>
  )
}
function StatusDot({ status, T }) {
  const c = { urgent: T.urgent, shelter: T.blue, transit: T.ok, adopted: T.purple }
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c[status] || T.muted, display: 'inline-block', flexShrink: 0 }} />
}
function MicroBadge({ bg, color, children }) {
  return <span style={{ fontSize: 10, background: bg, color, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{children}</span>
}
function TagChip({ active, onClick, T, children }) {
  return (
    <button className="btn-press" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 20,
      border: active ? `2px solid ${T.purple}` : `1.5px solid ${T.border}`,
      background: active ? T.purpleLt : 'transparent',
      color: active ? T.purple : T.muted,
      fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all .15s',
    }}>{children}</button>
  )
}
function ChipBtn({ active, onClick, T, children, small }) {
  return (
    <button className="btn-press" onClick={onClick} style={{
      padding: small ? '5px 12px' : '8px 14px', borderRadius: 20,
      border: active ? `2px solid ${T.accent}` : `1.5px solid ${T.border}`,
      background: active ? T.accentLt : 'transparent',
      color: active ? T.accent : T.muted,
      fontWeight: 600, fontSize: small ? 12 : 13, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}
function Msg({ T, type, children }) {
  const isErr = type === 'error'
  return (
    <div className="anim" style={{
      padding: '10px 14px', borderRadius: RS, marginBottom: 12,
      background: isErr ? T.dangerLt : T.okLt, color: isErr ? T.danger : T.ok,
      fontSize: 13, fontWeight: 600,
    }}>{children}</div>
  )
}
function SaveBtn({ saving, uploadProgress, onClick, T, label }) {
  return (
    <button className="btn-press" onClick={onClick} disabled={saving} style={{
      width: '100%', padding: 14, borderRadius: RS, border: 'none',
      background: saving ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
      color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {saving ? (
        <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
        {uploadProgress ? `Subiendo fotos ${uploadProgress}...` : 'Guardando...'}</>
      ) : label}
    </button>
  )
}
function PhotoThumb({ url, isPrimary, T, onSetPrimary, onRemove }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden' }}>
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {isPrimary && (
        <div style={{ position: 'absolute', top: 2, left: 2, background: T.accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 6 }}>Principal</div>
      )}
      <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 2 }}>
        {!isPrimary && <SmallCircleBtn onClick={onSetPrimary} bg="rgba(0,0,0,0.6)">⭐</SmallCircleBtn>}
        <SmallCircleBtn onClick={onRemove} bg="rgba(192,57,43,0.8)">✕</SmallCircleBtn>
      </div>
    </div>
  )
}
function PendingThumb({ file, T, onRemove }) {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `2px dashed ${T.accent}` }}>
      <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, textAlign: 'center', padding: 2 }}>Por subir</div>
      <SmallCircleBtn onClick={onRemove} bg="rgba(192,57,43,0.8)" style={{ position: 'absolute', top: 2, right: 2 }}>✕</SmallCircleBtn>
    </div>
  )
}
function SmallCircleBtn({ onClick, bg, children, style }) {
  return (
    <button onClick={onClick} style={{
      width: 22, height: 22, borderRadius: '50%', background: bg, border: 'none',
      color: '#fff', fontSize: 10, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>{children}</button>
  )
}


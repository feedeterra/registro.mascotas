import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { supabase, uploadPetPhoto, deletePetPhoto, uploadShelterImage } from '../lib/supabase'
import { compressImageToFile, fuzzyMatch, sizeLabel, sexLabel, PERSONALITY_TRAITS, parseCsv } from '../utils'
import { Card, Btn } from '../components/ui'
import { I } from '../components/ui/Icons'
import { ADOPTION_STATUSES } from '../lib/constants'
import { useSheltersAdmin } from '../hooks/useSheltersAdmin'

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
  adopterName: '', adopterQuote: '', adopterStory: '',
}

const TABS = [
  { key: 'pets', label: '🐾 Perritos' },
  { key: 'shelter', label: '🏠 Refugio' },
  { key: 'shelters', label: '🏘️ Refugios' },
  { key: 'team', label: '👥 Equipo' },
]

export default function Admin() {
  const T = useT()
  const navigate = useNavigate()
  const { isAdmin, isShelterStaff, shelterId, isLogged, loading: authLoading, userId } = useAuthContext()
  const { pets, loading, addPet, updatePet, deletePet, fetchPets } = usePets()
  const { config, loading: configLoading, updateConfig } = useShelterConfig()

  const [tab, setTab] = useState('pets')
  const [view, setView] = useState('list') // list | form
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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

  // Shelter config form
  const [shelterForm, setShelterForm] = useState(null)
  useEffect(() => {
    if (config && !shelterForm) {
      setShelterForm({
        next_event_title: config.next_event_title || '',
        next_event_date: config.next_event_date ? config.next_event_date.slice(0, 16) : '',
        next_event_place: config.next_event_place || '',
        next_event_whatsapp: config.next_event_whatsapp || '',
        announcement_text: config.announcement_text || '',
        announcement_active: config.announcement_active || false,
        announcement_end_date: config.announcement_end_date ? config.announcement_end_date.slice(0, 16) : '',
        whatsapp_number: config.whatsapp_number || '',
        instagram_url: config.instagram_url || '',
        whatsapp_group_link: config.whatsapp_group_link || '',
        name: config.name || '',
        mission: config.mission || '',
        description: config.description || '',
        hero_image_url: config.hero_image_url || '',
        shelter_image_url: config.shelter_image_url || '',
        email: config.email || '',
        legal_name: config.legal_name || '',
        cuit: config.cuit || '',
        registration_number: config.registration_number || '',
        donation_link: config.donation_link || 'https://cafecito.app/refugiocasa',
        transfer_accounts: Array.isArray(config.transfer_accounts) ? config.transfer_accounts : [],
      })
    }
  }, [config, shelterForm])

  // Team management
  const [allProfiles, setAllProfiles] = useState([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamSearch, setTeamSearch] = useState('')

  const fetchProfiles = async () => {
    setTeamLoading(true)
    const { data } = await supabase.from('profiles').select('id, display_name, phone, is_admin, shelter_id, created_at').order('created_at', { ascending: false })
    setAllProfiles(data || [])
    setTeamLoading(false)
  }

  useEffect(() => {
    if (tab === 'team') fetchProfiles()
  }, [tab])

  // Custom tags derived from all pets
  const customTags = useMemo(() => {
    const all = new Map()
    pets.forEach(p => {
      (p.tags || []).forEach(t => {
        if (!PERSONALITY_TRAITS[t] && t.includes(':')) {
          const [emoji, ...rest] = t.split(':')
          all.set(t, { emoji, label: rest.join(':') })
        }
      })
    })
    return all
  }, [pets])

  // ── Auth guard ──────────────────────────────────────────────
  if (authLoading) return <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  if (!isLogged || (!isAdmin && !isShelterStaff)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ color: T.txt, marginBottom: 8 }}>Acceso restringido</h2>
        <p style={{ color: T.muted, marginBottom: 16 }}>Solo el equipo del refugio puede acceder al panel de administracion.</p>
        <Btn onClick={() => navigate('/login')}>Iniciar sesion</Btn>
      </div>
    )
  }

  const scopeShelterId = !isAdmin ? shelterId : null
  const visibleTabs = isAdmin ? TABS : [{ key: 'pets', label: '🐾 Perritos' }]

  const sheltersAdmin = useSheltersAdmin(isAdmin)
  const [shelterFormNew, setShelterFormNew] = useState({ slug: '', name: '', city: '', lat: '', lng: '' })
  const [editShelterId, setEditShelterId] = useState(null)
  const [editShelterForm, setEditShelterForm] = useState(null)

  const assignShelterToProfile = async (profileId, nextShelterId) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ shelter_id: nextShelterId || null })
      .eq('id', profileId)
    if (err) throw err
    setAllProfiles(prev => prev.map(p => p.id === profileId ? { ...p, shelter_id: nextShelterId || null } : p))
  }

  // ── Filter pets ─────────────────────────────────────────────
  const filtered = pets.filter(p => {
    if (p.type !== 'stray') return false
    if (scopeShelterId && p.shelterId !== scopeShelterId) return false
    if (statusFilter !== 'all' && p.adoptionStatus !== statusFilter) return false
    if (search.trim()) {
      return fuzzyMatch(search, p.name) || fuzzyMatch(search, p.breed) || fuzzyMatch(search, p.neighborhood)
    }
    return true
  })

  const counts = pets.reduce((acc, p) => {
    if (p.type !== 'stray') return acc
    if (scopeShelterId && p.shelterId !== scopeShelterId) return acc
    acc.total++
    acc[p.adoptionStatus] = (acc[p.adoptionStatus] || 0) + 1
    if (!p.photos?.length) acc.noPhoto++
    return acc
  }, { total: 0, noPhoto: 0 })

  // ── Pet form handlers ───────────────────────────────────────
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
        }
        if (scopeShelterId) petData.shelterId = scopeShelterId

        if (errors.length) badRows.push({ idx: idx + 2, errors, row: r })
        else okRows.push(petData)
      })

      setImportPreview({ okRows, badRows, rawCount: rows.length })
    } catch (err) {
      setError(err.message || 'No pudimos leer el CSV')
    } finally {
      e.target.value = ''
    }
  }

  const runImport = async () => {
    if (!importPreview?.okRows?.length) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      const CHUNK = 100
      for (let i = 0; i < importPreview.okRows.length; i += CHUNK) {
        const chunk = importPreview.okRows.slice(i, i + CHUNK)
        // insert en lote (usePets.addPet es 1x1; para masivo usamos supabase directo)
        const { error: err } = await supabase
          .from('pets')
          .insert(chunk.map(p => ({
            shelter_id: p.shelterId ?? null,
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
            adopted_at: p.adoptionStatus === 'adopted' ? new Date().toISOString() : null,
          })))
        if (err) throw err
      }
      await fetchPets()
      setSuccess(`Importados ${importPreview.okRows.length} perritos`)
      closeImport()
    } catch (e) {
      setError(e.message || 'Error al importar')
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
      adopterName: pet.adopterName || '', adopterQuote: pet.adopterQuote || '',
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
        ...form, type: 'stray',
        status: form.adoptionStatus === 'adopted' ? 'adopted' : 'found',
      }
      // Staff: always enforce shelter link
      if (scopeShelterId) petData.shelterId = scopeShelterId
      // If marking as adopted, set adopted_at
      if (form.adoptionStatus === 'adopted') {
        petData.adoptedAt = petData.adoptedAt || new Date().toISOString()
      }
      // adopterStory goes into notes if provided and notes is empty
      if (form.adopterStory && !form.notes) {
        petData.notes = form.adopterStory
      } else if (form.adopterStory) {
        petData.notes = form.notes + '\n\n' + form.adopterStory
      }
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
    } finally { setSaving(false); setUploadProgress(null) }
  }

  const handleDelete = async (id) => {
    try { await deletePet(id); setDeleteConfirm(null) }
    catch (e) { setError(e.message) }
  }

  // ── Shelter config save ─────────────────────────────────────
  const saveShelterConfig = async () => {
    if (!shelterForm) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      const payload = { ...shelterForm }
      // Convert empty dates to null
      if (!payload.next_event_date) payload.next_event_date = null
      if (!payload.announcement_end_date) payload.announcement_end_date = null
      await updateConfig(payload)
      setSuccess('Configuracion guardada')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  // ── Toggle admin ────────────────────────────────────────────
  const toggleAdmin = async (profileId, currentValue) => {
    if (profileId === userId) return // Can't remove yourself
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_admin: !currentValue })
      .eq('id', profileId)
    if (!err) {
      setAllProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, is_admin: !currentValue } : p
      ))
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: PET FORM
  // ═══════════════════════════════════════════════════════════
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

      {/* Basic data */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>Datos basicos</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Label T={T}>Nombre *</Label>
            <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Ej: Canela" />
          </div>
          <div><Label T={T}>Raza</Label><input value={form.breed} onChange={e => setField('breed', e.target.value)} placeholder="Ej: Mestizo" /></div>
          <div><Label T={T}>Color</Label><input value={form.color} onChange={e => setField('color', e.target.value)} placeholder="Ej: Marron" /></div>
          <div><Label T={T}>Tamaño</Label><select value={form.size} onChange={e => setField('size', e.target.value)}>{SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div><Label T={T}>Sexo</Label><select value={form.sex} onChange={e => setField('sex', e.target.value)}>{SEXES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
          <div><Label T={T}>Castrado/a</Label><select value={form.neutered ?? ''} onChange={e => setField('neutered', e.target.value === '' ? null : e.target.value === 'true')}><option value="">No se sabe</option><option value="true">Si</option><option value="false">No</option></select></div>
          <div><Label T={T}>Barrio / Zona</Label><input value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} placeholder="Ej: Centro" /></div>
        </div>
      </Card>

      {/* Adoption status */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>Estado de adopcion</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ADOPTION_STATUSES.map(s => (
            <ChipBtn key={s.value} active={form.adoptionStatus === s.value}
              onClick={() => setField('adoptionStatus', s.value)} T={T}>
              {s.label}
            </ChipBtn>
          ))}
        </div>

        {form.adoptionStatus === 'adopted' && (
          <div className="anim" style={{
            marginTop: 14, padding: 14, borderRadius: R,
            background: T.okLt, border: `1px solid ${T.ok}30`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ok, marginBottom: 10 }}>
              🎉 Registrar adopcion
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <Label T={T}>Nombre del adoptante *</Label>
                <input value={form.adopterName} onChange={e => setField('adopterName', e.target.value)} placeholder="Ej: Maria Lopez" />
              </div>
              <div>
                <Label T={T}>Frase del adoptante</Label>
                <input value={form.adopterQuote} onChange={e => setField('adopterQuote', e.target.value)} placeholder="Ej: Es el mejor compañero del mundo!" />
              </div>
              <div>
                <Label T={T}>Historia de la adopcion</Label>
                <textarea
                  value={form.adopterStory}
                  onChange={e => setField('adopterStory', e.target.value)}
                  placeholder="Ej: Maria conocio a Canela en una juntada de voluntarios y fue amor a primera vista..."
                  rows={3}
                />
                <p style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  Esta historia aparecera en la seccion de "Finales felices"
                </p>
              </div>
              <div>
                <Label T={T}>📸 Foto con su nueva familia</Label>
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
                  Subi una foto del perrito con su nueva familia. Aparecera en Historias.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Photos */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>📸 Fotos</SectionTitle>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
          Se comprimen automaticamente. Hasta 8 fotos por perrito.
        </p>
        {pendingFiles.length > 0 && (
          <p className="anim" style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 10 }}>
            ⚠️ Haz clic en "Guardar" abajo para subir las fotos nuevas.
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

      {/* Tags */}
      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>🏷️ Etiquetas de personalidad</SectionTitle>
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

      {/* Notes */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <SectionTitle T={T}>📝 Notas / Descripcion</SectionTitle>
        <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
          placeholder="Informacion adicional: personalidad, historia, cuidados especiales..." rows={4} />
      </Card>

      {/* Save */}
      <SaveBtn saving={saving} uploadProgress={uploadProgress} onClick={handleSave} T={T}
        label={editId ? '💾 Guardar cambios' : '🐾 Crear perrito'} />
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // RENDER: MAIN WITH TABS
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>
      <h1 className="anim" style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 12 }}>
        🛡️ Panel Admin
      </h1>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        borderBottom: `2px solid ${T.borderLt}`, paddingBottom: 0,
      }}>
        {visibleTabs.map(t => (
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

      {error && <Msg T={T} type="error">{error}</Msg>}
      {success && <Msg T={T} type="success">{success}</Msg>}

      {/* ═══ PERRITOS TAB ═══ */}
      {tab === 'pets' && (
        <div className="anim">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
            <Btn v="secondary" onClick={openImport}>Importar CSV</Btn>
            <Btn onClick={openNew} icon={I.Plus()}>Nuevo perrito</Btn>
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

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando perritos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <p style={{ color: T.muted }}>No se encontraron perritos.</p>
                </Card>
              )}
              {filtered.map((pet, i) => (
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
        </div>
      )}

      {/* CSV Import Modal */}
      {importOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
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
              <Btn
                v="secondary"
                onClick={() => {
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
                }}
              >
                Descargar plantilla
              </Btn>
              <Btn onClick={() => importFileRef.current?.click()}>Elegir archivo</Btn>
              <input ref={importFileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onSelectImportFile} />
            </div>

            {importPreview && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
                  Preview: {importPreview.okRows.length} OK · {importPreview.badRows.length} con errores · {importPreview.rawCount} filas
                </div>
                {importPreview.badRows.length > 0 && (
                  <div style={{
                    maxHeight: 140, overflow: 'auto',
                    background: T.dangerLt, border: `1px solid ${T.danger}20`,
                    borderRadius: RS, padding: 10, marginBottom: 10,
                    fontSize: 12, color: T.danger, fontWeight: 600,
                  }}>
                    {importPreview.badRows.slice(0, 10).map(b => (
                      <div key={b.idx}>Fila {b.idx}: {b.errors.join(', ')}</div>
                    ))}
                    {importPreview.badRows.length > 10 && <div>… y {importPreview.badRows.length - 10} más</div>}
                  </div>
                )}
                <Btn
                  v="success"
                  onClick={runImport}
                  disabled={saving || importPreview.okRows.length === 0}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {saving ? 'Importando...' : `Importar ${importPreview.okRows.length}`}
                </Btn>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══ SHELTER CONFIG TAB ═══ */}
      {tab === 'shelter' && shelterForm && (
        <div className="anim">
          {/* General info */}
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>🏠 Datos del refugio</SectionTitle>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><Label T={T}>Nombre del refugio</Label><input value={shelterForm.name} onChange={e => setShelterForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label T={T}>Mision (frase corta)</Label><input value={shelterForm.mission} onChange={e => setShelterForm(f => ({ ...f, mission: e.target.value }))} placeholder="Rescatamos perros de la calle..." /></div>
              <div><Label T={T}>Descripcion</Label><textarea value={shelterForm.description} onChange={e => setShelterForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div><Label T={T}>WhatsApp del refugio</Label><input value={shelterForm.whatsapp_number} onChange={e => setShelterForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="5492346306562" /></div>
              <div><Label T={T}>Instagram URL</Label><input value={shelterForm.instagram_url} onChange={e => setShelterForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/..." /></div>
              <div><Label T={T}>Link grupo WhatsApp voluntarios</Label><input value={shelterForm.whatsapp_group_link} onChange={e => setShelterForm(f => ({ ...f, whatsapp_group_link: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></div>
            </div>
          </Card>

          {/* Images */}
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>📸 Imagenes de la app</SectionTitle>
            <div style={{ display: 'grid', gap: 14 }}>
              <ImageUploadField
                T={T}
                label="Foto del inicio (Hero)"
                hint="Aparece de fondo en la pantalla principal y en el Welcome. Ideal: foto grupal de perritos. Tamaño recomendado: 1200 x 800 px (horizontal, proporcion 3:2)."
                currentUrl={shelterForm.hero_image_url}
                onUpload={async (file) => {
                  const compressed = await compressImageToFile(file, 1400, 0.8)
                  const url = await uploadShelterImage(compressed, 'hero')
                  setShelterForm(f => ({ ...f, hero_image_url: url }))
                }}
                onRemove={() => setShelterForm(f => ({ ...f, hero_image_url: '' }))}
                onError={setError}
              />
              <ImageUploadField
                T={T}
                label="Foto del refugio"
                hint="Aparece en la pagina del refugio. Ideal: foto del lugar o del equipo. Tamaño recomendado: 1200 x 500 px (horizontal, proporcion 12:5, tipo banner)."
                currentUrl={shelterForm.shelter_image_url}
                onUpload={async (file) => {
                  const compressed = await compressImageToFile(file, 1400, 0.8)
                  const url = await uploadShelterImage(compressed, 'shelter')
                  setShelterForm(f => ({ ...f, shelter_image_url: url }))
                }}
                onRemove={() => setShelterForm(f => ({ ...f, shelter_image_url: '' }))}
                onError={setError}
              />
            </div>
          </Card>

          {/* ONG data */}
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>📋 Datos institucionales (ONG)</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Estos datos aparecen en la pagina del refugio para dar transparencia y seriedad.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><Label T={T}>Razon social / Nombre legal</Label><input value={shelterForm.legal_name} onChange={e => setShelterForm(f => ({ ...f, legal_name: e.target.value }))} placeholder="Ej: Asociacion Civil Refugio CASA" /></div>
              <div><Label T={T}>CUIT</Label><input value={shelterForm.cuit} onChange={e => setShelterForm(f => ({ ...f, cuit: e.target.value }))} placeholder="Ej: 30-12345678-9" /></div>
              <div><Label T={T}>N° de registro / Personeria juridica</Label><input value={shelterForm.registration_number} onChange={e => setShelterForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="Ej: IGJ N° 12345" /></div>
              <div><Label T={T}>Email de contacto</Label><input type="email" value={shelterForm.email} onChange={e => setShelterForm(f => ({ ...f, email: e.target.value }))} placeholder="Ej: contacto@refugiocasa.org" /></div>
              <div><Label T={T}>Link de donaciones (Cafecito, Mercado Pago, etc)</Label><input value={shelterForm.donation_link} onChange={e => setShelterForm(f => ({ ...f, donation_link: e.target.value }))} placeholder="https://cafecito.app/refugiocasa" /></div>
            </div>
          </Card>

          {/* Transfer accounts */}
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>🏦 Cuentas para transferencia</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Aparecen en la pantalla de "Donar" para que el donante copie alias o CBU/CVU.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {(shelterForm.transfer_accounts || []).map((acc, idx) => (
                <div key={idx} style={{
                  padding: 12, borderRadius: RS,
                  background: T.bg, border: `1px solid ${T.borderLt}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 13, color: T.txt }}>Cuenta {idx + 1}</strong>
                    <button
                      onClick={() => setShelterForm(f => ({
                        ...f,
                        transfer_accounts: f.transfer_accounts.filter((_, i) => i !== idx),
                      }))}
                      style={{
                        background: 'none', border: 'none', color: T.danger || '#dc2626',
                        cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      }}
                    >Eliminar</button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      { key: 'label', label: 'Etiqueta', placeholder: 'Refugio CASA' },
                      { key: 'titular', label: 'Titular', placeholder: 'Nombre completo' },
                      { key: 'dni', label: 'DNI (opcional)', placeholder: '21709559' },
                      { key: 'alias', label: 'Alias', placeholder: 'casarefugio2026' },
                      { key: 'cbu', label: 'CBU (opcional)', placeholder: '0070400130004005145406' },
                      { key: 'cvu', label: 'CVU (opcional)', placeholder: '0000003100012931965462' },
                    ].map(field => (
                      <div key={field.key}>
                        <Label T={T}>{field.label}</Label>
                        <input
                          value={acc[field.key] || ''}
                          placeholder={field.placeholder}
                          onChange={e => {
                            const v = e.target.value
                            setShelterForm(f => ({
                              ...f,
                              transfer_accounts: f.transfer_accounts.map((a, i) =>
                                i === idx ? { ...a, [field.key]: v } : a
                              ),
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShelterForm(f => ({
                  ...f,
                  transfer_accounts: [...(f.transfer_accounts || []), { label: '', titular: '', alias: '' }],
                }))}
                style={{
                  padding: 10, borderRadius: RS, border: `2px dashed ${T.borderLt}`,
                  background: 'transparent', color: T.muted, fontWeight: 700,
                  cursor: 'pointer', fontSize: 13,
                }}
              >+ Agregar cuenta</button>
            </div>
          </Card>

          {/* Next event */}
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>📅 Proxima juntada de voluntarios</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Aparece en la pagina del refugio con un contador regresivo y boton para anotarse.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div><Label T={T}>Titulo del evento</Label><input value={shelterForm.next_event_title} onChange={e => setShelterForm(f => ({ ...f, next_event_title: e.target.value }))} placeholder="Juntada de voluntarios" /></div>
              <div><Label T={T}>Fecha y hora</Label><input type="datetime-local" value={shelterForm.next_event_date} onChange={e => setShelterForm(f => ({ ...f, next_event_date: e.target.value }))} /></div>
              <div><Label T={T}>Lugar</Label><input value={shelterForm.next_event_place} onChange={e => setShelterForm(f => ({ ...f, next_event_place: e.target.value }))} placeholder="Refugio CASA - Capilla del Señor" /></div>
              <div><Label T={T}>Link para anotarse (grupo WhatsApp)</Label><input value={shelterForm.next_event_whatsapp} onChange={e => setShelterForm(f => ({ ...f, next_event_whatsapp: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></div>
            </div>
            {shelterForm.next_event_date && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: RS, background: T.purpleLt, fontSize: 12, color: T.purple, fontWeight: 600 }}>
                Vista previa: {new Date(shelterForm.next_event_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {new Date(shelterForm.next_event_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
              </div>
            )}
          </Card>

          {/* Announcement bar */}
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <SectionTitle T={T}>📢 Barra de anuncio</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
              Aparece como barra fija arriba de toda la app. Ideal para avisar de eventos o campañas.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={shelterForm.announcement_active}
                    onChange={e => setShelterForm(f => ({ ...f, announcement_active: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: T.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>Anuncio activo</span>
                </label>
              </div>
              <div><Label T={T}>Texto del anuncio</Label><input value={shelterForm.announcement_text} onChange={e => setShelterForm(f => ({ ...f, announcement_text: e.target.value }))} placeholder="Ej: 🐾 Juntada de voluntarios este sabado!" /></div>
              <div><Label T={T}>Mostrar hasta (opcional)</Label><input type="datetime-local" value={shelterForm.announcement_end_date} onChange={e => setShelterForm(f => ({ ...f, announcement_end_date: e.target.value }))} /></div>
            </div>
            {shelterForm.announcement_active && shelterForm.announcement_text && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: RS,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center',
              }}>
                Vista previa: {shelterForm.announcement_text}
              </div>
            )}
          </Card>

          <SaveBtn saving={saving} onClick={saveShelterConfig} T={T} label="💾 Guardar configuracion" />
        </div>
      )}
      {tab === 'shelter' && configLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando configuracion...</div>
      )}

      {/* ═══ SHELTERS CRUD TAB (admin) ═══ */}
      {tab === 'shelters' && isAdmin && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>🏘️ Refugios</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              Crear/editar refugios (slug, nombre, ciudad). El resto de datos se configura desde el panel del propio refugio.
            </p>

            <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
              <div><Label T={T}>Slug (único)</Label><input value={shelterFormNew.slug} onChange={e => setShelterFormNew(f => ({ ...f, slug: e.target.value }))} placeholder="casa" /></div>
              <div><Label T={T}>Nombre</Label><input value={shelterFormNew.name} onChange={e => setShelterFormNew(f => ({ ...f, name: e.target.value }))} placeholder="Refugio CASA" /></div>
              <div><Label T={T}>Ciudad / zona</Label><input value={shelterFormNew.city} onChange={e => setShelterFormNew(f => ({ ...f, city: e.target.value }))} placeholder="Capilla del Señor..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><Label T={T}>Lat (opcional)</Label><input value={shelterFormNew.lat} onChange={e => setShelterFormNew(f => ({ ...f, lat: e.target.value }))} placeholder="-34.1234" /></div>
                <div><Label T={T}>Lng (opcional)</Label><input value={shelterFormNew.lng} onChange={e => setShelterFormNew(f => ({ ...f, lng: e.target.value }))} placeholder="-58.1234" /></div>
              </div>
            </div>

            <Btn
              onClick={async () => {
                setSaving(true); setError(null); setSuccess(null)
                try {
                  if (!shelterFormNew.slug.trim() || !shelterFormNew.name.trim()) {
                    setError('Slug y nombre son obligatorios')
                    return
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
              {(sheltersAdmin.shelters || []).map((s) => (
                <Card key={s.id} style={{ padding: 14 }}>
                  {editShelterId === s.id && editShelterForm ? (
                    <>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input value={editShelterForm.slug} onChange={e => setEditShelterForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug" />
                        <input value={editShelterForm.name} onChange={e => setEditShelterForm(f => ({ ...f, name: e.target.value }))} placeholder="nombre" />
                        <input value={editShelterForm.city || ''} onChange={e => setEditShelterForm(f => ({ ...f, city: e.target.value }))} placeholder="ciudad" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                                lat: (editShelterForm.lat || '').trim() ? Number(editShelterForm.lat) : null,
                                lng: (editShelterForm.lng || '').trim() ? Number(editShelterForm.lng) : null,
                              })
                              setEditShelterId(null); setEditShelterForm(null)
                            } catch (e) { setError(e.message) }
                            finally { setSaving(false) }
                          }}
                          disabled={saving}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          Guardar
                        </Btn>
                        <Btn v="secondary" onClick={() => { setEditShelterId(null); setEditShelterForm(null) }} style={{ flex: 1, justifyContent: 'center' }}>
                          Cancelar
                        </Btn>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: T.txt, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: T.muted }}>
                            <b>{s.slug}</b> · {s.city || '—'} {s.is_active === false && <span style={{ color: T.danger, fontWeight: 700 }}>· Inactivo</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Btn v="secondary" onClick={() => { setEditShelterId(s.id); setEditShelterForm({ slug: s.slug || '', name: s.name || '', city: s.city || '', lat: s.lat ?? '', lng: s.lng ?? '' }) }}>
                            Editar
                          </Btn>
                          <Btn
                            v="danger"
                            onClick={() => sheltersAdmin.deactivateShelter(s.id).catch(err => setError(err.message))}
                            disabled={s.slug === 'casa'}
                          >
                            Desactivar
                          </Btn>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              ))}
              {(sheltersAdmin.shelters || []).length === 0 && (
                <Card style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ color: T.muted }}>No hay refugios todavía.</div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TEAM TAB ═══ */}
      {tab === 'team' && (
        <div className="anim">
          <Card style={{ padding: 16, marginBottom: 12 }}>
            <SectionTitle T={T}>👥 Equipo del refugio</SectionTitle>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              Los administradores pueden crear perritos, editar la configuracion y gestionar el equipo.
            </p>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{I.Search()}</div>
              <input type="text" placeholder="Buscar por nombre..." value={teamSearch} onChange={e => setTeamSearch(e.target.value)} style={{ paddingLeft: 38 }} />
            </div>

            {teamLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: T.muted }}>Cargando...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allProfiles
                  .filter(p => !teamSearch.trim() || (p.display_name || '').toLowerCase().includes(teamSearch.toLowerCase()))
                  .map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: RS,
                    background: p.is_admin ? T.accentLt : T.card,
                    border: `1px solid ${p.is_admin ? T.accent + '30' : T.borderLt}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: p.is_admin ? T.accent : T.border,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.is_admin ? '🛡️' : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.txt }}>
                        {p.display_name || 'Sin nombre'}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        {p.phone || 'Sin telefono'} {p.is_admin && <span style={{ color: T.accent, fontWeight: 700 }}>· Admin</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <select
                        value={p.shelter_id || ''}
                        onChange={(e) => {
                          const v = e.target.value || null
                          assignShelterToProfile(p.id, v).catch(err => setError(err.message))
                        }}
                        style={{ width: 170, padding: '6px 10px' }}
                      >
                        <option value="">Sin refugio</option>
                        {(sheltersAdmin.shelters || []).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}
                    <button
                      className="btn-press"
                      onClick={() => toggleAdmin(p.id, p.is_admin)}
                      disabled={p.id === userId}
                      style={{
                        padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700,
                        border: 'none', cursor: p.id === userId ? 'default' : 'pointer',
                        background: p.is_admin ? T.dangerLt : T.okLt,
                        color: p.is_admin ? T.danger : T.ok,
                        opacity: p.id === userId ? 0.5 : 1,
                      }}
                    >
                      {p.id === userId ? 'Vos' : p.is_admin ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <Card className="anim" style={{ padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ color: T.txt, marginBottom: 8 }}>Eliminar a {deleteConfirm.name}?</h3>
            <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Esta accion no se puede deshacer.</p>
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

// ─── Small components ─────────────────────────────────────────
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
function ImageUploadField({ T, label, hint, currentUrl, onUpload, onRemove, onError }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef(null)
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { await onUpload(file) } catch (err) { onError?.(err.message || 'Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }
  return (
    <div>
      <Label T={T}>{label}</Label>
      {hint && <p style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{hint}</p>}
      {currentUrl ? (
        <div style={{ position: 'relative', borderRadius: R, overflow: 'hidden', maxHeight: 160 }}>
          <img src={currentUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
            <button onClick={() => ref.current?.click()} className="btn-press" style={{
              padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.6)',
              color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>📸 Cambiar</button>
            <button onClick={onRemove} className="btn-press" style={{
              padding: '6px 10px', borderRadius: 16, background: 'rgba(192,57,43,0.8)',
              color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading} style={{
          width: '100%', padding: '20px 16px', borderRadius: R,
          border: `2px dashed ${T.border}`, background: T.accentLt,
          color: T.accent, cursor: uploading ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          fontSize: 13, fontWeight: 600,
        }}>
          {uploading ? '⏳ Subiendo...' : <>{I.Cam(28)} Subir imagen</>}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

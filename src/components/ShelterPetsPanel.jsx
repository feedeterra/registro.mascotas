import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useT, RS, RM, R } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { useAuthContext } from '../context/AuthContext'
import { supabase, uploadPetPhoto, deletePetPhoto } from '../lib/supabase'
import { compressImageToFile, fuzzyMatch, sizeLabel, sexLabel, PERSONALITY_TRAITS, parseCsv, waitingMessage } from '../utils'
import { Card, Btn, PetCardSkeleton, PageLoader } from './ui'
import { I } from './ui/Icons'
import { ADOPTION_STATUSES } from '../lib/constants'
import { Plus, Camera, AlertTriangle, Tags, FileText, PartyPopper, Save, Dog, FileSpreadsheet, Eye, Trash2, Heart, Bone, Coffee, Shield, Baby, Cat, GraduationCap, Users, Tag, Loader, Star, X, CheckCircle, Clock, ShieldCheck, Pencil, MessageSquare, ChevronLeft, ChevronRight, ChevronDown, PawPrint, EyeOff, Move } from 'lucide-react'

const TraitIcon = { Heart, Bone, Coffee, Shield, Baby, Dog, Cat, GraduationCap, Users, PawPrint, EyeOff }
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

function PhotoPositionPicker({ url, position, onChange, T }) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const [active, setActive] = useState(false)

  const parsePos = (pos) => {
    const parts = (pos || '50% 50%').split(' ')
    const x = parts[0].endsWith('%') ? parseFloat(parts[0]) : 50
    const y = parts[1]?.endsWith('%') ? parseFloat(parts[1]) : (parts[1] === 'top' ? 0 : parts[1] === 'bottom' ? 100 : 50)
    return { x, y }
  }

  const posFromEvent = (e) => {
    if (!containerRef.current) return position
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)))
    return `${x}% ${y}%`
  }

  const onStart = (e) => {
    // En mobile, solo permitimos arrastrar si tocan cerca del handle o si es mouse
    // Esto permite scrollear la página si tocan el resto de la imagen
    dragging.current = true
    setActive(true)
    onChange(posFromEvent(e))
  }

  const onMove = (e) => {
    if (!dragging.current) return
    // Evitamos el scroll de la página SOLO cuando estamos arrastrando activamente
    if (e.cancelable) e.preventDefault()
    onChange(posFromEvent(e))
  }

  const onEnd = () => {
    dragging.current = false
    setActive(false)
  }

  const { x, y } = parsePos(position)

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Move size={12} /> Arrastrá el punto azul para encuadrar la cara del perrito
      </div>
      <div
        ref={containerRef}
        onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchMove={onMove} onTouchEnd={onEnd}
        style={{
          width: '100%', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden',
          border: `2px solid ${active ? T.accent : T.borderLt}`,
          cursor: 'crosshair', position: 'relative', userSelect: 'none',
          background: T.bg,
          transition: 'border-color 0.15s, transform 0.2s',
          transform: active ? 'scale(1.01)' : 'scale(1)',
          touchAction: 'pan-y' // Permite scroll vertical normal si no se captura el touch en el handle
        }}
      >
        <img src={url} alt="" draggable={false} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, pointerEvents: 'none' }} />
        
        {/* Overlay para oscurecer un poco y que resalte el handle */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />

        {/* Zona de captura ampliada para el handle (Invisible pero grande para el dedo) */}
        <div
          onMouseDown={onStart}
          onTouchStart={onStart}
          style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: 60, height: 60, // Área de contacto grande para mobile
            borderRadius: '50%',
            cursor: 'grab',
            zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'none' // Bloquea el scroll solo cuando se toca esta zona
          }}
        >
          {/* El handle visual real */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: T.accent, border: '3px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: active ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.15s ease-out',
            pointerEvents: 'none'
          }}>
            <Move size={14} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  name: '', breed: '', color: '', size: 'medium', sex: 'unknown',
  neutered: null, adoptionStatus: 'shelter', neighborhood: '',
  notes: '', tags: [], photos: [], primaryPhotoIdx: 0,
  adopterStory: '', waiting_number: '', waiting_unit: 'meses',
  photoPositions: [],
}

export default function ShelterPetsPanel() {
  const T = useT()
  const navigate = useNavigate()
  const { slug: shelterSlug } = useParams()
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
  const [familyPhotoFile, setFamilyPhotoFile] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [adoptionWizard, setAdoptionWizard] = useState(null) // { id, name }
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
        if (!PERSONALITY_TRAITS[t]) {
          if (t.includes(':')) {
            const [emoji, ...rest] = t.split(':')
            all.set(t, { label: rest.join(':'), legacyEmoji: emoji })
          } else {
            all.set(t, { label: t })
          }
        }
      })
    })
    return all
  }, [pets, scopeShelterId])

  const isMissingData = (p) =>
    !p.photos?.length || !p.name?.trim() || !p.breed?.trim() || !p.sex || p.sex === 'unknown' || !p.size || !p.notes?.trim()

  const filtered = useMemo(() => {
    const list = pets.filter(p => {
      if (p.type !== 'stray') return false
      if (scopeShelterId && p.shelterId !== scopeShelterId) return false

      if (statusFilter === 'missing') {
        return isMissingData(p) && p.adoptionStatus !== 'adopted' && p.adoption_status !== 'adopted'
      } else if (statusFilter === 'all') {
        if (p.adoptionStatus === 'adopted' || p.adoption_status === 'adopted') return false
      } else if (p.adoptionStatus !== statusFilter) {
        return false
      }

      if (search.trim()) {
        return fuzzyMatch(search, p.name) || fuzzyMatch(search, p.breed) || fuzzyMatch(search, p.neighborhood)
      }
      return true
    })

    // Orden: Urgentes primero, luego por fecha de creación (más nuevos arriba)
    return list.sort((a, b) => {
      if (a.adoptionStatus === 'urgent' && b.adoptionStatus !== 'urgent') return -1
      if (b.adoptionStatus === 'urgent' && a.adoptionStatus !== 'urgent') return 1
      return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
    })
  }, [pets, scopeShelterId, statusFilter, search])

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
    if (isMissingData(p)) acc.missingData++
    return acc
  }, { total: 0, missingData: 0 }), [pets, scopeShelterId])

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
      ...pet,
      photos: pet.photos || [],
      tags: pet.tags || [],
      waiting_number: pet.waiting_number ?? '',
      waiting_unit: pet.waiting_unit ?? 'meses',
      photoPositions: pet.photoPositions ?? [],
    })
    setEditId(pet.id)
    setPendingFiles([])
    setFamilyPhotoFile(null)
    setError(null)
    setView('form')
  }

  const openMarkAdopted = (pet) => {
    setAdoptionWizard({ id: pet.id, name: pet.name, adopterName: '', story: '', photo: null })
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
    if (!label) return
    if (!form.tags.includes(label)) setForm(f => ({ ...f, tags: [...f.tags, label] }))
    setNewTagLabel('')
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
      const photoPositions = (f.photoPositions || []).filter((_, i) => i !== idx)
      let pi = f.primaryPhotoIdx
      if (idx === pi) pi = 0
      else if (idx < pi) pi = Math.max(0, pi - 1)
      return { ...f, photos, photoPositions, primaryPhotoIdx: pi }
    })
  }

  const movePhoto = (from, to) => {
    if (to < 0 || to >= form.photos.length) return
    setForm(f => {
      const photos = [...f.photos]
      const positions = [...(f.photoPositions || [])]
      const [movedPhoto] = photos.splice(from, 1)
      const [movedPos] = positions.splice(from, 1)
      photos.splice(to, 0, movedPhoto)
      positions.splice(to, 0, movedPos || '50% 50%')
      
      // Update primary photo index if it was moved
      let pi = f.primaryPhotoIdx
      if (pi === from) pi = to
      else if (from < pi && to >= pi) pi--
      else if (from > pi && to <= pi) pi++

      return { ...f, photos, photoPositions: positions, primaryPhotoIdx: pi }
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

      let familyPhotoUrl = form.adoptedPhotoUrl || null
      if (familyPhotoFile) {
        setUploadProgress('Familia...')
        const compressed = await compressImageToFile(familyPhotoFile)
        familyPhotoUrl = await uploadPetPhoto(compressed, editId || 'temp')
      }

      const petData = {
        ...form,
        type: 'stray',
        status: form.adoptionStatus === 'adopted' ? 'adopted' : 'found',
        shelterId: scopeShelterId,
        adoptedPhotoUrl: familyPhotoUrl,
        adoptedAt: form.adoptionStatus === 'adopted' ? (form.adoptedAt || new Date().toISOString()) : null,
        adopterStory: form.adopterStory || null,
      }

      // Legacy notes sync
      if (form.adopterStory && !form.notes) petData.notes = form.adopterStory
      else if (form.adopterStory && !form.notes?.includes(form.adopterStory)) petData.notes = (form.notes ? form.notes + '\n\n' : '') + form.adopterStory

      if (editId) {
        petData.photos = [...form.photos, ...newPhotoUrls]
        await updatePet(editId, petData)
      } else {
        petData.photos = form.photos
        const savedPet = await addPet(petData, newPhotoUrls.length > 0 ? newPhotoUrls : null)
        // If it was just created as adopted (unlikely but possible), sync back family photo ID if needed
        // but normally we edit an existing one to mark as adopted.
      }

      // 📢 AUTO-ANUNCIO si es una adopción nueva o editada con historia
      if (form.adoptionStatus === 'adopted' && form.adopterStory) {
        const annBody = `¡${form.name} encontró su familia para siempre! \n\n${form.adopterStory}`
        await supabase
          .from('shelter_announcements')
          .insert({
            shelter_id: scopeShelterId,
            body: annBody,
            image_url: familyPhotoUrl,
            announcement_type: 'adoption',
            updated_at: new Date().toISOString()
          })
      }

      setPendingFiles([])
      setFamilyPhotoFile(null)
      setView('list')
    } catch (e) {
      setError(e.message || 'Error al guardar')
      toast?.notifyError?.(e)
    } finally { setSaving(false); setUploadProgress(null) }
  }

  const handleDelete = async (id) => {
    try { await deletePet(id); setDeleteConfirm(null); toast?.notifySuccess?.('Perrito eliminado') }
    catch (e) { setError(e.message); toast?.notifyError?.(e) }
  }

  const handleAdoptionWizardSave = async () => {
    if (!adoptionWizard) return
    setSaving(true)
    try {
      let familyPhotoUrl = null
      if (adoptionWizard.photo) {
        const compressed = await compressImageToFile(adoptionWizard.photo)
        familyPhotoUrl = await uploadPetPhoto(compressed, adoptionWizard.id)
      }

      const petData = {
        adoptionStatus: 'adopted',
        status: 'adopted',
        adoptedPhotoUrl: familyPhotoUrl,
        adoptedAt: new Date().toISOString(),
        adopterStory: adoptionWizard.story,
        adopter_name: adoptionWizard.adopterName,
      }

      await updatePet(adoptionWizard.id, petData)

      // 📢 AUTO-ANUNCIO
      const annBody = `¡${adoptionWizard.name} encontró su familia para siempre${adoptionWizard.adopterName ? ` con ${adoptionWizard.adopterName}` : ''}! \n\n${adoptionWizard.story || ''}`
      
      await supabase
        .from('shelter_announcements')
        .insert({
          shelter_id: scopeShelterId,
          body: annBody,
          image_url: familyPhotoUrl,
          announcement_type: 'adoption',
          updated_at: new Date().toISOString()
        })

      setAdoptionWizard(null)
      toast?.notifySuccess?.(`¡Felicidades por la adopción de ${adoptionWizard.name}!`)
    } catch (e) {
      toast?.notifyError?.(e)
    } finally {
      setSaving(false)
    }
  }

  if (view === 'form') return (
    <div style={{ paddingTop: 12, paddingBottom: 24, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>
          {I.Back()}
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
          {editId ? `Editar: ${form.name || 'Perrito'}` : <><Plus size={20} /> Nuevo perrito</>}
        </h1>
        {/* Espacio para que el botón sticky no tape el contenido final */}
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ paddingBottom: 100 }}> {/* Padding extra para que el sticky no tape el final del form */}

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
          <div style={{ gridColumn: '1 / -1' }}>
            <Label T={T}>Tiempo esperando hogar</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="1" max="99" value={form.waiting_number}
                onChange={e => setField('waiting_number', e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Ej: 3" style={{ width: 90, flexShrink: 0 }} />
              <select value={form.waiting_unit} onChange={e => setField('waiting_unit', e.target.value)} style={{ flex: 1 }}>
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}>Estado de adopción</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {ADOPTION_STATUSES.map(s => {
            const isUrgent = s.value === 'urgent'
            return (
              <ChipBtn key={s.value} active={form.adoptionStatus === s.value} onClick={() => setField('adoptionStatus', s.value)} T={T}
                urgentColor={isUrgent ? T.urgent : null} urgentLt={isUrgent ? T.urgentLt : null}>
                {s.label}
              </ChipBtn>
            )
          })}
        </div>
        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
          <strong style={{ color: T.txt }}>En refugio</strong> — disponible para adopción ·{' '}
          <strong style={{ color: T.txt }}>En tránsito</strong> — ya tiene familia de tránsito ·{' '}
          <strong style={{ color: T.urgent }}>Urgente</strong> — aparece destacado en el inicio ·{' '}
          <strong style={{ color: T.ok }}>Adoptado</strong> — encontró su hogar
        </div>

        {form.adoptionStatus === 'adopted' && (
          <div className="anim" style={{ marginTop: 14, padding: 14, borderRadius: R, background: T.okLt, border: `1px solid ${T.ok}30` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ok, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PartyPopper size={16} /> Registrar adopción
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <Label T={T}>Historia de la adopción</Label>
                <textarea value={form.adopterStory} onChange={e => setField('adopterStory', e.target.value)} rows={3} placeholder="Ej: Lo conocimos en una jornada y fue amor a primera vista..." />
              </div>
              <div>
                <Label T={T}>Foto con su nueva familia</Label>
                <input type="file" accept="image/*" onChange={e => setFamilyPhotoFile(e.target.files?.[0] || null)} />
                {familyPhotoFile && <p style={{ fontSize: 11, color: T.ok, marginTop: 4 }}>Foto seleccionada: {familyPhotoFile.name}</p>}
                {form.adoptedPhotoUrl && !familyPhotoFile && (
                   <div style={{ marginTop: 8 }}>
                     <p style={{ fontSize: 11, color: T.muted }}>Foto actual:</p>
                     <img src={form.adoptedPhotoUrl} loading="lazy" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={16} /> Fotos</span></SectionTitle>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Se comprimen automáticamente. Hasta 8 fotos por perrito.</p>
        {pendingFiles.length > 0 && (
          <p className="anim" style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Hacé clic en “Guardar” abajo para subir las fotos nuevas.
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {form.photos.map((url, i) => (
            <PhotoThumb key={i} url={url} isPrimary={form.primaryPhotoIdx === i} T={T}
              index={i}
              total={form.photos.length}
              onMove={movePhoto}
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

        {form.photos.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {form.photos.map((url, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 4 }}>
                  {i === (form.primaryPhotoIdx ?? 0) ? 'Foto principal' : `Foto ${i + 1}`}
                </div>
                <PhotoPositionPicker
                  url={url}
                  position={form.photoPositions[i] ?? '50% 50%'}
                  onChange={v => {
                    const positions = Array.from({ length: form.photos.length }, (_, j) => form.photoPositions[j] ?? '50% 50%')
                    positions[i] = v
                    setField('photoPositions', positions)
                  }}
                  T={T}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ padding: 16, marginBottom: 12 }}>
        <SectionTitle T={T}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tags size={16} /> Etiquetas</span></SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {Object.entries(PERSONALITY_TRAITS).map(([key, { iconName, label }]) => {
            const Icon = TraitIcon[iconName] || Tag
            return (
              <TagChip key={key} active={form.tags.includes(key)} onClick={() => toggleTag(key)} T={T}>
                <Icon size={14} /> {label}
              </TagChip>
            )
          })}
        </div>
      </Card>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <SectionTitle T={T}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} /> Notas / Descripción</span></SectionTitle>
        <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
          placeholder="Información adicional: personalidad, historia, cuidados especiales..." rows={4} />
      </Card>

      </div>

      {/* Barra Sticky de Guardado */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        borderTop: `1.5px solid ${T.borderLt}`,
        zIndex: 100,
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          {(() => {
            const missing = [
              (!form.photos?.length && pendingFiles.length === 0) && 'Foto',
              !form.name?.trim() && 'Nombre',
              !form.breed?.trim() && 'Raza',
              (!form.sex || form.sex === 'unknown') && 'Sexo',
              !form.notes?.trim() && 'Descripción',
            ].filter(Boolean)
            return missing.length > 0 ? (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: `${T.danger}12`, border: `1px solid ${T.danger}30`,
                borderRadius: 10, padding: '8px 12px', marginBottom: 10,
              }}>
                <AlertTriangle size={14} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: T.danger, fontWeight: 600, lineHeight: 1.4 }}>
                  Faltan datos: {missing.map((m, i) => (
                    <span key={m}><strong>{m}</strong>{i < missing.length - 1 ? ', ' : ''}</span>
                  ))}
                </span>
              </div>
            ) : null
          })()}
          <SaveBtn saving={saving} uploadProgress={uploadProgress} onClick={handleSave} T={T}
            label={editId ? <><Save size={18} /> Guardar cambios</> : <><Dog size={18} /> Crear perrito</>} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      {error && <Msg T={T} type="error">{error}</Msg>}
      {success && <Msg T={T} type="success">{success}</Msg>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard T={T} label="Total" value={counts.total} color={T.txt} />
        <StatCard T={T} label="Refugio" value={counts.shelter || 0} color={T.blue} />
        <StatCard T={T} label="Urgentes" value={counts.urgent || 0} color={T.urgent} />
        <StatCard T={T} label="Faltan datos" value={counts.missingData || 0} color={T.danger} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>{I.Search()}</div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ paddingLeft: 40, borderRadius: 14, border: `1.5px solid ${T.borderLt}`, background: T.bg, height: 46 }} 
          />
        </div>

        <button 
          className="btn-press"
          onClick={openNew} 
          disabled={!scopeShelterId}
          style={{ 
            padding: '0 16px', height: 46, borderRadius: 14, border: 'none', 
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, 
            color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Plus size={18} /> Nuevo perrito
        </button>
      </div>

      <div style={{ 
        display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 16, 
        padding: 4, background: T.borderLt, borderRadius: RM,
        border: `1px solid ${T.borderLt}`,
        WebkitOverflowScrolling: 'touch'
      }}>
        {[{ key: 'all', label: 'Todos' }, { key: 'missing', label: 'Faltan datos' }, ...ADOPTION_STATUSES].map(s => (
          <ChipBtn key={s.key || s.value} active={statusFilter === (s.key || s.value)}
            onClick={() => setStatusFilter(s.key || s.value)} T={T} small>
            {s.label}
          </ChipBtn>
        ))}
      </div>

      <Card style={{ padding: '8px 16px', marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontSize: 13, color: T.txt, fontWeight: 700 }}>
              {filtered.length} {filtered.length === 1 ? 'perrito' : 'perritos'}
            </span>
            {filtered.length > 0 && (
              <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
                (Pág. {page} de {totalPages || 1})
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: T.bg, borderRadius: 10, padding: 2, border: `1.5px solid ${T.borderLt}` }}>
              <button
                className="btn-press"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent',
                  color: page <= 1 ? T.muted : T.txt,
                  cursor: page <= 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="btn-press"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent',
                  color: page >= totalPages ? T.muted : T.txt,
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[0,1,2,3].map(i => <PetCardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <Card style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: T.muted }}>No se encontraron perritos.</p>
            </Card>
          )}
          {paged.map((pet, i) => {
            const isAdopted = pet.adoptionStatus === 'adopted'
            const isUrgent = pet.adoptionStatus === 'urgent'
            const missing = !isAdopted && isMissingData(pet)
            const photo = pet.photos?.[pet.primaryPhotoIdx ?? 0] || pet.photo
            
            // Unificamos la info en una sola línea limpia
            const secondaryInfo = [
              sexLabel(pet.sex),
              sizeLabel(pet.size),
              waitingMessage(pet.created_at)
            ].filter(Boolean).join(' · ')

            return (
              <Card key={pet.id} className={`anim d${Math.min(i % 4 + 1, 4)}`} 
                style={{ 
                  padding: '14px 18px', 
                  marginBottom: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16,
                  border: isUrgent ? `1px solid ${T.urgent}30` : missing ? `1px solid ${T.danger}30` : `1px solid ${T.borderLt}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  borderRadius: RM
                }}>
                
                {/* Thumbnail Minimal */}
                <div onClick={() => openEdit(pet)} style={{
                  width: 64, height: 64, borderRadius: RM, flexShrink: 0, cursor: 'pointer',
                  background: photo ? `url(${photo}) center/cover` : T.accentLt,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                }} />

                {/* Info Minimalista */}
                <div onClick={() => openEdit(pet)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 17, color: T.txt, letterSpacing: '-0.3px' }}>{pet.name || 'Sin nombre'}</span>
                    {isUrgent && (
                      <span style={{ fontSize: 9, fontWeight: 900, color: T.urgent, background: T.urgentLt, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>Urgente</span>
                    )}
                    {isAdopted && (
                      <span style={{ fontSize: 9, fontWeight: 900, color: T.ok, background: T.okLt, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>Adoptado</span>
                    )}
                    {missing && (
                      <span style={{ fontSize: 9, fontWeight: 900, color: T.danger, background: T.dangerLt ?? `${T.danger}18`, padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>Faltan datos</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {secondaryInfo}
                  </div>
                </div>

                {/* Acciones Compactas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {pet.adoptionStatus !== 'adopted' ? (
                    <button onClick={(e) => { e.stopPropagation(); openMarkAdopted(pet) }} 
                      className="btn-press"
                      style={{
                        width: 38, height: 38, borderRadius: 12, background: T.okLt,
                        border: 'none', color: T.ok, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                      <PartyPopper size={18} />
                    </button>
                  ) : (
                    <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ok }}>
                      <CheckCircle size={18} />
                    </div>
                  )}

                  <button onClick={(e) => { e.stopPropagation(); navigate(shelterSlug ? `/refugio/${shelterSlug}/adoptar/${pet.id}` : `/perro/${pet.id}`) }} 
                    className="btn-press"
                    style={{
                      width: 38, height: 38, borderRadius: 12, background: 'none',
                      border: 'none', color: T.muted, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <Eye size={18} />
                  </button>

                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(pet) }} 
                    className="btn-press"
                    style={{
                      width: 38, height: 38, borderRadius: 12, background: 'none',
                      border: 'none', color: T.danger, cursor: 'pointer',
                      opacity: 0.6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, gap: 10, padding: '0 4px'
        }}>
          <button
            className="btn-press"
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page <= 1}
            style={{
              padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`,
              background: page <= 1 ? T.borderLt : T.bg,
              color: page <= 1 ? T.muted : T.txt,
              fontWeight: 700, fontSize: 13, cursor: page <= 1 ? 'default' : 'pointer'
            }}
          >
            ← Anterior
          </button>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
            Página {page} / {totalPages}
          </div>
          <button
            className="btn-press"
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
            disabled={page >= totalPages}
            style={{
              padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`,
              background: page >= totalPages ? T.borderLt : T.bg,
              color: page >= totalPages ? T.muted : T.txt,
              fontWeight: 700, fontSize: 13, cursor: page >= totalPages ? 'default' : 'pointer'
            }}
          >
            Siguiente →
          </button>
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center', borderTop: `1.5px solid ${T.borderLt}`, paddingTop: 20 }}>
        <button 
          onClick={openImport}
          style={{ 
            background: 'none', border: 'none', color: T.muted, fontSize: 12, fontWeight: 700, 
            textDecoration: 'underline', cursor: 'pointer', opacity: 0.7 
          }}
        >
          Importación masiva de perritos (CSV)
        </button>
      </div>

      {importOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Card className="anim" style={{ padding: 24, maxWidth: 480, width: '100%', borderRadius: 24, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.txt, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentLt, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={20} />
                </div>
                Carga masiva (CSV)
              </div>
              <button onClick={closeImport} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Subí un archivo Excel/CSV para cargar muchos perritos a la vez. El sistema procesará cada fila automáticamente.
            </p>

            <div style={{ background: T.bg, padding: 16, borderRadius: 16, marginBottom: 20, border: `1.5px solid ${T.borderLt}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Columnas requeridas</div>
              <p style={{ fontSize: 12, color: T.txt, fontWeight: 600, lineHeight: 1.4 }}>
                name, breed, color, size, sex, neutered, adoption_status, neighborhood, notes, tags, photos
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <button 
                className="btn-press"
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
                style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${T.borderLt}`, background: 'transparent', color: T.txt, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Descargar plantilla
              </button>
              
              <button 
                className="btn-press"
                onClick={() => importFileRef.current?.click()}
                style={{ padding: '12px', borderRadius: 12, border: 'none', background: T.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Elegir archivo CSV
              </button>
              <input ref={importFileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onSelectImportFile} />
            </div>

            {importPreview && (
              <div className="anim" style={{ marginTop: 20, padding: 16, borderRadius: 16, background: T.bg, border: `1.5px solid ${T.borderLt}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>Resultados del análisis:</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{importPreview.okRows.length} listos</div>
                </div>
                
                {importPreview.badRows.length > 0 && (
                  <div style={{ marginBottom: 16, fontSize: 12, color: T.danger, fontWeight: 600 }}>
                    {importPreview.badRows.length} filas tienen errores y serán ignoradas.
                  </div>
                )}
                
                <Btn v="success" onClick={runImport} disabled={saving || importPreview.okRows.length === 0} style={{ width: '100%', justifyContent: 'center', height: 44 }}>
                  {saving ? 'Importando...' : `Iniciar carga de ${importPreview.okRows.length} perritos`}
                </Btn>
              </div>
            )}
          </Card>
        </div>
      )}

      {deleteConfirm && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 99999, 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20 
        }}>
          <Card className="anim" style={{ padding: 28, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', borderRadius: 28 }}>
            <div style={{ marginBottom: 20, color: T.danger, display: 'flex', justifyContent: 'center' }}><Trash2 size={64} strokeWidth={1.5} /></div>
            <h2 style={{ color: T.txt, fontSize: 22, fontWeight: 900, marginBottom: 10 }}>¿Eliminar a {deleteConfirm.name}?</h2>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.5, marginBottom: 28 }}>
              Esta acción es permanente y eliminará toda la información del perrito de la red.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn-press"
                onClick={() => setDeleteConfirm(null)} 
                style={{ flex: 1, padding: '16px', borderRadius: 16, border: 'none', background: T.bg, color: T.muted, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                className="btn-press"
                onClick={() => handleDelete(deleteConfirm.id)} 
                style={{ flex: 1, padding: '16px', borderRadius: 16, border: 'none', background: T.danger, color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 20px ${T.danger}30` }}
              >
                Eliminar
              </button>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {adoptionWizard && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 99999, 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20 
        }}>
          <Card className="anim" style={{ 
            padding: 0, 
            maxWidth: 460, 
            width: '100%', 
            maxHeight: '90vh',
            overflowY: 'auto', 
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)', 
            borderRadius: 28,
            position: 'relative'
          }}>
            <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, padding: '32px 32px', color: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <PartyPopper size={64} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, textAlign: 'center', letterSpacing: '-0.5px' }}>¡Final Feliz para {adoptionWizard.name}!</h2>
              <p style={{ fontSize: 14, margin: '10px 0 0', textAlign: 'center', opacity: 0.9, fontWeight: 500 }}>
                Completá los datos para celebrar su nueva vida.
              </p>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gap: 20 }}>
                <div>
                  <Label T={T}>Nombre del adoptante</Label>
                  <input 
                    value={adoptionWizard.adopterName} 
                    onChange={e => setAdoptionWizard(prev => ({ ...prev, adopterName: e.target.value }))}
                    placeholder="Ej: Familia Rodriguez"
                    style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${T.border}`, fontSize: 15 }}
                  />
                </div>

                <div>
                  <Label T={T}>Foto con su nueva familia</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: 180, borderRadius: 20, border: `2px dashed ${T.border}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', position: 'relative',
                      background: adoptionWizard.photo ? '#f8fafc' : T.bg,
                      transition: 'all .2s'
                    }}
                  >
                    {adoptionWizard.photo ? (
                      <WizardPhotoPreview file={adoptionWizard.photo} />
                    ) : (
                      <div style={{ textAlign: 'center', color: T.muted }}>
                        <Camera size={36} style={{ marginBottom: 8, opacity: 0.6 }} />
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Subir foto del encuentro</div>
                        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Opcional pero recomendado</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) setAdoptionWizard(prev => ({ ...prev, photo: file }))
                    }} />
                </div>

                <div>
                  <Label T={T}>Breve historia o mensaje</Label>
                  <textarea
                    value={adoptionWizard.story}
                    onChange={e => setAdoptionWizard(prev => ({ ...prev, story: e.target.value }))}
                    placeholder="Contanos un poco sobre esta adopción..."
                    rows={3}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14,
                      border: `1.5px solid ${T.border}`, fontSize: 15, resize: 'none', lineHeight: 1.5
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button 
                  className="btn-press"
                  onClick={() => setAdoptionWizard(null)} 
                  style={{ flex: 1, padding: '16px', borderRadius: 16, border: 'none', background: T.bg, color: T.muted, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-press"
                  onClick={handleAdoptionWizardSave} 
                  disabled={saving || !adoptionWizard.adopterName}
                  style={{ 
                    flex: 2, padding: '16px', borderRadius: 16, border: 'none', 
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, 
                    color: '#fff', fontWeight: 800, cursor: 'pointer',
                    boxShadow: `0 8px 20px ${T.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {saving ? <Loader size={20} className="spin" /> : '¡Confirmar Adopción!'}
                </button>
              </div>
            </div>
          </Card>
        </div>,
        document.body
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
function TagChip({ active, onClick, T, children }) {
  return (
    <button className="btn-press" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: RS,
      border: active ? `2px solid ${T.accent}` : `1.5px solid ${T.border}`,
      background: active ? T.accentLt : 'transparent',
      color: active ? T.accent : T.muted,
      fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .15s',
    }}>{children}</button>
  )
}
function ChipBtn({ active, onClick, T, children, small, urgentColor, urgentLt }) {
  const activeColor = urgentColor && active ? urgentColor : active ? T.accent : T.muted
  const activeBg = urgentColor && active ? urgentLt : active ? '#fff' : 'transparent'
  return (
    <button className="btn-press" onClick={onClick} style={{
      padding: small ? '6px 12px' : '8px 16px', borderRadius: RS,
      border: urgentColor && active ? `1.5px solid ${urgentColor}` : 'none',
      background: activeBg, color: activeColor,
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      fontWeight: 800, fontSize: small ? 12 : 13, cursor: 'pointer', whiteSpace: 'nowrap',
      flex: 1, textAlign: 'center', transition: 'all .2s'
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
        <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}><Loader size={16} /></span>
        {uploadProgress ? `Subiendo fotos ${uploadProgress}...` : 'Guardando...'}</>
      ) : label}
    </button>
  )
}
function PhotoThumb({ url, isPrimary, T, index, total, onMove, onSetPrimary, onRemove }) {
  const [isDragging, setIsDragging] = useState(false)
  
  return (
    <div 
      draggable 
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', index)
        setIsDragging(true)
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
        onMove(from, index)
      }}
      style={{ 
        position: 'relative', width: 80, height: 80, borderRadius: RM, overflow: 'hidden', 
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.2s',
        border: isPrimary ? `2px solid ${T.accent}` : 'none',
        cursor: 'grab'
      }}
    >
      <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Drag handle overlay for mobile */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 4, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           {isPrimary ? (
            <div style={{ background: T.accent, color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 4px', borderRadius: 4, textTransform: 'uppercase' }}>FOTO 1</div>
          ) : <div />}
          <div style={{ display: 'flex', gap: 2, pointerEvents: 'auto' }}>
            <SmallCircleBtn onClick={onRemove} bg="rgba(0,0,0,0.5)"><X size={10} /></SmallCircleBtn>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {index > 0 && <SmallCircleBtn onClick={() => onMove(index, index - 1)} bg="rgba(0,0,0,0.4)"><ChevronLeft size={12} /></SmallCircleBtn>}
            {index < total - 1 && <SmallCircleBtn onClick={() => onMove(index, index + 1)} bg="rgba(0,0,0,0.4)"><ChevronRight size={12} /></SmallCircleBtn>}
          </div>
          {!isPrimary && <SmallCircleBtn onClick={onSetPrimary} bg="rgba(0,0,0,0.4)"><Star size={10} fill="currentColor" /></SmallCircleBtn>}
        </div>
      </div>
    </div>
  )
}
function PendingThumb({ file, T, onRemove }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `2px dashed ${T.accent}` }}>
      {url && <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, textAlign: 'center', padding: 2 }}>Por subir</div>
      <SmallCircleBtn onClick={onRemove} bg="rgba(192,57,43,0.8)" style={{ position: 'absolute', top: 2, right: 2 }}><X size={10} /></SmallCircleBtn>
    </div>
  )
}

function WizardPhotoPreview({ file }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null
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


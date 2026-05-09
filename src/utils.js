// ─── Image compression ───────────────────────────────────────────
export function compressImage(file, maxW = 800, quality = 0.7) {
  return new Promise((res) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement("canvas")
        let w = img.width, h = img.height
        if (w > maxW) { h = (h * maxW) / w; w = maxW }
        c.width = w; c.height = h
        c.getContext("2d").drawImage(img, 0, 0, w, h)
        res(c.toDataURL("image/jpeg", quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/** Compress image and return a File object ready for Supabase upload */
export function compressImageToFile(file, maxW = 1200, quality = 0.75) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onerror = rej
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = rej
      img.onload = () => {
        const c = document.createElement("canvas")
        let w = img.width, h = img.height
        if (w > maxW) { h = (h * maxW) / w; w = maxW }
        c.width = w; c.height = h
        c.getContext("2d").drawImage(img, 0, 0, w, h)
        c.toBlob(
          (blob) => {
            if (!blob) return rej(new Error('Compression failed'))
            try {
              const compressed = new File([blob], (file.name || 'image.jpg').replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
              res(compressed)
            } catch (e) {
              blob.name = (file.name || 'image.jpg').replace(/\.\w+$/, '.jpg')
              res(blob)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── ID generator ────────────────────────────────────────────────
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// ─── Time helpers ────────────────────────────────────────────────
export function elapsedStr(iso) {
  if (!iso) return ""
  const d = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(d / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  if (months > 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`
  if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`
}

export function waitingMessage(iso) {
  if (!iso) return ""
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days > 90) return "Lleva más de 3 meses esperando"
  if (days > 30) return `Lleva ${Math.floor(days / 30)} ${days >= 60 ? 'meses' : 'mes'} esperando`
  if (days > 7) return `Lleva ${days} días esperando familia`
  if (days > 0) return `Lleva ${days} ${days === 1 ? 'día' : 'días'} esperando familia`
  return "Recién llegó al refugio"
}

export function fmtDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Fuzzy search ────────────────────────────────────────────────
export function levenshtein(a, b) {
  if (!a || !b) return 99
  a = a.toLowerCase(); b = b.toLowerCase()
  if (a.includes(b) || b.includes(a)) return 0
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1); r[0] = i; return r })
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0))
  return dp[m][n]
}

export function fuzzyMatch(query, text, threshold = 2) {
  if (!query || !text) return false
  if (text.toLowerCase().includes(query.toLowerCase())) return true
  const words = text.toLowerCase().split(/\s+/)
  return words.some(w => levenshtein(query.toLowerCase(), w) <= threshold)
}

// ─── Enum labels (español) ───────────────────────────────────────
const SIZE_LABELS = { small: 'Chico', medium: 'Mediano', large: 'Grande' }
const SEX_LABELS = { male: 'Macho', female: 'Hembra', unknown: 'Desconocido' }

export function sizeLabel(v) { return SIZE_LABELS[v] || v || '' }
export function sexLabel(v) { return SEX_LABELS[v] || v || '' }

// ─── Personality traits ──────────────────────────────────────────
export const PERSONALITY_TRAITS = {
  affectionate: { iconName: 'Heart', label: 'Muy cariñoso' },
  playful: { iconName: 'Bone', label: 'Jugueton' },
  calm: { iconName: 'Coffee', label: 'Tranquilo' },
  protective: { iconName: 'Shield', label: 'Protector' },
  goodWithKids: { iconName: 'Baby', label: 'Bueno con niños' },
  goodWithDogs: { iconName: 'Dog', label: 'Se lleva bien con perros' },
  goodWithCats: { iconName: 'Cat', label: 'Se lleva bien con gatos' },
  trained: { iconName: 'GraduationCap', label: 'Sabe pasear con correa' },
  friendly: { iconName: 'Users', label: 'Amigable' },
  onlyDog: { iconName: 'PawPrint', label: 'Perro único' },
  shy: { iconName: 'EyeOff', label: 'Tímido' },
}

export function inferTraits(pet) {
  const traits = []
  const n = ((pet.notes || '') + ' ' + (pet.name || '')).toLowerCase()
  if (n.includes('cariños') || n.includes('amor') || n.includes('acarici')) traits.push('affectionate')
  if (n.includes('jugueton') || n.includes('jugar') || n.includes('pelota') || n.includes('juguetona')) traits.push('playful')
  if (n.includes('tranquil')) traits.push('calm')
  if (n.includes('chicos') || n.includes('niños') || n.includes('ninos')) traits.push('goodWithKids')
  if (n.includes('otros perros') || n.includes('se lleva bien')) traits.push('goodWithDogs')
  if (n.includes('gato')) traits.push('goodWithCats')
  if (n.includes('correa') || n.includes('obediente') || n.includes('pasear')) traits.push('trained')
  if (n.includes('protector')) traits.push('protective')
  if (n.includes('amigable') || n.includes('docil') || n.includes('gentil')) traits.push('friendly')
  return traits.slice(0, 4)
}

// ─── Pet story generator ─────────────────────────────────────────
export function generatePetStory(pet, shelterName) {
  const name = pet.name || (pet.sex === 'female' ? 'Esta perrita' : 'Este perrito')
  const pronoun = pet.sex === 'female' ? 'ella' : 'el'
  const adj = pet.sex === 'female' ? 'rescatada' : 'rescatado'

  const introShelter = shelterName ? ` desde ${shelterName}` : ''
  const intros = [
    pet.neighborhood 
      ? `${name} fue ${adj} cerca de ${pet.neighborhood}${introShelter}.` 
      : `${name} fue ${adj} de la calle${introShelter}.`,
  ]

  const middles = []
  if (pet.color && String(pet.color).trim()) {
    middles.push(`Tiene un pelaje ${String(pet.color).toLowerCase()} y mucho amor para dar.`)
  }
  if (pet.size === 'small') middles.push(`Es chiquit${pet.sex === 'female' ? 'a' : 'o'} pero con un corazon enorme.`)
  if (pet.size === 'large') middles.push(`Es grandot${pet.sex === 'female' ? 'a' : 'e'} y lleno de energia.`)

  const notes = (pet.notes || '').toLowerCase()
  if (notes.includes('cariños') || notes.includes('amor')) middles.push(`Le encanta que l${pet.sex === 'female' ? 'a' : 'o'} acaricien.`)
  if (notes.includes('jugueton') || notes.includes('jugar')) middles.push(`Le encanta jugar y correr.`)
  if (notes.includes('tranquil')) middles.push(`Es tranquil${pet.sex === 'female' ? 'a' : 'o'} y muy buena compañia.`)

  if (middles.length === 0) middles.push(`Tiene mucho amor para dar y esta esperando a alguien especial.`)

  const days = pet.createdAt ? Math.floor((Date.now() - new Date(pet.createdAt).getTime()) / 86400000) : 0
  const endings = days > 30
    ? `Lleva ${days} dias soñando con encontrar una familia que l${pet.sex === 'female' ? 'a' : 'o'} quiera para siempre.`
    : `Hoy sueña con encontrar una familia que le de todo el amor que merece.`

  return `${intros[0]} ${middles[0]} ${endings}`
}

// ─── Pet photo helper ────────────────────────────────────────────
export function getPetPhoto(pet) {
  return pet?.photos?.[pet.primaryPhotoIdx ?? pet.primary_photo_idx ?? 0]
    || pet?.photos?.[0]
    || pet?.photo
    || null
}

// ─── Teléfono Argentina / WhatsApp (wa.me exige solo dígitos, ej. 54911…) ───

/** Quita 0 inicial, prefijo 15 móvil viejo, y arma 549 + código + número. */
export function normalizePhoneToWhatsAppDigits(raw) {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null

  let d = s.replace(/\D/g, '')
  if (!d) return null

  while (d.startsWith('0')) d = d.slice(1)
  if (d.startsWith('15') && d.length >= 10) d = d.slice(2)

  if (d.startsWith('549')) {
    return d.length >= 13 && d.length <= 15 ? d : null
  }
  if (d.startsWith('54')) {
    let rest = d.slice(2)
    if (!rest.startsWith('9')) rest = `9${rest}`
    const candidate = `54${rest}`
    return candidate.length >= 13 && candidate.length <= 15 ? candidate : null
  }
  if (d.length >= 10 && d.length <= 11) {
    return `549${d}`
  }
  return null
}

/** Parte el cuerpo nacional (después de 549) en código de área + número local. */
export function splitNationalMobileBody(body) {
  const b = String(body || '').replace(/\D/g, '')
  if (!b) return { area: '', number: '' }
  if (b.length < 2) return { area: b, number: '' }
  for (const alen of [4, 3, 2]) {
    const rem = b.length - alen
    if (rem >= 6 && rem <= 8) return { area: b.slice(0, alen), number: b.slice(alen) }
  }
  return { area: b.slice(0, 2), number: b.slice(2) }
}

/** Inicializar campos código + número desde lo guardado en DB (cualquier formato razonable). */
export function phonePartsFromStored(raw) {
  const d = normalizePhoneToWhatsAppDigits(raw)
  if (d && d.startsWith('549')) return splitNationalMobileBody(d.slice(3))
  const all = String(raw || '').replace(/\D/g, '')
  if (!all) return { area: '', number: '' }
  if (all.startsWith('549')) return splitNationalMobileBody(all.slice(3))
  if (all.length >= 10 && all.length <= 11) return splitNationalMobileBody(all)
  if (all.length > 3 && all.length < 10) return splitNationalMobileBody(all)
  return { area: all.slice(0, 4), number: all.slice(4) }
}

/** Texto legible para listados (no para wa.me). */
export function formatPhoneDisplayAR(raw) {
  const d = normalizePhoneToWhatsAppDigits(raw)
  if (!d || !d.startsWith('549')) {
    const t = String(raw || '').trim()
    return t || ''
  }
  const { area, number } = splitNationalMobileBody(d.slice(3))
  if (!number) return `+54 9 ${area}`.trim()
  const half = Math.ceil(number.length / 2)
  const n1 = number.slice(0, half)
  const n2 = number.slice(half)
  return `+54 9 ${area} ${n1}${n2 ? ` ${n2}` : ''}`.trim()
}

/** URL base wa.me o null si el número no es válido. */
export function getWhatsAppBaseUrl(phone) {
  const digits = normalizePhoneToWhatsAppDigits(phone)
  return digits ? `https://wa.me/${digits}` : null
}

/**
 * Enlace WhatsApp con mensaje. Devuelve null si el número no normaliza (evita wa.me inválido).
 */
export function getWhatsAppLink(phone, message) {
  const base = getWhatsAppBaseUrl(phone)
  if (!base) return null
  if (message == null || String(message) === '') return base
  return `${base}?text=${encodeURIComponent(String(message))}`
}

/** @deprecated usar normalizePhoneToWhatsAppDigits */
export function cleanWhatsApp(num) {
  return normalizePhoneToWhatsAppDigits(num)
}

export function isValidWhatsApp(num) {
  return normalizePhoneToWhatsAppDigits(num) !== null
}

export function formatWhatsApp(num) {
  const clean = normalizePhoneToWhatsAppDigits(num)
  if (!clean) return String(num || '').trim() || ''
  return `+${clean}`
}

// ─── CSV helpers (import masivo) ──────────────────────────────────
function detectDelimiter(text) {
  const firstLine = (text || '').split(/\r?\n/).find(Boolean) || ''
  const commas = (firstLine.match(/,/g) || []).length
  const semis = (firstLine.match(/;/g) || []).length
  return semis > commas ? ';' : ','
}

function parseCsvLine(line, delimiter) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') { cur += '"'; i++; continue }
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map(s => (s ?? '').trim())
}

export function parseCsv(text) {
  const delimiter = detectDelimiter(text)
  const lines = (text || '').split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [], delimiter }
  const headers = parseCsvLine(lines[0], delimiter).map(h => h.replace(/^\uFEFF/, '').trim())
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line, delimiter)
    const row = {}
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? '' })
    return row
  })
  return { headers, rows, delimiter }
}

// ─── Pet / historia URLs ─────────────────────────────────────────
/** UUID v4 (perros en rutas legacy `/perro/:id`). */
export const PET_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isPetUuid(s) {
  return typeof s === 'string' && PET_UUID_RE.test(s)
}

/** URL canónica: `/refugio/:shelterSlug/perro/:petSlug` si hay datos; si no `/perro/:id`. */
export function getPetUrl(pet) {
  if (!pet?.id) return '/'
  const sh = pet.shelterSlug ?? pet.shelters?.slug
  const slug = pet.slug
  if (sh && slug) return `/refugio/${sh}/perro/${slug}`
  return `/perro/${pet.id}`
}

export function getStoryUrl(pet) {
  return pet?.shelterSlug
    ? `/refugio/${pet.shelterSlug}/historias`
    : `/historias`
}

export function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const aa = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(aa)))
}


export function waitingLabel(pet) {
  if (!pet?.waiting_number || !pet?.waiting_unit) return null
  return `${pet.waiting_number} ${pet.waiting_unit}`
}

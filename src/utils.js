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
  if (days > 90) return "Lleva mas de 3 meses esperando una familia"
  if (days > 30) return `Lleva ${Math.floor(days / 30)} ${days >= 60 ? 'meses' : 'mes'} esperando`
  if (days > 7) return `Lleva ${days} dias soñando con un hogar`
  if (days > 0) return `Hace ${days} ${days === 1 ? 'dia' : 'dias'} que busca familia`
  return "Recien llego y necesita ayuda"
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
  affectionate: { emoji: '💕', label: 'Muy cariñoso' },
  playful: { emoji: '🎾', label: 'Jugueton' },
  calm: { emoji: '😌', label: 'Tranquilo' },
  protective: { emoji: '🛡️', label: 'Protector' },
  goodWithKids: { emoji: '👶', label: 'Bueno con niños' },
  goodWithDogs: { emoji: '🐕', label: 'Se lleva bien con perros' },
  goodWithCats: { emoji: '🐱', label: 'Se lleva bien con gatos' },
  trained: { emoji: '🎓', label: 'Sabe pasear con correa' },
  friendly: { emoji: '🤗', label: 'Amigable' },
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
export function generatePetStory(pet) {
  const name = pet.name || (pet.sex === 'female' ? 'Esta perrita' : 'Este perrito')
  const pronoun = pet.sex === 'female' ? 'ella' : 'el'
  const adj = pet.sex === 'female' ? 'rescatada' : 'rescatado'

  const intros = [
    pet.neighborhood ? `${name} fue ${adj} cerca de ${pet.neighborhood}.` : `${name} fue ${adj} de la calle.`,
  ]

  const middles = []
  if (pet.breed) middles.push(`Es un${pet.sex === 'female' ? 'a' : ''} ${pet.breed.toLowerCase()} con mucho amor para dar.`)
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

// ─── WhatsApp helpers ────────────────────────────────────────────
export function cleanWhatsApp(num) {
  let clean = num.replace(/[^0-9]/g, "")
  if (clean.startsWith("0")) clean = clean.slice(1)
  if (clean.startsWith("15") && clean.length <= 10) clean = clean.slice(2)
  if (clean.startsWith("54")) {
    if (!clean.startsWith("549")) clean = "549" + clean.slice(2)
    return clean.length >= 12 ? clean : null
  }
  if (clean.length === 10) return "549" + clean
  if (clean.length < 10) return null
  return clean
}

export function isValidWhatsApp(num) { return cleanWhatsApp(num) !== null }

export function formatWhatsApp(num) {
  const clean = cleanWhatsApp(num)
  if (!clean) return num
  return "+" + clean
}

import { readFileSync, readdirSync, statSync, createReadStream } from 'fs'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const ONLY_ONE = process.argv.includes('--one')

const SUPABASE_URL = 'https://ombtfvupawpiopvcmynx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const SHELTER_ID   = 'b31e3c43-8eb1-43bc-bcdc-2d22de0eace5'
const BUCKET       = 'pet-photos'
const PHOTO_DIR    = '/Users/federicoterrazas/Desktop/perritos/PERROS REFU CASA'
const CSV_PATH     = '/Users/federicoterrazas/Desktop/perritos/Casa Refugio 2026 - Perros del refu.csv'

if (!SERVICE_KEY) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

// ── CSV parser (handles quoted multiline fields) ───────────────────
function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQ = false
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(cur.trim()); cur = '' }
      else if (c === '\n') { row.push(cur.trim()); rows.push(row); row = []; cur = '' }
      else if (c === '\r') {}
      else cur += c
    }
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row) }
  return rows
}

// ── Normalize for folder matching ─────────────────────────────────
const norm = s => (s||'').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]/g, '')

const ALIAS = {
  'mila':   'milanesa',
  'morci':  'morcilla',
  'sonri':  'sonrisa',
  'negri':  'negrito',
  'oli':    'olivia',
  'pilin':  'polito',
}

// ── Tag inference (mirrors src/utils.js inferTraits) ──────────────
function inferTags(notes) {
  const n = (notes || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const tags = []
  if (n.includes('cariños') || n.includes('amor') || n.includes('acarici')) tags.push('affectionate')
  if (n.includes('jugueton') || n.includes('jugar') || n.includes('pelota') || n.includes('juguetona')) tags.push('playful')
  if (n.includes('tranquil')) tags.push('calm')
  if (n.includes('chicos') || n.includes('niños') || n.includes('ninos')) tags.push('goodWithKids')
  if (n.includes('otros perros') || n.includes('se lleva bien')) tags.push('goodWithDogs')
  if (n.includes('gato')) tags.push('goodWithCats')
  if (n.includes('correa') || n.includes('obediente') || n.includes('pasear')) tags.push('trained')
  if (n.includes('protector')) tags.push('protective')
  if (n.includes('amigable') || n.includes('docil') || n.includes('gentil')) tags.push('friendly')
  if (n.includes('para perro unico') || n.includes('perro unico')) tags.push('onlyDog')
  if (n.includes('timid') || n.includes('miedos') || n.includes('necesita paciencia')) tags.push('shy')
  return tags.slice(0, 4)
}

// ── Field mappers ──────────────────────────────────────────────────
function mapSex(s) {
  const v = (s||'').toLowerCase()
  if (v === 'hembra') return 'female'
  if (v === 'macho')  return 'male'
  return 'unknown'
}

function mapSize(s) {
  const v = (s||'').toLowerCase()
  if (v.includes('grand')) return 'large'
  if (v.includes('chic'))  return 'small'
  if (v.includes('medi'))  return 'medium'
  return null
}

function parseAge(raw) {
  if (!raw) return null
  const s = raw.toString().toLowerCase().trim()
  if (s === 'vieji') return 10
  const nums = s.match(/\d+/g)
  if (!nums) return null
  return Math.max(...nums.map(Number))
}

function capitalize(s) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function buildNotes(row) {
  const parts = []
  if (row.Caracter) parts.push(row.Caracter)
  if (row['Consideraciones Especiales']) parts.push(row['Consideraciones Especiales'])
  return parts.filter(Boolean).join('. ') || null
}

// ── Load CSV ───────────────────────────────────────────────────────
const raw   = readFileSync(CSV_PATH, 'utf8')
const rows  = parseCSV(raw)
const hdrs  = rows[1] // row 0 = title, row 1 = headers
const data  = rows.slice(2).filter(r => r[hdrs.indexOf('Perro')] && r[hdrs.indexOf('Perro')].length > 1)

function toObj(r) {
  return Object.fromEntries(hdrs.map((h, i) => [h, r[i] ?? '']))
}

// ── Match folders ──────────────────────────────────────────────────
const folders = readdirSync(PHOTO_DIR).filter(n => {
  try { return statSync(`${PHOTO_DIR}/${n}`).isDirectory() } catch { return false }
})
const folderByNorm = new Map(folders.map(f => [norm(f), f]))

function getPhotoPaths(name) {
  const k = norm(name)
  const target = ALIAS[k] || k
  const folder = folderByNorm.get(target)
  if (!folder) return []
  return readdirSync(`${PHOTO_DIR}/${folder}`)
    .filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f))
    .map(f => `${PHOTO_DIR}/${folder}/${f}`)
}

// ── Build pet list (only those with photos) ───────────────────────
const dogs = data
  .map(toObj)
  .filter(r => r['Perro'].length > 1)
  .filter(r => getPhotoPaths(r['Perro']).length > 0)

const target = ONLY_ONE ? [dogs.find(d => norm(d['Perro']) === 'trufa') || dogs[0]] : dogs

console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'REAL'} | Perros a procesar: ${target.length}\n`)

// ── Upload photos ──────────────────────────────────────────────────
async function uploadPhotos(petId, photoPaths) {
  const urls = []
  for (const filePath of photoPaths) {
    const ext      = path.extname(filePath).slice(1).toLowerCase()
    const mime     = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const random   = Math.random().toString(36).slice(2, 8)
    const filename = `${petId}/${Date.now()}-${random}.${ext}`
    const buffer   = readFileSync(filePath)

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { upsert: false, contentType: mime })

    if (error) throw new Error(`Storage upload failed for ${filePath}: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    urls.push(data.publicUrl)
  }
  return urls
}

// ── Main loop ──────────────────────────────────────────────────────
let ok = 0, fail = 0

for (const row of target) {
  const name      = row['Perro']
  const photoPaths = getPhotoPaths(name)
  const payload = {
    name,
    species:          'dog',
    breed:            'NO',
    sex:              mapSex(row['Sexo']),
    size:             mapSize(row['Tamaño']),
    color:            capitalize(row['Pelaje']) || null,
    notes:            buildNotes(row),
    type:             'stray',
    status:           'found',
    adoption_status:  'shelter',
    shelter_id:       SHELTER_ID,
    age:              parseAge(row['Edad']),
    registered_via:   'bulk_import',
    owner_id:         null,
    photos:           [],
  }
  payload.tags = inferTags(payload.notes)

  if (DRY_RUN) {
    console.log(`[DRY-RUN] ${name}`)
    console.log(`  sex: ${payload.sex} | size: ${payload.size} | color: ${payload.color}`)
    console.log(`  notes: ${payload.notes?.slice(0, 80)}...`)
    console.log(`  fotos: ${photoPaths.length} archivos`)
    console.log()
    continue
  }

  try {
    const { data: inserted, error: insertErr } = await supabase
      .from('pets')
      .insert(payload)
      .select('id')
      .single()

    if (insertErr) throw insertErr

    const urls = await uploadPhotos(inserted.id, photoPaths)

    const { error: updateErr } = await supabase
      .from('pets')
      .update({ photos: urls })
      .eq('id', inserted.id)

    if (updateErr) throw updateErr

    console.log(`✓ ${name} (${urls.length} fotos)`)
    ok++
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`)
    fail++
  }
}

if (!DRY_RUN) console.log(`\nResultado: ${ok} ok, ${fail} fallidos`)

import { readFileSync, readdirSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = 'https://ombtfvupawpiopvcmynx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const SHELTER_ID   = 'b31e3c43-8eb1-43bc-bcdc-2d22de0eace5'
const BUCKET       = 'pet-photos'
const PHOTO_DIR    = '/Users/federicoterrazas/Desktop/historias'

if (!SERVICE_KEY) { console.error('Falta SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

// Group files by pet name (strip trailing number and spaces)
function extractName(filename) {
  const base = path.basename(filename, path.extname(filename))
  return base.replace(/\s*\d+$/, '').trim()
}

const files = readdirSync(PHOTO_DIR)
  .filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f))
  .sort()

// Capitalize first letter of each word
const LOWERCASE_WORDS = new Set(['y', 'de', 'del', 'la', 'el', 'los', 'las'])
const titleCase = s => s
  .replace(/\b\w/g, c => c.toUpperCase())
  .replace(/\b(\w+)\b/g, (w, m, offset) => offset > 0 && LOWERCASE_WORDS.has(m.toLowerCase()) ? m.toLowerCase() : w)

const groups = new Map()
for (const f of files) {
  const raw  = extractName(f)
  const name = titleCase(raw)
  if (!groups.has(name)) groups.set(name, [])
  groups.get(name).push(f)
}

console.log(`Grupos encontrados: ${groups.size}`)
groups.forEach((photos, name) => console.log(`  ${name}: ${photos.length} foto(s)`))
console.log()

async function uploadPhoto(filePath, petId) {
  const ext    = path.extname(filePath).slice(1).toLowerCase()
  const mime   = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const random = Math.random().toString(36).slice(2, 8)
  const dest   = `${petId}/${Date.now()}-${random}.${ext}`
  const buffer = readFileSync(filePath)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(dest, buffer, { upsert: false, contentType: mime })

  if (error) throw new Error(`Upload failed ${filePath}: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(dest).data.publicUrl
}

let ok = 0, fail = 0

for (const [name, photoFiles] of groups) {
  if (DRY_RUN) {
    console.log(`[DRY-RUN] "${name}" — ${photoFiles.length} foto(s): ${photoFiles.join(', ')}`)
    continue
  }

  try {
    const { data: inserted, error: insertErr } = await supabase
      .from('pets')
      .insert({
        name,
        species:          'dog',
        type:             'stray',
        status:           'found',
        adoption_status:  'adopted',
        shelter_id:       SHELTER_ID,
        registered_via:   'bulk_import',
        owner_id:         null,
        photos:           [],
        breed:            null,
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr

    const urls = []
    for (const f of photoFiles) {
      const url = await uploadPhoto(`${PHOTO_DIR}/${f}`, inserted.id)
      urls.push(url)
    }

    await supabase.from('pets').update({ photos: urls }).eq('id', inserted.id)

    console.log(`✓ ${name} (${urls.length} foto(s))`)
    ok++
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`)
    fail++
  }
}

if (!DRY_RUN) console.log(`\nResultado: ${ok} ok, ${fail} fallidos`)

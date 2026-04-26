import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

// ---- CONFIG ----
const DESKTOP_PATH = '/Users/federicoterrazas/Desktop/perritos'
const CSV_FILE = path.join(DESKTOP_PATH, 'Casa Refugio 2026 - Perros del refu.csv')
const PHOTOS_BASE_DIR = path.join(DESKTOP_PATH, 'PERROS REFU CASA')
const SHELTER_SLUG = 'casa'

const envPath = path.resolve('.env')
const vars = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)

// ---- HELPERS ----
function normSex(val) {
  const v = val?.toLowerCase().trim()
  if (['hembra', 'female', 'f'].includes(v)) return 'female'
  if (['macho', 'male', 'm'].includes(v)) return 'male'
  return 'unknown'
}

function normSize(val) {
  const v = val?.toLowerCase().trim()
  if (v.includes('chico')) return 'small'
  if (v.includes('paticorti')) return 'small'
  if (v.includes('mediano')) return 'medium'
  if (v.includes('grande')) return 'large'
  return 'medium'
}

function parseCSV(text) {
  const rows = text.split('\n').map(r => r.split(','))
  // Skip first row (Title) and second row (Headers)
  const headers = rows[1].map(h => h.trim())
  return rows.slice(2).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i]?.trim() })
    return obj
  }).filter(p => p.Perro)
}

const NAME_MAPPING = {
  'Oli': 'OLIVIA',
  'Mila': 'MILANESA',
  'Morci': 'MORCILLA',
  'Sonri': 'SONRISA',
  'Negri': 'NEGRITO',
  'Nerón': 'NERON'
}

async function uploadImage(filePath, petId) {
  if (!existsSync(filePath)) return null
  const buf = readFileSync(filePath)
  const fileName = path.basename(filePath)
  const ext = fileName.split('.').pop().toLowerCase()
  const dest = `${petId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const contentType = ['png', 'webp'].includes(ext) ? `image/${ext}` : 'image/jpeg'
  
  const { error } = await supabase.storage.from('pet-photos').upload(dest, buf, { contentType, upsert: false })
  if (error) { console.error(`  ❌ Error uploading ${fileName}:`, error.message); return null }
  return supabase.storage.from('pet-photos').getPublicUrl(dest).data.publicUrl
}

async function run() {
  console.log('🚀 Iniciando importación desde Desktop...')

  // 1. Get Shelter ID
  const { data: shelter } = await supabase.from('shelters').select('id').eq('slug', SHELTER_SLUG).single()
  if (!shelter) { console.error('⛔ No se encontró el refugio con slug:', SHELTER_SLUG); return }
  const shelterId = shelter.id
  console.log(`🏠 Shelter ID found: ${shelterId}`)

  // 2. Read CSV
  if (!existsSync(CSV_FILE)) { console.error('⛔ No se encontró el CSV en:', CSV_FILE); return }
  const petsData = parseCSV(readFileSync(CSV_FILE, 'utf8'))
  console.log(`📋 Dogs in CSV: ${petsData.length}`)

  // 3. Process
  let ok = 0, fail = 0

  for (const p of petsData) {
    const name = p.Perro
    console.log(`\n🐾 Procesando: ${name}...`)

    const payload = {
      shelter_id: shelterId,
      name: name,
      species: 'dog',
      sex: normSex(p.Sexo),
      size: normSize(p.Tamaño),
      notes: [
        p.Caracter ? `Caracter: ${p.Caracter}` : null,
        p.Edad ? `Edad: ${p.Edad}` : null,
        p.Pelaje ? `Pelaje: ${p.Pelaje}` : null,
        p['Consideraciones Especiales'] ? `Notas: ${p['Consideraciones Especiales']}` : null
      ].filter(Boolean).join('\n'),
      status: 'found',
      adoption_status: 'shelter',
      registered_via: 'import',
      created_at: new Date().toISOString()
    }

    const { data: inserted, error: insertErr } = await supabase.from('pets').insert(payload).select('id').single()

    if (insertErr) {
      console.error(`  ❌ Error al insertar:`, insertErr.message)
      fail++
      continue
    }

    // 4. Photos discovery
    const folderName = NAME_MAPPING[name] || name.toUpperCase()
    const folderPath = path.join(PHOTOS_BASE_DIR, folderName)
    
    if (existsSync(folderPath)) {
      const photos = []
      const files = readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      console.log(`  📸 Found folder ${folderName} with ${files.length} photos`)
      
      for (const f of files) {
        const url = await uploadImage(path.join(folderPath, f), inserted.id)
        if (url) photos.push(url)
      }

      if (photos.length > 0) {
        await supabase.from('pets').update({ photos }).eq('id', inserted.id)
        console.log(`  ✅ Uploaded ${photos.length} photos`)
      }
    } else {
      console.warn(`  ⚠️  No se encontró carpeta para: ${folderName}`)
    }

    ok++
  }

  console.log(`\nDONE! Finalizados: ${ok}, Fallados: ${fail}`)
}

run()

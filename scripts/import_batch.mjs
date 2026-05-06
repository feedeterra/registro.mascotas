import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

// ---- Config ----
const envPath = path.resolve('.env')
if (!existsSync(envPath)) { console.error('⛔ No se encontró .env'); process.exit(1) }

const vars = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)

// ---- CSV parser (soporta comillas y comas dentro de campos) ----
function parseCSVToObjects(text) {
  const result = []
  let row = [], inQuotes = false, cur = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
    else if (c === '"') { inQuotes = !inQuotes }
    else if (c === ',' && !inQuotes) { row.push(cur); cur = '' }
    else if (c === '\n' && !inQuotes) { row.push(cur); result.push(row); row = []; cur = '' }
    else if (c !== '\r') { cur += c }
  }
  if (cur || row.length) { row.push(cur); result.push(row) }
  if (result.length < 2) return []
  const headers = result[0].map(h => h.trim().toLowerCase())
  return result.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i]?.trim() ?? '' })
    return obj
  })
}

// ---- Normalizar valores ----
const SEX_MAP    = { hembra: 'female', macho: 'male', female: 'female', male: 'male' }
const SIZE_MAP   = { chico: 'small', pequeño: 'small', small: 'small', mediano: 'medium', medium: 'medium', grande: 'large', large: 'large', 'muy grande': 'xlarge', xlarge: 'xlarge' }
const STATUS_MAP = { shelter: 'shelter', refugio: 'shelter', transit: 'transit', transito: 'transit', tránsito: 'transit', urgent: 'urgent', urgente: 'urgent', adopted: 'adopted', adoptado: 'adopted' }

function norm(map, val, fallback) {
  return map[val?.toLowerCase().trim()] ?? fallback
}

function boolVal(val) {
  if (!val) return null
  return ['si', 'sí', 'yes', 'true', '1'].includes(val.toLowerCase().trim())
}

// ---- Subir foto a Supabase Storage ----
async function uploadImage(fileName, petId) {
  const filePath = path.resolve('import_data', 'fotos', fileName)
  if (!existsSync(filePath)) {
    console.warn(`  ⚠️  Foto no encontrada: import_data/fotos/${fileName}`)
    return null
  }
  const buf = readFileSync(filePath)
  const ext = fileName.split('.').pop().toLowerCase()
  const dest = `${petId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const { error } = await supabase.storage.from('pet-photos').upload(dest, buf, { contentType, upsert: false })
  if (error) { console.error(`  ❌ Error subiendo ${fileName}:`, error.message); return null }
  return supabase.storage.from('pet-photos').getPublicUrl(dest).data.publicUrl
}

// ---- Main ----
async function run() {
  const csvPath = path.resolve('import_data', 'perritos.csv')
  mkdirSync(path.resolve('import_data', 'fotos'), { recursive: true })

  if (!existsSync(csvPath)) {
    console.error('⛔ No se encontró import_data/perritos.csv')
    process.exit(1)
  }

  const pets = parseCSVToObjects(readFileSync(csvPath, 'utf8')).filter(p => p.nombre)
  if (!pets.length) { console.error('⛔ CSV vacío o sin encabezados válidos.'); process.exit(1) }

  console.log(`\n📋 ${pets.length} perrito${pets.length !== 1 ? 's' : ''} encontrado${pets.length !== 1 ? 's' : ''}. Empezando importación...\n`)

  let ok = 0, fail = 0

  for (const p of pets) {
    console.log(`🐾 ${p.nombre}...`)

    // Calcular created_at según dias_esperando
    let createdAt = new Date().toISOString()
    if (p.dias_esperando && !isNaN(Number(p.dias_esperando))) {
      createdAt = new Date(Date.now() - Number(p.dias_esperando) * 86400000).toISOString()
    }

    const payload = {
      name:             p.nombre,
      species:          'dog',
      color:            p.color || null,
      sex:              norm(SEX_MAP, p.sexo, 'unknown'),
      size:             norm(SIZE_MAP, p.tamano ?? p.tamaño, null),
      neutered:         boolVal(p.castrado),
      type:             'stray',
      status:           'found',
      adoption_status:  norm(STATUS_MAP, p.adopcion, 'shelter'),
      neighborhood:     p.barrio || null,
      notes:            p.notas || null,
      tags:             p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      photos:           [],
      registered_via:   'import',
      created_at:       createdAt,
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('pets').insert(payload).select('id').single()

    if (insertErr) {
      console.error(`  ❌ Error al insertar:`, insertErr.message)
      fail++
      continue
    }

    // Subir fotos si las hay en la carpeta
    if (p.fotos) {
      const files = p.fotos.split(',').map(f => f.trim()).filter(Boolean)
      const urls = []
      for (const f of files) {
        const url = await uploadImage(f, inserted.id)
        if (url) urls.push(url)
      }
      if (urls.length) {
        await supabase.from('pets').update({ photos: urls }).eq('id', inserted.id)
        console.log(`  ✅ Listo — ${urls.length} foto${urls.length !== 1 ? 's' : ''} subida${urls.length !== 1 ? 's' : ''}`)
      } else {
        console.log(`  ✅ Guardado sin fotos (se pueden subir desde Admin)`)
      }
    } else {
      console.log(`  ✅ Guardado sin fotos (se pueden subir desde Admin)`)
    }

    ok++
  }

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`✅ Importados: ${ok}   ❌ Fallados: ${fail}`)
  console.log(`${'─'.repeat(40)}\n`)
}

run()

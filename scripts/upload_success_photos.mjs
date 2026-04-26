import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import path from 'path'

// ---- Config ----
const envPath = path.resolve('.env')
const vars = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)
const SHELTER_ID = 'b31e3c43-8eb1-43bc-bcdc-2d22de0eace5' // Refugio CASA

// ---- Subir foto a Supabase Storage ----
async function uploadImage(filePath, petId) {
  const fileName = path.basename(filePath)
  const buf = readFileSync(filePath)
  const ext = fileName.split('.').pop().toLowerCase()
  const dest = `${petId}/success-${Date.now()}.${ext}`
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  
  const { error } = await supabase.storage.from('pet-photos').upload(dest, buf, { contentType, upsert: false })
  if (error) { console.error(`  ❌ Error subiendo ${fileName}:`, error.message); return null }
  
  return supabase.storage.from('pet-photos').getPublicUrl(dest).data.publicUrl
}

// ---- Main ----
async function run() {
  const historiasDir = path.resolve('import_data', 'historias')
  if (!existsSync(historiasDir)) {
    mkdirSync(historiasDir, { recursive: true })
    console.log('📂 Carpeta "import_data/historias" creada. Por favor, poné las fotos ahí y volvé a ejecutar el script.')
    process.exit(0)
  }

  const files = readdirSync(historiasDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f))
  if (files.length === 0) {
    console.log('🤷 No se encontraron fotos en "import_data/historias".')
    process.exit(0)
  }

  console.log(`\n🚀 Subiendo ${files.length} fotos de historias...\n`)

  let ok = 0, fail = 0

  for (const file of files) {
    const dogName = file.split('.')[0].replace(/[-_]/g, ' ')
    console.log(`📸 Procesando: ${file}...`)

    const payload = {
      name: `Historia: ${dogName}`,
      species: 'dog',
      type: 'stray',
      status: 'adopted',
      adoption_status: 'adopted',
      shelter_id: SHELTER_ID,
      registered_via: 'bulk_success',
      photos: [],
      notes: 'Historia pendiente de completar.',
      adopter_name: 'Cargando...',
      adopter_quote: 'Final feliz en proceso',
      adopted_at: new Date().toISOString()
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('pets').insert(payload).select('id').single()

    if (insertErr) {
      console.error(`  ❌ Error al crear registro:`, insertErr.message)
      fail++
      continue
    }

    // Subir foto
    const url = await uploadImage(path.join(historiasDir, file), inserted.id)
    if (url) {
      await supabase.from('pets').update({ photos: [url] }).eq('id', inserted.id)
      console.log(`  ✅ Registro creado con éxito.`)
      ok++
    } else {
      console.error(`  ❌ Error al subir foto para ${file}`)
      fail++
    }
  }

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`✅ Procesados: ${ok}   ❌ Fallados: ${fail}`)
  console.log(`${'─'.repeat(40)}\n`)
  console.log('🎉 ¡Listo! Ahora podés ir al Panel Admin, filtrar por "Adoptados" y completar los datos de cada uno.')
}

run()

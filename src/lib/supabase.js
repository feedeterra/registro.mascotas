// src/lib/supabase.js
// ─── Cliente Supabase centralizado ───────────────────────────────
// Un único cliente para toda la app. Importar desde acá siempre,
// nunca crear instancias sueltas en componentes.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '⛔ Faltan variables de entorno. Verificá que exista .env con ' +
    'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persiste la sesión en localStorage automáticamente
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ─── Storage helpers ─────────────────────────────────────────────
// Bucket configurado en Supabase Storage → "pet-photos"

const BUCKET = 'pet-photos'

/**
 * Subir una foto de mascota.
 * @param {File} file        - Archivo de imagen
 * @param {string} petId     - ID de la mascota (para organizar carpetas)
 * @returns {Promise<string>} URL pública del archivo subido
 */
export async function uploadPetPhoto(file, petId) {
  const ext      = file.name ? file.name.split('.').pop() : 'jpg'
  const randomStr = Math.random().toString(36).substring(2, 8)
  const filename = `${petId}/${Date.now()}-${randomStr}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { upsert: false, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Subir una imagen general del refugio (hero, shelter, etc).
 */
export async function uploadShelterImage(file, name, shelterId = null) {
  const ext = file.name ? file.name.split('.').pop() : 'jpg'
  const randomStr = Math.random().toString(36).substring(2, 8)
  const prefix = shelterId ? `shelter/${shelterId}` : 'shelter'
  const filename = `${prefix}/${name}-${Date.now()}-${randomStr}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { upsert: false, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Eliminar una foto de mascota.
 * @param {string} url - URL pública del archivo a eliminar
 */
export async function deletePetPhoto(url) {
  // Extraer path relativo desde la URL pública
  const path = url.split(`/${BUCKET}/`)[1]
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}

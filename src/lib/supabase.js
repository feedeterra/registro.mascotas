// src/lib/supabase.js
// ─── Cliente Supabase centralizado ───────────────────────────────
// Un único cliente para toda la app. Importar desde acá siempre,
// nunca crear instancias sueltas en componentes.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    'Faltan variables de entorno. Verificá que exista .env con ' +
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

const ALLOWED_IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES[file.type]) throw new Error('Tipo de archivo no permitido')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Archivo demasiado grande (máx. 5 MB)')
  return ALLOWED_IMAGE_TYPES[file.type]
}

function compressImage(file, maxPx = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

/**
 * Subir una foto de mascota.
 * @param {File} file        - Archivo de imagen
 * @param {string} petId     - ID de la mascota (para organizar carpetas)
 * @returns {Promise<string>} URL pública del archivo subido
 */
export async function uploadPetPhoto(file, petId) {
  validateImageFile(file)
  const compressed = await compressImage(file)
  const randomStr = Math.random().toString(36).substring(2, 8)
  const filename = `${petId}/${Date.now()}-${randomStr}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, { upsert: false, contentType: 'image/jpeg' })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Subir una imagen general del refugio (hero, shelter, etc).
 */
export async function uploadShelterImage(file, name, shelterId = null) {
  validateImageFile(file)
  const compressed = await compressImage(file)
  const randomStr = Math.random().toString(36).substring(2, 8)
  const prefix = shelterId ? `shelter/${shelterId}` : 'shelter'
  const filename = `${prefix}/${name}-${Date.now()}-${randomStr}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, { upsert: false, contentType: 'image/jpeg' })

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

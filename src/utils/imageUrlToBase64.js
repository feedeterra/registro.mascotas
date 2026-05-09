/**
 * Carga una imagen por URL y la devuelve como data URL (base64).
 * Útil con html-to-image cuando el origen (p. ej. Supabase Storage) requiere
 * datos embebidos para evitar problemas de CORS al rasterizar.
 */
export async function imageUrlToBase64(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return trimmed

  const res = await fetch(trimmed, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`No se pudo cargar la imagen (${res.status})`)

  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Error al leer la imagen'))
    reader.readAsDataURL(blob)
  })
}

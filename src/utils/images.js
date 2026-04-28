/**
 * Optimiza una URL de imagen de Supabase Storage usando Image Transformation.
 * Si la URL no es de Supabase, la retorna sin cambios.
 * 
 * @param {string} url - URL original de la imagen
 * @param {object} options - Opciones de transformación (width, height, quality, resize)
 */
export function optimizeImage(url, { width, height, quality = 80, resize = 'cover' } = {}) {
  if (!url || typeof url !== 'string') return url
  
  // Solo aplicamos a URLs de Supabase Storage
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    // Transformamos la URL a la ruta de renderizado
    // De: .../storage/v1/object/public/bucket/path
    // A:  .../storage/v1/render/image/public/bucket/path
    const optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    
    const params = new URLSearchParams()
    if (width) params.append('width', width)
    if (height) params.append('height', height)
    if (quality) params.append('quality', quality)
    if (resize) params.append('resize', resize)
    
    const queryString = params.toString()
    return queryString ? `${optimizedUrl}?${queryString}` : optimizedUrl
  }
  
  return url
}

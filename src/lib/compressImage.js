import imageCompression from 'browser-image-compression'

/**
 * Comprime una imagen antes de subirla.
 * Reduce fotos de celular (típicamente 3-8MB) a menos de 1MB
 * manteniendo buena calidad visual.
 */
export async function compressImage(file) {
  // No comprimir si ya es pequeña (menos de 500KB)
  if (file.size < 500 * 1024) return file

  const options = {
    maxSizeMB: 1,           // máximo 1MB
    maxWidthOrHeight: 1920, // máximo 1920px en cualquier dimensión
    useWebWorker: true,     // no bloquea el hilo principal
    fileType: 'image/webp', // convertir a WebP para mayor compresión
    initialQuality: 0.85,   // calidad inicial (se ajusta automáticamente)
  }

  try {
    const compressed = await imageCompression(file, options)
    console.log(
      `Imagen comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`
    )
    return compressed
  } catch (error) {
    // Si falla la compresión, subir el archivo original
    console.warn('Compresión falló, usando original:', error)
    return file
  }
}

/** Extensión de archivo acorde al MIME tras compresión (p. ej. webp). */
export function storageImageExtension(file) {
  const m = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' }
  return m[file?.type] || 'jpg'
}

import { useCallback, useState } from 'react'
import { toPng } from 'html-to-image'

/** pixelRatio 1 mantiene 1080×1080 / 1080×1920 según el nodo capturado (feed / stories). */
const TO_PNG_OPTIONS = {
  pixelRatio: 1,
  cacheBust: true,
  skipFonts: false,
}

function safeShareFilename(petName, format) {
  const raw = (petName || 'historia')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .slice(0, 48)
  const base = raw.replace(/\s+/g, '-') || 'historia'
  return `${base}-${format}.png`
}

/**
 * Generación PNG (html-to-image) y compartir / descarga.
 */
export function useShareStory() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const generateImage = useCallback(async (node) => {
    if (!node) return null
    return toPng(node, TO_PNG_OPTIONS)
  }, [])

  const shareOrDownload = useCallback(async (dataUrl, format, petName) => {
    if (!dataUrl) return
    const filename = safeShareFilename(petName, format)
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], filename, { type: 'image/png' })
    const sharePayload = { files: [file], title: 'Historia de adopción' }

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare(sharePayload)
    ) {
      await navigator.share(sharePayload)
      return
    }

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }, [])

  return {
    generateImage,
    shareOrDownload,
    isGenerating,
    setIsGenerating,
    error,
    setError,
  }
}

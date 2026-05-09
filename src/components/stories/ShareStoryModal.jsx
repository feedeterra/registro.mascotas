import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT, R, RM, RS } from '../../theme'
import { imageUrlToBase64 } from '../../utils/imageUrlToBase64'
import { useShareStory } from '../../hooks/useShareStory'
import StoryShareCard from './StoryShareCard'
import { Loader2, X } from 'lucide-react'

function appBaseUrl() {
  return (import.meta.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app').replace(/\/$/, '')
}

function labelForFooter(base) {
  return base.replace(/^https?:\/\//i, '') || 'perritosyrefugios.vercel.app'
}

function photoObjectPositionForStory(story) {
  if (!story) return '50% 50%'
  if (story.photoAfterIdx === -1) return story.adoptedPhotoPosition || '50% 50%'
  const idx = story.photoAfterIdx ?? 0
  const pos = Array.isArray(story.photoPositions) ? story.photoPositions[idx] : null
  if (typeof pos === 'string') return pos
  if (pos && typeof pos.x === 'number') return `${pos.x}% ${pos.y ?? 50}%`
  return '50% 50%'
}

function primaryPhotoUrl(story) {
  if (!story) return ''
  return story.photoAfter || story.photoBefore || ''
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object|null} props.story — VM de mapSuccessStoryRow / feed
 */
export default function ShareStoryModal({ open, onClose, story }) {
  const T = useT()
  const { generateImage, shareOrDownload, isGenerating, setIsGenerating, error, setError } = useShareStory()
  const [format, setFormat] = useState('square')
  const [photoB64, setPhotoB64] = useState(null)
  const [photoErr, setPhotoErr] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewErr, setPreviewErr] = useState(null)
  const exportRef = useRef(null)

  const base = appBaseUrl()
  const appLabel = labelForFooter(base)
  const shelterUrlLabel = story?.shelterSlug ? `${appLabel}/refugio/${story.shelterSlug}` : null
  const linkHelpPath = story?.shelterSlug ? `/refugio/${story.shelterSlug}` : '/historias'
  const linkHelpFull = `${base}${linkHelpPath.startsWith('/') ? linkHelpPath : `/${linkHelpPath}`}`

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const resetState = useCallback(() => {
    setFormat('square')
    setPhotoB64(null)
    setPhotoErr(null)
    setPreviewUrl(null)
    setPreviewErr(null)
    setError(null)
  }, [setError])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }
    if (!story) return
    let cancelled = false
    setPhotoErr(null)
    const url = primaryPhotoUrl(story)
    if (!url) {
      setPhotoB64(null)
      return
    }
    ;(async () => {
      try {
        const b64 = await imageUrlToBase64(url)
        if (!cancelled) setPhotoB64(b64)
      } catch (e) {
        if (!cancelled) {
          setPhotoB64(null)
          setPhotoErr(e?.message || 'No se pudo cargar la foto para compartir.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [open, story?.id, resetState])

  useEffect(() => {
    if (!open || !story) return
    let cancelled = false

    const run = async () => {
      setPreviewErr(null)
      try {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        if (cancelled || !exportRef.current) return
        const url = await generateImage(exportRef.current)
        if (!cancelled) setPreviewUrl(url)
      } catch (e) {
        if (!cancelled) setPreviewErr(e?.message || 'No se pudo generar la vista previa.')
      }
    }

    const t = setTimeout(run, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, story?.id, format, photoB64, generateImage])

  const primaryLabel = useMemo(() => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return 'Descargar imagen'
    }
    if (typeof navigator.canShare !== 'function') return 'Compartir'
    try {
      const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
      const f = new File([bytes], 'probe.png', { type: 'image/png' })
      return navigator.canShare({ files: [f] }) ? 'Compartir' : 'Descargar imagen'
    } catch {
      return 'Descargar imagen'
    }
  }, [open])

  const handlePrimary = async () => {
    if (!story || !exportRef.current) return
    setIsGenerating(true)
    setError(null)
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const dataUrl = await generateImage(exportRef.current)
      if (!dataUrl) throw new Error('Sin imagen generada.')
      await shareOrDownload(dataUrl, format, story.petName)
    } catch (e) {
      setError(e?.message || 'Error al compartir o descargar.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!open || !story) return null

  const petName = story.petName || 'Historia'
  const busy = isGenerating

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-story-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Nodo de exportación fuera de pantalla (tamaño real para toPng) */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <StoryShareCard
          ref={exportRef}
          petName={petName}
          petPhotoSrc={photoB64}
          storyText={story.story || ''}
          shelterName={story.shelterName}
          format={format}
          forExport
          shelterUrlLabel={shelterUrlLabel}
          photoObjectPosition={photoObjectPositionForStory(story)}
        />
      </div>

      <div
        className="modal-scroll"
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: 'min(90vh, calc(100dvh - 32px))',
          overflowX: 'hidden',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          background: T.card,
          borderRadius: R,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          border: `1.5px solid ${T.borderLt}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 18px',
            borderBottom: `1px solid ${T.borderLt}`,
          }}
        >
          <h2
            id="share-story-title"
            style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.txt, lineHeight: 1.25 }}
          >
            Compartir historia de {petName}
          </h2>
          <button
            type="button"
            className="btn-press"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: RS,
              border: `1.5px solid ${T.borderLt}`,
              background: T.bg,
              color: T.txt,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '14px 18px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, marginBottom: 8 }}>Formato</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className="btn-press"
              onClick={() => setFormat('square')}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: RS,
                border: `1.5px solid ${format === 'square' ? T.accent : T.borderLt}`,
                background: format === 'square' ? T.accentLt : T.bg,
                color: format === 'square' ? T.accentDk : T.muted,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cuadrado (feed)
            </button>
            <button
              type="button"
              className="btn-press"
              onClick={() => setFormat('story')}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: RS,
                border: `1.5px solid ${format === 'story' ? T.accent : T.borderLt}`,
                background: format === 'story' ? T.accentLt : T.bg,
                color: format === 'story' ? T.accentDk : T.muted,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Story
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, marginBottom: 8 }}>Vista previa</div>
          <div
            style={{
              borderRadius: RS,
              border: `1.5px solid ${T.borderLt}`,
              background: T.bg,
              padding: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: 200,
              marginBottom: 12,
            }}
          >
            {photoErr ? (
              <p style={{ margin: 0, fontSize: 13, color: T.danger, fontWeight: 600 }}>{photoErr}</p>
            ) : previewErr || error ? (
              <p style={{ margin: 0, fontSize: 13, color: T.danger, fontWeight: 600 }}>{previewErr || error}</p>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={`Vista previa ${format === 'square' ? 'cuadrada' : 'vertical'}`}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 8,
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 24 }}>
                <Loader2 size={32} color={T.accent} style={{ animation: 'spin 0.85s linear infinite' }} />
                <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>Generando vista previa…</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: T.muted, margin: '0 0 14px', lineHeight: 1.45 }}>
            La imagen incluye el enlace público que corresponde ({linkHelpFull.replace(/^https?:\/\//, '')}).
          </p>

          <button
            type="button"
            className="btn-press"
            disabled={busy || !!photoErr}
            onClick={handlePrimary}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: RM,
              border: 'none',
              background: busy ? T.borderLt : T.accent,
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              cursor: busy || !!photoErr ? 'not-allowed' : 'pointer',
              opacity: busy || !!photoErr ? 0.7 : 1,
            }}
          >
            {busy ? 'Generando…' : primaryLabel}
          </button>
        </div>
      </div>
    </div>
    , document.body
  )
}

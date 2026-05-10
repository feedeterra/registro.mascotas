import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT, R, RM, RS } from '../../theme'
import { imageUrlToBase64 } from '../../utils/imageUrlToBase64'
import { useShareStory } from '../../hooks/useShareStory'
import ShelterShareCard from './ShelterShareCard'
import { Loader2, X, Link2, Copy, Share2, Check } from 'lucide-react'

function appBaseUrl() {
  return (import.meta.env.VITE_APP_URL || 'https://perritosyrefugios.vercel.app').replace(/\/$/, '')
}

function labelForFooter(base) {
  return base.replace(/^https?:\/\//i, '') || 'perritosyrefugios.vercel.app'
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {{
 *   name: string,
 *   slug: string,
 *   description?: string,
 *   mission?: string,
 *   imageUrl?: string|null,
 *   imagePosition?: string|null,
 *   locationLabel?: string|null,
 * }|null} props.shelter
 */
export default function ShareShelterModal({ open, onClose, shelter }) {
  const T = useT()
  const { generateImage, shareOrDownload, isGenerating, setIsGenerating, error, setError } = useShareStory()
  const [format, setFormat] = useState('square')
  const [photoB64, setPhotoB64] = useState(null)
  const [photoErr, setPhotoErr] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewErr, setPreviewErr] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const exportRef = useRef(null)

  const base = appBaseUrl()
  const appLabel = labelForFooter(base)
  const sharePath = shelter?.slug ? `/refugio/${shelter.slug}` : ''
  const shareFullUrl = `${base}${sharePath.startsWith('/') ? sharePath : `/${sharePath}`}`
  const shelterUrlLabel = shelter?.slug ? `${appLabel}/refugio/${shelter.slug}` : null

  const blurb = useMemo(() => {
    if (!shelter) return ''
    const m = (shelter.mission || '').trim()
    const d = (shelter.description || '').trim()
    return m || d || ''
  }, [shelter?.mission, shelter?.description])

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
    setLinkCopied(false)
    setError(null)
  }, [setError])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }
    if (!shelter) return
    let cancelled = false
    setPhotoErr(null)
    const url = shelter.imageUrl || ''
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
    return () => {
      cancelled = true
    }
  }, [open, shelter?.slug, shelter?.imageUrl, resetState])

  useEffect(() => {
    if (!open || !shelter) return
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
  }, [open, shelter?.slug, format, photoB64, blurb, generateImage])

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
    if (!shelter || !exportRef.current) return
    setIsGenerating(true)
    setError(null)
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const dataUrl = await generateImage(exportRef.current)
      if (!dataUrl) throw new Error('Sin imagen generada.')
      const fileSlug = (shelter.slug || shelter.name || 'refugio')
        .replace(/[^\w-]/g, '-')
        .slice(0, 48)
      await shareOrDownload(dataUrl, format, fileSlug)
    } catch (e) {
      setError(e?.message || 'Error al compartir o descargar.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareFullUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setLinkCopied(false)
    }
  }

  const shareLinkNative = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shelter?.name ? `Sumate a ${shelter.name}` : 'Refugio',
          text: shelter?.name
            ? `Conocé ${shelter.name} en Perritos y refugios.`
            : 'Conocé este refugio en Perritos y refugios.',
          url: shareFullUrl,
        })
      } catch {
        /* user cancel */
      }
    } else {
      await copyLink()
    }
  }

  if (!open || !shelter) return null

  const name = shelter.name || 'Refugio'
  const busy = isGenerating

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-shelter-title"
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
        <ShelterShareCard
          ref={exportRef}
          shelterName={name}
          photoSrc={photoB64}
          blurb={blurb}
          locationLabel={shelter.locationLabel || null}
          format={format}
          forExport
          shelterUrlLabel={shelterUrlLabel}
          photoObjectPosition={shelter.imagePosition || '50% 50%'}
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
            id="share-shelter-title"
            style={{ margin: 0, fontSize: 17, fontWeight: 900, color: T.txt, lineHeight: 1.25 }}
          >
            Compartir {name}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: T.muted,
              marginBottom: 8,
            }}
          >
            <Link2 size={16} aria-hidden />
            Link del refugio
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            <div
              title={shareFullUrl}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 12px',
                borderRadius: RS,
                border: `1.5px solid ${T.borderLt}`,
                background: T.bg,
                fontSize: 12,
                fontWeight: 600,
                color: T.txt,
                lineHeight: 1.35,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {shareFullUrl}
            </div>
            <button
              type="button"
              className="btn-press"
              onClick={() => void copyLink()}
              aria-label={linkCopied ? 'Copiado' : 'Copiar link al portapapeles'}
              title={linkCopied ? 'Copiado' : 'Copiar'}
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: RS,
                border: `1.5px solid ${linkCopied ? T.ok : T.borderLt}`,
                background: linkCopied ? T.okLt : T.bg,
                color: linkCopied ? T.ok : T.txt,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {linkCopied ? <Check size={20} strokeWidth={2.5} aria-hidden /> : <Copy size={20} aria-hidden />}
            </button>
            <button
              type="button"
              className="btn-press"
              onClick={() => void shareLinkNative()}
              aria-label="Compartir link"
              title="Compartir"
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: RS,
                border: `1.5px solid ${T.borderLt}`,
                background: T.borderLt,
                color: T.txt,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={20} aria-hidden />
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, marginBottom: 8 }}>Imagen para redes — formato</div>
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
            La imagen incluye el enlace público del refugio ({shareFullUrl.replace(/^https?:\/\//, '')}).
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
    </div>,
    document.body
  )
}

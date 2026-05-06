import { useState, useRef } from 'react'
import { Move } from 'lucide-react'

/**
 * Ajuste de object-position para recortes tipo cover (mismo patrón que panel refugio).
 * @param {string} aspectRatio - ej. '16/9' (banner refugio) o '4/3' (historia pública)
 */
export default function PhotoPositionPicker({ url, position, onChange, T, aspectRatio = '16/9' }) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const [active, setActive] = useState(false)

  const posFromEvent = (e) => {
    if (!containerRef.current) return position
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)))
    return `${x}% ${y}%`
  }
  const onStart = (e) => {
    dragging.current = true
    setActive(true)
    onChange(posFromEvent(e))
  }
  const onMove = (e) => {
    if (!dragging.current) return
    if (e.cancelable) e.preventDefault()
    onChange(posFromEvent(e))
  }
  const onEnd = () => {
    dragging.current = false
    setActive(false)
  }

  const parts = (position || '50% 50%').split(' ')
  const px = parseFloat(parts[0]) || 50
  const py = parseFloat(parts[1]) || 50

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Move size={12} /> Arrastrá el ● para ajustar el recorte
      </div>
      <div
        ref={containerRef}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        style={{
          width: '100%',
          aspectRatio,
          borderRadius: 12,
          overflow: 'hidden',
          border: `2px solid ${active ? T.accent : T.borderLt}`,
          cursor: 'crosshair',
          position: 'relative',
          userSelect: 'none',
          background: T.bg,
          transition: 'border-color 0.15s',
          touchAction: 'pan-y',
        }}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, pointerEvents: 'none' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
        <div
          onMouseDown={onStart}
          onTouchStart={onStart}
          style={{
            position: 'absolute',
            left: `${px}%`,
            top: `${py}%`,
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            cursor: 'grab',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: T.accent,
              border: '3px solid #fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: active ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.15s ease-out',
              pointerEvents: 'none',
            }}
          >
            <Move size={14} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  )
}

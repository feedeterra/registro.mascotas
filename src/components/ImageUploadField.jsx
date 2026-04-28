import { useState, useRef } from 'react'
import { Camera, Loader } from 'lucide-react'

export default function ImageUploadField({ T, label, hint, currentUrl, onUpload, onRemove, onError }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { await onUpload(file) }
    catch (err) { onError?.(err?.message || 'Error al subir imagen') }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{hint}</div>}

      {currentUrl ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', maxHeight: 160 }}>
          <img src={currentUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn-press"
              onClick={() => ref.current?.click()}
              style={{ padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Cambiar
            </button>
            <button
              type="button"
              className="btn-press"
              onClick={onRemove}
              style={{ padding: '6px 10px', borderRadius: 16, background: 'rgba(192,57,43,0.85)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '18px 16px', borderRadius: 14,
            border: `2px dashed ${T.borderLt}`, background: T.accentLt,
            color: T.accent, cursor: uploading ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {uploading ? <><Loader size={14} className="spin"/> Subiendo…</> : <><Camera size={14}/> Subir imagen</>}
        </button>
      )}

      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useT, RS } from '../../theme'
import { useLocationSearch } from '../../hooks/useLocationSearch'
import { Loader2, X } from 'lucide-react'

const inputStyle = (T, { pr }) => ({
  width: '100%',
  padding: `10px ${pr}px 10px 12px`,
  borderRadius: RS,
  border: `1.5px solid ${T.borderLt}`,
  fontSize: 14,
  background: T.bg,
  color: T.txt,
  boxSizing: 'border-box',
})

/**
 * @param {{ value: { label: string, lat: number, lng: number } | null; onChange: (loc: { label: string, lat: number, lng: number } | null) => void; placeholder?: string }} props
 */
export default function LocationInput({
  value,
  onChange,
  placeholder = 'Buscá tu ciudad o localidad...',
}) {
  const T = useT()
  const { query, setQuery, suggestions, isSearching, reset } = useLocationSearch()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showPanel = open && !value && query.trim().length >= 3

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '10px 12px',
            borderRadius: RS,
            border: `1.5px solid ${T.borderLt}`,
            background: T.accentLt,
            color: T.txt,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.label}
          </span>
          <button
            type="button"
            className="btn-press"
            aria-label="Quitar ubicación"
            onClick={() => {
              onChange(null)
              reset()
              setOpen(false)
            }}
            style={{
              flexShrink: 0,
              padding: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: T.muted,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <input
              aria-expanded={showPanel}
              aria-controls="location-suggestions-listbox"
              aria-autocomplete="list"
              role="combobox"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              style={inputStyle(T, { pr: isSearching ? 40 : 14 })}
            />
            {isSearching && (
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  color: T.muted,
                }}
                aria-hidden
              >
                <span style={{ display: 'flex', animation: 'locSpin 0.85s linear infinite' }}>
                  <Loader2 size={18} />
                </span>
              </span>
            )}
          </div>
          {showPanel && (
            <div
              id="location-suggestions-listbox"
              role="listbox"
              aria-label="Sugerencias de ubicación"
              style={{
                position: 'absolute',
                zIndex: 50,
                left: 0,
                right: 0,
                marginTop: 6,
                maxHeight: 260,
                overflowY: 'auto',
                borderRadius: RS,
                border: `1.5px solid ${T.borderLt}`,
                background: T.card,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              {suggestions.length === 0 && !isSearching && (
                <div role="presentation" style={{ padding: '12px 14px', fontSize: 13, color: T.muted, fontWeight: 600 }}>
                  No se encontraron resultados
                </div>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={`${s.label}-${i}`}
                  type="button"
                  role="option"
                  className="btn-press"
                  onClick={() => {
                    onChange({ label: s.label, lat: s.lat, lng: s.lng })
                    reset()
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    border: 'none',
                    borderBottom: `1px solid ${T.borderLt}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.txt,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes locSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

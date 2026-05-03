import { useEffect, useState } from 'react'
import { phonePartsFromStored } from '../utils'

function formatLocalChunks(digits) {
  if (!digits) return ''
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

/**
 * WhatsApp móvil AR: prefijo fijo +54 9, código de área (2–4 dígitos) y número local (hasta 8).
 * Valor controlado: solo dígitos `549` + área + número (ej. 5491123456789), o ''.
 */
export default function PhoneFieldArgentina({
  value,
  onChange,
  T,
  RS,
  disabled,
  idArea,
  idNumber,
  hint,
  required: isRequired,
}) {
  const [area, setArea] = useState('')
  const [number, setNumber] = useState('')

  useEffect(() => {
    const p = phonePartsFromStored(value)
    setArea(p.area)
    setNumber(p.number)
  }, [value])

  const emit = (nextArea, nextNum) => {
    const a = nextArea.replace(/\D/g, '').slice(0, 4)
    const n = nextNum.replace(/\D/g, '').slice(0, 8)
    const body = a + n
    if (!body) onChange('')
    else onChange(`549${body}`)
  }

  const inputBase = {
    padding: '10px 12px',
    borderRadius: RS,
    border: `1px solid ${T.borderLt}`,
    fontSize: 15,
    fontWeight: 500,
    background: '#fcfcfc',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderRadius: RS,
            border: `1px solid ${T.borderLt}`,
            background: T.borderLt + '55',
            color: T.muted,
            fontSize: 14,
            fontWeight: 800,
            flexShrink: 0,
            minHeight: 42,
          }}
          aria-hidden
        >
          +54 9
        </div>
        <input
          id={idArea}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-area-code"
          placeholder="Cód. área"
          title="Código de área sin 0"
          required={isRequired}
          disabled={disabled}
          value={area}
          onChange={(e) => {
            const a = e.target.value.replace(/\D/g, '').slice(0, 4)
            setArea(a)
            emit(a, number)
          }}
          style={{ ...inputBase, flex: '0 1 100px', minWidth: 88, maxWidth: 120 }}
        />
        <input
          id={idNumber}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Tu número"
          title="Número sin 15"
          required={isRequired}
          disabled={disabled}
          value={formatLocalChunks(number)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
            setNumber(raw)
            emit(area, raw)
          }}
          style={{ ...inputBase, flex: '1 1 140px', minWidth: 120 }}
        />
      </div>
      {hint ? (
        <p style={{ fontSize: 11, color: T.muted, margin: 0, fontWeight: 600 }}>{hint}</p>
      ) : (
        <p style={{ fontSize: 11, color: T.muted, margin: 0, fontWeight: 600 }}>
          Sin 0 ni 15. Ejemplo: área <strong>11</strong> y número <strong>1234 5678</strong>.
        </p>
      )}
    </div>
  )
}

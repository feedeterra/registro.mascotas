import { useT } from '../../theme'
import { I } from './Icons'

export function PageLoader({ message = 'Cargando...' }) {
  const T = useT()
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px', minHeight: '50vh', textAlign: 'center'
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '22%', background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)', marginBottom: 20, border: `1.5px solid ${T.borderLt}`,
        animation: 'pulse 2s infinite ease-in-out'
      }}>
        <div style={{ color: T.accent }}>{I.Paw(36)}</div>
      </div>
      <p style={{ fontSize: 18, fontWeight: 900, color: T.txt, letterSpacing: '-0.5px' }}>{message}</p>
      <p style={{ fontSize: 14, color: T.muted, marginTop: 4, fontWeight: 500 }}>Estamos preparando todo para vos</p>
    </div>
  )
}

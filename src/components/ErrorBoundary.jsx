import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { theme, R, RS, FONT } from '../theme'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Intentionally left blank (avoid console noise; can be wired to Sentry later).
    void error
    void info
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const T = theme

    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        fontFamily: FONT,
      }}>
        <div style={{
          maxWidth: 420, width: '100%',
          background: '#fff',
          border: `1px solid ${T.borderLt}`,
          borderRadius: R,
          boxShadow: T.shadowLg,
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: 8, color: theme.urgent }}><AlertTriangle size={44} strokeWidth={1.5} /></div>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.txt, marginBottom: 6 }}>
            Algo salió mal
          </div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
            Intentá recargar. Si el problema sigue, volvé al inicio.
          </div>
          {this.state.error && (
            <div style={{ fontSize: 11, color: T.danger, background: '#fff3f3', borderRadius: 6, padding: '8px 10px', marginBottom: 14, textAlign: 'left', wordBreak: 'break-all' }}>
              {this.state.error.message}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-press"
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: RS,
                border: 'none',
                background: T.accent,
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Recargar
            </button>
            <button
              className="btn-press"
              onClick={() => { window.location.href = '/' }}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: RS,
                border: `1.5px solid ${T.border}`,
                background: 'transparent',
                color: T.txt,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Inicio
            </button>
          </div>
        </div>
      </div>
    )
  }
}


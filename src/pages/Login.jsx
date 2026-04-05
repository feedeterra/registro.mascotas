import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui'

export default function Login() {
  const T = useT()
  const navigate = useNavigate()
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, isLogged } = useAuthContext()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  if (isLogged) {
    navigate('/', { replace: true })
    return null
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle()
      // Supabase redirige a Google, no hace falta navigate
    } catch {
      setError('No pudimos conectar con Google. Intentá de nuevo.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Ingresá tu nombre'); setLoading(false); return }
        await signUpWithEmail(email, password, name.trim())
        // Si email confirmation está desactivado, ya queda logueado
        // Si está activado, mostramos mensaje
        setSuccess('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.')
      } else {
        await loginWithEmail(email, password)
        navigate('/', { replace: true })
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.')
      else if (msg.includes('Email not confirmed')) setError('Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.')
      else if (msg.includes('already registered')) setError('Ese email ya tiene cuenta. Iniciá sesión.')
      else setError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Ingresá tu email primero'); return }
    setError('')
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/perfil`,
    })
    setSuccess('Te enviamos un email para restablecer tu contraseña.')
  }

  return (
    <div className="anim" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 380, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🐾</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt }}>
          {mode === 'login' ? 'Bienvenido de vuelta' : 'Creá tu cuenta'}
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>
          {mode === 'login' ? 'Ingresá para guardar favoritos y ayudar' : 'Gratis, en segundos'}
        </p>
      </div>

      <Card style={{ padding: 24 }}>
        {/* Google — opción principal */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="btn-press"
          style={{
            width: '100%', padding: '13px 16px',
            background: '#fff', border: `1.5px solid ${T.border}`,
            borderRadius: RS, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 15, fontWeight: 700, color: T.txt,
            boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
        </button>

        {/* Separador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '16px 0', color: T.muted, fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: T.borderLt }} />
          <span>o con email</span>
          <div style={{ flex: 1, height: 1, background: T.borderLt }} />
        </div>

        {/* Toggle email form */}
        {!showEmail ? (
          <button
            onClick={() => setShowEmail(true)}
            style={{
              width: '100%', padding: '11px 16px',
              background: 'transparent', border: `1.5px solid ${T.borderLt}`,
              borderRadius: RS, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: T.muted,
            }}
          >
            Usar email y contraseña
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 6 }}>
              <input
                type="password"
                placeholder="Contraseña (mín. 6 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {mode === 'login' && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none', border: 'none', color: T.accent,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  marginBottom: 14, padding: 0,
                }}
              >
                Olvidé mi contraseña
              </button>
            )}

            {error && (
              <div style={{
                background: T.dangerLt || '#fff0f0', color: T.danger || '#c00',
                padding: '10px 14px', borderRadius: RS,
                fontSize: 13, fontWeight: 600, marginBottom: 12,
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                background: T.okLt, color: T.ok,
                padding: '10px 14px', borderRadius: RS,
                fontSize: 13, fontWeight: 600, marginBottom: 12,
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-press"
              style={{
                width: '100%', padding: '13px 0',
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk || T.accent})`,
                color: '#fff', border: 'none', borderRadius: RS,
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </Card>

      {/* Cambiar modo */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: T.muted }}>
        {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); setShowEmail(false) }}
          style={{
            background: 'none', border: 'none', color: T.accent,
            fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}
        >
          {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
        </button>
      </div>
    </div>
  )
}

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

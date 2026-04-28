import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { Dog, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const T = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, isLogged } = useAuthContext()
  const toast = useToast()
  const returnTo = location.state?.returnTo || '/'

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isLogged) navigate(returnTo, { replace: true })
  }, [isLogged, navigate, returnTo])

  if (isLogged) return null

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle()
      // Supabase redirige a Google, no hace falta navigate
    } catch {
      toast?.notifyError?.(new Error('No pudimos conectar con Google. Intentá de nuevo.'))
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
        if (!phone.trim()) { setError('Ingresá tu teléfono'); setLoading(false); return }
        await signUpWithEmail(email, password, name.trim(), phone.trim())
        // Si email confirmation está desactivado, ya queda logueado
        // Si está activado, mostramos mensaje
        setSuccess('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.')
      } else {
        await loginWithEmail(email, password)
        navigate(returnTo, { replace: true })
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.')
      else if (msg.includes('Email not confirmed')) setError('Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.')
      else if (msg.includes('already registered')) setError('Ese email ya tiene cuenta. Iniciá sesión.')
      else setError('Ocurrió un error. Intentá de nuevo.')
      toast?.notifyError?.(err, { log: false })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Ingresá tu email primero'); return }
    setError('')
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/perfil`,
      })
      setSuccess('Te enviamos un email para restablecer tu contraseña.')
    } catch (err) {
      toast?.notifyError?.(err)
      setError('No pudimos enviar el email. Intentá más tarde.')
    }
  }

  return (
    <div className="anim" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 380, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ marginBottom: 12, color: T.accent, display: 'flex', justifyContent: 'center' }}><Dog size={48} strokeWidth={1} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt }}>
          {mode === 'login' ? 'Bienvenido de vuelta' : 'Creá tu cuenta'}
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>
          {mode === 'login' ? 'Ingresá para guardar favoritos y ayudar' : 'Gratis, en segundos'}
        </p>
      </div>

      <Card style={{ padding: 24 }}>
        {!showEmail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="btn-press"
              style={{
                width: '100%', padding: '11px 16px',
                background: '#fff', border: `1.5px solid ${T.borderLt}`,
                borderRadius: RS, cursor: googleLoading ? 'default' : 'pointer',
                fontSize: 15, fontWeight: 700, color: '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
              {googleLoading ? 'Conectando...' : 'Continuar con Google'}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ height: 1, background: T.borderLt, flex: 1 }} />
              <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>O BIEN</span>
              <div style={{ height: 1, background: T.borderLt, flex: 1 }} />
            </div>

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
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="btn-press"
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${T.borderLt}`,
                    background: T.bg,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.muted,
                    fontSize: 16,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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

      <button
        onClick={() => navigate('/')}
        className="btn-press"
        style={{
          width: '100%', marginTop: 24, padding: '14px',
          background: T.accentLt, color: T.accent, border: 'none',
          borderRadius: RS, fontSize: 15, fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 12px rgba(192,84,45,0.08)'
        }}
      >
        <Dog size={18} /> Quiero ver los perritos
      </button>

      {/* Cambiar modo */}
      <div style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: T.muted }}>
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

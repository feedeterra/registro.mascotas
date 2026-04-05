import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Btn, Card } from '../components/ui'
import { I } from '../components/ui/Icons'

export default function Login() {
  const T = useT()
  const navigate = useNavigate()
  const { loginWithEmail, signUpWithEmail, isLogged } = useAuthContext()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (isLogged) {
    navigate('/perfil', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Ingresa tu nombre'); setLoading(false); return }
        await signUpWithEmail(email, password, name.trim())
      } else {
        await loginWithEmail(email, password)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos. Intenta de nuevo.'
          : err.message || 'Error al iniciar sesion'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Ingresa tu email primero'); return }
    setError('')
    try {
      await supabase.auth.resetPasswordForEmail(email)
      setSuccess('Te enviamos un email para restablecer tu contraseña')
    } catch {
      setError('No pudimos enviar el email. Intenta de nuevo.')
    }
  }

  return (
    <div className="anim" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🐶</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>
          {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>
          {mode === 'login'
            ? 'Tu cuenta te acerca a cambiar una vida'
            : 'Crea tu cuenta y empeza a ayudar'
          }
        </p>
      </div>

      {/* Value proposition for signup */}
      {mode === 'signup' && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          margin: '0 0 20px', padding: 16, background: T.accentLt, borderRadius: RS,
        }}>
          {[
            '💜 Guarda tus perritos favoritos',
            '🏠 Ofrece transito desde tu perfil',
            '🤝 Anotate como voluntario/a',
            '📊 Seguimiento de tu impacto',
          ].map((b, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 600, color: T.txt }}>{b}</div>
          ))}
        </div>
      )}

      <Card style={{ padding: 24 }}>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 4, display: 'block' }}>
                Nombre
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 4, display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: mode === 'login' ? 8 : 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 4, display: 'block' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {mode === 'login' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none', border: 'none', color: T.accent,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                marginBottom: 16, padding: 0,
              }}
            >
              Olvide mi contraseña
            </button>
          )}

          {error && (
            <div style={{
              background: T.dangerLt, color: T.danger,
              padding: '10px 14px', borderRadius: RS,
              fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: T.okLt, color: T.ok,
              padding: '10px 14px', borderRadius: RS,
              fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              {success}
            </div>
          )}

          <Btn
            onClick={() => {}}
            v="primary"
            sz="lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading
              ? 'Cargando...'
              : mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'
            }
          </Btn>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <span style={{ color: T.muted }}>
            {mode === 'login' ? 'No tenes cuenta? ' : 'Ya tenes cuenta? '}
          </span>
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{
              background: 'none', border: 'none', color: T.accent,
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}
          >
            {mode === 'login' ? 'Registrate' : 'Inicia sesion'}
          </button>
        </div>
      </Card>

      {/* Trust signals */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: T.muted }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          {I.Shield()} <span style={{ fontWeight: 600 }}>Tus datos estan protegidos</span>
        </div>
        <span>Solo los usamos para conectarte con los perritos</span>
      </div>
    </div>
  )
}

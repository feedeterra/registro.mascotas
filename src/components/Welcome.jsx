import { useT } from '../theme'
import { useShelterConfig } from '../hooks/useShelterConfig'
import { Card } from './ui'
import { Heart, Dog, Home, Users, BadgeCheck } from 'lucide-react'

const LS_KEY = 'registro-mascotas-welcomed'

export default function Welcome({ onContinue, petCount }) {
  const T = useT()
  const ctx = useShelterConfig()
  const config = ctx?.config

  const handleContinue = (path = '/') => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(true)) } catch {}
    onContinue(path)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }} className="anim">

        {/* Logo heart */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: `0 8px 32px ${T.accent}30`,
        }}>
          <span style={{ color: '#fff', fontSize: 36, display: 'flex' }}><Heart size={36} fill="currentColor" stroke="none" /></span>
        </div>

        {/* Brand */}
        <h1 style={{
          fontSize: 15, fontWeight: 800, color: T.accent, letterSpacing: 1,
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          Perritos <span style={{ fontWeight: 500, color: T.muted }}>y Refugios</span>
        </h1>

        {/* Big headline */}
        <h2 style={{
          fontSize: 32, fontWeight: 900, color: T.txt, lineHeight: 1.15,
          marginBottom: 12, letterSpacing: -0.5,
        }}>
          Cada perro merece un hogar lleno de amor.{' '}
          <span style={{ color: T.accent, display: 'inline-flex', verticalAlign: 'middle' }}><Heart size={28} fill="currentColor" stroke="none" /></span>
        </h2>

        <p style={{
          fontSize: 15, color: T.muted, lineHeight: 1.6,
          marginBottom: 28, padding: '0 8px',
        }}>
          Rescatamos, cuidamos y encontramos familias para perritos que lo necesitan.
        </p>

        {/* Primary CTA */}
        <button
          className="btn-press"
          onClick={() => handleContinue('/')}
          style={{
            width: '100%', padding: '16px 24px',
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', border: 'none', borderRadius: 16,
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: `0 6px 24px ${T.accent}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Dog size={20} /> Conocé a nuestros perritos
      </button>

        {/* Secondary CTA */}
        <button
          className="btn-press"
          onClick={() => handleContinue('/sumarme')}
          style={{
            width: '100%', padding: '14px 24px', marginTop: 12,
            background: 'transparent', color: T.txt,
            border: `2px solid ${T.border}`, borderRadius: 16,
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        Cómo podés ayudar <Heart size={16} fill="currentColor" stroke="none" style={{ color: T.accent }} />
      </button>

        {/* Verified badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 24, fontSize: 12, color: T.sage, fontWeight: 700,
          background: T.sageLt, borderRadius: 20, padding: '6px 14px',
        }}>
          <BadgeCheck size={16} /> Refugio verificado y sin fines de lucro
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
          Transparencia · Compromiso · Bienestar animal
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          marginTop: 24, padding: '16px 0',
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          {[
            { icon: <Dog size={18} />, value: petCount ?? '...', label: 'Rescatados' },
            { icon: <Home size={18} />, value: '987', label: 'Adopciones' },
            { icon: <Users size={18} />, value: '320', label: 'Voluntarios' },
            { icon: <Heart size={18} />, value: '2.150+', label: 'Apoyando' },
          ].map((s, i) => (
            <div key={i} className={`anim d${i+1}`} style={{ textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: T.accentLt, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px', fontSize: 16,
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.txt }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Login link */}
        <button
          onClick={() => handleContinue('/login')}
          style={{
            marginTop: 16, background: 'none', border: 'none',
            color: T.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Ya tengo una cuenta →
        </button>
      </div>
    </div>
  )
}

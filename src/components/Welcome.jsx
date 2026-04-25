import { useT, RS } from '../theme'
import { useShelterConfig } from '../hooks/useShelterConfig'
import { Card } from './ui'

const LS_KEY = 'registro-mascotas-welcomed'
const FALLBACK_BG = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80'

export default function Welcome({ onContinue, petCount }) {
  const T = useT()
  const ctx = useShelterConfig()
  const config = ctx?.config
  const bgImage = config?.hero_image_url || FALLBACK_BG

  const handleContinue = (path = '/') => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(true)) } catch {}
    onContinue(path)
  }

  const actions = [
    { emoji: '🐾', title: 'Adopta', desc: 'Dale un hogar a un perrito rescatado', path: '/adoptar' },
    { emoji: '💛', title: 'Apadrina', desc: 'Compromete a cuidar su alimento', path: '/adoptar?apadrinar=1' },
    { emoji: '🎁', title: 'Dona', desc: 'Alimento, materiales o dinero', path: '/sumarme?step=donar' },
    { emoji: '🤝', title: 'Se voluntario/a', desc: 'Sumate al equipo del refugio', path: '/voluntario' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(to bottom, rgba(27,67,50,0.7), rgba(27,67,50,0.88)), url('${bgImage}')`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <Card style={{ padding: 28, maxWidth: 420, textAlign: 'center', width: '100%' }} className="anim">
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: T.txt }}>Refugio CASA</h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 4 }}>
          Capilla del Señor, Buenos Aires
        </p>

        {/* Pet count - urgencia */}
        <div style={{
          background: `linear-gradient(135deg, ${T.accentLt}, ${T.purpleLt})`,
          borderRadius: RS, padding: '12px 16px', margin: '16px 0',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.accent, lineHeight: 1 }}>
            {petCount != null ? petCount : '...'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginTop: 4 }}>
            perritos suenan con encontrar una familia
          </div>
        </div>

        {/* Acciones principales */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          margin: '16px 0',
        }}>
          {actions.map((a, i) => (
            <div
              key={i}
              className={`anim d${i + 1} btn-press`}
              onClick={() => handleContinue(a.path)}
              style={{
                background: T.bg, borderRadius: RS, padding: '14px 10px',
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.3 }}>{a.desc}</div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16,
          fontSize: 12, color: T.muted, fontWeight: 600,
        }}>
          <span>+{petCount || 60} rescatados</span>
          <span>·</span>
          <span>Capilla del Senor</span>
        </div>

        <button
          className="btn-press"
          onClick={handleContinue}
          style={{
            width: '100%', padding: 16,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', border: 'none', borderRadius: RS,
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: `0 4px 14px ${T.accent}50`,
          }}
        >
          Conocelos y enamorate →
        </button>
      </Card>
    </div>
  )
}

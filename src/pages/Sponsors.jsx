import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { Card, Btn } from '../components/ui'
import { DEFAULT_WHATSAPP } from '../lib/constants'

const METRICS = [
  { emoji: '👥', value: '500+', label: 'visitas por mes' },
  { emoji: '🐾', value: '200+', label: 'perros registrados' },
  { emoji: '🎉', value: '30+', label: 'adopciones por año' },
  { emoji: '📍', value: 'Capilla del Señor', label: 'y alrededores' },
]

const PACKAGES = [
  {
    tier: 'Gold',
    emoji: '🥇',
    color: '#f59e0b',
    colorLt: '#fef3c7',
    desc: 'Máxima visibilidad en toda la app',
    benefits: [
      'Logo destacado en el inicio de la app',
      'Banner en sección Adoptar',
      'Mención en historias de éxito',
      'Publicación mensual en redes del refugio',
      'Certificado digital de impacto',
    ],
  },
  {
    tier: 'Silver',
    emoji: '🥈',
    color: '#6b7280',
    colorLt: '#f3f4f6',
    desc: 'Presencia constante en secciones clave',
    benefits: [
      'Logo en sección de refugio',
      'Mención en eventos del refugio',
      'Publicación trimestral en redes',
      'Certificado digital de impacto',
    ],
  },
  {
    tier: 'Estándar',
    emoji: '🌟',
    color: '#8b5cf6',
    colorLt: '#ede9fe',
    desc: 'Entrada ideal para sumarte como marca',
    benefits: [
      'Logo en página de sponsors',
      'Agradecimiento en redes',
      'Certificado digital de impacto',
    ],
  },
]

export default function Sponsors() {
  const T = useT()
  const navigate = useNavigate()

  const openWhatsApp = (pkg) => {
    const msg = encodeURIComponent(
      `Hola! Me interesa el paquete ${pkg} de sponsor en la app de Refugio CASA 🐾\n¿Podemos hablar?`
    )
    window.open(`https://wa.me/${DEFAULT_WHATSAPP}?text=${msg}`, '_blank')
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
        borderRadius: R, padding: '24px 20px', marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          Tu marca en Refugio CASA
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Conectá tu marca con personas que aman a los animales en Capilla del Señor y alrededores.
          Hacé una diferencia real mientras ganás visibilidad.
        </p>
      </div>

      {/* Métricas */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 10 }}>
          📊 Nuestra comunidad
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {METRICS.map((m, i) => (
            <Card key={i} style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>{m.value}</div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{m.label}</div>
            </Card>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' }}>
          * Datos estimados — actualizados con panel de admin próximamente
        </div>
      </div>

      {/* Paquetes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 10 }}>
          📦 Paquetes disponibles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PACKAGES.map((pkg, i) => (
            <Card key={i} className={`anim d${i + 1}`} style={{ padding: 16, borderTop: `3px solid ${pkg.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{pkg.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.txt }}>Paquete {pkg.tier}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{pkg.desc}</div>
                </div>
              </div>
              <ul style={{ margin: '0 0 14px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pkg.benefits.map((b, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: T.txt }}>
                    <span style={{ color: pkg.color, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Btn
                sz="md"
                onClick={() => openWhatsApp(pkg.tier)}
                style={{ width: '100%', justifyContent: 'center', background: pkg.color, border: 'none', color: '#fff' }}
              >
                📲 Consultar precio
              </Btn>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <Card style={{
        padding: 20, textAlign: 'center',
        background: `linear-gradient(135deg, ${T.accentLt}, ${T.purpleLt})`,
        border: 'none',
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>💜</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 6 }}>
          ¿Tenés una idea diferente?
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Estamos abiertos a propuestas de colaboración y canjes. Escribinos.
        </div>
        <Btn
          sz="lg"
          onClick={() => openWhatsApp('personalizado')}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          💬 Hablar con nosotros
        </Btn>
      </Card>
    </div>
  )
}

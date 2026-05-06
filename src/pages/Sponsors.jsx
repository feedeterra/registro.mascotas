import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { Card, Btn } from '../components/ui'
import { I } from '../components/ui/Icons'
import { Dog, MapPin, Heart, Users } from 'lucide-react'
import { DEFAULT_WHATSAPP_ADMIN } from '../lib/constants'
import { getWhatsAppLink } from '../utils'
import { useShelterConfigContext } from '../context/ShelterConfigContext'

const STATS = [
  { icon: <Users size={24} />, value: '500+', label: 'visitas/mes' },
  { icon: <Dog size={24} />, value: '200+', label: 'perros registrados' },
  { icon: <Heart size={24} />, value: '30+', label: 'adopciones/año' },
  { icon: <MapPin size={24} />, value: 'Varias Zonas', label: 'influencia' },
]

const PACKAGES = [
  {
    tier: 'Gold',
    color: '#f59e0b',
    colorLt: '#fef3c7',
    desc: 'Presente donde las familias eligen.',
    benefits: [
      'Logo destacado en el inicio',
      'Banner en sección Adoptar',
      'Mención en historias de éxito',
      'Publicación mensual en redes',
      'Certificado digital de impacto',
    ],
  },
  {
    tier: 'Silver',
    color: '#6b7280',
    colorLt: '#f3f4f6',
    desc: 'Presencia constante en secciones clave',
    benefits: [
      'Logo en sección principal',
      'Mención en eventos',
      'Publicación trimestral en redes',
      'Certificado digital de impacto',
    ],
  },
  {
    tier: 'Estandar',
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
  const shelterCtx = useShelterConfigContext()
  const config = shelterCtx?.config
  const isGlobal = !config
  
  const WHATSAPP = config?.whatsapp_admin || config?.whatsapp_number || DEFAULT_WHATSAPP_ADMIN
  const entityName = config?.name || 'Registro de Mascotas'

  const openWhatsApp = (pkg) => {
    const url = getWhatsAppLink(
      WHATSAPP,
      `Hola! Me interesa el paquete ${pkg} de sponsor para ${entityName}.\n¿Podemos hablar?`
    )
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
        borderRadius: R, padding: '24px 20px', marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#fff' }}>{I.Handshake(36)}</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          Tu marca en {entityName}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          Conectá tu marca con una red entera de familias. Crecé localmente, 
          mientras causas un impacto positivo y real en el bienestar animal.
        </p>
      </div>

      {/* Métricas */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 10 }}>
          Nuestra comunidad
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STATS.map((s, i) => (
            <Card key={i} style={{ padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: T.accent }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{s.label}</div>
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
          Paquetes disponibles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PACKAGES.map((pkg, i) => (
            <Card key={i} className={`anim d${i + 1}`} style={{ padding: 16, borderTop: `3px solid ${pkg.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
                Me interesa
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: T.accent }}>{I.Heart()}</div>
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
          Hablar con nosotros
        </Btn>
      </Card>
    </div>
  )
}

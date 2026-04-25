import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card } from '../components/ui'
import { getWhatsAppLink } from '../utils'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

const TRANSFER_MSG = 'Hola, quiero hacer una donacion por transferencia al refugio. Me podrian pasar el alias?'

export default function Sumarme() {
  const T = useT()
  const navigate = useNavigate()
  const { config } = useShelterConfig()

  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💜</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt, marginBottom: 6 }}>
          ¿Como queres ayudar?
        </h1>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, padding: '0 8px' }}>
          Hay tres formas de sumarte al refugio. Eligi la que mas te guste — desde la app
          podes hacer todo.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ═══ Adoptar ═══ */}
        <PathCard
          T={T}
          emoji="🐾"
          title="Quiero adoptar"
          color={T.accent}
          bgColor={T.accentLt}
          description="Encontra tu compañero entre los perritos del refugio. Vas a poder ver su historia, conocerlo a traves de fotos y notas, y si hay match coordinamos la adopcion por WhatsApp. Todo gratis y con acompañamiento."
          bullets={[
            'Buscar perritos disponibles',
            'Guardar tus favoritos',
            'Contactar al refugio para conocerlo',
          ]}
          ctaLabel="Ver perritos en adopcion →"
          onClick={() => navigate('/adoptar')}
        />

        {/* ═══ Voluntario ═══ */}
        <PathCard
          T={T}
          emoji="🤝"
          title="Ser voluntario/a"
          color={T.purple}
          bgColor={T.purpleLt}
          description="Sumate al equipo del refugio. Trabajamos en juntadas, hacemos visitas diarias, damos transito temporal y traslados al veterinario. Cada mano cuenta. Te pedimos pocos datos y elegis como queres ayudar."
          bullets={[
            'Trabajo en juntadas y eventos',
            'Visitas diarias al refugio',
            'Transito temporal o traslados',
            'Acceso al grupo de WhatsApp del equipo',
          ]}
          ctaLabel="Anotarme como voluntario/a →"
          onClick={() => navigate('/voluntario')}
        />

        {/* ═══ Donar ═══ */}
        <Card style={{
          padding: 18, border: `2px solid ${T.ok}30`,
          background: `linear-gradient(135deg, ${T.okLt}, #fff)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: T.ok, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>💛</div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: T.txt, margin: 0 }}>
                Donar dinero
              </h2>
              <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
                Sin registro, rapido y directo
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>
            Tu donacion va directo a comida, veterinario y refugio. Tenemos dos formas:
            <strong style={{ color: T.txt }}> Cafecito</strong> (con tarjeta, super rapido)
            o <strong style={{ color: T.txt }}>transferencia bancaria</strong> (te pasamos el alias por WhatsApp).
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={DONATION_LINK}
              target="_blank" rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '14px 12px', borderRadius: RS,
                background: `linear-gradient(135deg, #f5e6c8, #e8d5a8)`,
                color: '#8a6d3b', fontWeight: 800, fontSize: 14,
                textDecoration: 'none', border: '1px solid #e8d5a8',
                textAlign: 'center', lineHeight: 1.2,
              }}
            >
              💛 Donar con<br />Cafecito
            </a>
            <a
              href={getWhatsAppLink(WHATSAPP, TRANSFER_MSG)}
              target="_blank" rel="noopener noreferrer"
              className="btn-press"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '14px 12px', borderRadius: RS,
                background: '#25D366', color: '#fff',
                fontWeight: 800, fontSize: 14,
                textDecoration: 'none', border: 'none',
                textAlign: 'center', lineHeight: 1.2,
              }}
            >
              💬 Donar por<br />transferencia
            </a>
          </div>

          <p style={{
            fontSize: 11, color: T.muted, textAlign: 'center',
            marginTop: 10, fontStyle: 'italic',
          }}>
            No necesitas crear cuenta. Cada donacion suma a la comunidad.
          </p>
        </Card>

      </div>

      {/* Footer info */}
      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: R,
        background: T.bg, border: `1px solid ${T.borderLt}`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: 0 }}>
          ¿No estas seguro? Podes empezar viendo los perritos en adopcion y decidir despues.
          Tambien podes <strong style={{ color: T.txt }}>combinar</strong>: ser voluntario y donar, por ejemplo.
        </p>
      </div>
    </div>
  )
}

function PathCard({ T, emoji, title, color, bgColor, description, bullets, ctaLabel, onClick }) {
  return (
    <Card
      interactive
      onClick={onClick}
      style={{
        padding: 18, cursor: 'pointer',
        border: `2px solid ${color}30`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: bgColor, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>{emoji}</div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: T.txt, margin: 0 }}>{title}</h2>
      </div>

      <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 10 }}>
        {description}
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: '0 0 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {bullets.map((b, i) => (
          <li key={i} style={{
            fontSize: 12, color: T.txt, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color, fontWeight: 800 }}>✓</span> {b}
          </li>
        ))}
      </ul>

      <div style={{
        padding: '10px 14px', borderRadius: RS,
        background: color, color: '#fff',
        fontWeight: 700, fontSize: 13, textAlign: 'center',
      }}>
        {ctaLabel}
      </div>
    </Card>
  )
}

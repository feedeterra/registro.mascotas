import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card } from '../components/ui'
import { getWhatsAppLink } from '../utils'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

const TRANSFER_MSG = 'Hola, quiero hacer una donacion por transferencia al refugio. Tengo una consulta.'

const STEP_MAP = { adoptar: 'adopt', voluntariar: 'volunteer', apadrinar: 'sponsor-pet', donar: 'donate' }

export default function Sumarme() {
  const T = useT()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ctx = useShelterConfig()
  const config = ctx?.config

  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK
  const TRANSFER_ACCOUNTS = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []

  const stepParam = searchParams.get('step')
  const [selected, setSelected] = useState(() => STEP_MAP[stepParam] || null)

  useEffect(() => {
    if (stepParam) setSelected(STEP_MAP[stepParam] || null)
  }, [stepParam])

  if (selected) {
    return (
      <DetailView
        T={T}
        type={selected}
        onBack={() => setSelected(null)}
        navigate={navigate}
        WHATSAPP={WHATSAPP}
        DONATION_LINK={DONATION_LINK}
        TRANSFER_ACCOUNTS={TRANSFER_ACCOUNTS}
      />
    )
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💜</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt, marginBottom: 6 }}>
          ¿Como queres ayudar?
        </h1>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, padding: '0 8px' }}>
          Hay tres formas de sumarte al refugio. Eligi la que mas te guste.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OptionCard
          T={T} emoji="🐾" title="Quiero adoptar"
          subtitle="Encontrar un compañero peludo"
          color={T.accent} bgColor={T.accentLt}
          onClick={() => setSelected('adopt')}
        />
        <OptionCard
          T={T} emoji="🤝" title="Ser voluntario/a"
          subtitle="Ayudar con mi tiempo en el refugio"
          color={T.purple} bgColor={T.purpleLt}
          onClick={() => setSelected('volunteer')}
        />
        <OptionCard
          T={T} emoji="🌟" title="Apadrinar un perrito"
          subtitle="Cubrir sus gastos sin adoptarlo"
          color="#8a6d3b" bgColor="#fdf8ec"
          onClick={() => setSelected('sponsor-pet')}
        />
        <OptionCard
          T={T} emoji="💛" title="Donar dinero"
          subtitle="Ayudar desde casa, sin registro"
          color={T.ok} bgColor={T.okLt}
          onClick={() => setSelected('donate')}
        />
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px', borderRadius: R,
        background: T.bg, border: `1px solid ${T.borderLt}`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: 0 }}>
          Tambien podes <strong style={{ color: T.txt }}>combinar</strong>: ser voluntario y donar, por ejemplo.
        </p>
      </div>
    </div>
  )
}

// ─── Card de seleccion (paso 1) ──────────────────────────────────
function OptionCard({ T, emoji, title, subtitle, color, bgColor, onClick }) {
  return (
    <Card
      interactive
      onClick={onClick}
      style={{
        padding: 18, cursor: 'pointer',
        border: `2px solid ${color}30`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: bgColor, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, flexShrink: 0,
      }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.txt }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ color: color, fontSize: 22, fontWeight: 800 }}>→</div>
    </Card>
  )
}

// ─── Vista de detalle (paso 2) ───────────────────────────────────
function DetailView({ T, type, onBack, navigate, WHATSAPP, DONATION_LINK, TRANSFER_ACCOUNTS }) {
  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Boton volver */}
      <button
        className="btn-press"
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: T.muted, fontWeight: 600, fontSize: 14, marginBottom: 12, padding: 0,
        }}
      >
        ← Volver a las opciones
      </button>

      {type === 'adopt' && <AdoptDetail T={T} navigate={navigate} />}
      {type === 'volunteer' && <VolunteerDetail T={T} navigate={navigate} />}
      {type === 'sponsor-pet' && <SponsorPetDetail T={T} navigate={navigate} WHATSAPP={WHATSAPP} />}
      {type === 'donate' && <DonateDetail T={T} WHATSAPP={WHATSAPP} DONATION_LINK={DONATION_LINK} TRANSFER_ACCOUNTS={TRANSFER_ACCOUNTS} />}
    </div>
  )
}

function AdoptDetail({ T, navigate }) {
  return (
    <Card style={{ padding: 22, border: `2px solid ${T.accent}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: T.accentLt, color: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>🐾</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Quiero adoptar
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Encontrar tu compañero peludo
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Vas a poder ver todos los perritos del refugio que estan buscando una familia.
        Cada uno tiene su historia, fotos y notas sobre su personalidad. Podes guardar
        tus favoritos y cuando uno te llame, lo coordinamos por WhatsApp.
      </p>

      <BulletList T={T} color={T.accent} items={[
        'Ver perritos disponibles con foto y historia',
        'Filtrar por tamaño, urgencia o tiempo esperando',
        'Guardar tus favoritos',
        'Contactar al refugio para conocerlo en persona',
        'Acompañamiento durante todo el proceso',
      ]} />

      <button
        onClick={() => navigate('/adoptar')}
        className="btn-press"
        style={{
          width: '100%', marginTop: 8, padding: 14, borderRadius: RS,
          background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
          boxShadow: `0 6px 16px ${T.accent}40`,
        }}
      >
        Ver perritos en adopcion →
      </button>
    </Card>
  )
}

function VolunteerDetail({ T, navigate }) {
  return (
    <Card style={{ padding: 22, border: `2px solid ${T.purple}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: T.purpleLt, color: T.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>🤝</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Ser voluntario/a
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Sumarte al equipo del refugio
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Sumate al equipo. Trabajamos en juntadas, hacemos visitas diarias al refugio,
        damos transito temporal y traslados al veterinario. Te pedimos pocos datos y
        elegis como queres ayudar.
      </p>

      <BulletList T={T} color={T.purple} items={[
        'Trabajo en juntadas y eventos del refugio',
        'Visitas diarias para cuidar y pasear',
        'Transito temporal en tu casa',
        'Traslados al veterinario',
        'Acceso al grupo de WhatsApp del equipo',
      ]} />

      <button
        onClick={() => navigate('/voluntario')}
        className="btn-press"
        style={{
          width: '100%', marginTop: 8, padding: 14, borderRadius: RS,
          background: `linear-gradient(135deg, ${T.purple}, #5b21b6)`,
          color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
          boxShadow: `0 6px 16px ${T.purple}40`,
        }}
      >
        Anotarme como voluntario/a →
      </button>
    </Card>
  )
}

function SponsorPetDetail({ T, navigate, WHATSAPP }) {
  const sponsorMsg = 'Hola! Me gustaria apadrinar un perrito del refugio. Quiero saber como funciona.'
  return (
    <Card style={{ padding: 22, border: `2px solid #e8d48b` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#fdf8ec', color: '#8a6d3b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>🌟</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Apadrinar un perrito
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Ayudar sin necesidad de adoptarlo
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Apadrinar significa hacerte cargo de los gastos de un perrito en particular —
        su comida, vacunas o veterinario — mientras espera ser adoptado.
        No necesitas llevártelo a tu casa: el refugio lo cuida, vos lo sostenés.
      </p>

      <BulletList T={T} color="#8a6d3b" items={[
        'Elegis el perrito que más te llegue',
        'Acordás con el refugio el monto mensual',
        'El refugio te manda fotos y novedades de tu apadrinado',
        'Podés visitarlo cuando quieras',
        'Si en algún momento querés adoptarlo, tenés prioridad',
      ]} />

      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 4,
        background: '#fdf8ec', border: '1px solid #e8d48b',
        fontSize: 13, color: '#8a6d3b', lineHeight: 1.5,
      }}>
        En el listado vas a ver el botón <strong>🌟 Apadrinar</strong> en cada perrito
        — tocalo y te abrimos un WhatsApp directo con el nombre de ese perrito.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button
          onClick={() => navigate('/adoptar?apadrinar=1')}
          className="btn-press"
          style={{
            width: '100%', padding: 14, borderRadius: RS,
            background: 'linear-gradient(135deg, #f5e6c8, #e8d5a8)',
            color: '#8a6d3b', fontWeight: 800, fontSize: 15,
            border: '1px solid #e8d48b', cursor: 'pointer',
          }}
        >
          Ver perritos para apadrinar →
        </button>
        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(sponsorMsg)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 12, borderRadius: RS,
            background: '#25D366', color: '#fff',
            fontWeight: 700, fontSize: 14,
            textDecoration: 'none', border: 'none',
          }}
        >
          💬 Consultar por WhatsApp
        </a>
      </div>
    </Card>
  )
}

function DonateDetail({ T, WHATSAPP, DONATION_LINK, TRANSFER_ACCOUNTS }) {
  return (
    <Card style={{ padding: 22, border: `2px solid ${T.ok}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: T.okLt, color: T.ok,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>💛</div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Donar dinero
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Sin registro, rapido y directo
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Tu donacion va directo a comida, veterinario y refugio. Podes donar con
        <strong> tarjeta por Cafecito</strong> o por <strong>transferencia</strong>
        copiando el alias o CBU/CVU.
      </p>

      <BulletList T={T} color={T.ok} items={[
        'No necesitas crear una cuenta',
        'Cada donacion suma a la comunidad',
        'El refugio recibe el 100% de tu aporte',
      ]} />

      {/* Mensaje de impacto */}
      <div style={{
        background: T.okLt, borderRadius: RS,
        padding: '12px 14px', marginTop: 12, marginBottom: 4,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <p style={{ fontSize: 13, color: T.txt, lineHeight: 1.5, margin: 0 }}>
          Con <strong>$2.000</strong> cubrís el alimento de un perrito por una semana.
          Con <strong>$8.000</strong>, un mes completo.
        </p>
      </div>

      <a
        href={DONATION_LINK}
        target="_blank" rel="noopener noreferrer"
        className="btn-press"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: 14, borderRadius: RS, marginTop: 8,
          background: `linear-gradient(135deg, #f5e6c8, #e8d5a8)`,
          color: '#8a6d3b', fontWeight: 800, fontSize: 15,
          textDecoration: 'none', border: '1px solid #e8d5a8',
        }}
      >
        💛 Donar con Cafecito (tarjeta)
      </a>

      {TRANSFER_ACCOUNTS.length > 0 && (
        <div style={{
          marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.borderLt}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
            Transferencia bancaria
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
            Toca cualquier dato para copiarlo.
          </div>

          {TRANSFER_ACCOUNTS.map((acc, idx) => (
            <TransferAccount key={idx} T={T} acc={acc} />
          ))}

          <a
            href={getWhatsAppLink(WHATSAPP, TRANSFER_MSG)}
            target="_blank" rel="noopener noreferrer"
            className="btn-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 12, borderRadius: RS, marginTop: 8,
              background: '#25D366', color: '#fff',
              fontWeight: 700, fontSize: 14,
              textDecoration: 'none', border: 'none',
            }}
          >
            💬 Consultar por WhatsApp
          </a>
        </div>
      )}

      {TRANSFER_ACCOUNTS.length === 0 && (
        <a
          href={getWhatsAppLink(WHATSAPP, TRANSFER_MSG)}
          target="_blank" rel="noopener noreferrer"
          className="btn-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 14, borderRadius: RS, marginTop: 10,
            background: '#25D366', color: '#fff',
            fontWeight: 800, fontSize: 15,
            textDecoration: 'none', border: 'none',
          }}
        >
          💬 Donar por transferencia (consultar)
        </a>
      )}
    </Card>
  )
}

function TransferAccount({ T, acc }) {
  const rows = [
    acc.titular && { label: 'Titular', value: acc.titular },
    acc.dni && { label: 'DNI', value: acc.dni },
    acc.alias && { label: 'Alias', value: acc.alias, big: true },
    acc.cbu && { label: 'CBU', value: acc.cbu },
    acc.cvu && { label: 'CVU', value: acc.cvu },
  ].filter(Boolean)

  return (
    <div style={{
      background: T.bg, borderRadius: RS, padding: 12, marginBottom: 10,
      border: `1px solid ${T.borderLt}`,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 800, color: T.ok, marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {acc.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => <CopyRow key={i} T={T} row={r} />)}
      </div>
    </div>
  )
}

function CopyRow({ T, row }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(row.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <button
      onClick={onCopy}
      className="btn-press"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        padding: '8px 10px', borderRadius: 8,
        background: T.card, border: `1px solid ${T.borderLt}`,
        cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{row.label}</div>
        <div style={{
          fontSize: row.big ? 15 : 13, color: T.txt, fontWeight: row.big ? 800 : 600,
          fontFamily: row.label === 'CBU' || row.label === 'CVU' || row.label === 'DNI' ? 'monospace' : 'inherit',
          wordBreak: 'break-all',
        }}>
          {row.value}
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: copied ? T.ok : T.muted,
        flexShrink: 0,
      }}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </div>
    </button>
  )
}

function BulletList({ T, color, items }) {
  return (
    <ul style={{
      listStyle: 'none', padding: 0, margin: '0 0 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {items.map((b, i) => (
        <li key={i} style={{
          fontSize: 13, color: T.txt, display: 'flex', alignItems: 'flex-start', gap: 8,
          lineHeight: 1.4,
        }}>
          <span style={{ color, fontWeight: 800, flexShrink: 0 }}>✓</span> {b}
        </li>
      ))}
    </ul>
  )
}

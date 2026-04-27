import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card } from '../components/ui'
import { ArrowLeft, Dog, Building, Heart, Star, Gift, MessageCircle } from 'lucide-react'
import { I } from '../components/ui/Icons'
import { getWhatsAppLink } from '../utils'
import { DEFAULT_WHATSAPP } from '../lib/constants'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { useAuth } from '../hooks/useAuth'

const TRANSFER_MSG = 'Hola, quiero hacer una donacion por transferencia a la red de refugios. Tengo una consulta.'
const STEP_MAP = { adoptar: 'adopt', voluntariar: 'volunteer', apadrinar: 'sponsor-pet', donar: 'donate' }

export default function Sumarme() {
  const T = useT()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ctx = useShelterConfig()
  const { volunteerSubs } = useAuth()
  const config = ctx?.config
  const shelter = ctx?.shelter

  const { items: shelters, loading: loadingShelters } = useSheltersPublic({ fetchAll: true })

  const stepParam = searchParams.get('step')
  const [selected, setSelected] = useState(() => STEP_MAP[stepParam] || null)

  useEffect(() => {
    if (stepParam) setSelected(STEP_MAP[stepParam] || null)
  }, [stepParam])

  // Logic for persistent shelter choice
  useEffect(() => {
    // If we are in a specific shelter context via URL, save it as preference
    if (shelter?.slug) {
      localStorage.setItem('preferred_shelter_slug', shelter.slug)
    }
  }, [shelter])

  // If we land on /sumarme (global), check if we have a preference
  useEffect(() => {
    const hasSlugInUrl = window.location.pathname.includes('/refugio/')
    if (!hasSlugInUrl && !selected) {
      const preferredSlug = localStorage.getItem('preferred_shelter_slug') || volunteerSubs[0]?.shelter?.slug
      if (preferredSlug) {
        // Redirect to their preferred shelter sumarme page
        navigate(`/refugio/${preferredSlug}/sumarme`, { replace: true })
      }
    }
  }, [volunteerSubs, navigate, selected])

  const isGlobal = !shelter
  const activeConfig = config
  const WHATSAPP = activeConfig?.whatsapp_number || DEFAULT_WHATSAPP
  const TRANSFER_ACCOUNTS = Array.isArray(activeConfig?.transfer_accounts) ? activeConfig.transfer_accounts : []

  // If GLOBAL and NO SHELTER selected in state (and not in a sub-step), show PICKER
  if (isGlobal && !selected) {
    return (
      <div className="anim" style={{ paddingTop: 16, paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: T.accent, marginBottom: 12 }}>{I.Building(48)}</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: T.txt, marginBottom: 8, letterSpacing: '-0.5px' }}>
            ¿A qué refugio querés ayudar?
          </h1>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
            Cada refugio gestiona sus propios voluntarios y donaciones de forma independiente.
          </p>
        </div>

        {loadingShelters ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <Card key={i} style={{ height: 80, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shelters.map(s => (
              <Card
                key={s.id}
                interactive
                onClick={() => {
                  localStorage.setItem('preferred_shelter_slug', s.slug)
                  navigate(`/refugio/${s.slug}/sumarme`)
                }}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: `1.5px solid ${T.borderLt}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: T.accentLt, color: T.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {I.Paw(22)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: T.txt }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
                      {[s.city, s.shelter_config?.province].filter(Boolean).join(', ') || 'Argentina'}
                    </div>
                  </div>
                </div>
                <div style={{ color: T.accent, fontWeight: 800 }}>→</div>
              </Card>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 32, padding: '20px', borderRadius: 20,
          background: T.card, border: `1.5px dashed ${T.border}`,
          textAlign: 'center',
        }}>
          <div style={{ color: T.muted, marginBottom: 8 }}>{I.Info(24)}</div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
            ¿Sos dueño de un refugio y querés aparecer acá? 
            <br />
            <a href={`https://wa.me/${DEFAULT_WHATSAPP}?text=Hola!+Quiero+sumar+mi+refugio+a+la+red.`} 
               target="_blank" rel="noopener noreferrer"
               style={{ color: T.accent, fontWeight: 700, textDecoration: 'underline' }}>
              Contactanos para sumarte
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (selected) {
    return (
      <DetailView
        T={T}
        type={selected}
        onBack={() => {
          if (stepParam) {
            navigate(ctx?.shelter ? `/refugio/${ctx.shelter.slug}/sumarme` : '/sumarme')
          }
          setSelected(null)
        }}
        navigate={navigate}
        shelterSlug={shelter?.slug}
        WHATSAPP={WHATSAPP}
        TRANSFER_ACCOUNTS={TRANSFER_ACCOUNTS}
        shelterName={shelter?.name}
      />
    )
  }

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: T.purple, marginBottom: 12 }}>{I.HeartFill(56)}</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: T.txt, marginBottom: 8, letterSpacing: '-0.5px' }}>
          Sumate a {shelter?.name || 'la red'}
        </h1>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.5, padding: '0 8px' }}>
          {shelter 
            ? `Tu ayuda directa para los perritos de ${shelter.name}.`
            : 'Hay distintas formas de ayudar a los refugios de la red.'} 
          Elegí la que más te guste.
        </p>

        {shelter && (
          <button 
            onClick={() => {
              localStorage.removeItem('preferred_shelter_slug')
              navigate('/sumarme')
            }}
            style={{
              marginTop: 12, background: 'none', border: 'none',
              color: T.accent, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', textDecoration: 'underline'
            }}
          >
            Ayudar a otro refugio
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OptionCard
          T={T} icon={<Dog size={28} />} title="Quiero adoptar"
          subtitle="Encontrar un compañero peludo"
          color={T.accent} bgColor={T.accentLt}
          onClick={() => setSelected('adopt')}
        />
        <OptionCard
          T={T} icon={<Building size={28} />} title="Ser voluntario/a"
          subtitle="Ayudar con mi tiempo en el refugio"
          color={T.purple} bgColor={T.purpleLt}
          onClick={() => setSelected('volunteer')}
        />
        <OptionCard
          T={T} icon={<Star size={28} />} title="Apadrinar un perrito"
          subtitle="Cubrir sus gastos sin adoptarlo"
          color="#8a6d3b" bgColor="#fdf8ec"
          onClick={() => setSelected('sponsor-pet')}
        />
        <OptionCard
          T={T} icon={<Gift size={28} />} title="Donar dinero"
          subtitle="Ayudar desde casa, sin registro"
          color={T.ok} bgColor={T.okLt}
          onClick={() => setSelected('donate')}
        />
      </div>

      <div style={{
        marginTop: 20, padding: '16px 16px', borderRadius: R,
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
function OptionCard({ T, icon, title, subtitle, color, bgColor, onClick }) {
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
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.txt }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ color: color, fontSize: 22, fontWeight: 800 }}>→</div>
    </Card>
  )
}

// ─── Vista de detalle (paso 2) ───────────────────────────────────
function DetailView({ T, type, onBack, navigate, shelterSlug, WHATSAPP, TRANSFER_ACCOUNTS }) {
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
        <ArrowLeft size={16} /> Volver a las opciones
      </button>

      {type === 'adopt' && <AdoptDetail T={T} navigate={navigate} shelterSlug={shelterSlug} />}
      {type === 'volunteer' && <VolunteerDetail T={T} navigate={navigate} shelterSlug={shelterSlug} />}
      {type === 'sponsor-pet' && <SponsorPetDetail T={T} navigate={navigate} WHATSAPP={WHATSAPP} shelterSlug={shelterSlug} />}
      {type === 'donate' && <DonateDetail T={T} WHATSAPP={WHATSAPP} TRANSFER_ACCOUNTS={TRANSFER_ACCOUNTS} />}
    </div>
  )
}

function AdoptDetail({ T, navigate, shelterSlug }) {
  return (
    <Card style={{ padding: 22, border: `2px solid ${T.accent}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: T.accentLt, color: T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}><Dog size={48} strokeWidth={1} /></div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Quiero adoptar
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Encontrar tu compañero peludo
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: 0 }}>
        Vas a poder ver los perritos de la red que están buscando una familia.
      </p>
      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Cada uno tiene su historia, fotos y notas sobre su personalidad. Podes guardar
        tus favoritos y cuando uno te llame, lo coordinamos por WhatsApp.
      </p>

      <BulletList T={T} color={T.accent} items={[
        'Ver perritos disponibles con foto y historia',
        'Filtrar por tamaño, urgencia o tiempo esperando',
        'Elegir al que sientas que es para vos',
        'Contactar al refugio elegido para conocer al perrito',
        'Completar el proceso de adopción y llevarlo a casa',
      ]} />

      <button
        onClick={() => navigate(shelterSlug ? `/refugio/${shelterSlug}/adoptar` : '/adoptar')}
        className="btn-press"
        style={{
          width: '100%', marginTop: 8, padding: 14, borderRadius: RS,
          background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
          boxShadow: `0 6px 16px ${T.accent}40`,
        }}
      >
        Ver perritos en adopción →
      </button>
    </Card>
  )
}

function VolunteerDetail({ T, navigate, shelterSlug }) {
  return (
    <Card style={{ padding: 22, border: `2px solid ${T.purple}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: T.purpleLt, color: T.purple,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}><Heart size={28} /></div>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: T.txt, margin: 0 }}>
            Ser voluntario/a
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
            Sumarte al equipo del refugio
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: 0 }}>
        Sumate al equipo de un refugio local. Trabajamos en juntadas, hacemos visitas diarias,
        ayudamos con traslados y difundimos a los perritos.
      </p>
      <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 14 }}>
        Te pedimos pocos datos y elegis como queres ayudar.
      </p>

      <BulletList T={T} color={T.purple} items={[
        'Trabajo en juntadas y eventos del refugio',
        'Visitas diarias para cuidar y pasear',
        'Transito temporal en tu casa',
        'Traslados al veterinario',
        'Acceso al grupo de WhatsApp del equipo',
      ]} />

      <button
        onClick={() => navigate(shelterSlug ? `/refugio/${shelterSlug}/voluntario` : '/voluntario')}
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

function SponsorPetDetail({ T, navigate, WHATSAPP, shelterSlug }) {
  const sponsorMsg = 'Hola! Me gustaria apadrinar un perrito del refugio. Quiero saber como funciona.'
  return (
    <Card style={{ padding: 22, border: `2px solid #e8d48b`, textAlign: 'center' }}>
      <div style={{ color: '#8a6d3b', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
        <Star size={48} strokeWidth={1.5} fill="#fdf8ec" />
      </div>
      
      <h2 style={{ fontSize: 20, fontWeight: 900, color: T.txt, margin: '0 0 8px' }}>
        Apadrinar un perrito
      </h2>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, marginBottom: 20 }}>
        Apadriná a un perrito en particular cubriendo sus gastos mientras espera ser adoptado. 
        El refugio lo cuida, vos lo sostenés.
      </p>

      <div style={{ textAlign: 'left', marginBottom: 20 }}>
        <BulletList T={T} color="#8a6d3b" items={[
          'Elegís al perrito que más te llegue',
          'Acordás el monto mensual con el refugio',
          'Recibís fotos y novedades de tu apadrinado',
          'Tenés prioridad si decidís adoptarlo',
        ]} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate(shelterSlug ? `/refugio/${shelterSlug}/adoptar?apadrinar=1` : '/adoptar?apadrinar=1')}
          className="btn-press"
          style={{
            width: '100%', padding: '14px 18px', borderRadius: 14,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 14px ${T.accent}30`,
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
            padding: 12, borderRadius: 12,
            background: T.bg, color: T.muted,
            fontWeight: 700, fontSize: 13,
            textDecoration: 'none', border: `1.5px solid ${T.border}`,
          }}
        >
          <MessageCircle size={16}/> Consultar por WhatsApp
        </a>
      </div>
    </Card>
  )
}

function DonateDetail({ T, WHATSAPP, TRANSFER_ACCOUNTS }) {
  return (
    <Card style={{ padding: '24px 20px', border: `2px solid ${T.ok}30`, textAlign: 'center' }}>
      <div style={{ color: T.ok, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{I.Gift(48)}</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: T.txt, margin: '0 0 8px' }}>Donar dinero</h2>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: '0 0 20px' }}>
        Tu donación va directo a comida y veterinario.
        <br />
        Sin intermediarios, 100% para el refugio.
      </p>

      {/* Mensaje de impacto destacado */}
      <div style={{
        background: T.okLt, borderRadius: 16,
        padding: '14px', marginBottom: 20,
        border: `1.5px solid ${T.ok}20`,
      }}>
        <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
          Con <strong style={{ color: T.ok }}>$2.000</strong> cubrís el alimento de un perrito por una semana.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TRANSFER_ACCOUNTS.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Transferencia bancaria
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TRANSFER_ACCOUNTS.map((acc, idx) => (
                <TransferAccount key={idx} T={T} acc={acc} />
              ))}
            </div>
          </div>
        )}

        <a
          href={getWhatsAppLink(WHATSAPP, TRANSFER_MSG)}
          target="_blank" rel="noopener noreferrer"
          className="btn-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 18px', borderRadius: 14, marginTop: 4,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            color: '#fff', fontWeight: 800, fontSize: 15,
            textDecoration: 'none', boxShadow: `0 4px 14px ${T.accent}30`,
          }}
        >
          <MessageCircle size={18}/> Escribirnos para donar de otra forma
        </a>
      </div>
    </Card>
  )
}

function TransferAccount({ T, acc }) {
  const rows = [
    acc.titular && { label: 'Titular', value: acc.titular },
    acc.dni && { label: 'DNI', value: acc.dni },
    acc.alias && { label: 'Alias', value: acc.alias },
    acc.cbu && { label: 'CBU', value: acc.cbu },
    acc.cvu && { label: 'CVU', value: acc.cvu },
  ].filter(Boolean)

  return (
    <div style={{
      background: T.card, borderRadius: 16, padding: '16px 20px', marginBottom: 12,
      border: `1.5px solid ${T.borderLt}`,
      textAlign: 'left',
    }}>
      <div style={{
        fontSize: 14, fontWeight: 800, color: T.txt, marginBottom: 14,
      }}>
        {acc.label || 'Cuenta Bancaria'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
    } catch { /* clipboard not available */ }
  }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>{row.label}:</span>
        <span style={{ 
          fontSize: 14, color: T.txt, fontWeight: 700, 
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: row.label === 'CBU' || row.label === 'CVU' ? 'monospace' : 'inherit'
        }}>
          {row.value}
        </span>
      </div>
      <button
        onClick={onCopy}
        className="btn-press"
        style={{
          padding: '6px 12px', borderRadius: 8,
          background: copied ? T.okLt : T.borderLt,
          color: copied ? T.ok : T.muted,
          fontSize: 12, fontWeight: 700, border: 'none',
          cursor: 'pointer', flexShrink: 0,
          transition: 'all .2s',
        }}
      >
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
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

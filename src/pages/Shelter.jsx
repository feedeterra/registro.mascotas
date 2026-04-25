import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { Card, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'

const DONATION_LINK = 'https://cafecito.app/refugiocasa'

export default function Shelter() {
  const T = useT()
  const navigate = useNavigate()
  const { isLogged, userId } = useAuthContext()
  const { config, loading: configLoading } = useShelterConfig()
  const { pets } = usePets()

  const WHATSAPP = config?.whatsapp_number || '5492346306562'
  const adoptablePets = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')

  // ── Next volunteer meetup from config ───────────────────────
  const hasEvent = !!config?.next_event_date
  const [countdown, setCountdown] = useState(null)
  const eventDate = useMemo(() => hasEvent ? new Date(config.next_event_date) : null, [config?.next_event_date, hasEvent])
  const eventPassed = eventDate ? Date.now() > eventDate.getTime() : true

  useEffect(() => {
    if (!eventDate || eventPassed) return
    const tick = () => {
      const diff = eventDate.getTime() - Date.now()
      if (diff <= 0) { setCountdown(null); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [eventDate, eventPassed])

  if (configLoading) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  )

  const shelterName = config?.name || 'Refugio CASA'
  const shelterMission = config?.mission || 'Rescatamos perros de la calle. Les damos amor. Les buscamos familia.'
  const shelterDesc = config?.description || 'Somos un grupo de vecinos de Capilla del Señor que dedicamos nuestro tiempo a rescatar, cuidar y buscar familias para perros en situacion de calle. Cada perrito que entra al refugio recibe atencion veterinaria, vacunas y mucho amor.'
  const city = config?.city || 'Capilla del Señor, Exaltacion de la Cruz, Buenos Aires'
  const eventWhatsapp = config?.next_event_whatsapp || config?.whatsapp_group_link || `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Quiero sumarme a la proxima juntada de voluntarios.')}`

  const helpOptions = [
    {
      emoji: '🐾', title: 'Adoptar un perrito',
      desc: 'Escribinos por WhatsApp y te contamos como es el proceso. Es simple y rapido.',
      action: 'whatsapp',
      msg: 'Hola! Quiero consultar sobre adopcion de perritos del refugio.',
      color: T.ok, bgColor: T.okLt,
    },
    {
      emoji: '💛', title: 'Apadrinar un perrito',
      desc: 'Elegí un perrito y compromete a ayudar con su alimento y cuidado mensual.',
      action: 'link', href: '/adoptar',
      linkText: 'Elegir un perrito para apadrinar',
      color: T.accent, bgColor: T.accentLt,
    },
    {
      emoji: '🎁', title: 'Donar alimento o materiales',
      desc: 'Aceptamos alimento balanceado, mantas, medicamentos y mas. Coordinamos el retiro.',
      action: 'whatsapp',
      msg: 'Hola! Quiero donar materiales o alimento al refugio. Como puedo hacer?',
      color: T.blue, bgColor: T.blueLt,
    },
    {
      emoji: '💰', title: 'Donar dinero',
      desc: 'Tu donacion va directo al cuidado de los perritos: comida, veterinario y refugio.',
      action: 'external', href: DONATION_LINK,
      color: T.accent, bgColor: T.accentLt,
    },
    {
      emoji: '🤝', title: 'Ser voluntario/a',
      desc: 'Sumate al grupo de WhatsApp donde coordinamos actividades del refugio.',
      action: 'whatsapp-group',
      href: config?.whatsapp_group_link || `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Quiero ser voluntario/a del refugio.')}`,
      color: T.purple, bgColor: T.purpleLt,
    },
  ]

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {/* Hero */}
      <Card style={{ overflow: 'hidden', marginBottom: 16 }}>
        {config?.shelter_image_url && (
          <img src={config.shelter_image_url} alt={shelterName}
            style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', background: T.borderLt }} />
        )}
        <div style={{
          background: T.headerBg, padding: '32px 20px 20px',
          textAlign: 'center', color: '#fff',
        }}>
          {!config?.shelter_image_url && <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>}
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{shelterName}</h1>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>📍 {city}</p>
          <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 20 }}>{shelterMission}</p>

          <div style={{
            display: 'flex', justifyContent: 'space-around', padding: '14px 0',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{adoptablePets.length}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>En adopcion</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>60+</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Rescatados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>🤝</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Voluntarios</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>{shelterDesc}</p>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 4 }}>Como ayudar</h3>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
            Hay muchas formas de hacer la diferencia. Elegí la que mas te guste.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {helpOptions.map((opt, i) => {
              const content = (
                <div key={i} className="btn-press" style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderRadius: R, border: `1px solid ${T.borderLt}`, background: T.card, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: opt.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>{opt.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.txt, marginBottom: 2 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>{opt.desc}</div>
                    {opt.linkText && <div style={{ fontSize: 12, color: opt.color, fontWeight: 700, marginTop: 4 }}>{opt.linkText} →</div>}
                  </div>
                </div>
              )
              if (opt.action === 'whatsapp') {
                return <a key={i} href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(opt.msg)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              if (opt.action === 'link') return <Link key={i} to={opt.href} style={{ textDecoration: 'none' }}>{content}</Link>
              if (opt.action === 'external' || opt.action === 'whatsapp-group') {
                return <a key={i} href={opt.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              return <div key={i}>{content}</div>
            })}
          </div>

          {/* Next volunteer event */}
          {hasEvent && !eventPassed && countdown && (
            <div className="anim" style={{
              padding: 16, borderRadius: R, marginBottom: 16,
              background: `linear-gradient(135deg, ${T.purpleLt}, ${T.blueLt})`,
              border: `1.5px solid ${T.purple}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.txt }}>
                    {config.next_event_title || 'Juntada de voluntarios'}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    {eventDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {eventDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                  </div>
                  {config.next_event_place && (
                    <div style={{ fontSize: 12, color: T.muted }}>📍 {config.next_event_place}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                {[
                  { v: countdown.d, l: 'dias' }, { v: countdown.h, l: 'hs' },
                  { v: countdown.m, l: 'min' }, { v: countdown.s, l: 'seg' },
                ].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 800, color: T.purple, boxShadow: T.shadow,
                    }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>

              <a href={eventWhatsapp} target="_blank" rel="noopener noreferrer" className="btn-press" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '11px 20px', borderRadius: RS,
                background: `linear-gradient(135deg, ${T.purple}, #5b21b6)`,
                color: '#fff', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', border: 'none', boxShadow: `0 4px 12px ${T.purple}40`,
              }}>
                🤝 Anotarme para la juntada
              </a>
            </div>
          )}

          {/* Follow / support */}
          <button className="btn-press" onClick={() => navigate('/sumarme')} style={{
            width: '100%', padding: '12px 20px', borderRadius: RS,
            border: 'none', background: T.accent,
            color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            💜 Quiero apoyar al refugio
          </button>
        </div>
      </Card>

      {/* Sponsor CTA */}
      <Card style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
          Queres ser sponsor del refugio?
        </h3>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
          Tu marca puede aparecer en la app y ayudar a los perritos. Escribinos y te contamos como.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Me interesa ser sponsor del refugio y aparecer en la app. Quiero saber mas!')}`}
          target="_blank" rel="noopener noreferrer" className="btn-press"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 24px', borderRadius: RS,
            background: `linear-gradient(135deg, #f5e6c8, #e8d5a8)`,
            color: '#8a6d3b', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', border: '1px solid #e8d5a8',
          }}>
          ⭐ Quiero ser sponsor
        </a>
      </Card>

      <SponsorZone tier="silver" style={{ marginBottom: 16 }} />

      {/* ONG Institutional data */}
      {(config?.legal_name || config?.cuit || config?.email) && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Datos institucionales</h2>
          <Card style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.legal_name && (
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>Razon social</div>
                  <div style={{ fontSize: 14, color: T.txt, fontWeight: 700 }}>{config.legal_name}</div>
                </div>
              )}
              {config.cuit && (
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>CUIT</div>
                  <div style={{ fontSize: 14, color: T.txt, fontWeight: 600 }}>{config.cuit}</div>
                </div>
              )}
              {config.registration_number && (
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>Personeria juridica</div>
                  <div style={{ fontSize: 14, color: T.txt, fontWeight: 600 }}>{config.registration_number}</div>
                </div>
              )}
              <div style={{
                marginTop: 4, padding: '10px 14px', borderRadius: RS,
                background: T.okLt, border: `1px solid ${T.ok}20`,
                fontSize: 12, color: T.ok, fontWeight: 600, lineHeight: 1.5,
              }}>
                ✅ Organizacion sin fines de lucro registrada. Todos los fondos se destinan al cuidado de los animales.
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Contact */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Contacto</h2>
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ok, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            {I.Phone()} WhatsApp
          </a>
          {config?.email && (
            <a href={`mailto:${config.email}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.blue, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              ✉️ {config.email}
            </a>
          )}
          {config?.instagram_url && (
            <a href={config.instagram_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.purple, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              {I.Instagram()} Instagram
            </a>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontWeight: 600, fontSize: 14 }}>
            {I.Loc()} {city}
          </div>
        </div>
      </Card>
    </div>
  )
}

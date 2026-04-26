import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'
import { usePublicShelterAnnouncements, usePublicShelterEvents } from '../hooks/useShelterPublicContent'
import { useShelterPets } from '../hooks/usePets'
import { Card, SponsorZone } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'

export default function Shelter() {
  const T = useT()
  const navigate = useNavigate()
  const { slug } = useParams()
  const { isLogged } = useAuthContext()
  const { config, shelter, loading: configLoading } = useShelterPublicConfig(slug)

  const [annPage, setAnnPage] = useState(1)
  const [evtPage, setEvtPage] = useState(1)
  const ANN_PAGE_SIZE = 3
  const EVT_PAGE_SIZE = 3
  const pubAnn = usePublicShelterAnnouncements(shelter?.id || null, { page: annPage, pageSize: ANN_PAGE_SIZE })
  const pubEvt = usePublicShelterEvents(shelter?.id || null, { page: evtPage, pageSize: EVT_PAGE_SIZE })
  const { pets } = useShelterPets(shelter?.id ?? null)

  const shelterSlug = shelter?.slug || slug || ''
  const WHATSAPP = (config?.whatsapp_number || '').trim()
  const donationHref = (config?.donation_link || '').trim()
  const transferAccounts = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []
  const adoptablePets = pets.filter(p => p.type === 'stray' && p.adoptionStatus !== 'adopted')

  if (configLoading) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando...</div>
  )

  if (!shelter && !config) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏚️</div>
      <p style={{ color: T.muted, fontWeight: 600 }}>Refugio no encontrado.</p>
      <button onClick={() => navigate('/refugios')} style={{ marginTop: 12, background: T.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
        Ver todos los refugios
      </button>
    </div>
  )

  const shelterName = config?.name || shelter?.name || 'Refugio'
  const city = shelter?.city || '—'
  const shelterMission = (config?.mission || '').trim()
  const shelterDesc = (config?.description || '').trim()

  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/refugio/${shelterSlug}/sumarme`
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sumate a ${shelterName}`,
          text: `Podés adoptar, ser voluntario o donar en ${shelterName}. ¡Unite!`,
          url: shareUrl,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

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
      action: 'link', href: `/adoptar?refugio=${encodeURIComponent(shelterSlug)}&apadrinar=1`,
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
      desc: donationHref
        ? 'Tu donación va directo al cuidado de los perritos: comida, veterinario y refugio.'
        : transferAccounts.length
          ? 'Podés donar mediante transferencia bancaria. Más abajo vas a encontrar los datos.'
          : 'Este refugio todavía no configuró cómo recibir donaciones.',
      action: donationHref ? 'external' : transferAccounts.length ? 'scroll' : 'disabled',
      href: donationHref || null,
      color: T.accent, bgColor: T.accentLt,
    },
    {
      emoji: '🤝', title: 'Ser voluntario/a',
      desc: 'Sumate al grupo de WhatsApp donde coordinamos actividades del refugio.',
      action: 'whatsapp-group',
      href: config?.whatsapp_group_link || (WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola! Quiero ser voluntario/a del refugio.')}` : null),
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
          {shelterMission && <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>{shelterMission}</p>}

          {/* Botón compartir link de participación */}
          <button
            className="btn-press"
            onClick={handleShare}
            style={{
              width: '100%', padding: '11px 16px', marginBottom: 16,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <ShareIcon /> {copied ? '¡Link copiado!' : 'Compartir · Invitar a participar'}
          </button>

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
          {shelterDesc ? (
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>{shelterDesc}</p>
          ) : (
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Este refugio todavía no completó su descripción.
            </p>
          )}

          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 4 }}>Como ayudar</h3>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
            Hay muchas formas de hacer la diferencia. Elegí la que mas te guste.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {helpOptions.map((opt, i) => {
              const isDisabled = opt.action === 'disabled' || (opt.action === 'external' && !opt.href) || (opt.action === 'whatsapp-group' && !opt.href)
              const content = (
                <div key={i} className="btn-press" style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderRadius: R,
                  border: `1px solid ${isDisabled ? T.border : T.borderLt}`,
                  background: isDisabled ? T.borderLt : T.card,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  filter: isDisabled ? 'grayscale(0.15)' : 'none',
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
                if (!WHATSAPP) return <div key={i} style={{ opacity: 0.6 }}>{content}</div>
                return <a key={i} href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(opt.msg)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              if (opt.action === 'link') return <Link key={i} to={opt.href} style={{ textDecoration: 'none' }}>{content}</Link>
              if (opt.action === 'scroll') {
                return (
                  <button
                    key={i}
                    onClick={() => document.getElementById('donaciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left' }}
                  >
                    {content}
                  </button>
                )
              }
              if (opt.action === 'disabled') return <div key={i}>{content}</div>
              if (opt.action === 'external' || opt.action === 'whatsapp-group') {
                if (!opt.href) return <div key={i}>{content}</div>
                return <a key={i} href={opt.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              return <div key={i}>{content}</div>
            })}
          </div>

          {/* Perritos en adopción */}
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 8 }}>
            🐾 Perritos en adopción
          </h3>

          {adoptablePets.length === 0 ? (
            <Card style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 13 }}>
                Todavía no hay perritos en adopción cargados para este refugio.
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {adoptablePets.slice(0, 6).map(p => (
                <PetCard key={p.id} pet={p} />
              ))}
            </div>
          )}
          {adoptablePets.length > 6 && (
            <button
              className="btn-press"
              onClick={() => {
                navigate(shelterSlug ? `/adoptar?refugio=${encodeURIComponent(shelterSlug)}` : '/adoptar')
              }}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: RS,
                border: `1.5px solid ${T.border}`,
                background: 'transparent',
                color: T.txt,
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 16,
              }}
            >
              Ver más perritos →
            </button>
          )}

          {/* Anuncios */}
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginTop: 10, marginBottom: 8 }}>
            📢 Anuncios del refugio
          </h3>
          {pubAnn.error && (
            <Card style={{ padding: 14, marginBottom: 12, border: `1.5px solid ${T.danger}30`, background: T.dangerLt }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: T.danger, marginBottom: 4 }}>No pudimos cargar anuncios</div>
              <div style={{ fontSize: 12, color: T.txt }}>{pubAnn.error}</div>
            </Card>
          )}
          {pubAnn.loading ? (
            <Card style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 13 }}>Cargando anuncios...</div>
            </Card>
          ) : pubAnn.items.length === 0 ? (
            <Card style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 13 }}>No hay anuncios activos.</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {pubAnn.items.map(a => (
                <Card key={a.id} style={{ padding: 0, overflow: 'hidden' }}>
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt="Anuncio"
                      style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block', borderBottom: `1px solid ${T.borderLt}` }}
                    />
                  )}
                  <div style={{ padding: 14, fontSize: 13, color: T.txt, lineHeight: 1.45 }}>{a.body}</div>
                </Card>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
              Página {annPage} / {Math.max(1, Math.ceil((pubAnn.total || 0) / ANN_PAGE_SIZE))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-press" onClick={() => setAnnPage(p => Math.max(1, p - 1))} disabled={annPage <= 1}
                style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: annPage <= 1 ? 'default' : 'pointer' }}>
                ←
              </button>
              <button className="btn-press" onClick={() => setAnnPage(p => Math.min(Math.max(1, Math.ceil((pubAnn.total || 0) / ANN_PAGE_SIZE)), p + 1))}
                disabled={annPage >= Math.max(1, Math.ceil((pubAnn.total || 0) / ANN_PAGE_SIZE))}
                style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: annPage >= Math.max(1, Math.ceil((pubAnn.total || 0) / ANN_PAGE_SIZE)) ? 'default' : 'pointer' }}>
                →
              </button>
            </div>
          </div>

          {/* Eventos */}
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 8 }}>
            📅 Próximos eventos
          </h3>
          {pubEvt.error && (
            <Card style={{ padding: 14, marginBottom: 12, border: `1.5px solid ${T.danger}30`, background: T.dangerLt }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: T.danger, marginBottom: 4 }}>No pudimos cargar eventos</div>
              <div style={{ fontSize: 12, color: T.txt }}>{pubEvt.error}</div>
            </Card>
          )}
          {pubEvt.loading ? (
            <Card style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 13 }}>Cargando eventos...</div>
            </Card>
          ) : pubEvt.items.length === 0 ? (
            <Card style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: T.muted, fontSize: 13 }}>No hay eventos próximos.</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {pubEvt.items.map(e => {
                const d = e.event_at ? new Date(e.event_at) : null
                return (
                  <Card key={e.id} style={{ padding: 14 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: T.txt, marginBottom: 4 }}>{e.title || 'Evento'}</div>
                    {d && (
                      <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
                        {d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                      </div>
                    )}
                    {e.place && <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>📍 {e.place}</div>}
                    {e.signup_link && (
                      <a href={e.signup_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 800, color: T.purple, textDecoration: 'none' }}>
                        Anotarme →
                      </a>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>
              Página {evtPage} / {Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-press" onClick={() => setEvtPage(p => Math.max(1, p - 1))} disabled={evtPage <= 1}
                style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: evtPage <= 1 ? 'default' : 'pointer' }}>
                ←
              </button>
              <button className="btn-press" onClick={() => setEvtPage(p => Math.min(Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE)), p + 1))}
                disabled={evtPage >= Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE))}
                style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: evtPage >= Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE)) ? 'default' : 'pointer' }}>
                →
              </button>
            </div>
          </div>

          {/* Follow / support */}
          <button className="btn-press" onClick={() => navigate(`/refugio/${shelterSlug}/sumarme`)} style={{
            width: '100%', padding: '12px 20px', borderRadius: RS,
            border: 'none', background: T.accent,
            color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            ♡ Quiero apoyar al refugio
          </button>
        </div>
      </Card>

      {/* Donaciones */}
      {(donationHref || transferAccounts.length > 0) && (
        <>
          <h2 id="donaciones" style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Donaciones</h2>
          <Card style={{ padding: '16px 20px', marginBottom: 16 }}>
            {donationHref && (
              <a
                href={donationHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: RS,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff',
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginBottom: transferAccounts.length ? 12 : 0,
                }}
              >
                💰 Donar con link
              </a>
            )}

            {transferAccounts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: T.muted, fontWeight: 700 }}>
                  Datos para transferencia
                </div>
                {transferAccounts.map((acc, idx) => (
                  <Card key={idx} style={{ padding: 12, border: `1px solid ${T.borderLt}` }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.txt, marginBottom: 6 }}>
                      {acc.label || `Cuenta ${idx + 1}`}
                    </div>
                    {acc.titular && <div style={{ fontSize: 12, color: T.muted }}>Titular: <b style={{ color: T.txt }}>{acc.titular}</b></div>}
                    {acc.alias && <div style={{ fontSize: 12, color: T.muted }}>Alias: <b style={{ color: T.txt }}>{acc.alias}</b></div>}
                    {acc.cbu && <div style={{ fontSize: 12, color: T.muted }}>CBU: <b style={{ color: T.txt }}>{acc.cbu}</b></div>}
                    {acc.cvu && <div style={{ fontSize: 12, color: T.muted }}>CVU: <b style={{ color: T.txt }}>{acc.cvu}</b></div>}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

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

      {/* Contact */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Contacto</h2>
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WHATSAPP ? (
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ok, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              {I.Phone()} WhatsApp
            </a>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontWeight: 600, fontSize: 14 }}>
              {I.Phone()} WhatsApp no configurado
            </div>
          )}
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

      {/* Botón compartir también al final para staff que llega scrolleando */}
      <button
        className="btn-press"
        onClick={handleShare}
        style={{
          width: '100%', padding: '12px 16px', marginTop: 8, marginBottom: 8,
          background: T.borderLt, border: `1.5px solid ${T.border}`,
          borderRadius: 12, color: T.txt, fontWeight: 700, fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <ShareIconDark /> {copied ? '¡Link copiado!' : 'Compartir link del refugio'}
      </button>

      {/* Datos institucionales (al final) */}
      {(config?.legal_name || config?.cuit || config?.registration_number || config?.email) && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 12 }}>Datos institucionales</h2>
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
              {config.email && (
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>Email</div>
                  <div style={{ fontSize: 14, color: T.txt, fontWeight: 600 }}>{config.email}</div>
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
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function ShareIconDark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

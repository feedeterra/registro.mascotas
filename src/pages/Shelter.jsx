import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'
import { usePublicShelterAnnouncements, usePublicShelterEvents } from '../hooks/useShelterPublicContent'
import { useShelterPets } from '../hooks/usePets'
import { Card, SponsorZone, PageLoader } from '../components/ui'
import { Dog, MapPin, Building, Megaphone, CalendarDays, HandCoins, CircleCheckBig, Mail, Star } from 'lucide-react'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'

export default function Shelter() {
  const T = useT()
  const navigate = useNavigate()
  const { slug } = useParams()
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
  const adoptedPets = pets.filter(p => p.adoptionStatus === 'adopted' && p.photos?.length)
  const [copied, setCopied] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  if (configLoading) return <PageLoader message="Cargando refugio..." />

  if (!shelter && !config) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ marginBottom: 12, color: T.accent, display: 'flex', justifyContent: 'center' }}><Building size={48} strokeWidth={1} /></div>
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
      svgIcon: I.Paw(22), title: 'Adoptar un perrito',
      desc: 'Escribinos por WhatsApp y te contamos cómo es el proceso.',
      action: 'link', href: `/adoptar?refugio=${encodeURIComponent(shelterSlug)}`,
      linkText: 'Ver perritos disponibles',
      color: T.ok, bgColor: T.okLt,
    },
    {
      svgIcon: I.HeartFill(22), title: 'Apadrinar un perrito',
      desc: 'Elegí un perrito y comprometete a ayudar con su alimento y cuidado mensual.',
      action: 'link', href: `/adoptar?refugio=${encodeURIComponent(shelterSlug)}&apadrinar=1`,
      linkText: 'Elegir un perrito para apadrinar',
      color: T.accent, bgColor: T.accentLt,
    },
    {
      svgIcon: I.Gift(22), title: 'Donar alimentos o materiales',
      desc: WHATSAPP
        ? 'Alimento balanceado, mantas, medicamentos. Coordinamos el retiro.'
        : 'Este refugio todavía no configuró su WhatsApp de contacto.',
      action: 'whatsapp',
      msg: 'Hola! Quiero donar materiales o alimento al refugio. ¿Cómo puedo hacer?',
      color: T.blue, bgColor: T.blueLt,
    },
    {
      svgIcon: I.ArrowRight(22), title: 'Donar dinero',
      desc: donationHref || transferAccounts.length
        ? 'Tu donación va directo al cuidado de los perritos: comida, veterinario y refugio.'
        : 'Este refugio todavía no configuró cómo recibir donaciones.',
      action: donationHref || transferAccounts.length ? 'donation-modal' : 'disabled',
      color: T.accent, bgColor: T.accentLt,
    },
    {
      svgIcon: I.Handshake(22), title: 'Ser voluntario/a',
      desc: 'Sumate al equipo y ayudá con tu tiempo en las actividades del refugio.',
      action: 'link', href: `/refugio/${shelterSlug}/voluntario`,
      linkText: 'Registrarme como voluntario/a',
      color: T.purple, bgColor: T.purpleLt,
    },
  ]

  return (
    <div className="anim" style={{ paddingTop: 0, paddingBottom: 24 }}>
      {/* Hero full-bleed */}
      <div style={{ position: 'relative', minHeight: 220, overflow: 'hidden', marginBottom: 0, marginTop: 12, borderRadius: '16px 16px 0 0' }}>
        {config?.shelter_image_url ? (
          <>
            <img
              src={config.shelter_image_url}
              alt={shelterName}
              style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block', borderRadius: '16px 16px 0 0' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }} />
          </>
        ) : (
          <div style={{
            width: '100%', height: 220,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          }} />
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 20px 20px',
          color: '#fff',
        }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 2px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{shelterName}</h1>
          <p style={{ fontSize: 13, opacity: 0.9, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {city}</p>
        </div>
        <button
          className="btn-press"
          onClick={handleShare}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 20, color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px',
          }}
        >
          <ShareIcon /> {copied ? '¡Copiado!' : 'Compartir'}
        </button>
      </div>

      {/* Info + misión */}
      <Card style={{ borderRadius: '0 0 20px 20px', padding: '16px 20px 20px', marginBottom: 16, marginTop: 0 }}>
        {shelterMission && (
          <p style={{ fontSize: 14, color: T.txt, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>{shelterMission}</p>
        )}
        {shelterDesc && (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>{shelterDesc}</p>
        )}

        {/* CTA voluntario */}
        <Link
          to={`/refugio/${shelterSlug}/voluntario`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 18px', borderRadius: 50,
            background: T.accentLt, border: `1.5px solid ${T.accent}30`,
            color: T.accent, fontWeight: 800, fontSize: 14,
            textDecoration: 'none', marginBottom: 4,
          }}
        >
          {I.Paw(16)} Quiero ser voluntario/a →
        </Link>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          marginTop: 16, paddingTop: 14,
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>{adoptablePets.length}</div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>En adopción</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>{pets.length}</div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Rescatados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.accent }}>{I.Handshake(20)}</div>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Voluntarios</div>
          </div>
        </div>
      </Card>

      {/* Carrusel finales felices */}
      {adoptedPets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={16} fill={T.accent} color={T.accent} /> Finales felices
            </h3>
            <Link to={`/refugio/${shelterSlug}/historias`} style={{ fontSize: 13, color: T.accent, fontWeight: 700, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            margin: '0 -14px', padding: '0 14px 12px',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
            boxSizing: 'content-box',
          }}>
            {adoptedPets.map(p => (
              <Link key={p.id} to={`/refugio/${shelterSlug}/historias`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ width: 110, position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                  <img
                    src={p.photos[p.primaryPhotoIdx ?? 0]}
                    alt={p.name}
                    loading="lazy"
                    style={{ width: 110, height: 110, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6, right: 6,
                    color: '#fff', fontSize: 11, fontWeight: 800,
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  }}>{p.name}</div>
                </div>
              </Link>
            ))}
            <div style={{ width: 1, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* 5 botones de acción */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, paddingLeft: 2 }}>¿Cómo querés ayudar?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {helpOptions.map((opt, i) => {
            const isDisabled = opt.action === 'disabled' || (opt.action === 'external' && !opt.href) || (opt.action === 'whatsapp-group' && !opt.href)
            const content = (
              <div key={i} className="btn-press" style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                borderRadius: R,
                border: `1.5px solid ${isDisabled ? T.borderLt : opt.color + '30'}`,
                background: isDisabled ? T.borderLt : T.card,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                filter: isDisabled ? 'grayscale(0.3)' : 'none',
                boxShadow: isDisabled ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: opt.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0, color: opt.color,
                }}>{opt.svgIcon || opt.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: isDisabled ? T.muted : T.txt, marginBottom: 2 }}>{opt.title}</div>
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
              if (opt.action === 'donation-modal') return <button key={i} onClick={() => setShowDonationModal(true)} style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}>{content}</button>
              if (opt.action === 'external' || opt.action === 'whatsapp-group') {
                if (!opt.href) return <div key={i}>{content}</div>
                return <a key={i} href={opt.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              return <div key={i}>{content}</div>
            })}
          </div>
      </div>

      {/* Carrusel de perritos */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Dog size={18} /> Perritos en adopción</h3>
          {adoptablePets.length > 0 && (
            <button
              className="btn-press"
              onClick={() => navigate(shelterSlug ? `/adoptar?refugio=${encodeURIComponent(shelterSlug)}` : '/adoptar')}
              style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}
            >
              Ver todos →
            </button>
          )}
        </div>
        {adoptablePets.length === 0 ? (
          <Card style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: T.muted, fontSize: 13 }}>Todavía no hay perritos cargados.</div>
          </Card>
        ) : adoptablePets.length <= 2 ? (
          <div style={{ display: 'grid', gridTemplateColumns: adoptablePets.length === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
            {adoptablePets.map(p => <PetCard key={p.id} pet={p} />)}
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16,
            margin: '0 -14px', padding: '0 14px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none'
          }}>
            {adoptablePets.map(p => (
              <div key={p.id} style={{ width: 180, flexShrink: 0 }}>
                <PetCard pet={p} />
              </div>
            ))}
            <div style={{ width: 1, flexShrink: 0 }} />
          </div>
        )}
      </div>

      {/* Anuncios */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 8 }}>
          <span style={{display:'flex', alignItems:'center', gap:6}}><Megaphone size={16}/> Anuncios del refugio</span>
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
            <span style={{display:'flex', alignItems:'center', gap:6}}><CalendarDays size={16}/> Próximos eventos</span>
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
                    {e.place && <div style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {e.place}</div>}
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

      </div>

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
                <HandCoins size={16}/> Donar con link
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={16} /> {config.email}</span>
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

      {/* Modal donaciones */}
      {showDonationModal && createPortal(
        <div
          onClick={() => setShowDonationModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: T.card, borderRadius: 24,
              padding: '24px 20px 28px',
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Agradecimiento */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🐾</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 6px' }}>¡Muchas gracias!</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                Tu donación ayuda a pagar comida, veterinario y refugio para los perritos que esperan una familia.
              </p>
            </div>

            {/* Link de pago */}
            {donationHref && (
              <a
                href={donationHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px 18px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', marginBottom: transferAccounts.length ? 16 : 0,
                  boxSizing: 'border-box',
                }}
              >
                <HandCoins size={18} /> Donar online
              </a>
            )}

            {/* Cuentas de transferencia */}
            {transferAccounts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {donationHref && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: T.borderLt }} />
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>o por transferencia</span>
                    <div style={{ flex: 1, height: 1, background: T.borderLt }} />
                  </div>
                )}
                {transferAccounts.map((acc, idx) => (
                  <Card key={idx} style={{ padding: 14, border: `1px solid ${T.borderLt}` }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.txt, marginBottom: 8 }}>
                      {acc.label || `Cuenta ${idx + 1}`}
                    </div>
                    {[
                      acc.titular && { label: 'Titular', value: acc.titular },
                      acc.alias && { label: 'Alias', value: acc.alias },
                      acc.cbu && { label: 'CBU', value: acc.cbu },
                      acc.cvu && { label: 'CVU', value: acc.cvu },
                    ].filter(Boolean).map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}: </span>
                          <span style={{ fontSize: 13, color: T.txt, fontWeight: 700 }}>{value}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(value)
                            setCopiedField(`${idx}-${label}`)
                            setTimeout(() => setCopiedField(null), 2000)
                          }}
                          style={{
                            background: copiedField === `${idx}-${label}` ? T.okLt : T.borderLt,
                            border: 'none', borderRadius: 8, padding: '4px 10px',
                            fontSize: 11, fontWeight: 700,
                            color: copiedField === `${idx}-${label}` ? T.ok : T.muted,
                            cursor: 'pointer', flexShrink: 0, marginLeft: 8,
                          }}
                        >
                          {copiedField === `${idx}-${label}` ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowDonationModal(false)}
              style={{
                width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12,
                background: T.borderLt, border: 'none', color: T.muted,
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}

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
                <span style={{display:'flex', gap:6, alignItems:'flex-start'}}><CircleCheckBig size={14} style={{flexShrink:0, marginTop:1}}/> Organizacion sin fines de lucro registrada. Todos los fondos se destinan al cuidado de los animales.</span>
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

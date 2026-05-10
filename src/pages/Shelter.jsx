import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT, R, RM, RS } from '../theme'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'
import { usePublicShelterAnnouncements, usePublicShelterEvents } from '../hooks/useShelterPublicContent'
import { useShelterPets } from '../hooks/usePets'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import SEO from '../components/SEO'
import { optimizeImage } from '../utils/images'
import { Card, Skeleton, Btn, Badge, PageLoader, SponsorZone } from '../components/ui'
import { useAuthContext } from '../context/AuthContext'
import { DEFAULT_WHATSAPP_ADMIN } from '../lib/constants'
import { MapPin, Megaphone, CalendarDays, Mail, Heart, Star, CircleCheckBig, HandCoins, Share2, Sparkles } from 'lucide-react'
import { fetchSuccessStoriesForShelter, mapAdoptedPetToStoryVm } from '../services/successStories'
import { getWhatsAppLink, normalizePhoneToWhatsAppDigits, getWhatsAppBaseUrl } from '../utils'
import { useShelterCampaignsPublic } from '../hooks/useCampaigns'
import CampaignCard from '../components/campaigns/CampaignCard'
import { pathToColectas } from '../utils/campaignsNav'
import ShareShelterModal from '../components/shelter/ShareShelterModal'

const SHELTER_CAROUSEL_MAX = 10

export default function Shelter() {
  const T = useT()
  const navigate = useNavigate()
  const { slug } = useParams()
  const { config, shelter, loading: configLoading } = useShelterPublicConfig(slug)
  const { volunteerSubs } = useAuthContext()
  const isVolunteer = shelter?.id ? volunteerSubs.some(s => s.shelter_id === shelter.id) : false

  const [annPage, setAnnPage] = useState(1)
  const [evtPage, setEvtPage] = useState(1)
  const [copiedField, setCopiedField] = useState(null)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [shareShelterOpen, setShareShelterOpen] = useState(false)

  const ANN_PAGE_SIZE = 3
  const EVT_PAGE_SIZE = 3
  
  const pubAnn = usePublicShelterAnnouncements(shelter?.id || null, { page: annPage, pageSize: ANN_PAGE_SIZE })
  const pubEvt = usePublicShelterEvents(shelter?.id || null, { page: evtPage, pageSize: EVT_PAGE_SIZE })
  const { pets } = useShelterPets(shelter?.id ?? null)
  const { data: campaigns = [] } = useShelterCampaignsPublic(shelter?.id ?? null, { limit: 6 })

  const { data: shelterTableStories = [] } = useQuery({
    queryKey: ['success_stories', 'shelter_page', shelter?.id],
    queryFn: async () => {
      const r = await fetchSuccessStoriesForShelter(shelter.id, 40)
      if (r.error) throw r.error
      return r.data || []
    },
    enabled: !!shelter?.id,
  })

  const adoptedCarouselItems = useMemo(() => {
    const legacy = new Set(shelterTableStories.map((s) => s.legacyPetId).filter(Boolean))
    const tableSlugNameKeys = new Set(
      shelterTableStories.map((s) => {
        const sSlug = (s.shelterSlug || '').toLowerCase()
        const name = (s.petName || '').trim().toLowerCase()
        return `${sSlug}|${name}`
      })
    )
    const pageSlug = (slug || '').toLowerCase()
    const fallback = pets
      .filter((p) => p.adoptionStatus === 'adopted' && p.photos?.length && !legacy.has(p.id))
      .filter((p) => {
        const name = (p.name || '').trim().toLowerCase()
        if (!name) return true
        const pSlug = (p.shelterSlug || pageSlug || '').toLowerCase()
        return !tableSlugNameKeys.has(`${pSlug}|${name}`)
      })
      .map(mapAdoptedPetToStoryVm)
    const merged = [...shelterTableStories, ...fallback]
    return merged.slice(0, SHELTER_CAROUSEL_MAX)
  }, [shelterTableStories, pets, slug])

  const shelterName = config?.name || shelter?.name || 'Refugio'
  const shelterDesc = config?.description || (shelter?.city ? `Conocé al refugio ${shelterName} en ${shelter.city}.` : `Conocé al refugio ${shelterName}.`)
  const image = config?.shelter_image_url

  const shelterMission = config?.mission
  const locationLabel =
    (shelter?.address && shelter.address.trim()) ||
    [shelter?.city, config?.province].filter(Boolean).join(', ') ||
    '—'
  const shelterSlug = shelter?.slug || slug || ''

  const shareShelterVm = useMemo(
    () => ({
      name: shelterName,
      slug: shelterSlug,
      description: shelterDesc,
      mission: shelterMission || '',
      imageUrl: image || null,
      imagePosition: config?.shelter_image_position || '50% 50%',
      locationLabel,
    }),
    [
      shelterName,
      shelterSlug,
      shelterDesc,
      shelterMission,
      image,
      config?.shelter_image_position,
      locationLabel,
    ]
  )

  const seo = (
    <SEO 
      title={shelterName}
      description={shelterDesc}
      image={image}
    />
  )

  if (configLoading) return (
    <div style={{ padding: 20, paddingTop: 40 }}>
      {seo}

      <Skeleton height={200} radius={RM} style={{ marginBottom: 20 }} />
      <Skeleton width="70%" height={24} style={{ marginBottom: 12 }} />
      <Skeleton width="40%" height={16} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Skeleton height={60} radius={RS} />
        <Skeleton height={60} radius={RS} />
        <Skeleton height={60} radius={RS} />
      </div>
    </div>
  )

  if (!shelter && !config) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      {seo}
      <div style={{ marginBottom: 12, color: T.accent, display: 'flex', justifyContent: 'center' }}>{I.Building(48)}</div>
      <p style={{ color: T.muted, fontWeight: 600 }}>Refugio no encontrado.</p>
      <button onClick={() => navigate('/refugios')} style={{ marginTop: 12, background: T.accent, color: '#fff', border: 'none', borderRadius: RM, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
        Ver todos los refugios
      </button>
    </div>
  )

  const donationHref = config?.donation_link

  const WHATSAPP = (config?.whatsapp_number || '').trim()
  const WHATSAPP_ADMIN_RAW = (config?.whatsapp_admin || WHATSAPP).trim()
  const hasShelterAdminWa = Boolean(normalizePhoneToWhatsAppDigits(WHATSAPP_ADMIN_RAW))
  const transferAccounts = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []

  const adoptablePets = pets.filter(p => p.type === 'stray' && (p.adoptionStatus || '').toLowerCase() !== 'adopted')

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
      desc: hasShelterAdminWa
        ? 'Alimento balanceado, mantas, medicamentos. Coordinamos el retiro.'
        : 'Este refugio todavía no configuró su WhatsApp de contacto.',
      action: hasShelterAdminWa ? 'whatsapp-admin' : 'disabled',
      msg: 'Hola! Quiero donar materiales o alimento al refugio. ¿Cómo puedo hacer?',
      color: T.blue, bgColor: T.blueLt,
    },
    {
      svgIcon: <HandCoins size={22}/>, title: 'Donar dinero',
      desc: donationHref || transferAccounts.length
        ? 'Tu donación va directo al cuidado de los perritos: comida, veterinario y refugio.'
        : 'Este refugio todavía no configuró cómo recibir donaciones.',
      action: donationHref || transferAccounts.length ? 'donation-modal' : 'disabled',
      color: T.accent, bgColor: T.accentLt,
    },
    {
      svgIcon: <Sparkles size={22} strokeWidth={2} aria-hidden />,
      title: 'Colectas y objetivos',
      desc: 'Campañas con meta publicada: alimento, veterinaria u otras urgencias. Podés filtrar por refugio en la lista.',
      action: 'link',
      href: pathToColectas(shelterSlug),
      linkText: 'Ver colectas de este refugio',
      color: '#b45309',
      bgColor: '#fffbeb',
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
      {seo}


      {/* Hero + ficha: mobile apilado; desktop foto | datos (breakpoint 900px en theme) */}
      <div className="shelter-detail-hero-wrap">
        <div className="shelter-detail-hero-media" style={{ position: 'relative', minHeight: 220, overflow: 'hidden', marginBottom: 0, marginTop: 12, borderRadius: '16px 16px 0 0' }}>
          {config?.shelter_image_url ? (
            <>
              <img
                className="shelter-detail-hero-img"
                src={optimizeImage(config.shelter_image_url, { width: 1000, quality: 85 })}
                alt={shelterName}
                style={{ width: '100%', height: 260, objectFit: 'cover', objectPosition: config.shelter_image_position || '50% 50%', display: 'block', borderRadius: '16px 16px 0 0' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
              }} />
            </>
          ) : (
            <div
              className="shelter-detail-hero-placeholder"
              style={{
                width: '100%', height: 220,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              }}
            />
          )}
          <div className="shelter-detail-hero-titles--mob" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 20px 20px',
            color: '#fff',
          }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 2px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{shelterName}</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {locationLabel}</p>
          </div>
          <button
            type="button"
            className="btn-press shelter-detail-hero-share--mob"
            onClick={() => setShareShelterOpen(true)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: RS, color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px',
            }}
          >
            <Share2 size={16} /> Compartir
          </button>
        </div>

      {/* Info + misión */}
      <Card className="shelter-detail-hero-card" style={{ borderRadius: '0 0 20px 20px', padding: '16px 20px 20px', marginBottom: 16, marginTop: 0 }}>
        <div className="shelter-detail-hero-titles--desk">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 4px', color: T.txt, letterSpacing: -0.5 }}>{shelterName}</h1>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><MapPin size={16} style={{ flexShrink: 0 }} /> {locationLabel}</p>
            </div>
            <button
              type="button"
              className="btn-press shelter-detail-hero-share--desk"
              onClick={() => setShareShelterOpen(true)}
              style={{
                background: T.borderLt, border: `1px solid ${T.border}`,
                borderRadius: RS, color: T.txt, fontWeight: 700, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', flexShrink: 0,
              }}
            >
              <Share2 size={16} /> Compartir
            </button>
          </div>
        </div>
        {shelterMission && (
          <p style={{ fontSize: 14, color: T.txt, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>{shelterMission}</p>
        )}
        {shelterDesc && (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>{shelterDesc}</p>
        )}

        {/* CTA voluntario */}
        <div style={{ marginTop: 16 }}>
          {isVolunteer ? (
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 18px', borderRadius: RM,
                background: T.okLt, border: `1.5px solid ${T.ok}30`,
                color: T.ok, fontWeight: 800, fontSize: 14,
                marginBottom: 4,
              }}
            >
              <CircleCheckBig size={16} /> Ya sos voluntario/a
            </div>
          ) : (
            <Link
              to={`/refugio/${shelterSlug}/voluntario`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 18px', borderRadius: RM,
                background: T.accentLt, border: `1.5px solid ${T.accent}30`,
                color: T.accent, fontWeight: 800, fontSize: 14,
                textDecoration: 'none', marginBottom: 4,
              }}
            >
              {I.Paw(16)} Quiero ser voluntario/a →
            </Link>
          )}
        </div>

        {/* Stats compactos: en desktop una línea; en móvil envuelven entre bloques */}
        <div
          className="shelter-detail-stats"
          style={{
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${T.borderLt}`,
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline',
            columnGap: 10, rowGap: 6,
            fontSize: 'clamp(11px, 3.1vw, 12px)',
            color: T.muted, fontWeight: 600, lineHeight: 1.4,
            paddingLeft: 2, paddingRight: 2,
          }}
        >
          <span>
            <span style={{ color: T.txt, fontWeight: 800 }}>{adoptablePets.length}</span>
            {' en adopción'}
          </span>
          <span style={{ color: T.borderLt, userSelect: 'none' }} aria-hidden>·</span>
          <span>
            <span style={{ color: T.txt, fontWeight: 800 }}>{shelter?.total_rescued ?? '—'}</span>
            {' rescatados'}
          </span>
          <span style={{ color: T.borderLt, userSelect: 'none' }} aria-hidden>·</span>
          <span>
            <span style={{ color: T.txt, fontWeight: 800 }}>{shelter?.volunteer_subscriptions?.[0]?.count ?? 0}</span>
            {` voluntario${(shelter?.volunteer_subscriptions?.[0]?.count ?? 0) !== 1 ? 's' : ''}`}
          </span>
        </div>
      </Card>
      </div>

      {/* Success Stories Horizontal Scroll */}
      {adoptedCarouselItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: T.txt }}>Finales felices</h2>
            <Link to={`/refugio/${slug}/historias`} style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Ver todas</Link>
          </div>
          <div className="shelter-success-carousel" style={{
            width: '100%', maxWidth: '100%', minWidth: 0,
            overflowX: 'auto',
            margin: '0 -14px', padding: '0 14px 12px',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
            boxSizing: 'content-box',
          }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'nowrap', width: 'max-content', minWidth: '100%' }}>
            {adoptedCarouselItems.map((s) => (
              <div key={`${s.source}-${s.id}`} style={{ flexShrink: 0 }}>
                <div className="shelter-success-card" style={{ width: 110, position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                  <img
                    src={s.photoAfter || s.photoBefore || ''}
                    alt={s.petName}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none' }}
                    style={{
                      width: 110, height: 110, objectFit: 'cover', display: 'block',
                      objectPosition: (() => {
                        if (s.photoAfterIdx === -1) return s.adoptedPhotoPosition || '50% 50%'
                        const pos = Array.isArray(s.photoPositions) ? s.photoPositions[s.photoAfterIdx ?? 0] : null
                        if (typeof pos === 'string') return pos
                        if (pos && typeof pos.x === 'number') return `${pos.x}% ${pos.y}%`
                        return '50% 50%'
                      })(),
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6, right: 6,
                    color: '#fff', fontSize: 11, fontWeight: 800,
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  }}>{s.petName}</div>
                </div>
              </div>
            ))}
            <div style={{ width: 1, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* 5 botones de acción */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, paddingLeft: 2 }}>¿Cómo querés ayudar?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {helpOptions.map((opt, i) => {
            const isDisabled = opt.action === 'disabled'
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
                  width: 48, height: 48, borderRadius: RS,
                  background: opt.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0, color: opt.color,
                }}>{opt.svgIcon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: isDisabled ? T.muted : T.txt, marginBottom: 2 }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.4 }}>{opt.desc}</div>
                  {opt.linkText && <div style={{ fontSize: 12, color: opt.color, fontWeight: 700, marginTop: 4 }}>{opt.linkText} →</div>}
                </div>
                </div>
              )
              if (opt.action === 'whatsapp-admin') {
                const href = getWhatsAppLink(WHATSAPP_ADMIN_RAW, opt.msg)
                if (!href) return <div key={i} style={{ opacity: 0.6 }}>{content}</div>
                return <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{content}</a>
              }
              if (opt.action === 'link') return <Link key={i} to={opt.href} style={{ textDecoration: 'none' }}>{content}</Link>
              if (opt.action === 'donation-modal') return <button key={i} onClick={() => setShowDonationModal(true)} style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}>{content}</button>
              if (opt.action === 'disabled') return <div key={i}>{content}</div>
              return <div key={i}>{content}</div>
            })}
          </div>
      </div>

      {/* Pets Grid */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: T.txt }}>{adoptablePets.length} perritos en adopción</h2>
          {adoptablePets.length > 0 && (
            <button
              className="btn-press"
              onClick={() => navigate(`/adoptar?refugio=${encodeURIComponent(shelterSlug)}`)}
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
          <div className="desktop-cards-grid desktop-cards-grid--tight" style={{ display: 'grid', gridTemplateColumns: adoptablePets.length === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
            {adoptablePets.map(p => <PetCard key={p.id} pet={p} />)}
          </div>
        ) : (
          <div style={{
            width: '100%', maxWidth: '100%', minWidth: 0,
            overflowX: 'auto', paddingBottom: 16,
            margin: '0 -14px', padding: '0 14px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'nowrap', width: 'max-content', minWidth: '100%' }}>
              {adoptablePets.slice(0, SHELTER_CAROUSEL_MAX).map(p => (
                <div key={p.id} style={{ width: 180, flexShrink: 0 }}>
                  <PetCard pet={p} />
                </div>
              ))}
              <div style={{ width: 1, flexShrink: 0 }} />
            </div>
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
          <div className="desktop-cards-grid desktop-cards-grid--tight" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
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
      </div>

      {/* Eventos */}
      <div style={{ marginBottom: 20 }}>
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
          <div className="desktop-cards-grid desktop-cards-grid--tight" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
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
            <button type="button" className="btn-press" onClick={() => setEvtPage(p => Math.max(1, p - 1))} disabled={evtPage <= 1}
              style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: evtPage <= 1 ? 'default' : 'pointer' }}>
              ←
            </button>
            <button type="button" className="btn-press" onClick={() => setEvtPage(p => Math.min(Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE)), p + 1))}
              disabled={evtPage >= Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE))}
              style={{ padding: '8px 12px', borderRadius: RS, border: `1px solid ${T.border}`, background: 'transparent', fontWeight: 800, cursor: evtPage >= Math.max(1, Math.ceil((pubEvt.total || 0) / EVT_PAGE_SIZE)) ? 'default' : 'pointer' }}>
              →
            </button>
          </div>
        </div>
      </div>

      {/* Colectas activas */}
      {campaigns.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Colectas activas</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                shelterSlug={shelterSlug}
                shelterName={shelterName}
                shelterAccounts={transferAccounts}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Donaciones */}
      {(donationHref || transferAccounts.length > 0) && (
        <div style={{ marginBottom: 24 }}>
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
                  width: '100%', padding: '12px 18px', borderRadius: RS,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontWeight: 800, textDecoration: 'none',
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
                            setCopiedField(`inline-${idx}-${label}`)
                            setTimeout(() => setCopiedField(null), 2000)
                          }}
                          style={{
                            background: copiedField === `inline-${idx}-${label}` ? T.okLt : T.borderLt,
                            border: 'none', borderRadius: RS, padding: '4px 10px',
                            fontSize: 11, fontWeight: 700,
                            color: copiedField === `inline-${idx}-${label}` ? T.ok : T.muted,
                            cursor: 'pointer', flexShrink: 0, marginLeft: 8,
                          }}
                        >
                          {copiedField === `inline-${idx}-${label}` ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Sponsor CTA */}
      <Card style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Star size={28} /></div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 4 }}>
          ¿Querés apoyar a este refugio con tu marca?
        </h3>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 14 }}>
          Tu marca puede aparecer en la app y contribuir al cuidado de los perritos. Escribinos y te contamos cómo.
        </p>
        <Btn onClick={() => {
          const u = getWhatsAppLink(DEFAULT_WHATSAPP_ADMIN, `Hola! Me interesa ser sponsor de ${shelterName} y aparecer en la app.`)
          if (u) window.open(u, '_blank')
        }}>
          Quiero ser patrocinador
        </Btn>
      </Card>

      <SponsorZone tier="silver" style={{ marginBottom: 16 }} />

      {/* Contact */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Contacto</h2>
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hasShelterAdminWa ? (
            <a href={getWhatsAppBaseUrl(WHATSAPP_ADMIN_RAW)} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ok, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              {I.Phone(16)} WhatsApp
            </a>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontWeight: 600, fontSize: 14 }}>
              {I.Phone(16)} WhatsApp no configurado
            </div>
          )}
          {config?.email && (
            <a href={`mailto:${config.email}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.blue, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              <Mail size={16} /> {config.email}
            </a>
          )}
          {config?.instagram_url && (
            <a href={config.instagram_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.purple, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              {I.Instagram(16)} Instagram
            </a>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.muted, fontWeight: 600, fontSize: 14 }}>
            <MapPin size={16} /> {locationLabel}
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
            className="modal-scroll"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: T.card, borderRadius: 24,
              padding: '24px 20px 28px',
              maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 6px' }}>¡Muchas gracias!</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                Tu donación ayuda a pagar comida, veterinario y refugio para los perritos que esperan una familia.
              </p>
            </div>

            {donationHref && (
              <a
                href={donationHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px 18px', borderRadius: RM,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', marginBottom: transferAccounts.length ? 16 : 0,
                }}
              >
                <HandCoins size={18} /> Donar online
              </a>
            )}

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
                            border: 'none', borderRadius: RS, padding: '4px 10px',
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
                width: '100%', marginTop: 16, padding: '12px 0', borderRadius: RM,
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

      {/* Botón compartir también al final */}
      <button
        className="btn-press"
        onClick={() => setShareShelterOpen(true)}
        style={{
          width: '100%', padding: '12px 16px', marginTop: 16, marginBottom: 8,
          background: T.borderLt, border: `1.5px solid ${T.border}`,
          borderRadius: RM, color: T.txt, fontWeight: 700, fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Share2 size={16} /> Compartir refugio
      </button>

      {/* Datos institucionales */}
      {(config?.legal_name || config?.cuit || config?.registration_number || config?.email) && (
        <Card style={{ padding: '16px 20px', marginBottom: 16, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Datos institucionales</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {config.legal_name && (
              <div>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>Razón social</div>
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
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 2 }}>Personería jurídica</div>
                <div style={{ fontSize: 14, color: T.txt, fontWeight: 600 }}>{config.registration_number}</div>
              </div>
            )}
            <div style={{
              marginTop: 4, padding: '10px 14px', borderRadius: RS,
              background: T.okLt, border: `1px solid ${T.ok}20`,
              fontSize: 12, color: T.ok, fontWeight: 600, lineHeight: 1.5,
            }}>
              <span style={{display:'flex', gap:6, alignItems:'flex-start'}}><CircleCheckBig size={14} style={{flexShrink:0, marginTop:1}}/> Organización sin fines de lucro. Cada peso que donás va al cuidado de los perritos.</span>
            </div>
          </div>
        </Card>
      )}

      <ShareShelterModal
        open={shareShelterOpen}
        onClose={() => setShareShelterOpen(false)}
        shelter={shareShelterVm}
      />
    </div>
  )
}

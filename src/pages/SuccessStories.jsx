import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { usePetsContext as usePets } from '../context/PetsContext'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { Card, Skeleton, SponsorZone, PageLoader } from '../components/ui'
import PetCard from '../components/PetCard'
import FeaturedCarousel from '../components/FeaturedCarousel'
import { Dog, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { I } from '../components/ui/Icons'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'

export default function SuccessStories() {
  const T = useT()
  const { pets, loading } = usePets()
  const ctx = useShelterConfig()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK

  const [waitingPage, setWaitingPage] = useState(1)
  const WAITING_PAGE_SIZE = 10

  // Waiting pets: sorted by longest wait first
  const waitingPets = useMemo(() =>
    pets
      .filter(p => p.type === 'stray' && p.adoption_status !== 'adopted' && p.adoptionStatus !== 'adopted')
      .sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt)),
    [pets]
  )

  const waitingTotalPages = Math.max(1, Math.ceil(waitingPets.length / WAITING_PAGE_SIZE))
  const pagedWaiting = waitingPets.slice((waitingPage - 1) * WAITING_PAGE_SIZE, waitingPage * WAITING_PAGE_SIZE)

  const maxWaitDays = waitingPets.length > 0
    ? Math.floor((Date.now() - new Date(waitingPets[0]?.created_at || waitingPets[0]?.createdAt).getTime()) / 86400000)
    : 90

  if (loading) return <PageLoader message="Cargando historias..." />

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>

      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: T.txt, letterSpacing: -0.5 }}>
          Historias del refugio
        </h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
          Cada adopción es un final feliz. Cada perrito esperando es una historia por escribir.
        </p>
      </div>

      {/* ═══ Sponsor Zone Superior ═══ */}
      <SponsorZone tier="gold" whatsapp={WHATSAPP} style={{ marginBottom: 24 }} />

      {/* ═══ CTA intermedio ═══ */}
      <div className="anim d4" style={{
        margin: '36px 0',
        padding: '28px 20px',
        background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
        borderRadius: R,
        textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: '#fff', opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: '#fff', opacity: 0.05, pointerEvents: 'none' }} />

        <div style={{ color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
          <Heart size={44} fill="currentColor" stroke="none" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 10, lineHeight: 1.1, letterSpacing: -0.5 }}>
          Vos también podés escribir un final feliz
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 24, lineHeight: 1.5 }}>
          No hace falta adoptar para cambiar una vida. Sumate como voluntario, apadriná o doná. Cada acción cuenta.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            to="/adoptar"
            className="btn-press"
            style={{
              background: '#fff', color: T.accent,
              borderRadius: RS, padding: '14px 16px', fontWeight: 900,
              fontSize: 15, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            <Dog size={18} strokeWidth={2.5} /> Ver perritos en adopción
          </Link>
          <Link
            to="/refugios"
            className="btn-press"
            style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: RS, padding: '12px 16px', fontWeight: 800,
              fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {I.Building(18)} Ver refugios para ayudar
          </Link>
        </div>
      </div>

      {/* ═══ Sponsor Zone Inferior ═══ */}
      <SponsorZone tier="standard" whatsapp={WHATSAPP} style={{ marginBottom: 24 }} />

      {/* ═══ Esperando su familia ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: T.txt, marginBottom: 4 }}>
            Siguen esperando
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>
            Ellos también sueñan con una familia.
          </p>
        </div>
        <Link to="/adoptar" style={{ fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: 'none', flexShrink: 0, marginLeft: 8 }}>
          Ver todos →
        </Link>
      </div>

      {waitingTotalPages > 1 && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>Página {waitingPage} / {waitingTotalPages}</span>
          <div style={{ display: 'flex', background: T.bg, borderRadius: 10, padding: 2, border: `1.5px solid ${T.borderLt}` }}>
            <button className="btn-press" onClick={() => setWaitingPage(p => Math.max(1, p - 1))} disabled={waitingPage <= 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: waitingPage <= 1 ? 'default' : 'pointer', color: waitingPage <= 1 ? T.muted : T.txt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn-press" onClick={() => setWaitingPage(p => Math.min(waitingTotalPages, p + 1))} disabled={waitingPage >= waitingTotalPages}
              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: waitingPage >= waitingTotalPages ? 'default' : 'pointer', color: waitingPage >= waitingTotalPages ? T.muted : T.txt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Skeleton width={300} height={400} radius={R} />
        </div>
      ) : (
        waitingPets.length > 0 && <FeaturedCarousel pets={pagedWaiting} />
      )}

      {!loading && waitingPets.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: T.muted, fontWeight: 600 }}>
            ¡Todos los perritos encontraron familia!
          </p>
        </Card>
      )}
    </div>
  )
}

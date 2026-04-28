import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { usePhotoSwipe } from '../hooks/usePhotoSwipe'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useT, RS, RM, R } from '../theme'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { usePetsListQuery } from '../hooks/queries/usePetsQuery'
import { fetchFeaturedPets } from '../services/pets'
import { sizeLabel, sexLabel, getPetPhoto, getWhatsAppLink } from '../utils'
import { Card, SponsorZone, PetCardSkeleton } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import { Dog, MapPin, Search, Utensils, Home, Building, AlertCircle, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEFAULT_WHATSAPP } from '../lib/constants'
import { supabase } from '../lib/supabase'

export default function Adopt() {
  const T = useT()
  const navigate = useNavigate()
  const { search: qs } = useLocation()
  const showSponsor = new URLSearchParams(qs).get('apadrinar') === '1'
  const ctx = useShelterConfig()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const transferAccounts = Array.isArray(config?.transfer_accounts) ? config.transfer_accounts : []
  const [searchParams, setSearchParams] = useSearchParams()
  const PAGE_SIZE = 24
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [foodModalAccounts, setFoodModalAccounts] = useState([])
  const lastInteraction = useRef(0)
  const debounceTimer = useRef(null)

  // Keep carousel index local (don't write it to the URL), otherwise it can fight with the shelter filter querystring.
  const [carouselIdx, setCarouselIdx] = useState(0)

  const shelterSlugParam = (searchParams.get('refugio') || '').trim()
  const { items: shelters } = useSheltersPublic({ fetchAll: true })

  const [selectedShelterSlug, setSelectedShelterSlug] = useState(shelterSlugParam)

  useEffect(() => {
    // Keep UI in sync with URL (back/forward navigation)
    setSelectedShelterSlug(shelterSlugParam)
  }, [shelterSlugParam])

  const setShelterSlugParam = useCallback((nextSlug) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (!nextSlug) p.delete('refugio')
      else p.set('refugio', String(nextSlug))
      return p
    }, { replace: true })
  }, [setSearchParams])

  // Debounce search input to avoid a query per keystroke
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter, selectedShelterSlug])

  // Resolve shelter UUID from slug for server-side filter
  const selectedShelterId = selectedShelterSlug
    ? (shelters.find(s => s.slug === selectedShelterSlug)?.id ?? null)
    : null

  // Pass invalidShelter flag when a slug is selected but not yet resolved (shelters still loading)
  const shelterLoading = selectedShelterSlug && shelters.length === 0

  const petsFilters = {
    type: 'stray',
    excludeAdopted: true,
    ...(selectedShelterSlug && selectedShelterId ? { shelterId: selectedShelterId } : {}),
    ...(selectedShelterSlug && !selectedShelterId && !shelterLoading ? { invalidShelter: true } : {}),
    ...(filter !== 'all' ? { adoptionStatus: filter } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  }

  const { data: petsData, isFetching: petsLoading } = usePetsListQuery({
    page,
    pageSize: PAGE_SIZE,
    filters: petsFilters,
    enabled: !shelterLoading,
  })

  const pagedPets = petsData?.pets ?? []
  const totalCount = petsData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Featured carousel — independent query, urgentes first, global (no shelter filter)
  const { data: featuredData } = useQuery({
    queryKey: ['pets-featured'],
    queryFn: () => fetchFeaturedPets({ limit: 10 }),
    staleTime: 1000 * 60 * 2,
  })
  const featured = featuredData?.data ?? []

  useEffect(() => {
    // Clamp carousel index when featured list changes
    if (featured.length <= 0) { setCarouselIdx(0); return }
    setCarouselIdx(i => Math.max(0, Math.min(i, featured.length - 1)))
  }, [featured.length])

  // Auto-advance carousel
  useEffect(() => {
    if (featured.length <= 1) return
    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 10000) {
        setCarouselIdx(i => (i + 1) % featured.length)
        setNotesExpanded(false)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [featured.length])

  const curr = featured.length > 0 ? featured[carouselIdx % featured.length] : null

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'urgent', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><AlertCircle size={14}/> Urgentes</span> },
    { key: 'shelter', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><Building size={14}/> En refugio</span> },
    { key: 'transit', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><Home size={14}/> En tránsito</span> },
  ]

  const { handleTouchStart: handleSwipeStart, handleTouchEnd: handleSwipeEnd } = usePhotoSwipe(
    featured.length,
    () => { lastInteraction.current = Date.now(); setCarouselIdx(i => (i + 1) % featured.length); setNotesExpanded(false) },
    () => { lastInteraction.current = Date.now(); setCarouselIdx(i => (i - 1 + featured.length) % featured.length); setNotesExpanded(false) },
    30
  )

  const handleCarouselNext = () => {
    lastInteraction.current = Date.now()
    setCarouselIdx(i => (i + 1) % featured.length)
    setNotesExpanded(false)
  }

  const handleCarouselPrev = () => {
    lastInteraction.current = Date.now()
    setCarouselIdx(i => (i - 1 + featured.length) % featured.length)
    setNotesExpanded(false)
  }


  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5, color: T.txt, marginBottom: 10 }}>
          Elegí a tu compañero para siempre.
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: T.muted }}>
          Dale una oportunidad… y cambiá su vida (y la tuya).
        </p>
      </div>

      {/* ═══ Carousel grande ═══ */}
      {curr && (
        <div className="anim d1" style={{ marginBottom: 20 }}>
          {/* Dots + position indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            {featured.slice(0, Math.min(featured.length, 10)).map((_, i) => (
              <div
                key={i}
                onClick={() => { setCarouselIdx(i); lastInteraction.current = Date.now(); setNotesExpanded(false) }}
                style={{
                  width: carouselIdx % featured.length === i ? 18 : 6,
                  height: 6, borderRadius: 3, cursor: 'pointer',
                  background: carouselIdx % featured.length === i ? T.accent : T.border,
                  transition: 'all .3s',
                }}
              />
            ))}
            {featured.length > 1 && (
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginLeft: 6 }}>
                {(carouselIdx % featured.length) + 1}/{featured.length}
              </span>
            )}
          </div>

          <div key={carouselIdx} className="anim">
            <Card
              style={{
                overflow: 'hidden', borderRadius: R,
                border: curr.adoptionStatus === 'urgent' ? `2px solid ${T.urgent}` : `1.5px solid ${T.borderLt}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              }}
              onTouchStart={handleSwipeStart}
              onTouchEnd={handleSwipeEnd}
            >
              {/* Photo */}
              <div style={{ position: 'relative' }}>
                {(() => {
                  const photo = getPetPhoto(curr)
                  return photo
                    ? <img src={photo} alt={curr.name} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block', maxHeight: 400 }} decoding="async" />
                    : <div style={{ width: '100%', aspectRatio: '4/5', maxHeight: 400, background: T.purpleLt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}>{I.Dog(80)}</div>
                })()}

                {/* Badges */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                  <span style={{
                    background: curr.adoptionStatus === 'urgent' ? T.urgent : 'rgba(0,0,0,0.45)',
                    backdropFilter: curr.adoptionStatus !== 'urgent' ? 'blur(6px)' : undefined,
                    color: '#fff', padding: '5px 12px', borderRadius: RS,
                    fontSize: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}>
                    {curr.adoptionStatus === 'urgent' ? 'URGENTE' : curr.adoptionStatus === 'transit' ? 'En tránsito' : 'En refugio'}
                  </span>
                </div>

                {/* Nav arrows */}
                {featured.length > 1 && (<>
                  <button
                    className="btn-press"
                    onClick={handleCarouselPrev}
                    style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                      color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >‹</button>
                  <button
                    className="btn-press"
                    onClick={handleCarouselNext}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                      color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >›</button>
                </>)}

                {/* Name overlay */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                  padding: '60px 20px 16px', color: '#fff',
                }}>
                  <h3 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.5px' }}>{curr.name}</h3>
                  <p style={{ fontSize: 14, opacity: .95, margin: 0, fontWeight: 500 }}>
                    {[curr.age ? `${curr.age} años` : curr.breed, sexLabel(curr.sex), sizeLabel(curr.size)].filter(Boolean).join(' · ')}
                  </p>
                  {curr.waiting_number && curr.waiting_unit && (
                    <p style={{ fontSize: 12, fontWeight: 700, margin: '4px 0 0', color: 'rgba(255,200,150,0.95)' }}>
                      {curr.waiting_number} {curr.waiting_unit} esperando una familia
                    </p>
                  )}
                </div>
              </div>

              {/* Info + description */}
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.borderLt}` }}>
                {curr.neighborhood && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: curr.notes ? 8 : 0 }}>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {curr.neighborhood}</span>
                  </div>
                )}
                {curr.notes && (
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                    {notesExpanded || curr.notes.length <= 120
                      ? curr.notes
                      : curr.notes.slice(0, 120) + '...'}
                    {curr.notes.length > 120 && (
                      <button
                        onClick={() => setNotesExpanded(!notesExpanded)}
                        style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4 }}
                      >
                        {notesExpanded ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </p>
                )}
              </div>

              {/* Primary CTA */}
              <div style={{ padding: '12px 14px 8px', background: T.bg }}>
                <button
                  className="btn-press"
                  onClick={() => navigate(shelterSlug ? `/refugio/${shelterSlug}/adoptar/${curr.id}` : `/perro/${curr.id}`)}
                  style={{
                    width: '100%', padding: 14, borderRadius: RM, border: 'none',
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                    color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    boxShadow: `0 4px 14px ${T.accent}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Dog size={18}/> Ver ficha de {curr.name || 'este perrito'}
                </button>
              </div>

              {/* Secondary chips */}
              <div style={{ padding: '0 14px 14px', background: T.bg, display: 'flex', gap: 8 }}>
                <a
                  href={getWhatsAppLink(WHATSAPP, `Hola! Quiero apadrinar a ${curr.name} del refugio.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-press"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 6px', background: T.accentLt,
                    color: T.accent, borderRadius: RS, fontWeight: 700, fontSize: 13,
                    textDecoration: 'none', border: `1px solid ${T.accent}25`,
                  }}
                >
                  <Star size={14}/> Apadrinar
                </a>
                <button
                  onClick={async () => {
                    const slug = curr?.shelterSlug || shelterSlug
                    try {
                      if (slug) {
                        const { data: shelter } = await supabase.from('shelters').select('id').eq('slug', slug).single()
                        if (shelter?.id) {
                          const { data } = await supabase.from('shelter_config').select('transfer_accounts').eq('shelter_id', shelter.id).single()
                          setFoodModalAccounts(Array.isArray(data?.transfer_accounts) ? data.transfer_accounts : [])
                        } else {
                          setFoodModalAccounts(transferAccounts)
                        }
                      } else {
                        setFoodModalAccounts(transferAccounts)
                      }
                    } catch {
                      setFoodModalAccounts(transferAccounts)
                    }
                    setShowFoodModal(true)
                  }}
                  className="btn-press"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 6px', background: T.borderLt,
                    color: T.muted, borderRadius: RS, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${T.border}`, cursor: 'pointer',
                  }}
                >
                  <Utensils size={14}/> Ponerle un plato
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ Sponsor ═══ */}
      <SponsorZone tier="gold" whatsapp={WHATSAPP} style={{ marginBottom: 16 }} />

      {/* ═══ Search & Filters ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt }}>
          Todos los perritos
        </h2>
        {!petsLoading && (
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
            {totalCount} esperando
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>
          {I.Search()}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, raza, color..."
          value={search}
          onChange={handleSearchChange}
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div style={{
        display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto',
        padding: 4, background: T.borderLt, borderRadius: RM,
        border: `1px solid ${T.borderLt}`,
        WebkitOverflowScrolling: 'touch',
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            className="btn-press"
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px', borderRadius: RS,
              border: 'none',
              background: filter === f.key ? '#fff' : 'transparent',
              color: filter === f.key ? T.accent : T.muted,
              boxShadow: filter === f.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all .2s',
              flex: 1, textAlign: 'center'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!shelterSlug && shelters.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 8 }}>Elegí un refugio</div>
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto',
            margin: '0 -14px', padding: '0 14px 8px',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
          }}>
            <button
              className="btn-press"
              onClick={() => { setSelectedShelterSlug(''); setShelterSlugParam('') }}
              style={{
                flex: 1, minWidth: 100, padding: '12px 14px', borderRadius: RS,
                border: 'none',
                background: !selectedShelterSlug ? '#fff' : T.borderLt,
                color: !selectedShelterSlug ? T.accent : T.muted,
                boxShadow: !selectedShelterSlug ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Todos
            </button>
            {shelters.map(s => {
              const active = selectedShelterSlug === s.slug
              return (
                <button
                  key={s.id}
                  className="btn-press"
                  onClick={() => { setSelectedShelterSlug(s.slug); setShelterSlugParam(s.slug) }}
                  style={{
                    flex: 1, minWidth: 140, padding: '12px 14px', borderRadius: RS,
                    border: 'none',
                    background: active ? '#fff' : T.borderLt,
                    color: active ? T.accent : T.txt,
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: active ? T.accent : T.muted, fontWeight: 600, marginTop: 1 }}>
                    {[s.city, s.shelter_config?.province].filter(Boolean).join(', ') || 'Argentina'}
                  </div>
                </button>
              )
            })}
            <div style={{ width: 1, flexShrink: 0 }} />
          </div>
        </div>
      )}

      <Card style={{ padding: '8px 16px', marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontSize: 13, color: T.txt, fontWeight: 700 }}>
              {totalCount} {totalCount === 1 ? 'perrito' : 'perritos'}
            </span>
            {totalCount > 0 && (
              <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
                (Pág. {page} de {totalPages || 1})
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: T.bg, borderRadius: 10, padding: 2, border: `1.5px solid ${T.borderLt}` }}>
              <button
                className="btn-press"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent',
                  color: page <= 1 ? T.muted : T.txt,
                  cursor: page <= 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="btn-press"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent',
                  color: page >= totalPages ? T.muted : T.txt,
                  cursor: page >= totalPages ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══ Pet Grid ═══ */}
      {petsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[0, 1, 2, 3].map(i => <PetCardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {pagedPets.map((pet, i) => (
            <PetCard key={pet.id} pet={pet} delay={i % 4} showSponsor={showSponsor} />
          ))}
        </div>
      )}

      <SponsorZone tier="standard" whatsapp={WHATSAPP} style={{ marginTop: 16 }} />

      {!petsLoading && totalCount === 0 && (
        <Card style={{ padding: 32, textAlign: 'center', marginTop: 16 }}>
          <div style={{ marginBottom: 12, color: T.muted }}><Search size={40}/></div>
          <p style={{ color: T.muted, fontWeight: 600, marginBottom: 12 }}>
            {search ? 'No encontramos perritos con esa búsqueda.' : 'No hay perritos en esta categoría.'}
          </p>
          {search && (
            <button
              className="btn-press"
              onClick={() => { setSearch(''); setFilter('all') }}
              style={{
                background: T.accentLt, color: T.accent, border: 'none',
                borderRadius: RS, padding: '8px 16px', fontWeight: 700,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Ver todos los perritos
            </button>
          )}
        </Card>
      )}
      {showFoodModal && createPortal(
        <div
          onClick={() => setShowFoodModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, background: T.card, borderRadius: 24,
              padding: '24px 20px 28px', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ color: T.accent, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <Utensils size={48} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, margin: '0 0 6px' }}>Dale de comer hoy</h3>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, margin: '0 0 4px' }}>
                Con $5.000 {curr?.name || 'este perrito'} ya come toda una semana.
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                Tu donación va directo al refugio para comida y cuidados.
              </p>
            </div>

            {foodModalAccounts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {foodModalAccounts.map((acc, idx) => (
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
            ) : (
              <a
                href={getWhatsAppLink(WHATSAPP, `Hola! Quiero donar comida para los perritos del refugio.`)}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 18px', borderRadius: 14,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
                  color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none',
                }}
              >
                Coordinar por WhatsApp
              </a>
            )}

            <button
              onClick={() => setShowFoodModal(false)}
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
    </div>
  )
}

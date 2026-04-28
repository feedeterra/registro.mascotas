import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useT, RS, RM, R } from '../theme'
import { useShelterConfigContext as useShelterConfig } from '../context/ShelterConfigContext'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import { usePetsListQuery } from '../hooks/queries/usePetsQuery'
import { fetchFeaturedPets } from '../services/pets'
import { Card, SponsorZone, PetCardSkeleton } from '../components/ui'
import { I } from '../components/ui/Icons'
import PetCard from '../components/PetCard'
import FeaturedCarousel from '../components/FeaturedCarousel'
import { Search, Home, Building, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEFAULT_WHATSAPP } from '../lib/constants'

export default function Adopt() {
  const T = useT()
  const { search: qs } = useLocation()
  const showSponsor = new URLSearchParams(qs).get('apadrinar') === '1'
  const ctx = useShelterConfig()
  const shelterSlug = ctx?.shelter?.slug
  const config = ctx?.config
  const WHATSAPP = config?.whatsapp_number || DEFAULT_WHATSAPP
  const [searchParams, setSearchParams] = useSearchParams()
  const PAGE_SIZE = 24
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const debounceTimer = useRef(null)

  const shelterSlugParam = (searchParams.get('refugio') || '').trim()
  const { items: shelters } = useSheltersPublic({ fetchAll: true })

  const [selectedShelterSlug, setSelectedShelterSlug] = useState(shelterSlugParam)

  useEffect(() => {
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

  const selectedShelterId = selectedShelterSlug
    ? (shelters.find(s => s.slug === selectedShelterSlug)?.id ?? null)
    : null

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

  const { data: featuredData } = useQuery({
    queryKey: ['pets-featured'],
    queryFn: () => fetchFeaturedPets({ limit: 10 }),
    staleTime: 1000 * 60 * 2,
  })
  const featured = featuredData?.data ?? []

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'urgent', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><AlertCircle size={14}/> Urgentes</span> },
    { key: 'shelter', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><Building size={14}/> En refugio</span> },
    { key: 'transit', label: <span style={{display:'flex', gap:4, alignItems:'center'}}><Home size={14}/> En transito</span> },
  ]


  return (
    <div style={{ paddingTop: 12, paddingBottom: 24 }}>

      {/* Header */}
      <div className="anim" style={{ marginBottom: 24, padding: '0 4px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 12, color: T.txt }}>
          Elegí a tu compañero para siempre.
        </h1>
        <p style={{ fontSize: 15, color: T.muted, margin: 0, lineHeight: 1.5 }}>
          Dale una oportunidad... y cambiá su vida (y la tuya).
        </p>
      </div>

      {/* ═══ Carousel grande ═══ */}
      {featured.length > 0 && <FeaturedCarousel pets={featured} />}
    </div>
  )
}

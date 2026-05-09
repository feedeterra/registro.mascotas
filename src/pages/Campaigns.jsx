import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useT, RS } from '../theme'
import { Card, PageLoader, SEO } from '../components/ui'
import { usePublicCampaignsPaged } from '../hooks/useCampaigns'
import { useSheltersPublic } from '../hooks/useSheltersPublic'
import CampaignCard from '../components/campaigns/CampaignCard'

const PAGE_SIZE = 9

const selectStyle = (T) => ({
  padding: '5px 8px',
  borderRadius: 10,
  border: `1px solid ${T.borderLt}`,
  background: T.bg,
  color: T.txt,
  fontWeight: 600,
  fontSize: 12,
  minWidth: 0,
  maxWidth: '100%',
})

export default function Campaigns() {
  const T = useT()
  const { slug: routeShelterSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const refugioQ = (searchParams.get('refugio') || '').trim()
  const shelterQ = (searchParams.get('shelter') || '').trim()

  const [page, setPage] = useState(1)
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [shelterFilter, setShelterFilter] = useState('all')

  const { items: shelters } = useSheltersPublic({ fetchAll: true })

  const shelterOptions = useMemo(
    () =>
      [...(shelters || [])].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'es')
      ),
    [shelters]
  )

  const lockedShelter = useMemo(() => {
    if (!routeShelterSlug || !shelterOptions.length) return null
    return shelterOptions.find((s) => s.slug === routeShelterSlug) || null
  }, [routeShelterSlug, shelterOptions])

  const shelterIdForQuery = lockedShelter?.id ?? shelterFilter

  useEffect(() => {
    if (!shelters?.length) return
    if (routeShelterSlug) {
      const s = shelters.find((x) => x.slug === routeShelterSlug)
      if (s) setShelterFilter(s.id)
      return
    }
    if (shelterQ && shelters.some((s) => s.id === shelterQ)) {
      setShelterFilter(shelterQ)
      return
    }
    if (refugioQ) {
      const s = shelters.find((x) => x.slug === refugioQ)
      if (s) setShelterFilter(s.id)
    }
  }, [shelters, routeShelterSlug, refugioQ, shelterQ])

  const onShelterSelectChange = (e) => {
    const v = e.target.value
    setShelterFilter(v)
    const next = new URLSearchParams(searchParams)
    next.delete('refugio')
    next.delete('shelter')
    if (v !== 'all') {
      const sh = shelterOptions.find((s) => s.id === v)
      if (sh?.slug) next.set('refugio', sh.slug)
      else next.set('shelter', v)
    }
    setSearchParams(next, { replace: true })
  }

  const { data, isLoading, error } = usePublicCampaignsPaged({
    page,
    pageSize: PAGE_SIZE,
    urgency: urgencyFilter,
    shelterId: shelterIdForQuery,
  })

  useEffect(() => {
    setPage(1)
  }, [urgencyFilter, shelterIdForQuery])

  const campaigns = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = total <= 0 ? 1 : Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters =
    urgencyFilter !== 'all' || shelterIdForQuery !== 'all'

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageNumbers = useMemo(() => {
    const maxBtns = 5
    if (totalPages <= maxBtns) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const half = Math.floor(maxBtns / 2)
    let start = Math.max(1, page - half)
    let end = Math.min(totalPages, start + maxBtns - 1)
    start = Math.max(1, end - maxBtns + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  const seo = (
    <SEO
      title="Colectas"
      description="Colectas activas de refugios: ayudá con donaciones para objetivos concretos."
      image={null}
    />
  )

  if (isLoading && !data) return <PageLoader message="Cargando colectas..." />

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      {seo}
      <div style={{ marginBottom: 12 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: T.txt,
            letterSpacing: -0.4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Sparkles size={20} aria-hidden /> Colectas activas
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: T.muted,
            lineHeight: 1.45,
          }}
        >
          Objetivos concretos que están juntando donaciones por transferencia.
          {lockedShelter
            ? ` Mostrando las de ${lockedShelter.name}.`
            : ' Podés filtrar por urgencia y por refugio.'}
        </p>
      </div>

      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Urgencia
          </span>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{ ...selectStyle(T), minWidth: 108 }}
          >
            <option value="all">Todas</option>
            <option value="3">Alta</option>
            <option value="2">Media</option>
            <option value="1">Baja</option>
          </select>
        </label>
        {lockedShelter ? (
          <div
            style={{
              flex: '1 1 200px',
              minWidth: 0,
              maxWidth: 320,
              padding: '8px 12px',
              borderRadius: 10,
              border: `1px solid ${T.borderLt}`,
              background: T.card,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
              Refugio
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.txt }}>{lockedShelter.name}</div>
            <Link
              to="/colectas"
              style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 800, color: T.accent, textDecoration: 'none' }}
            >
              Ver colectas de todos los refugios →
            </Link>
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 160px', minWidth: 0, maxWidth: 280 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Refugio
            </span>
            <select
              value={shelterFilter}
              onChange={onShelterSelectChange}
              style={selectStyle(T)}
            >
              <option value="all">Todos</option>
              {shelterOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` — ${s.city}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        {total > 0 && (
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginLeft: 'auto' }}>
            {total === 1 ? '1 colecta' : `${total} colectas`}
          </span>
        )}
      </div>

      {error && (
        <Card
          style={{
            padding: 14,
            marginBottom: 12,
            background: T.dangerLt,
            border: `1px solid ${T.danger}20`,
          }}
        >
          <div style={{ color: T.danger, fontWeight: 700, fontSize: 13 }}>
            No se pudieron cargar las colectas.
          </div>
        </Card>
      )}

      {campaigns.length === 0 ? (
        <Card style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ color: T.muted, fontWeight: 700 }}>
            {hasActiveFilters
              ? 'No hay colectas que coincidan con los filtros.'
              : 'Todavía no hay colectas publicadas.'}
          </div>
          <Link
            to="/refugios"
            style={{
              marginTop: 10,
              display: 'inline-block',
              color: T.accent,
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            Ver refugios →
          </Link>
        </Card>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 10, maxWidth: 480, margin: '0 auto', width: '100%' }}>
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} micro />
            ))}
          </div>

          {total > 0 && (
            <Card
              style={{
                marginTop: 16,
                padding: '8px 12px',
                border: `1.5px solid ${T.borderLt}`,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="btn-press"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
                style={{
                  padding: '6px 10px',
                  borderRadius: RS,
                  border: `1.5px solid ${T.borderLt}`,
                  background: T.bg,
                  color: page <= 1 ? T.muted : T.txt,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ChevronLeft size={16} /> Ant.
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="btn-press"
                    onClick={() => setPage(n)}
                    style={{
                      minWidth: 30,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: `1.5px solid ${n === page ? T.accent : T.borderLt}`,
                      background: n === page ? T.accentLt : T.bg,
                      color: n === page ? T.accent : T.txt,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-press"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Página siguiente"
                style={{
                  padding: '6px 10px',
                  borderRadius: RS,
                  border: `1.5px solid ${T.borderLt}`,
                  background: T.bg,
                  color: page >= totalPages ? T.muted : T.txt,
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Sig. <ChevronRight size={16} />
              </button>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, width: '100%', textAlign: 'center', flexBasis: '100%' }}>
                Página {page} de {totalPages}
              </span>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useT } from '../../theme'
import { useAuthContext } from '../../context/AuthContext'
import { usePetsContext } from '../../context/PetsContext'
import { Card } from '../ui'
import HomeShelterCard from '../HomeShelterCard'
import { fetchHomeDashboard } from '../../services/home'

export default function VolunteerSubsList() {
  const T = useT()
  const { volunteerSubs, unsubscribeFromShelter } = useAuthContext()
  const { pets } = usePetsContext()
  const [unsubConfirm, setUnsubConfirm] = useState(null)
  const [actionError, setActionError] = useState('')

  const { data: homeStats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: fetchHomeDashboard,
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(volunteerSubs?.length),
  })

  const adoptableByShelter = useMemo(() => {
    const m = {}
    if (!pets?.length) return m
    for (const p of pets) {
      if (p.type !== 'stray' || String(p.adoptionStatus || '').toLowerCase() === 'adopted') continue
      const sid = p.shelterId
      if (!sid) continue
      m[sid] = (m[sid] || 0) + 1
    }
    return m
  }, [pets])

  const handleUnsub = async (shelterId) => {
    try {
      await unsubscribeFromShelter(shelterId)
      setUnsubConfirm(null)
    } catch (err) {
      setActionError(err.message || 'Error al desuscribirse')
    }
  }

  if (!volunteerSubs || volunteerSubs.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            {volunteerSubs ? 'Todavía no te suscribiste a ningún refugio para ayudar.' : 'Cargando tus suscripciones...'}
          </div>
        </Card>
        <Link
          to="/sumarme"
          style={{
            display: 'block', textAlign: 'center', padding: '14px',
            background: T.accentLt, color: T.accent, borderRadius: 16,
            fontWeight: 800, fontSize: 14, textDecoration: 'none',
            border: `2px dashed ${T.accent}40`,
          }}
        >
          + Quiero sumarme a ayudar
        </Link>
      </div>
    )
  }

  const subs = volunteerSubs || []
  const gridCols = subs.length === 1 ? '1fr' : '1fr 1fr'

  return (
    <div style={{ marginBottom: 16 }}>
      {actionError && (
        <div style={{ padding: '8px 12px', background: T.dangerLt, color: T.danger, borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {actionError}
        </div>
      )}

      <div
        className="desktop-cards-grid desktop-cards-grid--fixed"
        style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}
      >
        {subs.map((sub) => {
          const s = sub?.shelter || {}
          const cfg = Array.isArray(s.shelter_config) ? s.shelter_config[0] : s.shelter_config
          const volCount = homeStats?.perShelterVolunteers?.[sub.shelter_id] ?? 0
          const adoptableCount = adoptableByShelter[sub.shelter_id] ?? 0
          const slug = s.slug

          const cardFooter = (
            <>
              <p style={{ fontSize: 12, color: T.muted, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.45 }}>
                ¡Gracias por ayudar en esta causa!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {unsubConfirm === sub.shelter_id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleUnsub(sub.shelter_id)}
                      style={{
                        fontSize: 11, fontWeight: 800, color: T.danger,
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      Confirmar salida
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnsubConfirm(null)}
                      style={{
                        fontSize: 11, color: T.muted, fontWeight: 700,
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUnsubConfirm(sub.shelter_id)}
                    style={{
                      fontSize: 11, fontWeight: 700, color: T.muted,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    Dejar de ayudar
                  </button>
                )}
              </div>
            </>
          )

          return (
            <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {slug ? (
                <HomeShelterCard
                  to={`/refugio/${slug}`}
                  name={s.name || 'Refugio'}
                  city={s.city}
                  province={cfg?.province}
                  coverUrl={cfg?.shelter_image_url || null}
                  volCount={volCount}
                  adoptableCount={adoptableCount}
                  footer={cardFooter}
                />
              ) : (
                <Card style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: 16, textAlign: 'center', color: T.muted, fontWeight: 600 }}>
                    Refugio sin enlace público
                  </div>
                  <div style={{ borderTop: `1px solid ${T.borderLt}`, padding: '10px 12px 12px', background: T.card }}>
                    {cardFooter}
                  </div>
                </Card>
              )}
            </div>
          )
        })}
      </div>

      <Link
        to="/sumarme"
        style={{
          display: 'block', textAlign: 'center', padding: '14px',
          background: T.accentLt, color: T.accent, borderRadius: 16,
          fontWeight: 800, fontSize: 14, textDecoration: 'none',
          marginTop: 16, border: `2px dashed ${T.accent}40`,
        }}
      >
        + Quiero ayudar a otro refugio
      </Link>
    </div>
  )
}

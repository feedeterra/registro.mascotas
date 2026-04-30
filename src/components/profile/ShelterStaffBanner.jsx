import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { R } from '../../theme'
import { Shield, ChevronRight } from 'lucide-react'
import HomeShelterCard from '../HomeShelterCard'
import { fetchHomeDashboard } from '../../services/home'

export default function ShelterStaffBanner({ profile, isAdmin, isShelterStaff, staffAdoptableCount = 0 }) {
  const navigate = useNavigate()

  const { data: homeStats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: fetchHomeDashboard,
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(isShelterStaff && profile?.shelter_id && !isAdmin),
  })

  if (isAdmin) {
    return (
      <button
        type="button"
        className="btn-press"
        onClick={() => navigate('/superadmin')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: 16, background: 'linear-gradient(135deg, #111, #333)',
          color: '#fff', borderRadius: R, border: 'none', cursor: 'pointer',
          marginBottom: 16, textAlign: 'left',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Modo Super Admin</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Gestionar toda la plataforma</div>
        </div>
        <ChevronRight size={18} opacity={0.6} />
      </button>
    )
  }

  if (isShelterStaff && profile?.shelter) {
    const s = profile.shelter
    const cfg = Array.isArray(s.shelter_config) ? s.shelter_config[0] : s.shelter_config
    const volCount = profile.shelter_id ? (homeStats?.perShelterVolunteers?.[profile.shelter_id] ?? 0) : 0
    const gestionTo = s.slug ? `/refugio/${s.slug}/gestion` : '/mi-refugio'

    return (
      <div className="anim d1" style={{ marginBottom: 16 }}>
        <HomeShelterCard
          to={gestionTo}
          name={s.name || 'Tu refugio'}
          city={s.city}
          province={cfg?.province}
          coverUrl={cfg?.shelter_image_url || null}
          volCount={volCount}
          adoptableCount={staffAdoptableCount}
        />
      </div>
    )
  }

  return null
}

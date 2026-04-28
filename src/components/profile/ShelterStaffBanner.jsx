import { useNavigate } from 'react-router-dom'
import { useT, R } from '../../theme'
import { Shield, Building, ChevronRight } from 'lucide-react'

export default function ShelterStaffBanner({ profile, isAdmin, isShelterStaff }) {
  const T = useT()
  const navigate = useNavigate()

  if (isAdmin) {
    return (
      <button
        className="btn-press"
        onClick={() => navigate('/superadmin')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: 16, background: `linear-gradient(135deg, #111, #333)`,
          color: '#fff', borderRadius: R, border: 'none', cursor: 'pointer',
          marginBottom: 16, textAlign: 'left',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
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
    return (
      <button
        className="btn-press"
        onClick={() => navigate(`/refugio/${profile.shelter.slug}/gestion`)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: 16, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          color: '#fff', borderRadius: R, border: 'none', cursor: 'pointer',
          marginBottom: 16, textAlign: 'left',
          boxShadow: `0 8px 24px ${T.accent}40`,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Building size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 600 }}>Gestionás este refugio</div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.2 }}>{profile.shelter.name || 'Tu Refugio'}</div>
        </div>
        <ChevronRight size={18} opacity={0.6} />
      </button>
    )
  }

  return null
}

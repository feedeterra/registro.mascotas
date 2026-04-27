import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { Home, Dog, Heart, Building, Star, Shield, User } from 'lucide-react'

export default function Navbar() {
  const T = useT()
  const { isLogged, isAdmin, isShelterStaff, profile, shelterSlug, volunteerSubs } = useAuthContext()
  const [showShelterPicker, setShowShelterPicker] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleMyShelterClick = () => {
    if (!isLogged) return navigate('/refugios')
    if (isShelterStaff && shelterSlug) return navigate(`/refugio/${shelterSlug}`)
    const subs = volunteerSubs ?? []
    if (subs.length === 1 && subs[0].shelter?.slug) return navigate(`/refugio/${subs[0].shelter.slug}`)
    if (subs.length > 1) return setShowShelterPicker(true)
    navigate('/refugios')
  }

  return (
    <>
      {/* Top header */}
      <div style={{
        background: T.headerBg,
        color: T.txt,
        padding: '12px 16px', position: 'sticky', top: 0, zIndex: 800,
        boxShadow: `0 1px 0 ${T.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn-press"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 44 }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <Heart size={16} fill="currentColor" stroke="none" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.txt, lineHeight: 1.1 }}>Perritos</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 0.3 }}>y Refugios</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAdmin && !location.pathname.startsWith('/superadmin') && (
              <button
                className="btn-press"
                onClick={() => navigate('/superadmin')}
                style={{
                  background: T.accentLt, border: 'none',
                  borderRadius: 20, color: T.accent, padding: '6px 10px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Shield size={14} /> Admin
              </button>
            )}
            {isShelterStaff && !location.pathname.endsWith('/gestion') && (
              <button
                className="btn-press"
                onClick={() => navigate(`/refugio/${shelterSlug}/gestion`)}
                style={{
                  background: T.accentLt, border: 'none',
                  borderRadius: 20, color: T.accent, padding: '6px 10px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Building size={14} /> Mi refugio
              </button>
            )}
            {isLogged ? (
              <button
                className="btn-press"
                onClick={() => navigate('/perfil')}
                style={{
                  background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : T.accentLt,
                  border: `2px solid ${T.accent}30`, borderRadius: '50%',
                  width: 34, height: 34,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.accent, fontSize: 13, fontWeight: 800, flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {!profile?.avatar_url && (profile?.display_name?.[0]?.toUpperCase() || <User size={18} />)}
              </button>
            ) : (
              <button
                className="btn-press"
                onClick={() => navigate('/login')}
                style={{
                  background: T.accentLt, border: 'none',
                  borderRadius: 20, color: T.accent, padding: '6px 12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 800,
        background: T.card, borderTop: `1px solid ${T.border}`,
        padding: '6px 0 env(safe-area-inset-bottom, 6px)',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -2px 12px rgba(0,0,0,.04)',
      }}>
        <NavBtn icon={<Home size={20} />} label="Inicio" active={isActive('/')} onClick={() => navigate('/')} T={T} />
        <NavBtn icon={<Dog size={20} />} label="Perritos" active={isActive('/adoptar')} onClick={() => navigate('/adoptar')} T={T} />
        <NavBtn icon={<Heart size={20} />} label="Ayudar" active={isActive('/sumarme')} onClick={() => navigate('/sumarme')} T={T} highlight />
        <NavBtn
          icon={<Building size={20} />} label="Refugios"
          active={location.pathname.startsWith('/refugio/') || isActive('/refugios')}
          onClick={handleMyShelterClick}
          T={T}
        />
        <NavBtn icon={<Star size={20} />} label="Historias" active={isActive('/historias')} onClick={() => navigate('/historias')} T={T} />
      </div>

      {/* Shelter Picker Modal */}
      {showShelterPicker && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowShelterPicker(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 480, background: T.card, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: T.border, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.txt, marginBottom: 16 }}>Mis refugios</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {volunteerSubs.map(sub => (
                <button
                  key={sub.shelter_id}
                  className="btn-press"
                  onClick={() => { navigate(`/refugio/${sub.shelter.slug}`); setShowShelterPicker(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: T.bg, border: `1px solid ${T.borderLt}`, borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.txt, flex: 1 }}>{sub.shelter.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{sub.shelter.city || '—'}</div>
                </button>
              ))}
            </div>
            <button
              className="btn-press"
              onClick={() => setShowShelterPicker(false)}
              style={{ width: '100%', padding: 14, marginTop: 16, background: 'none', border: 'none', color: T.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function NavBtn({ icon, label, active, onClick, T, highlight }) {
  return (
    <button
      className="btn-press"
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
        color: active ? T.accent : T.muted,
        transition: 'color .15s', minHeight: 52, position: 'relative',
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 24, height: 3, borderRadius: '0 0 3px 3px',
          background: T.accent,
        }} />
      )}
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: active ? T.accentLt : highlight ? T.accentLt : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.2 }}>{label}</span>
    </button>
  )
}


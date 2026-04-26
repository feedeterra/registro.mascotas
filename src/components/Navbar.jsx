import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { I } from './ui/Icons'


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
              {I.HeartFill(16)}
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
                {I.Shield()} Admin
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
                {I.Building()} Mi refugio
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
                {!profile?.avatar_url && (profile?.display_name?.[0]?.toUpperCase() || I.User())}
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
        <NavBtn icon={<HomeIcon />} label="Inicio" active={isActive('/')} onClick={() => navigate('/')} T={T} />
        <NavBtn icon={<DogIcon />} label="Perros" active={isActive('/adoptar')} onClick={() => navigate('/adoptar')} T={T} />
        <NavBtn icon={<HeartNavIcon />} label="Ayudar" active={isActive('/sumarme')} onClick={() => navigate('/sumarme')} T={T} highlight />
        <NavBtn
          icon={<BuildingIcon />} label="Refugio"
          active={location.pathname.startsWith('/refugio/') || isActive('/refugios')}
          onClick={handleMyShelterClick}
          T={T}
        />
        <NavBtn icon={<StarIcon />} label="Historias" active={isActive('/historias')} onClick={() => navigate('/historias')} T={T} />
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

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function DogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5"/>
      <path d="M8 14v.5M16 14v.5"/>
      <path d="M11.25 16.25h1.5L12 17l-.75-.75z"/>
      <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/>
    </svg>
  )
}
function HeartNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

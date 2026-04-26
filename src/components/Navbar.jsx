import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { I } from './ui/Icons'

import { DEFAULT_WHATSAPP } from '../lib/constants'
const WHATSAPP = DEFAULT_WHATSAPP

export default function Navbar() {
  const T = useT()
  const { isLogged, isAdmin, isShelterStaff, profile, shelterSlug } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

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

      {/* Bottom Navigation Bar — 5 flat tabs, no FAB */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 800,
        background: T.card, borderTop: `1px solid ${T.border}`,
        padding: '6px 0 env(safe-area-inset-bottom, 6px)',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -2px 12px rgba(0,0,0,.04)',
      }}>
        <NavBtn
          icon={<HomeIcon />} label="Inicio"
          active={isActive('/')}
          onClick={() => navigate('/')}
          T={T}
        />
        <NavBtn
          icon={<DogIcon />} label="Perros"
          active={isActive('/adoptar')}
          onClick={() => navigate('/adoptar')}
          T={T}
        />
        <NavBtn
          icon={<HeartNavIcon />} label="Ayudar"
          active={isActive('/sumarme')}
          onClick={() => navigate('/sumarme')}
          T={T}
          highlight
        />
        <NavBtn
          icon={<GiftIcon />} label="Donar"
          active={isActive('/sumarme') && location.search.includes('donar')}
          onClick={() => navigate('/sumarme?step=donar')}
          T={T}
        />
        <NavBtn
          icon={isLogged ? <UserIcon /> : <LockIcon />}
          label={isLogged ? 'Perfil' : 'Ingresar'}
          active={isActive('/perfil') || isActive('/login')}
          onClick={() => navigate(isLogged ? '/perfil' : '/login')}
          T={T}
        />
      </div>
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

// Inline SVG nav icons (20px, stroke)
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
function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

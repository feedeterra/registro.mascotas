import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { I } from './ui/Icons'

import { DEFAULT_WHATSAPP } from '../lib/constants'
const WHATSAPP = DEFAULT_WHATSAPP

export default function Navbar() {
  const T = useT()
  const { isLogged, isAdmin, isShelterStaff, profile } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Top header — warm & clean */}
      <div style={{
        background: T.headerBg,
        color: T.txt,
        padding: '14px 16px', position: 'sticky', top: 0, zIndex: 800,
        boxShadow: `0 1px 0 ${T.border}`,
        borderBottom: `1px solid ${T.borderLt}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', minHeight: 44, paddingTop: 4, paddingBottom: 4 }}>
            {/* Heart logo icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 16,
            }}>
              {I.HeartFill(18)}
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: T.txt, whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                Perritos
              </h1>
              <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 0.3 }}>
                y Refugios
              </span>
            </div>
          </NavLink>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Dark mode toggle */}
            <button
              className="btn-press"
              onClick={T.toggleDark}
              style={{
                background: T.dark ? 'rgba(255,255,255,.1)' : T.borderLt,
                border: 'none', borderRadius: 20,
                color: T.muted, padding: '6px 10px',
                cursor: 'pointer', fontSize: 14, flexShrink: 0,
              }}
            >
              {T.dark ? '☀️' : '🌙'}
            </button>
            {isAdmin && (
              <button
                className="btn-press"
                onClick={() => navigate('/superadmin')}
                style={{
                  background: T.accentLt, border: 'none',
                  borderRadius: 20, color: T.accent, padding: '6px 10px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}
              >
                🛡️ Admin
              </button>
            )}
            {isShelterStaff && (
              <button
                className="btn-press"
                onClick={() => navigate('/mi-refugio')}
                style={{
                  background: T.accentLt, border: 'none',
                  borderRadius: 20, color: T.accent, padding: '6px 10px',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}
              >
                🏠 Mi refugio
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
                {!profile?.avatar_url && (profile?.display_name?.[0]?.toUpperCase() || '👤')}
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        boxShadow: '0 -2px 12px rgba(0,0,0,.04)',
      }}>
        <NavBtn
          emoji="🏠" label="Inicio"
          active={isActive('/')}
          onClick={() => navigate('/')}
          T={T}
        />
        <NavBtn
          emoji="🐾" label="Perros"
          active={isActive('/adoptar')}
          onClick={() => navigate('/adoptar')}
          T={T}
        />

        {/* Center FAB — Ayudar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/sumarme')}
            className="fab-pulse"
            style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
              color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${T.accent}40`, marginTop: -18,
            }}
          >
            ❤️
          </button>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginTop: 2 }}>Ayudar</span>
        </div>

        <NavBtn
          emoji="💰" label="Donar"
          active={isActive('/sumarme')}
          onClick={() => navigate('/sumarme?step=donar')}
          T={T}
        />
        <NavBtn
          emoji={isLogged ? '👤' : '🔒'}
          label={isLogged ? 'Perfil' : 'Ingresar'}
          active={isActive('/perfil') || isActive('/login')}
          onClick={() => navigate(isLogged ? '/perfil' : '/login')}
          T={T}
        />
      </div>
    </>
  )
}

function NavBtn({ emoji, label, active, onClick, T }) {
  return (
    <button
      className="btn-press"
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
        color: active ? T.accent : T.muted, fontSize: 12, fontWeight: 600,
        transition: 'color .2s', minHeight: 56,
      }}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
      {active && (
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: T.accent, marginTop: 1,
        }} />
      )}
    </button>
  )
}

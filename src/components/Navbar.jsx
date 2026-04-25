import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'

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
      {/* Top header — sticky & compact */}
      <div style={{
        background: T.headerBg, color: '#fff',
        padding: '12px 16px', position: 'sticky', top: 0, zIndex: 800,
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
              Refugio CASA
            </h1>
          </NavLink>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAdmin && (
              <button
                className="btn-press"
                onClick={() => navigate('/admin')}
                style={{
                  background: 'rgba(255,255,255,.15)', border: 'none',
                  borderRadius: 20, color: '#fff', padding: '5px 10px',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}
              >
                🛡️ Admin
              </button>
            )}
            {isShelterStaff && !isAdmin && (
              <button
                className="btn-press"
                onClick={() => navigate('/mi-refugio')}
                style={{
                  background: 'rgba(255,255,255,.15)', border: 'none',
                  borderRadius: 20, color: '#fff', padding: '5px 10px',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0,
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
                  background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'rgba(255,255,255,.25)',
                  border: 'none', borderRadius: 20,
                  color: '#fff', padding: '5px 12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all .2s',
                }}
              >
                🐾 {profile?.display_name?.split(' ')[0] || 'Mi perfil'}
              </button>
            ) : (
              <button
                className="btn-press"
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(255,255,255,.1)', border: 'none',
                  borderRadius: 20, color: '#fff', padding: '5px 12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
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
        boxShadow: '0 -2px 10px rgba(0,0,0,.06)',
      }}>
        <NavBtn
          emoji="🐾" label="Inicio"
          active={isActive('/')}
          onClick={() => navigate('/')}
          T={T}
        />
        <NavBtn
          emoji="🎉" label="Historias"
          active={isActive('/historias')}
          onClick={() => navigate('/historias')}
          T={T}
        />

        {/* Center FAB - Adoptar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/adoptar')}
            className="fab-pulse"
            style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none',
              background: `linear-gradient(135deg, ${T.purple}, #5b21b6)`,
              color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${T.purple}50`, marginTop: -18,
            }}
          >
            💜
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.purple, marginTop: 2 }}>Adoptar</span>
        </div>

        <NavBtn
          emoji="🏠" label="Refugio"
          active={isActive('/refugio/casa')}
          onClick={() => navigate('/refugio/casa')}
          T={T}
        />
        <NavBtn
          emoji="🏘️" label="Refugios"
          active={isActive('/refugios')}
          onClick={() => navigate('/refugios')}
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
      {label}
      {active && (
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: T.accent, marginTop: 1,
        }} />
      )}
    </button>
  )
}

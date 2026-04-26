import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { useShelterConfigContext } from '../context/ShelterConfigContext'

// Minimal SVG icons — no emojis in structural UI
const IconHome = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
)

const IconStory = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconShelter = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <rect x="9" y="12" width="6" height="9" />
    <path d="M9 2H5a2 2 0 0 0-2 2v4" />
    <path d="M15 2h4a2 2 0 0 1 2 2v4" />
  </svg>
)

const IconProfile = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLock = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconPaw = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <ellipse cx="6" cy="7" rx="2" ry="3" />
    <ellipse cx="18" cy="7" rx="2" ry="3" />
    <ellipse cx="10" cy="5" rx="2" ry="3" />
    <ellipse cx="14" cy="5" rx="2" ry="3" />
    <path d="M12 12c-2.8 0-5 2-5 4.5 0 1.5.8 2.5 2 3 .8.3 1.7.5 3 .5s2.2-.2 3-.5c1.2-.5 2-1.5 2-3 0-2.5-2.2-4.5-5-4.5z" />
  </svg>
)

const IconShield = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export default function Navbar() {
  const T = useT()
  const { isLogged, isAdmin, isShelterStaff, profile } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const ctx = useShelterConfigContext()
  const shelterName = ctx?.config?.name || ctx?.shelter?.name || null

  const isActive = (path) => location.pathname === path
  const firstName = profile?.display_name?.split(' ')[0] ?? 'Mi perfil'

  return (
    <>
      {/* Top header */}
      <div style={{
        background: T.headerBg, color: '#fff',
        padding: '0 16px',
        height: 52,
        position: 'sticky', top: 0, zIndex: 800,
        boxShadow: '0 1px 0 rgba(255,255,255,0.08), 0 2px 12px rgba(0,0,0,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0', display: 'flex', alignItems: 'center', gap: 7,
            minHeight: 44, minWidth: 44,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconPaw size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', letterSpacing: -0.2 }}>
            {shelterName ?? 'Registro de Mascotas'}
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isAdmin && (
            <button
              className="btn-press"
              onClick={() => navigate('/superadmin')}
              style={{
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 10, color: '#fff', padding: '6px 10px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                minHeight: 34,
              }}
            >
              <IconShield size={13} color="#fff" />
              Admin
            </button>
          )}
          {isShelterStaff && (
            <button
              className="btn-press"
              onClick={() => navigate('/mi-refugio')}
              style={{
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 10, color: '#fff', padding: '6px 10px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 4,
                minHeight: 34,
              }}
            >
              <IconShelter size={14} color="#fff" />
              Refugio
            </button>
          )}
          {isLogged ? (
            <button
              className="btn-press"
              onClick={() => navigate('/perfil')}
              style={{
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'rgba(255,255,255,.2)',
                border: '1.5px solid rgba(255,255,255,.3)',
                borderRadius: 20,
                color: '#fff', padding: '5px 12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                minHeight: 34,
              }}
            >
              {!profile?.avatar_url && <IconProfile size={14} color="#fff" />}
              {firstName}
            </button>
          ) : (
            <button
              className="btn-press"
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 10, color: '#fff', padding: '6px 12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                minHeight: 34,
              }}
            >
              <IconLock size={13} color="#fff" />
              Ingresar
            </button>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 800,
        background: T.card, borderTop: `1px solid ${T.borderLt}`,
        paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.05), 0 -4px 16px rgba(0,0,0,0.06)',
      }}>
        <NavBtn
          icon={<IconHome size={22} />}
          label="Inicio"
          active={isActive('/')}
          onClick={() => navigate('/')}
          T={T}
        />
        <NavBtn
          icon={<IconStory size={22} />}
          label="Historias"
          active={isActive('/historias')}
          onClick={() => navigate('/historias')}
          T={T}
        />

        {/* Center FAB */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start',
          paddingTop: 4,
        }}>
          <button
            onClick={() => navigate('/adoptar')}
            className="fab-pulse"
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: `linear-gradient(135deg, ${T.purple}, #5b21b6)`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px ${T.purple}60`,
              marginTop: -20,
              flexShrink: 0,
            }}
          >
            <IconPaw size={24} color="#fff" />
          </button>
          <span style={{
            fontSize: 10, fontWeight: 700, color: T.purple,
            marginTop: 3, letterSpacing: 0.2,
          }}>
            Adoptar
          </span>
        </div>

        <NavBtn
          icon={<IconShelter size={22} />}
          label="Refugios"
          active={location.pathname.startsWith('/refugio/') || isActive('/refugios')}
          onClick={() => navigate('/refugios')}
          T={T}
        />
        <NavBtn
          icon={isLogged ? <IconProfile size={22} /> : <IconLock size={20} />}
          label={isLogged ? 'Perfil' : 'Ingresar'}
          active={isActive('/perfil') || isActive('/login')}
          onClick={() => navigate(isLogged ? '/perfil' : '/login')}
          T={T}
        />
      </div>
    </>
  )
}

function NavBtn({ icon, label, active, onClick, T }) {
  return (
    <button
      className="btn-press"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3,
        background: 'none', border: 'none',
        padding: '8px 4px 6px', cursor: 'pointer',
        color: active ? T.accent : T.muted,
        transition: 'color .15s',
        minHeight: 56, minWidth: 44,
        position: 'relative',
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 600, lineHeight: 1 }}>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 24, height: 3, borderRadius: '0 0 3px 3px',
          background: T.accent,
        }} />
      )}
    </button>
  )
}

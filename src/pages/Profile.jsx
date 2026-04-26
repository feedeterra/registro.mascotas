import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { Btn, Card } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'
import { useToast } from '../context/ToastContext'

const VOLUNTEER_ROLE_LABELS = {
  pasear: '🦮 Pasear perros',
  alimentos: '🍽️ Donar alimentos',
  redes: '📱 Redes sociales',
  transporte: '🚗 Transporte',
  otro: '✨ Otro',
}

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const {
    isLogged, profile, userId, updateProfile, logout,
    volunteerSubs, unsubscribeFromShelter, deleteAccount,
  } = useAuthContext()
  const { pets } = usePets()
  const toast = useToast()

  const [deleteStep, setDeleteStep] = useState(null) // null | 'confirm' | 'deleting'
  const [unsubConfirm, setUnsubConfirm] = useState(null) // shelter_id
  const [actionError, setActionError] = useState('')

  if (!isLogged) {
    navigate('/login', { replace: true })
    return null
  }

  const favIds = getFavs()
  const favPets = pets.filter(p => favIds.includes(p.id))

  const handleToggle = async (field, value) => {
    try {
      await updateProfile({ [field]: value })
    } catch (err) {
      console.error('Error updating profile:', err)
      toast?.notifyError?.(err)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const handleUnsub = async (shelterId) => {
    try {
      await unsubscribeFromShelter(shelterId)
      setUnsubConfirm(null)
    } catch (err) {
      setActionError(err.message || 'Error al desuscribirse')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteStep('deleting')
    try {
      await deleteAccount()
      navigate('/', { replace: true })
    } catch (err) {
      setActionError(err.message || 'Error al eliminar la cuenta')
      setDeleteStep(null)
    }
  }

  const toggleStyle = (active) => ({
    width: 48, height: 28, borderRadius: 14,
    background: active ? T.ok : T.border,
    border: 'none', cursor: 'pointer',
    position: 'relative', transition: 'background .2s',
    flexShrink: 0,
  })

  const toggleKnob = (active) => ({
    position: 'absolute', top: 3,
    left: active ? 23 : 3,
    width: 22, height: 22, borderRadius: '50%',
    background: '#fff', transition: 'left .2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  })

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 40 }}>

      {/* Profile header */}
      <Card style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : T.accentLt,
          margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.accent, fontSize: 28, fontWeight: 800,
          border: `3px solid ${T.border}`,
        }}>
          {!profile?.avatar_url && (profile?.display_name?.[0]?.toUpperCase() || '?')}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>
          {profile?.display_name || 'Usuario'}
        </h1>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
          {profile?.email || ''}
        </p>
        {profile?.phone && (
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>📞 {profile.phone}</p>
        )}

        <div style={{
          display: 'flex', justifyContent: 'space-around', marginTop: 16, paddingTop: 16,
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.purple }}>{favIds.length}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Favoritos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>{volunteerSubs.length}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Refugios</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ok }}>
              {profile?.is_volunteer ? '✓' : '—'}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>Voluntario</div>
          </div>
        </div>
      </Card>

      {/* Mis refugios */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mis refugios</h2>
      {volunteerSubs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {volunteerSubs.map(sub => (
            <Card key={sub.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: T.purpleLt, color: T.purple,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>🏠</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>
                    {sub.shelter?.name || 'Refugio'}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    📍 {sub.shelter?.city || '—'}
                  </div>
                  {sub.roles?.length > 0 && (
                    <div style={{ fontSize: 11, color: T.accent, marginTop: 3 }}>
                      {sub.roles.map(r => VOLUNTEER_ROLE_LABELS[r] || r).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <Link
                    to={`/refugio/${sub.shelter?.slug}`}
                    style={{
                      fontSize: 12, fontWeight: 700, color: T.accent,
                      textDecoration: 'none', padding: '4px 10px',
                      background: T.accentLt, borderRadius: 8,
                    }}
                  >
                    Ver →
                  </Link>
                  {unsubConfirm === sub.shelter_id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleUnsub(sub.shelter_id)}
                        style={{
                          fontSize: 11, fontWeight: 700, color: T.danger,
                          background: T.dangerLt, border: 'none',
                          borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
                        }}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setUnsubConfirm(null)}
                        style={{
                          fontSize: 11, color: T.muted,
                          background: 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnsubConfirm(sub.shelter_id)}
                      style={{
                        fontSize: 11, fontWeight: 700, color: T.muted,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 0',
                      }}
                    >
                      Salir
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Todavía no te suscribiste a ningún refugio.{' '}
            <Link to="/refugios" style={{ color: T.accent, fontWeight: 700 }}>Ver refugios →</Link>
          </div>
        </Card>
      )}

      {/* Favoritos */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mis favoritos</h2>
      {favPets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {favPets.map(pet => <PetCard key={pet.id} pet={pet} />)}
        </div>
      ) : (
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.muted }}>
            Tocá el 💜 en los perfiles para guardar perritos acá.
          </div>
        </Card>
      )}

      {/* Cómo quiero ayudar */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Cómo quiero ayudar</h2>
      <Card style={{ marginBottom: 16 }}>
        {[
          { key: 'isVolunteer', dbKey: 'is_volunteer', label: 'Soy voluntario/a', desc: 'Disponible para ayudar al refugio' },
          { key: 'canTransit', dbKey: 'can_transit', label: 'Puedo dar tránsito', desc: 'Tengo espacio para un perrito temporal' },
          { key: 'wantsToAdopt', dbKey: 'wants_to_adopt', label: 'Quiero adoptar', desc: 'Busco un compañero peludo' },
        ].map((item, i) => (
          <div
            key={item.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderBottom: i < 2 ? `1px solid ${T.borderLt}` : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{item.desc}</div>
            </div>
            <button
              onClick={() => handleToggle(item.key, !profile?.[item.dbKey])}
              style={toggleStyle(profile?.[item.dbKey])}
            >
              <div style={toggleKnob(profile?.[item.dbKey])} />
            </button>
          </div>
        ))}
      </Card>

      {/* Errores de acciones */}
      {actionError && (
        <div style={{
          padding: '10px 14px', borderRadius: RS, marginBottom: 12,
          background: T.dangerLt, color: T.danger, fontSize: 13, fontWeight: 600,
        }}>
          {actionError}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Btn onClick={handleLogout} v="danger" sz="lg" style={{ width: '100%', justifyContent: 'center' }}>
          Cerrar sesión
        </Btn>

        {/* Eliminar cuenta */}
        {deleteStep === null && (
          <button
            onClick={() => setDeleteStep('confirm')}
            style={{
              background: 'none', border: 'none', color: T.muted,
              fontSize: 12, cursor: 'pointer', padding: '8px 0', textAlign: 'center',
            }}
          >
            Eliminar mi cuenta
          </button>
        )}

        {deleteStep === 'confirm' && (
          <Card style={{ padding: 16, background: T.dangerLt, border: `1px solid ${T.danger}30` }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.danger, marginBottom: 6 }}>
              ⚠️ ¿Eliminar cuenta?
            </div>
            <p style={{ fontSize: 12, color: T.danger, marginBottom: 12, lineHeight: 1.5 }}>
              Esta acción es irreversible. Perderás tus suscripciones, favoritos y perfil.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn v="danger" onClick={handleDeleteAccount} style={{ flex: 1, justifyContent: 'center' }}>
                Sí, eliminar
              </Btn>
              <Btn v="secondary" onClick={() => setDeleteStep(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </Btn>
            </div>
          </Card>
        )}

        {deleteStep === 'deleting' && (
          <div style={{ padding: '12px 0', textAlign: 'center', color: T.muted, fontSize: 13 }}>
            Eliminando cuenta...
          </div>
        )}
      </div>
    </div>
  )
}

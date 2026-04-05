import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePets } from '../hooks/usePets'
import { Btn, Card } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const { isLogged, profile, userId, updateProfile, logout } = useAuthContext()
  const { pets } = usePets()

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
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
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
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
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

        {/* Impact counters */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', marginTop: 16, paddingTop: 16,
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.purple }}>{favIds.length}</div>
            <div style={{ fontSize: 11, color: T.muted }}>Favoritos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>0</div>
            <div style={{ fontSize: 11, color: T.muted }}>Compartidos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ok }}>0</div>
            <div style={{ fontSize: 11, color: T.muted }}>Donaciones</div>
          </div>
        </div>
      </Card>

      {/* Favorites */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mis favoritos</h2>
      {favPets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {favPets.map(pet => <PetCard key={pet.id} pet={pet} />)}
        </div>
      ) : (
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.muted }}>
            Todavia no guardaste ningun perrito. Toca el 💜 en los perfiles para guardarlos aca.
          </div>
        </Card>
      )}

      {/* Flags */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Como quiero ayudar</h2>
      <Card style={{ marginBottom: 16 }}>
        {[
          { key: 'isVolunteer', dbKey: 'is_volunteer', label: 'Soy voluntario/a', desc: 'Disponible para ayudar al refugio' },
          { key: 'canTransit', dbKey: 'can_transit', label: 'Puedo dar transito', desc: 'Tengo espacio para un perrito temporal' },
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

      {/* Activity placeholder */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Tu actividad</h2>
      <Card style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>
          Todavia no tenes actividad
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          Guarda perritos, adopta o dona para ver tu impacto aca
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        <Btn onClick={handleLogout} v="danger" sz="lg" style={{ width: '100%', justifyContent: 'center' }}>
          Cerrar sesion
        </Btn>
      </div>
    </div>
  )
}

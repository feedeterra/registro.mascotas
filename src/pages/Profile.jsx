import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useT, RS } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext as usePets } from '../context/PetsContext'
import { Btn, Card } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'
import { useToast } from '../context/ToastContext'
import { Dog, Building, MapPin, Phone, Edit2, AlertTriangle } from 'lucide-react'

import EditProfileModal from '../components/profile/EditProfileModal'
import ShelterStaffBanner from '../components/profile/ShelterStaffBanner'
import VolunteerSubsList from '../components/profile/VolunteerSubsList'

const VOLUNTEER_ROLE_LABELS = {
  juntadas: 'Juntadas',
  transporte_personas: 'Llevar personas',
  transporte_perros: <span style={{display:'flex', gap:4, alignItems:'center'}}><Dog size={14}/> Trasladar perros</span>,
}

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isLogged, profile, userId, updateProfile, logout,
    volunteerSubs, deleteAccount, isAdmin, isShelterStaff
  } = useAuthContext()
  const { pets } = usePets()
  const toast = useToast()

  const [deleteStep, setDeleteStep] = useState(null) // null | 'confirm' | 'deleting'
  const [showEditModal, setShowEditModal] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!isLogged) navigate('/login', { replace: true, state: { returnTo: location.pathname } })
  }, [isLogged, navigate])

  if (!isLogged) return null

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

      <ShelterStaffBanner profile={profile} isAdmin={isAdmin} isShelterStaff={isShelterStaff} />

      {/* Profile header */}
      <Card style={{ padding: 24, textAlign: 'center', marginBottom: 16, position: 'relative' }}>
        <button
          onClick={() => setShowEditModal(true)}
          className="btn-press"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: T.borderLt, border: 'none', color: T.muted,
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Edit2 size={16} />
        </button>

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
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Phone size={12}/> {profile.phone}</p>
        )}
        {profile?.neighborhood && (
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><MapPin size={12}/> {profile.neighborhood}</p>
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
              {volunteerSubs.length > 0 ? '✓' : '—'}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>Voluntario</div>
          </div>
        </div>
      </Card>

      {/* Mis refugios */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mis refugios</h2>
      <VolunteerSubsList />

      {/* Favoritos */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Mis favoritos</h2>
      {favPets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {favPets.map(pet => <PetCard key={pet.id} pet={pet} />)}
        </div>
      ) : (
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.muted }}>
            Guárdá tus perritos favoritos para encontrarlos rápido. Tocá el corazón en cada perfil.
          </div>
        </Card>
      )}



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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><AlertTriangle size={18} /> ¿Eliminar cuenta?</span>
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

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={async (formData) => {
            await updateProfile(formData)
            toast?.notifyOk?.('Perfil actualizado correctamente')
          }}
        />
      )}
    </div>
  )
}

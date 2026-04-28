import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, RM, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext } from '../context/PetsContext'
import { Btn, Card } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'
import { useToast } from '../context/ToastContext'
import { Dog, Building, MapPin, Phone, Edit2, AlertTriangle, Share, Star, Megaphone } from 'lucide-react'

import EditProfileModal from '../components/profile/EditProfileModal'
import ShelterStaffBanner from '../components/profile/ShelterStaffBanner'
import VolunteerSubsList from '../components/profile/VolunteerSubsList'
import { usePublicShelterAnnouncements } from '../hooks/useShelterPublicContent'

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { session, profile, volunteerSubs, loading: authLoading, logout } = useAuthContext()
  const { pets, loading: petsLoading } = usePetsContext()
  const [showEdit, setShowEdit] = useState(false)

  // Favoritos
  const favIds = getFavs()
  const myFavs = (pets || []).filter(p => favIds.includes(p.id))

  // Data del refugio (usamos el primero por ahora)
  const mainShelterId = volunteerSubs?.[0]?.shelter_id || null
  const mainShelterSlug = volunteerSubs?.[0]?.shelter?.slug || ''
  const { items: announcements } = usePublicShelterAnnouncements(mainShelterId, { pageSize: 3 })
  const adoptedPets = (pets || []).filter(p => 
    (volunteerSubs || []).some(s => s.shelter_id === p.shelterId) && 
    p.adoptionStatus === 'adopted' && 
    p.photos?.length
  )

  if (authLoading || petsLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Cargando perfil...</div>
  }

  if (!session?.user) {
    navigate('/login')
    return null
  }

  return (
    <div className="anim" style={{ paddingBottom: 60 }}>
      {/* 1. Perfil y Métricas */}
      <Card style={{ padding: '24px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: T.accentLt, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: T.accent, border: `3px solid ${T.accent}15`
          }}>
            {profile?.display_name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 2px', color: T.txt }}>
              {profile?.display_name || 'Mi Perfil'}
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{session.user.email}</p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{
              padding: 10, borderRadius: '50%', background: T.borderLt, border: 'none',
              color: T.muted, cursor: 'pointer'
            }}
          >
            <Edit2 size={16} />
          </button>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 16, paddingTop: 16,
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          {/* 1. Perritos (Activos) */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.accent, lineHeight: 1 }}>
              {pets.filter(p => volunteerSubs.some(s => s.shelter_id === p.shelterId) && p.adoptionStatus !== 'adopted').length}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8, fontWeight: 700 }}>Perritos</div>
          </div>

          {/* 2. Adoptados */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ok, lineHeight: 1 }}>
              {pets.filter(p => volunteerSubs.some(s => s.shelter_id === p.shelterId) && p.adoptionStatus === 'adopted').length}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8, fontWeight: 700 }}>Adoptados</div>
          </div>

          {/* 3. Invitar */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <button
              onClick={() => {
                if (!mainShelterSlug) return
                const url = `${window.location.origin}/sumarme?r=${mainShelterSlug}`
                navigator.clipboard.writeText(url)
                toast?.notifyOk?.('¡Link copiado! Ya podés invitar a tus amigos.')
              }}
              className="btn-press"
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '100%', color: T.accent
              }}
            >
              <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share size={24} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginTop: 8 }}>Invitar</div>
            </button>
          </div>
        </div>
      </Card>

      {/* Mensaje de Gratitud Humano */}
      {volunteerSubs.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${T.okLt} 0%, #fff 100%)`,
          padding: '16px 20px', borderRadius: 20, marginBottom: 24,
          border: `1.5px solid ${T.ok}20`, display: 'flex', gap: 14, alignItems: 'center'
        }}>
          <div style={{ fontSize: 24 }}>✨</div>
          <p style={{ fontSize: 13, color: T.ok, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
            ¡Gracias por ayudar a <b>{volunteerSubs[0]?.shelter?.name || 'nuestra causa'}</b>! <br/>
            Tu tiempo y dedicación cambian vidas todos los días.
          </p>
        </div>
      )}

      {/* 2. Finales Felices (Carrusel) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} fill={T.accent} color={T.accent} /> Finales felices
          </h3>
          {mainShelterSlug && adoptedPets.length > 0 && (
            <Link to={`/refugio/${mainShelterSlug}/historias`} style={{ fontSize: 13, color: T.accent, fontWeight: 700, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          )}
        </div>
        
        {adoptedPets.length > 0 ? (
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            margin: '0 -20px', padding: '0 20px 12px',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
            boxSizing: 'content-box',
          }}>
            {adoptedPets.map(p => (
              <div key={p.id} style={{ flexShrink: 0 }}>
                <div style={{ width: 120, position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <img
                    src={p.photos?.[p.primaryPhotoIdx ?? 0] || p.photos?.[0] || ''}
                    alt={p.name}
                    style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8, right: 8,
                    color: '#fff', fontSize: 12, fontWeight: 800,
                  }}>{p.name}</div>
                </div>
              </div>
            ))}
            <div style={{ width: 1, flexShrink: 0 }} />
          </div>
        ) : (
          <Card style={{ padding: 20, textAlign: 'center', background: T.bgLt, border: 'none' }}>
            <div style={{ fontSize: 13, color: T.muted }}>
              ¡Pronto aparecerán aquí las historias de éxito de tu refugio! 🐾
            </div>
          </Card>
        )}
      </div>

      {/* 3. Noticias del Refugio */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} color={T.purple} /> Noticias del refugio
        </h3>
        
        {announcements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(a => (
              <Card key={a.id} style={{ padding: 0, overflow: 'hidden' }}>
                {a.image_url && (
                  <img
                    src={a.image_url}
                    alt="Noticia"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block', borderBottom: `1px solid ${T.borderLt}` }}
                  />
                )}
                <div style={{ padding: 14, fontSize: 13, color: T.txt, lineHeight: 1.5 }}>{a.body}</div>
              </Card>
            ))}
          </div>
        ) : (
          <Card style={{ padding: 20, textAlign: 'center', background: T.bgLt, border: 'none' }}>
            <div style={{ fontSize: 13, color: T.muted }}>
              No hay noticias nuevas por ahora. ¡Seguí atento! 📢
            </div>
          </Card>
        )}
      </div>

      <ShelterStaffBanner />

      {/* 4. Mis Refugios */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={18} color={T.accent} /> Mis refugios
        </h3>
        <VolunteerSubsList />
      </div>

      {/* 5. Mis Favoritos */}
      {favIds.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} color={T.purple} /> Mis favoritos
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {myFavs.map(p => <PetCard key={p.id} pet={p} />)}
          </div>
        </div>
      )}

      {/* Acciones de Cuenta */}
      <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderLt}`, paddingTop: 24 }}>
        <button
          onClick={() => {
            if (confirm('¿Cerrar sesión?')) {
              logout()
              navigate('/')
            }
          }}
          style={{
            width: '100%', padding: '14px', borderRadius: RM,
            background: T.borderLt, border: 'none', color: T.danger,
            fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 12
          }}
        >
          Cerrar Sesión
        </button>

        <button
          onClick={() => {
            if (confirm('¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) {
              alert('Por favor contactanos para procesar la eliminación de tu cuenta.')
            }
          }}
          style={{
            width: '100%', padding: '14px', background: 'none', border: 'none',
            color: T.muted, fontSize: 12, cursor: 'pointer'
          }}
        >
          Eliminar mi cuenta
        </button>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useT, RM, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext } from '../context/PetsContext'
import { Btn, Card, SponsorZone } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'
import { useToast } from '../context/ToastContext'
import { Dog, Building, MapPin, Phone, Edit2, AlertTriangle, Share, Star, Megaphone, Heart } from 'lucide-react'

import EditProfileModal from '../components/profile/EditProfileModal'
import ShelterStaffBanner from '../components/profile/ShelterStaffBanner'
import VolunteerSubsList from '../components/profile/VolunteerSubsList'
import { usePublicShelterAnnouncements } from '../hooks/useShelterPublicContent'

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { session, profile, volunteerSubs, loading: authLoading, logout, updateProfile, subscribeToShelter } = useAuthContext()
  const { pets, loading: petsLoading } = usePetsContext()
  const [showEdit, setShowEdit] = useState(false)

  // Onboarding Wizard State
  const queryParams = new URLSearchParams(window.location.search)
  const isOnboarding = queryParams.get('onboarding') === 'true'
  const [obStep, setObStep] = useState(profile?.phone ? 2 : 1)
  const [obData, setObData] = useState({ 
    displayName: profile?.display_name || '', 
    phone: profile?.phone || '' 
  })
  const [savingOb, setSavingOb] = useState(false)
  const [obShelterSearch, setObShelterSearch] = useState('')
  const [obShelterResults, setObShelterResults] = useState([])
  const [obSearching, setObSearching] = useState(false)

  const searchSheltersOb = async (q) => {
    if (!q.trim()) { setObShelterResults([]); return }
    setObSearching(true)
    const { data } = await supabase
      .from('shelters')
      .select('id, name, slug, city')
      .ilike('name', `%${q}%`)
      .limit(5)
    setObShelterResults(data || [])
    setObSearching(false)
  }

  const handleJoinShelter = async (sId) => {
    setSavingOb(true)
    try {
      await subscribeToShelter(sId)
      toast?.notifyOk?.('¡Ya sos voluntario! Ahora podés ver los perritos.')
      // No saltamos al paso 3 todavía, dejamos que el usuario vea que se unió
    } catch (e) {
      toast?.notifyError?.(e)
    } finally {
      setSavingOb(false)
    }
  }

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

  // ── ONBOARDING WIZARD ──────────────────────────────────────────
  if (isOnboarding) {
    const handleSaveStep1 = async () => {
      if (!obData.displayName.trim() || !obData.phone.trim()) {
        toast?.notifyError?.(new Error('Por favor completa todos los campos'))
        return
      }
      setSavingOb(true)
      try {
        await updateProfile({ displayName: obData.displayName, phone: obData.phone })
        setObStep(2)
      } catch (e) {
        toast?.notifyError?.(e)
      } finally {
        setSavingOb(false)
      }
    }

    return (
      <div className="anim" style={{ 
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 0'
      }}>
        <Card style={{ padding: 32, maxWidth: 440, width: '100%', borderRadius: 32 }}>
          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ 
                width: s === obStep ? 24 : 8, height: 8, borderRadius: 4, 
                background: s === obStep ? T.accent : T.border,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            ))}
          </div>

          {obStep === 1 && (
            <div className="anim-slide-up">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ 
                  width: 72, height: 72, borderRadius: 24, background: `linear-gradient(135deg, ${T.accentLt}, #fff)`, 
                  color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(192,84,45,0.12)' 
                }}>
                  <Dog size={36} strokeWidth={1.5} />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: T.txt, marginBottom: 8, letterSpacing: -0.8 }}>¡Hola! Bienvenid@</h1>
                <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.5 }}>Para empezar, necesitamos tus datos básicos de contacto.</p>
              </div>

              <div style={{ display: 'grid', gap: 20, marginBottom: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: T.txt, paddingLeft: 4 }}>Nombre completo</label>
                  <input 
                    value={obData.displayName}
                    onChange={e => setObData(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                    style={{ 
                      width: '100%', padding: '16px 18px', borderRadius: 18, 
                      border: `2px solid ${T.borderLt}`, fontSize: 15, fontWeight: 500,
                      background: '#fcfcfc', transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.borderLt}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: T.txt, paddingLeft: 4 }}>Tu WhatsApp</label>
                  <input 
                    value={obData.phone}
                    onChange={e => setObData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Ej: +54 9 11 ..."
                    style={{ 
                      width: '100%', padding: '16px 18px', borderRadius: 18, 
                      border: `2px solid ${T.borderLt}`, fontSize: 15, fontWeight: 500,
                      background: '#fcfcfc', transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.borderLt}
                  />
                </div>
              </div>

              <Btn v="accent" onClick={handleSaveStep1} loading={savingOb} style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 18, boxShadow: `0 10px 20px ${T.accent}25` }}>
                Continuar
              </Btn>
            </div>
          )}

          {obStep === 2 && (
            <div className="anim-slide-up">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ 
                  width: 72, height: 72, borderRadius: 24, background: `linear-gradient(135deg, ${T.purplePale || '#f3e8ff'}, #fff)`, 
                  color: T.purple || '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(126,34,206,0.12)' 
                }}>
                  <Building size={36} strokeWidth={1.5} />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: T.txt, marginBottom: 8, letterSpacing: -0.8 }}>Elegí un refugio</h1>
                <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.5 }}>Elegí a quién te gustaría ayudar hoy como voluntario.</p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <input 
                    value={obShelterSearch}
                    onChange={e => { setObShelterSearch(e.target.value); searchSheltersOb(e.target.value) }}
                    placeholder="Buscar refugio por nombre..."
                    style={{ 
                      width: '100%', padding: '16px 18px', borderRadius: 18, 
                      border: `2px solid ${T.borderLt}`, fontSize: 15, fontWeight: 500,
                      background: '#fcfcfc', transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.borderLt}
                  />
                  {obSearching && <div style={{ position: 'absolute', right: 18, top: 18 }}><Dog size={18} className="spin" color={T.accent} /></div>}
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {obShelterResults.map(s => {
                    const isJoined = volunteerSubs.some(sub => sub.shelter_id === s.id)
                    return (
                      <div key={s.id} className="btn-press" style={{ 
                        display: 'flex', alignItems: 'center', gap: 14, padding: 16, 
                        borderRadius: 20, background: isJoined ? '#f0fdf4' : T.bgLt, 
                        border: `2px solid ${isJoined ? T.ok : 'transparent'}`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.2s'
                      }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 12, background: isJoined ? T.okLt : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: isJoined ? T.ok : T.muted
                        }}>
                          {isJoined ? <Star size={20} fill={T.ok} /> : <Building size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: T.txt }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{s.city}</div>
                        </div>
                        {!isJoined && (
                          <button 
                            disabled={savingOb}
                            onClick={() => handleJoinShelter(s.id)}
                            style={{ 
                              padding: '10px 18px', borderRadius: 14, background: T.accent, color: '#fff', 
                              border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                              boxShadow: `0 4px 12px ${T.accent}20`
                            }}
                          >
                            Unirme
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {!obSearching && obShelterSearch && obShelterResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>No encontramos ese refugio.</p>
                      <button onClick={() => navigate('/refugios')} style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>Explorar todos →</button>
                    </div>
                  )}
                </div>
              </div>

              <Btn 
                v={volunteerSubs.length > 0 ? "accent" : "outline"}
                disabled={volunteerSubs.length === 0}
                onClick={() => navigate('/adoptar')} 
                style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 18, boxShadow: volunteerSubs.length > 0 ? `0 10px 20px ${T.accent}25` : 'none' }}
              >
                {volunteerSubs.length > 0 ? '¡Listo! Ir a ver perritos' : 'Elegí un refugio para continuar'}
              </Btn>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="anim" style={{ paddingTop: 20, paddingBottom: 60 }}>
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
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Heart size={20} fill={T.ok} color={T.ok} />
          </div>
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
          <Card style={{ padding: '24px 20px', textAlign: 'center', background: T.bgLt, border: `1px dashed ${T.borderLt}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ color: T.muted, opacity: 0.6 }}><Dog size={32} strokeWidth={1.5} /></div>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
              Pronto aparecerán aquí las historias de éxito del refugio.
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
          <Card style={{ padding: '24px 20px', textAlign: 'center', background: T.bgLt, border: `1px dashed ${T.borderLt}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ color: T.muted, opacity: 0.6 }}><Megaphone size={32} strokeWidth={1.5} /></div>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
              No hay noticias nuevas por ahora.
            </div>
          </Card>
        )}
      </div>

      <ShelterStaffBanner />

      {/* Sponsor Zone */}
      <div style={{ marginBottom: 24 }}>
        <SponsorZone tier="silver" />
      </div>

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

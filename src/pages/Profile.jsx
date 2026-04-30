import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useT, RM, R } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { usePetsContext } from '../context/PetsContext'
import { Btn, Card, SponsorZone } from '../components/ui'
import PetCard, { getFavs } from '../components/PetCard'
import { useToast } from '../context/ToastContext'
import { Dog, Building, MapPin, Edit2, Share, Star, Megaphone, Heart, Camera, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImageToFile } from '../utils'

import EditProfileModal from '../components/profile/EditProfileModal'
import ShelterStaffBanner from '../components/profile/ShelterStaffBanner'
import VolunteerSubsList from '../components/profile/VolunteerSubsList'
import { usePublicShelterAnnouncements } from '../hooks/useShelterPublicContent'
import { useSheltersPublic } from '../hooks/useSheltersPublic'

export default function Profile() {
  const T = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { session, profile, volunteerSubs, loading: authLoading, logout, updateProfile, subscribeToShelter, deleteAccount, isAdmin, isShelterStaff } = useAuthContext()
  const { pets, loading: petsLoading } = usePetsContext()
  const [showEdit, setShowEdit] = useState(false)

  // Onboarding Wizard State
  const [searchParams] = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'
  
  // Si ya tiene teléfono y ya está unido a un refugio, el onboarding está completo.
  const isFullyOnboarded = Boolean(profile?.phone) && volunteerSubs?.length > 0
  
  useEffect(() => {
    if (!authLoading && !session?.user) navigate('/login', { replace: true })
  }, [authLoading, session, navigate])

  useEffect(() => {
    if (isOnboarding && isFullyOnboarded && !authLoading) {
      navigate('/', { replace: true })
    }
  }, [isOnboarding, isFullyOnboarded, authLoading, navigate])

  const [obStep, setObStep] = useState(1)
  const obStepInited = useRef(false)
  useEffect(() => {
    if (!authLoading && !obStepInited.current) {
      obStepInited.current = true
      if (profile?.phone) setObStep(3)
    }
  }, [authLoading, profile?.phone])
  const [obData, setObData] = useState({
    displayName: profile?.display_name || '',
    phone: '',
    country: '+54 9'
  })
  const [savingOb, setSavingOb] = useState(false)
  const [obShelterSearch, setObShelterSearch] = useState('')
  const [obAvatarUrl, setObAvatarUrl] = useState(profile?.avatar_url || null)
  const [obAvatarPos, setObAvatarPos] = useState(profile?.avatar_position || { x: 50, y: 50 })
  const [obAvatarUploading, setObAvatarUploading] = useState(false)
  const [obAvatarDragging, setObAvatarDragging] = useState(false)

  const handleObAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const uid = session?.user?.id
    if (!uid) return
    setObAvatarUploading(true)
    try {
      const compressed = await compressImageToFile(file, 400, 0.7)
      const path = `avatars/${uid}/u_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const { error: upErr } = await supabase.storage.from('pet-photos').upload(path, compressed, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(path)
      setObAvatarUrl(publicUrl)
      setObAvatarPos({ x: 50, y: 50 })
    } catch { toast?.notifyError?.(new Error('Error al subir la foto')) }
    finally { setObAvatarUploading(false); e.target.value = '' }
  }

  const handleObAvatarMove = (e) => {
    if (!obAvatarDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setObAvatarPos({
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    })
  }

  const handleObSaveAvatar = async () => {
    if (obAvatarUrl) {
      setSavingOb(true)
      try { await updateProfile({ avatarUrl: obAvatarUrl, avatarPosition: obAvatarPos }) }
      catch (e) { toast?.notifyError?.(e) }
      finally { setSavingOb(false) }
    }
    setObStep(3)
  }

  // Load all public shelters for onboarding step 2
  const { items: allShelters, loading: sheltersLoading } = useSheltersPublic({ fetchAll: true })
  const obShelterResults = obShelterSearch.trim()
    ? allShelters.filter(s => s.name.toLowerCase().includes(obShelterSearch.toLowerCase()))
    : allShelters

  const handleJoinShelter = async (sId) => {
    setSavingOb(true)
    try {
      await subscribeToShelter(sId)
      toast?.notifyOk?.('¡Ya sos voluntario! Ahora podés ver los perritos.')
    } catch (e) {
      toast?.notifyError?.(e)
    } finally {
      setSavingOb(false)
    }
  }

  // Favoritos
  const favIds = getFavs()
  const myFavs = (pets || []).filter(p => favIds.includes(p.id))

  const staffAdoptableCount = useMemo(() => {
    if (!isShelterStaff || !profile?.shelter_id || !pets?.length) return 0
    return pets.filter(p =>
      p.shelterId === profile.shelter_id &&
      p.type === 'stray' &&
      String(p.adoptionStatus || '').toLowerCase() !== 'adopted',
    ).length
  }, [isShelterStaff, profile?.shelter_id, pets])

  // Data del refugio
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

  if (!session?.user) return <Navigate to="/login" replace />

  // ── ONBOARDING WIZARD ──────────────────────────────────────────
  if (isOnboarding) {
    const handleSaveStep1 = async () => {
      if (!obData.displayName.trim() || !obData.phone.trim()) {
        toast?.notifyError?.(new Error('Por favor completa todos los campos'))
        return
      }
      setSavingOb(true)
      try {
        const finalPhone = `${obData.country} ${obData.phone}`.trim()
        await updateProfile({ displayName: obData.displayName, phone: finalPhone })
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
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: s === obStep ? 24 : 8, height: 8, borderRadius: 4,
                background: s === obStep ? T.accent : s < obStep ? T.accent + '55' : T.border,
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
                  margin: '0 auto 20px', boxShadow: `0 8px 20px ${T.accent}15` 
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={obData.country}
                        onChange={e => setObData(p => ({ ...p, country: e.target.value }))}
                        style={{ 
                          position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10, width: '100%' 
                        }}
                      >
                        <option value="+54 9">Argentina (+54 9)</option>
                        <option value="+598">Uruguay (+598)</option>
                        <option value="+56">Chile (+56)</option>
                        <option value="+55">Brasil (+55)</option>
                        <option value="+591">Bolivia (+591)</option>
                        <option value="+51">Peru (+51)</option>
                        <option value="+57">Colombia (+57)</option>
                        <option value="+34">Espana (+34)</option>
                        <option value="+1">USA (+1)</option>
                        <option value="+">Otro</option>
                      </select>
                      <div style={{ 
                        padding: '16px 14px', borderRadius: 18, border: `2px solid ${T.borderLt}`, 
                        background: '#f0f0f0', color: T.muted, fontSize: 15, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 6, minWidth: 95
                      }}>
                        {obData.country.length > 1 ? obData.country : '+'}
                        <span style={{ fontSize: 10 }}>▼</span>
                      </div>
                    </div>
                    <input 
                      value={obData.phone}
                      onChange={e => setObData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                      placeholder="Ej: 11 1234 5678"
                      type="tel"
                      style={{ 
                        flex: 1, padding: '16px 18px', borderRadius: 18, 
                        border: `2px solid ${T.borderLt}`, fontSize: 15, fontWeight: 500,
                        background: '#fcfcfc', transition: 'all 0.2s', outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = T.accent}
                      onBlur={e => e.target.style.borderColor = T.borderLt}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: T.muted, paddingLeft: 4, marginTop: -4 }}>
                    {obData.country === '+54 9' 
                      ? 'Ingresá el código de área sin el 0 y el número sin el 15.' 
                      : 'Ingresá tu número con código de área completo.'}
                  </p>
                </div>
              </div>

              <Btn v="accent" onClick={handleSaveStep1} loading={savingOb} style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 18, boxShadow: `0 10px 20px ${T.accent}25` }}>
                Continuar
              </Btn>
            </div>
          )}

          {obStep === 2 && (
            <div className="anim-slide-up">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: T.txt, marginBottom: 8, letterSpacing: -0.8 }}>¿Ponemos una cara al nombre?</h1>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.5 }}>Es opcional — podés saltear esto si querés.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                <div
                  style={{ position: 'relative', width: 160, height: 160, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${T.borderLt}`, background: T.accentLt, touchAction: 'none', cursor: obAvatarUrl ? (obAvatarDragging ? 'grabbing' : 'grab') : 'default' }}
                  onMouseMove={handleObAvatarMove}
                  onMouseDown={() => setObAvatarDragging(true)}
                  onMouseUp={() => setObAvatarDragging(false)}
                  onMouseLeave={() => setObAvatarDragging(false)}
                  onTouchMove={handleObAvatarMove}
                  onTouchStart={() => setObAvatarDragging(true)}
                  onTouchEnd={() => setObAvatarDragging(false)}
                >
                  {obAvatarUrl ? (
                    <img src={obAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${obAvatarPos.x}% ${obAvatarPos.y}%`, pointerEvents: 'none' }} />
                  ) : obAvatarUploading ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader size={32} color={T.accent} className="spin" />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                      <Camera size={40} strokeWidth={1.5} />
                    </div>
                  )}
                  {obAvatarUrl && (
                    <div style={{ position: 'absolute', left: `${obAvatarPos.x}%`, top: `${obAvatarPos.y}%`, transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', border: '3px solid #fff', background: obAvatarDragging ? T.accent : 'rgba(255,255,255,0.25)', boxShadow: '0 0 8px rgba(0,0,0,0.3)', pointerEvents: 'none' }} />
                  )}
                </div>

                <label style={{ marginTop: 16, padding: '10px 24px', borderRadius: 16, background: T.accentLt, color: T.accent, fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Camera size={16} /> {obAvatarUrl ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleObAvatarFile} disabled={obAvatarUploading} />
                </label>

                {obAvatarUrl && <p style={{ fontSize: 11, color: T.muted, marginTop: 10, fontWeight: 600 }}>Arrastrá la imagen para centrar tu cara</p>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn v="accent" onClick={handleObSaveAvatar} loading={savingOb} style={{ width: '100%', height: 52, fontSize: 16, borderRadius: 18, boxShadow: `0 10px 20px ${T.accent}25` }}>
                  {obAvatarUrl ? 'Guardar y continuar' : 'Continuar sin foto'}
                </Btn>
                {obAvatarUrl && (
                  <Btn v="ghost" onClick={() => setObStep(3)} style={{ width: '100%', height: 44, fontSize: 14, borderRadius: 18 }}>
                    Saltear
                  </Btn>
                )}
              </div>
            </div>
          )}

          {obStep === 3 && (
            <div className="anim-slide-up">
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 24, background: `linear-gradient(135deg, ${T.accentLt}, #fff)`,
                  color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', boxShadow: `0 8px 20px ${T.accent}15`
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
                    onChange={e => setObShelterSearch(e.target.value)}
                    placeholder="Buscar refugio por nombre..."
                    style={{ 
                      width: '100%', padding: '16px 18px', borderRadius: 18, 
                      border: `2px solid ${T.borderLt}`, fontSize: 15, fontWeight: 500,
                      background: '#fcfcfc', transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = T.accent}
                    onBlur={e => e.target.style.borderColor = T.borderLt}
                  />
                  {sheltersLoading && <div style={{ position: 'absolute', right: 18, top: 18 }}><Dog size={18} className="spin" color={T.accent} /></div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 6, margin: '0 -4px' }}>
                  {obShelterResults.map(s => {
                    const isJoined = volunteerSubs.some(sub => sub.shelter_id === s.id)
                    return (
                      <div key={s.id} className="tap" style={{
                        position: 'relative', borderRadius: 18, overflow: 'hidden',
                        height: 130, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk || '#a0522d'})`,
                        boxShadow: isJoined ? `0 0 0 3px ${T.ok}` : '0 4px 16px rgba(0,0,0,0.10)',
                        cursor: isJoined ? 'default' : 'pointer',
                        transition: 'box-shadow 0.2s',
                        flexShrink: 0,
                      }} onClick={() => !isJoined && handleJoinShelter(s.id)}>
                        {/* Background image */}
                        {s.shelter_config?.shelter_image_url && (
                          <img src={s.shelter_config.shelter_image_url} alt={s.name} loading="lazy"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
                        {/* Joined badge */}
                        {isJoined && (
                          <div style={{
                            position: 'absolute', top: 10, right: 10,
                            background: T.ok, color: '#fff', borderRadius: 20,
                            padding: '4px 10px', fontSize: 11, fontWeight: 800,
                          }}>✓ Unido</div>
                        )}
                        {/* Content */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, lineHeight: 1.2, marginBottom: 6, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                            {s.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 8px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                                <MapPin size={10} /> {s.city || '—'}
                              </div>
                              {s.pets?.[0]?.count > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 8px', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                                  {s.pets[0].count} en adopcion
                                </div>
                              )}
                            </div>
                            {!isJoined && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: T.txt, fontWeight: 800, flexShrink: 0 }}>
                                Sumarme →
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!sheltersLoading && obShelterSearch && obShelterResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontSize: 14, color: T.muted, fontWeight: 500 }}>No encontramos ese refugio.</p>
                    </div>
                  )}
                  {!sheltersLoading && !obShelterSearch && obShelterResults.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: 13, color: T.muted, padding: '20px 0' }}>Cargando refugios...</p>
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

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="anim" style={{ paddingTop: 12, paddingBottom: 60 }}>
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

        <button
          type="button"
          className="btn-press"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: RM,
            border: `1.5px solid ${T.borderLt}`,
            background: T.bg,
            color: T.danger,
            fontWeight: 900,
            fontSize: 13,
            cursor: 'pointer',
            marginTop: 2,
          }}
        >
          Cerrar sesión
        </button>

        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 8, paddingTop: 16,
          borderTop: `1px solid ${T.borderLt}`,
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.accent, lineHeight: 1 }}>
              {pets.filter(p => volunteerSubs.some(s => s.shelter_id === p.shelterId) && p.adoptionStatus !== 'adopted').length}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8, fontWeight: 700 }}>Perritos</div>
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ok, lineHeight: 1 }}>
              {pets.filter(p => volunteerSubs.some(s => s.shelter_id === p.shelterId) && p.adoptionStatus === 'adopted').length}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8, fontWeight: 700 }}>Adoptados</div>
          </div>

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

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={18} color={T.purple} /> Noticias del refugio
        </h3>
        
        {announcements.length > 0 ? (
          <div className="desktop-cards-grid desktop-cards-grid--tight" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

      <ShelterStaffBanner
        profile={profile}
        isAdmin={isAdmin}
        isShelterStaff={isShelterStaff}
        staffAdoptableCount={staffAdoptableCount}
      />

      <div style={{ marginBottom: 24 }}>
        <SponsorZone tier="silver" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building size={18} color={T.accent} /> Mis refugios
        </h3>
        <VolunteerSubsList />
      </div>

      {favIds.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} color={T.purple} /> Mis favoritos
          </h3>
          <div className="profile-favorites-grid">
            {myFavs.map(p => <PetCard key={p.id} pet={p} />)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderLt}`, paddingTop: 24 }}>
        <button
          type="button"
          onClick={async () => {
            if (!confirm('¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.')) return
            try {
              await deleteAccount()
              navigate('/login', { replace: true })
            } catch (e) {
              toast?.notifyError?.(new Error('No se pudo eliminar la cuenta. Contactanos por WhatsApp.'))
            }
          }}
          style={{
            width: '100%', padding: '14px', background: 'none', border: 'none',
            color: T.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Eliminar mi cuenta
        </button>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  )
}

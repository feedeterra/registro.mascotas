import { useState, useEffect } from 'react'
import { useT, RS, RM, R } from '../../theme'
import { compressImage, getWhatsAppLink } from '../../utils'
import { I } from './Icons'
import { DEFAULT_WHATSAPP, DEFAULT_WHATSAPP_ADMIN } from '../../lib/constants'
import { Star, Handshake, Heart } from 'lucide-react'

export function Btn({ children, onClick, v = "primary", sz = "md", disabled, style, icon, type, loading }) {
  const T = useT()
  const vs = {
    primary: { bg: T.accent, c: "#fff", b: "none" },
    accent: { bg: T.accent, c: "#fff", b: "none" },
    secondary: { bg: "transparent", c: T.txt, b: `1.5px solid ${T.border}` },
    outline: { bg: "transparent", c: T.accent, b: `2px solid ${T.borderLt}` },
    danger: { bg: "transparent", c: T.danger, b: `1.5px solid ${T.danger}` },
    ghost: { bg: "transparent", c: T.muted, b: "none" },
    success: { bg: T.ok, c: "#fff", b: "none" },
  }
  const szs = { 
    sm: { p: "6px 12px", f: "13px", r: RS }, 
    md: { p: "10px 20px", f: "14px", r: RM }, 
    lg: { p: "14px 28px", f: "15px", r: RM } 
  }
  
  const vv = vs[v] || vs.primary
  const ss = szs[sz] || szs.md

  return (
    <button
      className="btn-press"
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: ss.p, fontSize: ss.f,
        background: (disabled || loading) ? T.border : vv.bg,
        color: (disabled || loading) ? T.muted : vv.c,
        border: vv.b, borderRadius: ss.r, fontWeight: 700,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        transition: "all .2s", ...style,
      }}
    >
      {loading ? "..." : <>{icon}{children}</>}
    </button>
  )
}

export function Card({ children, style, className, interactive, onClick, onTouchStart, onTouchEnd }) {
  const T = useT()
  const cls = [className, interactive ? 'tap' : '', 'shadow-apple'].filter(Boolean).join(' ')
  return (
    <div
      className={cls}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background: T.card, borderRadius: R,
        border: `1px solid ${T.borderLt}`,
        cursor: interactive ? 'pointer' : undefined,
        transition: 'transform .2s ease, box-shadow .2s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PhotoUp({ value, onChange, size = 120 }) {
  const T = useT()
  const [loading, setLoading] = useState(false)
  const hf = async (e) => {
    const f = e.target.files[0]
    if (f) { setLoading(true); onChange(await compressImage(f)); setLoading(false) }
  }
  return (
    <label style={{
      width: size, height: size, borderRadius: RM,
      border: `2px dashed ${value ? "transparent" : T.border}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", overflow: "hidden",
      background: value ? "transparent" : T.accentLt,
      color: T.accent, flexShrink: 0, position: "relative",
    }}>
      {loading
        ? <div style={{ animation: "pulse 1s infinite", fontSize: 14, fontWeight: 600 }}>Procesando...</div>
        : value
          ? <img src={value} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <>{I.Cam()}<span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>Subir foto</span></>
      }
      <input type="file" accept="image/*" onChange={hf} style={{ display: "none" }} />
    </label>
  )
}

export function Skeleton({ width = '100%', height = 16, radius = RS, style }) {
  return (
    <div className="skeleton" style={{
      width, height, borderRadius: radius, ...style,
    }} />
  )
}

export function PetCardSkeleton() {
  const T = useT()
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Skeleton height={180} radius={0} />
      <div style={{ padding: 16 }}>
        <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <Skeleton width="30%" height={24} radius={RS} />
          <Skeleton width="30%" height={24} radius={RS} />
        </div>
      </div>
    </Card>
  )
}

export function ShelterCardSkeleton() {
  const T = useT()
  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
      <Skeleton height={200} radius={0} />
      <div style={{ padding: 16 }}>
        <Skeleton width="70%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width="80px" height={24} radius={20} />
          <Skeleton width="100px" height={24} radius={20} />
        </div>
      </div>
    </Card>
  )
}

export function SuccessStorySkeleton() {
  const T = useT()
  return (
    <Card style={{ padding: 0, overflow: 'hidden', width: 280, flexShrink: 0 }}>
      <Skeleton height={210} radius={0} />
      <div style={{ padding: 12 }}>
        <Skeleton width="50%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={12} />
      </div>
    </Card>
  )
}

export * from './PageLoader'

export function SponsorZone({ tier = 'standard', sponsors = [], logoUrl, name, whatsapp, style }) {
  const T = useT()
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (sponsors.length <= 1) return
    const interval = setInterval(() => setCurrentIdx(i => (i + 1) % sponsors.length), 6000)
    return () => clearInterval(interval)
  }, [sponsors.length])

  const sponsor = sponsors.length > 0 ? sponsors[currentIdx % sponsors.length] : null

  if (logoUrl || sponsor?.logoUrl) {
    const logo = logoUrl || sponsor.logoUrl
    const displayName = name || sponsor?.name
    const link = sponsor?.websiteUrl || '#'
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{
        display: 'block', padding: '16px 20px', borderRadius: RM,
        background: T.sponsorLt, border: `1.5px solid ${T.sponsorBorder}`,
        textDecoration: 'none', textAlign: 'center',
        transition: 'opacity .3s',
        ...style,
      }}>
        <img src={logo} alt={displayName} style={{ maxHeight: 32, maxWidth: '60%', objectFit: 'contain', marginBottom: 4 }} />
        {displayName && <div style={{ fontSize: 11, color: T.sponsor, fontWeight: 700 }}>{displayName}</div>}
      </a>
    )
  }

  const ts = {
    gold: { bg: `linear-gradient(135deg, #fdf8ec, #f5e6c8)`, border: T.sponsorBorder, icon: <Star size={16} />, label: 'Espacio Premium' },
    silver: { bg: T.card, border: T.sponsorBorder, icon: <Handshake size={16} />, label: 'Espacio Patrocinador' },
    standard: { bg: T.card, border: T.border, icon: <Heart size={16} />, label: 'Patrociná esta sección' },
  }[tier] || { bg: T.card, border: T.border, icon: <Heart size={16} />, label: 'Patrociná esta sección' }

  // All sponsors go to the app owner (Federico)
  const targetWhatsapp = DEFAULT_WHATSAPP
  const sponsorMsg = name 
    ? `Hola! Me interesa ser sponsor de la sección de ${name} en la app Perritos y Refugios.`
    : `Hola! Quiero ser sponsor de la app Perritos y Refugios.`

  const sponsorHref = getWhatsAppLink(targetWhatsapp, sponsorMsg)
  if (!sponsorHref) return null

  return (
    <a
      href={sponsorHref}
      target="_blank"
      rel="noopener noreferrer"
      className="tap"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: RM,
        background: ts.bg, border: `1.5px dashed ${ts.border}`,
        textDecoration: 'none', gap: 10,
        ...style,
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: T.sponsor, fontWeight: 800, letterSpacing: '.3px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {ts.icon} <span>{ts.label}</span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Tu marca puede ayudar a los perritos</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, color: T.accent,
        background: '#fff', borderRadius: RS,
        padding: '5px 12px', flexShrink: 0, whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        Contactar →
      </div>
    </a>
  )
}

export function Badge({ children, bg, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: RS,
      fontSize: 12, fontWeight: 800,
      background: bg, color, letterSpacing: ".2px",
    }}>
      {children}
    </span>
  )
}
export { default as SEO } from '../SEO'

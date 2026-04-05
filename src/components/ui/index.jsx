import { useState, useEffect } from 'react'
import { useT, RS, R } from '../../theme'
import { compressImage } from '../../utils'
import { I } from './Icons'

export function Btn({ children, onClick, v = "primary", sz = "md", disabled, style, icon, type }) {
  const T = useT()
  const vs = {
    primary: { bg: T.accent, c: "#fff", b: "none" },
    secondary: { bg: "transparent", c: T.txt, b: `1.5px solid ${T.border}` },
    danger: { bg: "transparent", c: T.danger, b: `1.5px solid ${T.dangerLt}` },
    ghost: { bg: "transparent", c: T.muted, b: "none" },
    success: { bg: T.ok, c: "#fff", b: "none" },
  }
  const szs = { sm: { p: "6px 12px", f: "13px" }, md: { p: "10px 20px", f: "14px" }, lg: { p: "14px 28px", f: "15px" } }
  const vv = vs[v], ss = szs[sz]
  return (
    <button
      className="btn-press"
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: ss.p, fontSize: ss.f,
        background: disabled ? T.border : vv.bg,
        color: disabled ? T.muted : vv.c,
        border: vv.b, borderRadius: RS, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: "6px",
        transition: "all .2s", ...style,
      }}
    >
      {icon}{children}
    </button>
  )
}

export function Card({ children, style, className, interactive, onTouchStart, onTouchEnd }) {
  const T = useT()
  const cls = [className, interactive ? 'tap' : ''].filter(Boolean).join(' ')
  return (
    <div
      className={cls}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        background: T.card, borderRadius: R,
        border: `1px solid ${T.borderLt}`,
        boxShadow: T.shadow,
        cursor: interactive ? 'pointer' : undefined,
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
      width: size, height: size, borderRadius: R,
      border: `2px dashed ${value ? "transparent" : T.border}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", overflow: "hidden",
      background: value ? "transparent" : T.accentLt,
      color: T.accent, flexShrink: 0, position: "relative",
    }}>
      {loading
        ? <div style={{ animation: "pulse 1s infinite", fontSize: 14, fontWeight: 600 }}>Procesando...</div>
        : value
          ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

export function SponsorZone({ tier = 'standard', sponsors = [], logoUrl, name, style }) {
  const T = useT()
  const [currentIdx, setCurrentIdx] = useState(0)

  // Rotate sponsors if multiple provided
  useEffect(() => {
    if (sponsors.length <= 1) return
    const interval = setInterval(() => setCurrentIdx(i => (i + 1) % sponsors.length), 6000)
    return () => clearInterval(interval)
  }, [sponsors.length])

  const sponsor = sponsors.length > 0 ? sponsors[currentIdx % sponsors.length] : null

  // If a real sponsor with logo exists, show it
  if (logoUrl || sponsor?.logoUrl) {
    const logo = logoUrl || sponsor.logoUrl
    const displayName = name || sponsor?.name
    const link = sponsor?.websiteUrl || '#'
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{
        display: 'block', padding: '14px 20px', borderRadius: RS,
        background: T.sponsorLt, border: `1px solid ${T.sponsorBorder}`,
        textDecoration: 'none', textAlign: 'center',
        transition: 'opacity .3s',
        ...style,
      }}>
        <img src={logo} alt={displayName} style={{ maxHeight: 32, maxWidth: '60%', objectFit: 'contain', marginBottom: 4 }} />
        {displayName && <div style={{ fontSize: 11, color: T.sponsor, fontWeight: 600 }}>{displayName}</div>}
        {sponsor?.tagline && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sponsor.tagline}</div>}
      </a>
    )
  }

  // If sponsor data exists but no logo (prototype mode)
  if (sponsor && !sponsor.logoUrl) {
    const tierConfig = {
      gold: { bg: `linear-gradient(135deg, #fdf8ec, #f5e6c8)`, border: T.sponsorBorder },
      silver: { bg: T.card, border: T.sponsorBorder },
      standard: { bg: T.card, border: T.border },
    }
    const tc = tierConfig[tier] || tierConfig.standard
    return (
      <div style={{
        padding: '14px 20px', borderRadius: RS,
        background: tc.bg, border: `1.5px solid ${tc.border}`,
        textAlign: 'center',
        ...style,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.sponsor }}>{sponsor.name}</div>
        {sponsor.tagline && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sponsor.tagline}</div>}
        <div style={{ fontSize: 10, color: T.sponsor, marginTop: 4, fontWeight: 600, opacity: 0.7 }}>
          Patrocinador del refugio
        </div>
      </div>
    )
  }

  // Default: placeholder CTA to become a sponsor
  const tierStyles = {
    gold: { bg: `linear-gradient(135deg, #fdf8ec, #f5e6c8)`, border: T.sponsorBorder, icon: '⭐', label: 'Espacio Premium' },
    silver: { bg: T.card, border: T.sponsorBorder, icon: '🤝', label: 'Espacio Patrocinador' },
    standard: { bg: T.card, border: T.border, icon: '💛', label: 'Patrocina esta seccion' },
  }
  const ts = tierStyles[tier] || tierStyles.standard
  return (
    <a
      href="https://wa.me/5492346306562?text=Hola!%20Me%20interesa%20patrocinar%20un%20espacio%20en%20la%20app%20de%20Refugio%20CASA"
      target="_blank" rel="noopener noreferrer"
      className="tap"
      style={{
        display: 'block', padding: '16px 20px', borderRadius: RS,
        background: ts.bg, border: `1.5px solid ${ts.border}`,
        textAlign: 'center', textDecoration: 'none',
        ...style,
      }}
    >
      <div style={{ fontSize: 12, color: T.sponsor, fontWeight: 700, letterSpacing: '.3px' }}>
        {ts.icon} {ts.label}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
        Tu marca puede ayudar a los perritos
      </div>
    </a>
  )
}

export function Badge({ children, bg, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700,
      background: bg, color, letterSpacing: ".3px",
    }}>
      {children}
    </span>
  )
}

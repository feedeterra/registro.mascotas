import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useT } from '../theme'
import { useAuthContext } from '../context/AuthContext'
import { useAppConfig } from '../hooks/useAppConfig'
import { useShelterPublicConfig } from '../hooks/useShelterConfig'
import { supabase } from '../lib/supabase'

/**
 * Separador entre avisos de distintos refugios.
 * Em space (\u2003) + nbsp + punto medio: se ve más aire que solo nbsp; white-space:pre evita colapso.
 */
const JOIN = '\u2003\u2003\u00A0\u00B7\u00A0\u2003\u2003'
const MAX_TOTAL = 520
const MAX_EACH = 220

function refugioSlugFromPath(pathname) {
  const m = pathname.match(/^\/refugio\/([^/]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function standalonePetIdFromPath(pathname) {
  const m = pathname.match(/^\/perro\/([^/]+)/)
  return m ? m[1] : null
}

function embeddedShelterName(row) {
  const s = row?.shelters
  if (!s) return null
  return Array.isArray(s) ? s[0]?.name : s?.name
}

function rawShelterBannerText(cfg) {
  if (!cfg?.announcement_active) return ''
  const t = (cfg.announcement_text || '').trim()
  return t || ''
}

function rawGlobalBannerText(app) {
  if (!app?.global_banner_active) return ''
  const t = (app.global_banner_text || '').trim()
  return t || ''
}

function labeledLine(displayName, text) {
  const t = (text || '').trim()
  if (!t) return ''
  const label = (displayName || '').trim() || 'Refugio'
  return `${label}: ${t}`
}

function truncatePart(s, max) {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function joinLimited(parts) {
  const cleaned = parts.map(p => truncatePart(p.trim(), MAX_EACH)).filter(Boolean)
  let out = cleaned.join(JOIN)
  if (out.length > MAX_TOTAL) out = `${out.slice(0, MAX_TOTAL - 1)}…`
  return out
}

export default function AnnouncementBar() {
  const T = useT()
  const location = useLocation()
  const { isLogged, profile, volunteerSubs } = useAuthContext()
  const { config: appConfig } = useAppConfig()

  const refugioSlug = useMemo(() => refugioSlugFromPath(location.pathname), [location.pathname])
  const standalonePetId = useMemo(() => standalonePetIdFromPath(location.pathname), [location.pathname])

  const { config: refugioConfig, shelter: refugioShelter, loading: refugioLoading } =
    useShelterPublicConfig(refugioSlug)

  const [petShelterBannerResolved, setPetShelterBannerResolved] = useState(!standalonePetId)
  const [petShelterCfg, setPetShelterCfg] = useState(null)
  const [petShelterName, setPetShelterName] = useState(null)
  const [petHasShelter, setPetHasShelter] = useState(false)

  useEffect(() => {
    if (!standalonePetId) {
      setPetShelterCfg(null)
      setPetShelterName(null)
      setPetHasShelter(false)
      setPetShelterBannerResolved(true)
      return
    }
    setPetShelterBannerResolved(false)
    let cancelled = false
    ;(async () => {
      const { data: pet } = await supabase
        .from('pets')
        .select('shelter_id, shelters(name)')
        .eq('id', standalonePetId)
        .maybeSingle()
      if (cancelled) return
      const sid = pet?.shelter_id ?? null
      const sname = pet?.shelters
        ? (Array.isArray(pet.shelters) ? pet.shelters[0]?.name : pet.shelters?.name)
        : null
      if (!sid) {
        setPetShelterCfg(null)
        setPetShelterName(null)
        setPetHasShelter(false)
        setPetShelterBannerResolved(true)
        return
      }
      setPetHasShelter(true)
      setPetShelterName(sname || null)
      let row = null
      const { data: byShelter } = await supabase.from('shelter_config').select('*').eq('shelter_id', sid).maybeSingle()
      row = byShelter
      if (!row) {
        const { data: byId } = await supabase.from('shelter_config').select('*').eq('id', sid).maybeSingle()
        row = byId
      }
      if (!cancelled) {
        setPetShelterCfg(row)
        setPetShelterBannerResolved(true)
      }
    })()
    return () => { cancelled = true }
  }, [standalonePetId])

  const memberShelterIds = useMemo(() => {
    const ids = new Set()
    if (profile?.shelter_id) ids.add(profile.shelter_id)
    for (const s of volunteerSubs || []) {
      if (s.shelter_id) ids.add(s.shelter_id)
    }
    return [...ids]
  }, [profile?.shelter_id, volunteerSubs])

  const [memberConfigs, setMemberConfigs] = useState([])

  const shelterOnly = !!refugioSlug || (!!standalonePetId && petShelterBannerResolved && petHasShelter)

  useEffect(() => {
    if (!isLogged || !memberShelterIds.length || shelterOnly) {
      setMemberConfigs([])
      return
    }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('shelter_config')
        .select('shelter_id, announcement_text, announcement_active, shelters(name)')
        .in('shelter_id', memberShelterIds)
      if (cancelled) return
      setMemberConfigs(data || [])
    })()
    return () => { cancelled = true }
  }, [isLogged, shelterOnly, memberShelterIds])

  const displayText = useMemo(() => {
    if (standalonePetId && !petShelterBannerResolved) return null

    if (shelterOnly) {
      let cfg = null
      let displayName = 'Refugio'
      if (refugioSlug) {
        if (refugioLoading) return null
        cfg = refugioConfig
        displayName = refugioShelter?.name || refugioConfig?.name || 'Refugio'
      } else {
        cfg = petShelterCfg
        displayName = petShelterName || petShelterCfg?.name || 'Refugio'
      }
      const raw = rawShelterBannerText(cfg)
      if (!raw) return ''
      return labeledLine(displayName, raw)
    }

    const globalRaw = rawGlobalBannerText(appConfig)
    const loggedWithShelters = isLogged && memberShelterIds.length > 0

    if (!loggedWithShelters) {
      if (!globalRaw) return ''
      return labeledLine('Perritos y refugios', globalRaw)
    }

    const parts = []
    if (globalRaw) parts.push(labeledLine('Perritos y refugios', globalRaw))
    for (const c of memberConfigs) {
      const raw = rawShelterBannerText(c)
      if (!raw) continue
      const nm = embeddedShelterName(c) || 'Refugio'
      parts.push(labeledLine(nm, raw))
    }
    if (!parts.length) return ''
    return joinLimited(parts)
  }, [
    standalonePetId,
    petShelterBannerResolved,
    shelterOnly,
    refugioSlug,
    refugioLoading,
    refugioConfig,
    refugioShelter,
    petShelterCfg,
    petShelterName,
    appConfig,
    isLogged,
    memberShelterIds.length,
    memberConfigs,
  ])

  if (displayText == null || displayText === '') return null

  return (
    <AnnouncementBarInner displayText={displayText} T={T} />
  )
}

function AnnouncementBarInner({ displayText, T }) {
  const trackRef = useRef(null)
  const measureRef = useRef(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)
  const [metrics, setMetrics] = useState({ textW: 0, viewW: 0 })

  const measureOverflow = useCallback(() => {
    const track = trackRef.current
    const ghost = measureRef.current
    if (!track || !ghost) return
    const textW = ghost.getBoundingClientRect().width
    const viewW = track.getBoundingClientRect().width
    const byPixels = textW > viewW + 2
    const byLength = displayText.length > 26
    setNeedsMarquee(byPixels || byLength)
    setMetrics({ textW, viewW })
  }, [displayText])

  useLayoutEffect(() => {
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => measureOverflow())
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [displayText, measureOverflow])

  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measureOverflow())
    ro.observe(track)
    window.addEventListener('resize', measureOverflow)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measureOverflow)
    }
  }, [measureOverflow])

  // Velocidad basada en píxeles (más consistente que length).
  // Distancia aproximada: entra desde la derecha (viewW) + recorre todo el texto (textW).
  // Si el texto es largo, aumentamos la velocidad para que no sea eterna.
  const durationSec = useMemo(() => {
    const { textW, viewW } = metrics
    // px/s más bajo = animación más lenta y legible.
    const baseSpeed = 62
    const bonus = textW > 900 ? 28 : textW > 650 ? 18 : 0
    const speed = baseSpeed + bonus
    const dist = Math.max(0, textW + viewW)
    const raw = dist > 0 ? dist / speed : displayText.length * 0.22
    return Math.min(72, Math.max(14, raw))
  }, [metrics, displayText.length])

  return (
    <>
      <style>{`
        @keyframes announcement-bar-marquee {
          0% { transform: translate3d(var(--marquee-start, 0px), 0, 0); }
          100% { transform: translate3d(var(--marquee-end, 0px), 0, 0); }
        }
        .announcement-bar-marquee-inner {
          display: inline-block;
          white-space: pre;
          width: max-content;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .announcement-bar-marquee-inner {
            animation: none !important;
          }
          .announcement-bar-track--scroll {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
      <div
        role="region"
        aria-label="Avisos"
        style={{
          background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
          color: '#fff',
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          position: 'relative',
          lineHeight: 1.35,
          overflow: 'hidden',
        }}
      >
        <span
          ref={measureRef}
          aria-hidden
          style={{
            position: 'fixed',
            left: -99999,
            top: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
            whiteSpace: 'pre',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          {displayText}
        </span>
        <div
          ref={trackRef}
          className={needsMarquee ? 'announcement-bar-track--scroll' : undefined}
          style={{
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
          }}
        >
          {needsMarquee ? (
            <div
              className="announcement-bar-marquee-inner"
              style={{
                animation: `announcement-bar-marquee ${durationSec}s linear infinite`,
                // Arranca fuera de pantalla (desde la derecha) y termina cuando se va completo por la izquierda.
                '--marquee-start': `${metrics.viewW}px`,
                '--marquee-end': `${-metrics.textW}px`,
              }}
            >
              {displayText}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                minWidth: 0,
              }}
            >
              <span style={{ whiteSpace: 'pre' }}>{displayText}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

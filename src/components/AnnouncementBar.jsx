import { useState, useEffect, useMemo } from 'react'
import { useT } from '../theme'
import { useShelterConfig, useShelterPublicConfig } from '../hooks/useShelterConfig'
import { useActiveShelterAnnouncement } from '../hooks/useShelterPublicContent'

export default function AnnouncementBar() {
  const T = useT()
  const ctx = useShelterConfig()
  const config = ctx?.config
  const { shelter } = useShelterPublicConfig('casa')
  const { announcement } = useActiveShelterAnnouncement(shelter?.id || null)
  const [dismissed, setDismissed] = useState(false)

  const text = announcement?.body || config?.announcement_text || ''
  const active = announcement ? true : !!config?.announcement_active
  if (!active || !text || dismissed) return null

  // Check if announcement has expired
  if (!announcement && config.announcement_end_date && new Date(config.announcement_end_date) < new Date()) return null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
      color: '#fff', padding: '8px 40px 8px 14px',
      fontSize: 13, fontWeight: 600, textAlign: 'center',
      position: 'relative', lineHeight: 1.4,
    }}>
      {text}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
          fontSize: 16, cursor: 'pointer', padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  )
}

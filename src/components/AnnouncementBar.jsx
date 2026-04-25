import { useState, useEffect, useMemo } from 'react'
import { useT } from '../theme'
import { useShelterConfig } from '../hooks/useShelterConfig'

export default function AnnouncementBar() {
  const T = useT()
  const ctx = useShelterConfig()
  const config = ctx?.config
  const [dismissed, setDismissed] = useState(false)

  if (!config?.announcement_active || !config?.announcement_text || dismissed) return null

  // Check if announcement has expired
  if (config.announcement_end_date && new Date(config.announcement_end_date) < new Date()) return null

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
      color: '#fff', padding: '8px 40px 8px 14px',
      fontSize: 13, fontWeight: 600, textAlign: 'center',
      position: 'relative', lineHeight: 1.4,
    }}>
      {config.announcement_text}
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

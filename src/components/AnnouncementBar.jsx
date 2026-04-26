import { useState } from 'react'
import { useT } from '../theme'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { useActiveShelterAnnouncement } from '../hooks/useShelterPublicContent'

export default function AnnouncementBar() {
  const T = useT()
  const ctx = useShelterConfigContext()
  const shelter = ctx?.shelter
  const config = ctx?.config
  const { announcement } = useActiveShelterAnnouncement(shelter?.id ?? null)
  const dismissKey = `announcement-dismissed-${announcement?.id ?? 'legacy'}`
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(dismissKey) } catch { return false }
  })

  const text = announcement?.body || config?.announcement_text || ''
  const active = announcement ? true : !!config?.announcement_active
  if (!active || !text || dismissed) return null
  if (!announcement && config?.announcement_end_date && new Date(config.announcement_end_date) < new Date()) return null

  const dismiss = () => {
    try { localStorage.setItem(dismissKey, '1') } catch {}
    setDismissed(true)
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
      color: '#fff', padding: '8px 40px 8px 14px',
      fontSize: 13, fontWeight: 600, textAlign: 'center',
      position: 'relative', lineHeight: 1.4,
    }}>
      {text}
      <button
        onClick={dismiss}
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

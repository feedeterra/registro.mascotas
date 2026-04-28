import { useT } from '../theme'
import { SponsorZone } from './ui'
import { DEFAULT_WHATSAPP, DEFAULT_DONATION_LINK } from '../lib/constants'
import { useShelterConfigContext } from '../context/ShelterConfigContext'
import { Heart, Share2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function Footer() {
  const T = useT()
  const shelterCtx = useShelterConfigContext()
  const toast = useToast()
  const config = shelterCtx?.config

  const WHATSAPP = DEFAULT_WHATSAPP
  const DONATION_LINK = config?.donation_link || DEFAULT_DONATION_LINK
  const instagramUrl = config?.instagram_url
  const shelterName = config?.name || 'Registro de Mascotas'
  const isGlobal = !config

  return (
    <footer style={{
      textAlign: 'center', padding: '24px 16px 100px',
      fontSize: 13, color: T.muted,
      borderTop: `1px solid ${T.borderLt}`,
      marginTop: 32,
    }}>
      {/* Social proof / Share */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16,
        marginBottom: 16, fontSize: 13, fontWeight: 700,
      }}>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Registro de Mascotas',
                text: 'Ayudá a los perritos de los refugios a encontrar un hogar. ¡Adoptá o sumate como voluntario!',
                url: window.location.origin,
              })
            } else {
              navigator.clipboard.writeText(window.location.origin)
              toast?.notifySuccess?.('Link copiado al portapapeles')
            }
          }}
          style={{
            background: 'none', border: 'none', color: T.accent,
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: 0,
          }}
        >
          <Share2 size={16} /> Compartir app
        </button>
        {config?.city && <span style={{ color: T.purple }}>{config.city}</span>}
      </div>

      <SponsorZone tier="standard" style={{ marginBottom: 16, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }} />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        {!isGlobal && (
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.ok, fontWeight: 600, textDecoration: 'none' }}
          >
            WhatsApp
          </a>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.purple, fontWeight: 600, textDecoration: 'none' }}
          >
            Instagram
          </a>
        )}
        {!isGlobal && (
          <a
            href={DONATION_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.accent, fontWeight: 600, textDecoration: 'none' }}
          >
            Donar
          </a>
        )}
      </div>
      <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>Hecho con <Heart size={14} fill="currentColor" stroke="none" style={{ color: T.purple }} /> por voluntarios para los perritos</p>
      <p style={{ marginTop: 4, fontSize: 11 }}>{shelterName} &copy; {new Date().getFullYear()}</p>
    </footer>
  )
}

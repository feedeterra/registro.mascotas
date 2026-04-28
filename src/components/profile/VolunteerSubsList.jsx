import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../theme'
import { useAuthContext } from '../../context/AuthContext'
import { Card } from '../ui'
import { Building, MapPin, Dog, MessageCircle } from 'lucide-react'
import { DEFAULT_WHATSAPP } from '../../lib/constants'

const VOLUNTEER_ROLE_LABELS = {
  juntadas: 'Juntadas',
  transporte_personas: 'Llevar personas',
  transporte_perros: <span style={{display:'flex', gap:4, alignItems:'center'}}><Dog size={14}/> Trasladar perros</span>,
}

export default function VolunteerSubsList() {
  const T = useT()
  const { volunteerSubs, unsubscribeFromShelter } = useAuthContext()
  const [unsubConfirm, setUnsubConfirm] = useState(null)
  const [actionError, setActionError] = useState('')

  const handleUnsub = async (shelterId) => {
    try {
      await unsubscribeFromShelter(shelterId)
      setUnsubConfirm(null)
    } catch (err) {
      setActionError(err.message || 'Error al desuscribirse')
    }
  }

  if (volunteerSubs.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <Card style={{ padding: 20, textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Todavía no te suscribiste a ningún refugio para ayudar.
          </div>
        </Card>
        <Link
          to="/sumarme"
          style={{
            display: 'block', textAlign: 'center', padding: '14px',
            background: T.accentLt, color: T.accent, borderRadius: 16,
            fontWeight: 800, fontSize: 14, textDecoration: 'none',
            border: `2px dashed ${T.accent}40`,
          }}
        >
          + Quiero sumarme a ayudar
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {actionError && (
        <div style={{ padding: '8px 12px', background: T.dangerLt, color: T.danger, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          {actionError}
        </div>
      )}
      
      {volunteerSubs.map(sub => (
        <Card key={sub.id} style={{ padding: 0, marginBottom: 16, overflow: 'hidden', border: `1px solid ${T.borderLt}` }}>
          {/* Cuerpo del mensaje */}
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: T.accentLt, margin: '0 auto 16px',
              border: `3px solid ${T.card}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {sub.shelter?.image_url ? (
                <img src={sub.shelter.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={sub.shelter.name} />
              ) : (
                <Building size={28} color={T.accent} />
              )}
            </div>
            
            <p style={{ fontSize: 14, lineHeight: 1.6, color: T.txt, margin: 0 }}>
              ¡Gracias por ayudar a <strong>{sub.shelter?.name || 'el refugio'}</strong> en esta causa! <br/>
              <span style={{ color: T.muted, fontSize: 13 }}>Los perritos te agradecen mucho tu compromiso como voluntario.</span>
            </p>
          </div>

          {/* Línea divisora */}
          <div style={{ height: 1, background: T.borderLt }} />

          {/* Footer de acciones */}
          <div style={{ padding: '12px 16px', background: '#fff', display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
            <Link
              to={`/refugio/${sub.shelter?.slug}`}
              style={{
                fontSize: 12, fontWeight: 800, color: T.accent,
                textDecoration: 'none', padding: '8px 16px',
                background: T.accentLt, borderRadius: 12,
              }}
            >
              Ver refugio
            </Link>
            
            {unsubConfirm === sub.shelter_id ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => handleUnsub(sub.shelter_id)}
                  style={{
                    fontSize: 11, fontWeight: 800, color: T.danger,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  Confirmar salida
                </button>
                <button
                  onClick={() => setUnsubConfirm(null)}
                  style={{
                    fontSize: 11, color: T.muted, fontWeight: 700,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setUnsubConfirm(sub.shelter_id)}
                style={{
                  fontSize: 11, fontWeight: 700, color: T.muted,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Dejar de ayudar
              </button>
            )}
          </div>
        </Card>
      ))}

      <Link
        to="/sumarme"
        style={{
          display: 'block', textAlign: 'center', padding: '14px',
          background: T.accentLt, color: T.accent, borderRadius: 16,
          fontWeight: 800, fontSize: 14, textDecoration: 'none',
          marginTop: 8, border: `2px dashed ${T.accent}40`,
        }}
      >
        + Quiero ayudar a otro refugio
      </Link>
    </div>
  )
}

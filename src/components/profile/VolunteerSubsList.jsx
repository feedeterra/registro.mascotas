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
        <Card key={sub.id} style={{ padding: '20px', marginBottom: 12, border: `1px solid ${T.accent}20` }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: T.accentLt, color: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', flexShrink: 0,
            }}><Building size={24} /></div>
            
            <p style={{ fontSize: 14, lineHeight: 1.5, color: T.txt, margin: '0 0 16px' }}>
              ¡Gracias por ayudar a <strong>{sub.shelter?.name || 'el refugio'}</strong> en esta causa! <br/>
              Los perritos te agradecen mucho tu compromiso como voluntario.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
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
                    Cancelar
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

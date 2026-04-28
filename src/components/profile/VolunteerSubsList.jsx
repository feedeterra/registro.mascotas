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
        <Card key={sub.id} style={{ padding: '14px 16px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {/* Izquierda: Icono + Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: T.accentLt, color: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}><Building size={22} /></div>
              
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.txt, lineHeight: 1.2 }}>
                  {sub.shelter?.name || 'Refugio'}
                </div>
                <div style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={11} /> {sub.shelter?.city || '—'}
                </div>
                {sub.roles?.length > 0 && (
                  <div style={{ 
                    marginTop: 6, fontSize: 10, color: T.accent, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.02em'
                  }}>
                    {sub.roles.map(r => (typeof VOLUNTEER_ROLE_LABELS[r] === 'string' ? VOLUNTEER_ROLE_LABELS[r] : r)).join(' · ')}
                  </div>
                )}
              </div>
            </div>

            {/* Derecha: Botones apilados y centrados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              <Link
                to={`/refugio/${sub.shelter?.slug}`}
                style={{
                  fontSize: 11, fontWeight: 800, color: T.accent,
                  textDecoration: 'none', padding: '8px 16px',
                  background: T.accentLt, borderRadius: 10,
                  textAlign: 'center', minWidth: 85
                }}
              >
                Ver Info
              </Link>
              {unsubConfirm === sub.shelter_id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <button
                    onClick={() => handleUnsub(sub.shelter_id)}
                    style={{
                      fontSize: 10, fontWeight: 800, color: '#fff',
                      background: T.danger, border: 'none',
                      borderRadius: 8, padding: '6px 0', cursor: 'pointer',
                    }}
                  >
                    Sí, salir
                  </button>
                  <button
                    onClick={() => setUnsubConfirm(null)}
                    style={{
                      fontSize: 9, color: T.muted, fontWeight: 700,
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
                    padding: '4px 0'
                  }}
                >
                  Salir
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

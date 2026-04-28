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
        <Card key={sub.id} style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* 1. Icono */}
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: T.accentLt, color: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><Building size={20} /></div>
            
            {/* 2. Info Central */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: T.txt, lineHeight: 1.2 }}>
                {sub.shelter?.name || 'Refugio'}
              </div>
              <div style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                <MapPin size={10} /> {sub.shelter?.city || '—'}
              </div>
              {sub.roles?.length > 0 && (
                <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginTop: 2 }}>
                  {sub.roles.map(r => (typeof VOLUNTEER_ROLE_LABELS[r] === 'string' ? VOLUNTEER_ROLE_LABELS[r] : r)).join(' · ')}
                </div>
              )}
            </div>

            {/* 3. Acciones a la derecha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              <Link
                to={`/refugio/${sub.shelter?.slug}`}
                style={{
                  fontSize: 10, fontWeight: 800, color: T.accent,
                  textDecoration: 'none', padding: '6px 10px',
                  background: T.accentLt, borderRadius: 8,
                  textAlign: 'center'
                }}
              >
                Ver Info
              </Link>
              {unsubConfirm === sub.shelter_id ? (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={() => handleUnsub(sub.shelter_id)}
                    style={{
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      background: T.danger, border: 'none',
                      borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
                    }}
                  >
                    Sí, salir
                  </button>
                  <button
                    onClick={() => setUnsubConfirm(null)}
                    style={{
                      fontSize: 9, color: T.muted, fontWeight: 800,
                      background: T.borderLt, border: 'none',
                      borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setUnsubConfirm(sub.shelter_id)}
                  style={{
                    fontSize: 10, fontWeight: 700, color: T.muted,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 0', textAlign: 'center'
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

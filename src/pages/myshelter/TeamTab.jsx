import { Search, Loader } from 'lucide-react'
import { Card } from '../../components/ui'

function TeamMemberRow({ p, T, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 16,
      background: T.bg, border: `1.5px solid ${T.borderLt}`,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: `linear-gradient(135deg, ${T.accentLt}, #fff)`, color: T.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, flexShrink: 0,
      }}>
        {(p.display_name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>{p.display_name || 'Sin nombre'}</div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{p.phone || 'Sin teléfono'}</div>
      </div>
      {onRemove && (
        <button className="btn-press" onClick={onRemove} style={{
          fontSize: 12, fontWeight: 800, color: T.danger,
          background: T.dangerLt, border: 'none',
          borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
        }}>
          Quitar
        </button>
      )}
    </div>
  )
}

export default function TeamTab({ 
  currentStaff, currentVolunteers, staffLoading, volunteersLoading,
  teamSearch, setTeamSearch, searchUsers, teamSearching, teamResults,
  assignStaff, removeStaff, targetId, T 
}) {
  return (
    <div className="anim">
      {/* Agregar staff */}
      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Agregar Staff</h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
          Buscá por nombre o teléfono para invitar nuevos administradores.
        </p>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Nombre o teléfono..."
            value={teamSearch}
            onChange={e => { setTeamSearch(e.target.value); searchUsers(e.target.value) }}
            style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: `1.5px solid ${T.borderLt}`, fontSize: 15, boxSizing: 'border-box' }}
          />
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
        </div>
        {teamSearching && <div style={{ padding: 12, fontSize: 12, color: T.muted }}>Buscando...</div>}
        {teamResults.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teamResults.map(p => {
              const alreadyStaff = currentStaff.some(s => s.id === p.id)
              const otherShelter = p.shelter_id && p.shelter_id !== targetId
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, background: T.bg }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.display_name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {p.phone}
                      {otherShelter && <span style={{ color: T.danger }}> · Otro refugio</span>}
                    </div>
                  </div>
                  {!alreadyStaff && (
                    <button
                      className="btn-press"
                      onClick={() => assignStaff(p.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {otherShelter ? 'Reasignar' : 'Agregar'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Owner */}
      {(() => {
        const owners = currentStaff.filter(p => p.shelter_role === 'owner')
        if (!owners.length) return null
        return (
          <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Responsable</h2>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Titular del refugio.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {owners.map(p => (
                <TeamMemberRow key={p.id} p={p} T={T} onRemove={null} />
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Staff */}
      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Staff</h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Personas con acceso a la gestión del refugio.</p>
        {staffLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted }}><Loader size={20} className="spin" /></div>
        ) : currentStaff.filter(p => p.shelter_role !== 'owner').length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>Ningún staff asignado todavía.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentStaff.filter(p => p.shelter_role !== 'owner').map(p => (
              <TeamMemberRow key={p.id} p={p} T={T} onRemove={() => removeStaff(p.id)} />
            ))}
          </div>
        )}
      </Card>

      {/* Voluntarios */}
      <Card style={{ padding: 24, marginBottom: 16, border: `1.5px solid ${T.borderLt}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: T.txt, letterSpacing: -0.5 }}>Voluntarios</h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Personas anotadas para ayudar al refugio.</p>
        {volunteersLoading ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted }}><Loader size={20} className="spin" /></div>
        ) : currentVolunteers.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 13 }}>No hay voluntarios anotados todavía.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentVolunteers.map((v, i) => {
              const p = v.user || v
              return (
                <div key={p.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 16,
                  background: T.bg, border: `1.5px solid ${T.borderLt}`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14,
                    background: `linear-gradient(135deg, ${T.sagePale}, #fff)`, color: T.sage,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, flexShrink: 0,
                  }}>
                    {(p.display_name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.txt }}>{p.display_name || 'Sin nombre'}</div>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{p.phone || 'Sin teléfono'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

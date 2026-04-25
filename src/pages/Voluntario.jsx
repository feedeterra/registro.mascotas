import { useNavigate } from 'react-router-dom'
import { useT, R, RS } from '../theme'
import { Card, Btn } from '../components/ui'

export default function Voluntario() {
  const T = useT()
  const navigate = useNavigate()

  return (
    <div className="anim" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <Card style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🤝</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 8 }}>
          Anotarse como voluntario/a
        </h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 18 }}>
          Esta funcionalidad esta en construccion. Pronto vas a poder anotarte en un par de pasos
          y sumarte al equipo del refugio.
        </p>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>
          Mientras tanto, escribinos por WhatsApp y te sumamos al grupo de voluntarios.
        </p>
        <Btn onClick={() => navigate('/refugio/casa')} sz="lg">
          Volver al refugio
        </Btn>
      </Card>
    </div>
  )
}

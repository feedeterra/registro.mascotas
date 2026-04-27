import { useNavigate } from 'react-router-dom'
import { useT } from '../theme'
import { Dog } from 'lucide-react'
import { Card, Btn } from '../components/ui'

export default function NotFound() {
  const T = useT()
  const navigate = useNavigate()

  return (
    <div className="anim" style={{ paddingTop: 40, paddingBottom: 24 }}>
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: T.accent, display: 'flex', justifyContent: 'center' }}>
          <Dog size={48} strokeWidth={1} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt, marginBottom: 8 }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
          La página que buscás no existe o fue movida.
        </p>
        <Btn sz="lg" onClick={() => navigate('/')}>
          Volver al inicio
        </Btn>
      </Card>
    </div>
  )
}

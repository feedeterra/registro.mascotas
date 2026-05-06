import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../theme'
import { Card, Btn } from '../components/ui'

const now = Date.now()
const day = 86400000

const dogs = [
  {
    name: 'Canela', species: 'dog', color: 'Marrón claro', size: 'medium',
    sex: 'female', neutered: true, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Centro',
    photos: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80'],
    notes: 'Canela fue encontrada en la ruta, muy asustada. Es súper cariñosa y se lleva bien con otros perros. Necesita un hogar urgente.',
    registered_via: 'organic', created_at: new Date(now - 15 * day).toISOString(),
  },
  {
    name: 'Mora', species: 'dog', color: 'Atigrada', size: 'medium',
    sex: 'female', neutered: false, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Barrio Norte',
    photos: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80'],
    notes: 'Mora fue abandonada atada a un poste. Es muy dócil y obediente. Tiene 2 años y está sana.',
    registered_via: 'organic', created_at: new Date(now - 3 * day).toISOString(),
  },
  {
    name: 'Nena', species: 'dog', color: 'Negra con patas blancas', size: 'medium',
    sex: 'female', neutered: false, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Ruta 8',
    photos: ['https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80'],
    notes: 'Nena fue atropellada y rescatada. Ya se recuperó, está castrada y lista para adopción.',
    registered_via: 'organic', created_at: new Date(now - 1 * day).toISOString(),
  },
  {
    name: 'Rocky', species: 'dog', color: 'Dorado', size: 'large',
    sex: 'male', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'],
    notes: 'Rocky es un amor. Le encanta jugar con pelotas y es muy bueno con los chicos. Tiene 4 años.',
    registered_via: 'organic', created_at: new Date(now - 45 * day).toISOString(),
  },
  {
    name: 'Toto', species: 'dog', color: 'Negro', size: 'large',
    sex: 'male', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80'],
    notes: 'Toto es el payaso del refugio. Siempre contento, ideal para una familia activa. Tiene 3 años.',
    registered_via: 'organic', created_at: new Date(now - 60 * day).toISOString(),
  },
  {
    name: 'Coco', species: 'dog', color: 'Blanco', size: 'small',
    sex: 'male', neutered: false, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=600&q=80'],
    notes: 'Coco es tranquilo y cariñoso. Ideal para departamento. Tiene aproximadamente 5 años.',
    registered_via: 'organic', created_at: new Date(now - 30 * day).toISOString(),
  },
  {
    name: 'Firulais', species: 'dog', color: 'Marrón y blanco', size: 'medium',
    sex: 'male', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1477884213360-7e9d7dcc8f9b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Firulais es el más veterano del refugio. Es tranquilo, sabe pasear con correa. Tiene 7 años y mucho amor para dar.',
    registered_via: 'organic', created_at: new Date(now - 90 * day).toISOString(),
  },
  {
    name: 'Bruno', species: 'dog', color: 'Negro y marrón', size: 'large',
    sex: 'male', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'],
    notes: 'Bruno parece imponente pero es un gigante gentil. Le encanta que lo acaricien. Tiene 5 años.',
    registered_via: 'organic', created_at: new Date(now - 55 * day).toISOString(),
  },
  {
    name: 'Manchas', species: 'dog', color: 'Blanco con manchas negras', size: 'medium',
    sex: 'male', neutered: false, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80'],
    notes: 'Manchas es juguetón y muy activo. Necesita una familia con patio. Tiene 2 años.',
    registered_via: 'organic', created_at: new Date(now - 40 * day).toISOString(),
  },
  {
    name: 'Luna', species: 'dog', color: 'Blanca', size: 'small',
    sex: 'female', neutered: true, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio Las Acacias',
    photos: ['https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Luna está en tránsito recuperándose de una cirugía. Es dulce y tranquila. Tiene 3 años.',
    registered_via: 'organic', created_at: new Date(now - 20 * day).toISOString(),
  },
  {
    name: 'Laika', species: 'dog', color: 'Negro y fuego', size: 'large',
    sex: 'female', neutered: true, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio San Martín',
    photos: ['https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=600&q=80'],
    notes: 'Laika es inteligente y protectora. Ideal para casa con patio. Está en tránsito temporal. Tiene 4 años.',
    registered_via: 'organic', created_at: new Date(now - 10 * day).toISOString(),
  },
  {
    name: 'Lola', species: 'dog', color: 'Canela', size: 'small',
    sex: 'female', neutered: false, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio Sur',
    photos: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Lola es una cachorrita de 8 meses, muy juguetona. Se lleva bien con gatos. Está en tránsito.',
    registered_via: 'organic', created_at: new Date(now - 25 * day).toISOString(),
  },
]

export default function DevSeed() {
  const T = useT()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!import.meta.env.DEV) {
    navigate('/', { replace: true })
    return null
  }

  const handleSeed = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const { data: shelter } = await supabase.from('shelters').select('id').eq('slug', 'casa').single()
      const withShelter = dogs.map(d => ({ ...d, shelter_id: shelter?.id || null }))
      const { data, error } = await supabase.from('pets').insert(withShelter).select('id, name')
      if (error) throw error
      setStatus({ ok: true, msg: `Insertados ${data.length} perros: ${data.map(d => d.name).join(', ')}` })
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignShelter = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const { data: shelter } = await supabase.from('shelters').select('id').eq('slug', 'casa').single()
      if (!shelter) throw new Error('No se encontró el refugio "casa"')
      const { data, error } = await supabase
        .from('pets')
        .update({ shelter_id: shelter.id })
        .is('shelter_id', null)
        .select('id, name')
      if (error) throw error
      setStatus({ ok: true, msg: `${data.length} perros asignados al refugio "casa"` })
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from('pets').delete().eq('registered_via', 'organic')
      if (error) throw error
      setStatus({ ok: true, msg: 'Todos los perros de ejemplo eliminados' })
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: T.txt }}>Dev: Seed Data</h1>
      <Card style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 16 }}>
          Inserta 12 perros de ejemplo en la base de datos para probar la app.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={handleSeed} disabled={loading} sz="lg">
            {loading ? 'Insertando...' : 'Insertar 12 perros'}
          </Btn>
          <Btn onClick={handleAssignShelter} disabled={loading} v="secondary" sz="lg">
            {loading ? 'Asignando...' : 'Asignar todos a "casa"'}
          </Btn>
          <Btn onClick={handleClear} disabled={loading} v="danger" sz="lg">
            Limpiar
          </Btn>
        </div>
        {status && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: status.ok ? T.okLt : T.dangerLt,
            color: status.ok ? T.ok : T.danger,
            fontSize: 13, fontWeight: 600,
          }}>
            {status.msg}
          </div>
        )}
      </Card>
    </div>
  )
}

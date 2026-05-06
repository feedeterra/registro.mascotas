import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env
const env = readFileSync('.env', 'utf8')
const vars = {}
env.split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)

const now = Date.now()
const day = 86400000

const dogs = [
  // URGENTES
  {
    name: 'Canela', species: 'dog', color: 'Marrón claro', size: 'Mediano',
    sex: 'Hembra', neutered: true, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Centro',
    photos: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80'],
    notes: 'Canela fue encontrada en la ruta, muy asustada. Es súper cariñosa y se lleva bien con otros perros. Necesita un hogar urgente.',
    registered_via: 'organic', created_at: new Date(now - 15 * day).toISOString(),
  },
  {
    name: 'Mora', species: 'dog', color: 'Atigrada', size: 'Mediano',
    sex: 'Hembra', neutered: false, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Barrio Norte',
    photos: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80'],
    notes: 'Mora fue abandonada atada a un poste. Es muy dócil y obediente. Tiene 2 años y está sana.',
    registered_via: 'organic', created_at: new Date(now - 3 * day).toISOString(),
  },
  {
    name: 'Nena', species: 'dog', color: 'Negra con patas blancas', size: 'Mediano',
    sex: 'Hembra', neutered: false, type: 'stray', status: 'found', adoption_status: 'urgent',
    neighborhood: 'Ruta 8',
    photos: ['https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80'],
    notes: 'Nena fue atropellada y rescatada. Ya se recuperó, está castrada y lista para adopción.',
    registered_via: 'organic', created_at: new Date(now - 1 * day).toISOString(),
  },
  // EN REFUGIO
  {
    name: 'Rocky', species: 'dog', color: 'Dorado', size: 'Grande',
    sex: 'Macho', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'],
    notes: 'Rocky es un amor. Le encanta jugar con pelotas y es muy bueno con los chicos. Tiene 4 años.',
    registered_via: 'organic', created_at: new Date(now - 45 * day).toISOString(),
  },
  {
    name: 'Toto', species: 'dog', color: 'Negro', size: 'Grande',
    sex: 'Macho', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80'],
    notes: 'Toto es el payaso del refugio. Siempre contento, ideal para una familia activa. Tiene 3 años.',
    registered_via: 'organic', created_at: new Date(now - 60 * day).toISOString(),
  },
  {
    name: 'Coco', species: 'dog', color: 'Blanco', size: 'Chico',
    sex: 'Macho', neutered: false, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=600&q=80'],
    notes: 'Coco es tranquilo y cariñoso. Ideal para departamento. Tiene aproximadamente 5 años.',
    registered_via: 'organic', created_at: new Date(now - 30 * day).toISOString(),
  },
  {
    name: 'Firulais', species: 'dog', color: 'Marrón y blanco', size: 'Mediano',
    sex: 'Macho', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1477884213360-7e9d7dcc8f9b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Firulais es el más veterano del refugio. Es tranquilo, sabe pasear con correa. Tiene 7 años y mucho amor para dar.',
    registered_via: 'organic', created_at: new Date(now - 90 * day).toISOString(),
  },
  {
    name: 'Bruno', species: 'dog', color: 'Negro y marrón', size: 'Grande',
    sex: 'Macho', neutered: true, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80'],
    notes: 'Bruno parece imponente pero es un gigante gentil. Le encanta que lo acaricien. Tiene 5 años.',
    registered_via: 'organic', created_at: new Date(now - 55 * day).toISOString(),
  },
  {
    name: 'Manchas', species: 'dog', color: 'Blanco con manchas negras', size: 'Mediano',
    sex: 'Macho', neutered: false, type: 'stray', status: 'found', adoption_status: 'shelter',
    neighborhood: 'Refugio CASA',
    photos: ['https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80'],
    notes: 'Manchas es juguetón y muy activo. Necesita una familia con patio. Tiene 2 años.',
    registered_via: 'organic', created_at: new Date(now - 40 * day).toISOString(),
  },
  // EN TRÁNSITO
  {
    name: 'Luna', species: 'dog', color: 'Blanca', size: 'Chico',
    sex: 'Hembra', neutered: true, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio Las Acacias',
    photos: ['https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Luna está en tránsito recuperándose de una cirugía. Es dulce y tranquila. Tiene 3 años.',
    registered_via: 'organic', created_at: new Date(now - 20 * day).toISOString(),
  },
  {
    name: 'Laika', species: 'dog', color: 'Negro y fuego', size: 'Grande',
    sex: 'Hembra', neutered: true, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio San Martín',
    photos: ['https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=600&q=80'],
    notes: 'Laika es inteligente y protectora. Ideal para casa con patio. Está en tránsito temporal. Tiene 4 años.',
    registered_via: 'organic', created_at: new Date(now - 10 * day).toISOString(),
  },
  {
    name: 'Lola', species: 'dog', color: 'Canela', size: 'Chico',
    sex: 'Hembra', neutered: false, type: 'stray', status: 'found', adoption_status: 'transit',
    neighborhood: 'Barrio Sur',
    photos: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80'],
    notes: 'Lola es una cachorrita de 8 meses, muy juguetona. Se lleva bien con gatos. Está en tránsito.',
    registered_via: 'organic', created_at: new Date(now - 25 * day).toISOString(),
  },
]

console.log('Insertando 12 perros de ejemplo...')

const { data, error } = await supabase.from('pets').insert(dogs).select('id, name')

if (error) {
  console.error('Error:', error.message)
  console.log('\nSi el error es de permisos (RLS), ejecuta el SQL directamente en Supabase Dashboard:')
  console.log('  Dashboard > SQL Editor > New Query > pegar scripts/seed-dogs.sql > Run')
  process.exit(1)
}

console.log(`Insertados ${data.length} perros:`)
data.forEach(d => console.log(`  - ${d.name} (${d.id})`))

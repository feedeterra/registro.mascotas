import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://ombtfvupawpiopvcmynx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const { data, error } = await supabase
  .from('pets')
  .update({ waiting_unit: 'años' })
  .eq('registered_via', 'bulk_import')
  .not('age', 'is', null)
  .select('id,name,age')

if (error) { console.error(error.message); process.exit(1) }

// waiting_number must equal age per row — do it in one shot via JS
for (const pet of data) {
  await supabase.from('pets').update({ waiting_number: pet.age }).eq('id', pet.id)
}
console.log(`${data.length} perros actualizados`)

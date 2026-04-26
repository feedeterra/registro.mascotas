import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

const envPath = path.resolve('.env')
const vars = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)

async function getShelterId() {
  const { data, error } = await supabase.from('shelters').select('id').eq('slug', 'casa').single()
  if (error) console.error('Error:', error.message)
  else console.log('SHELTER_ID:', data.id)
}
getShelterId()

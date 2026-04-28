import { createClient } from '@supabase/supabase-client'
import dotenv from 'dotenv'
dotenv.config()

// We use the anon key to simulate a public user
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  console.log('--- Checking shelters (public) ---')
  const { data: shelters, error: shErr } = await supabase.from('shelters').select('id, name, slug').limit(5)
  if (shErr) console.error('Shelters error:', shErr)
  else console.log('Shelters found:', shelters)

  console.log('\n--- Checking shelter_config (public) ---')
  const { data: configs, error: cfgErr } = await supabase.from('shelter_config').select('id, shelter_id, shelter_image_url').limit(5)
  if (cfgErr) console.error('Config error:', cfgErr)
  else console.log('Configs found:', configs)
}

check()

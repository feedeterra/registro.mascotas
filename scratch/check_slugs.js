import { createClient } from '@supabase/supabase-client'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.from('shelters').select('id, name, slug').or('slug.is.null,slug.eq.""')
  if (error) console.error(error)
  else console.log('Shelters with missing slugs:', data)
}

check()

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const envPath = path.resolve('.env')
const vars = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) vars[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)

async function check() {
  const table = process.argv[2] || 'pets'
  const { data, error } = await supabase.from(table).select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Columns for ${table}:`, Object.keys(data[0] || {}))
  }
}
check()

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

async function testInsert() {
  const { error } = await supabase.from('pets').insert({
    name: 'Test Columns',
    adopter_name: 'Test Adopter'
  })
  if (error) {
    console.log('Error inserting adopter_name:', error.message)
  } else {
    console.log('Column adopter_name EXISTS!')
  }
}
testInsert()

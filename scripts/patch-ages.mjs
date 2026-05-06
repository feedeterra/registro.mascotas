import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ombtfvupawpiopvcmynx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQ = false
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { row.push(cur.trim()); cur = '' }
      else if (c === '\n') { row.push(cur.trim()); rows.push(row); row = []; cur = '' }
      else if (c === '\r') {}
      else cur += c
    }
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row) }
  return rows
}

function parseAge(raw) {
  if (!raw) return null
  const s = raw.toString().toLowerCase().trim()
  if (s === 'vieji') return 10
  const nums = s.match(/\d+/g)
  if (!nums) return null
  return Math.max(...nums.map(Number))
}

const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')
const ALIAS = { 'mila':'milanesa','morci':'morcilla','sonri':'sonrisa','negri':'negrito','oli':'olivia','pilin':'polito' }

const raw = readFileSync('/Users/federicoterrazas/Desktop/perritos/Casa Refugio 2026 - Perros del refu.csv', 'utf8')
const rows = parseCSV(raw)
const hdrs = rows[1]
const nameIdx = hdrs.indexOf('Perro')
const ageIdx  = hdrs.indexOf('Edad')
const data = rows.slice(2).filter(r => r[nameIdx]?.length > 1)

// Build name→age map (keep highest age if duplicate names)
const ageMap = new Map()
for (const r of data) {
  const name = r[nameIdx].trim()
  const age  = parseAge(r[ageIdx])
  if (!age) continue
  const key = norm(name)
  const canonical = ALIAS[key] || key
  if (!ageMap.has(canonical) || age > ageMap.get(canonical).age)
    ageMap.set(canonical, { name, age })
}

// Fetch all bulk_import pets
const { data: pets } = await supabase
  .from('pets')
  .select('id, name')
  .eq('registered_via', 'bulk_import')

let ok = 0, skip = 0
for (const pet of pets) {
  const key = ALIAS[norm(pet.name)] || norm(pet.name)
  const entry = ageMap.get(key)
  if (!entry) { skip++; continue }
  const { error } = await supabase.from('pets').update({ age: entry.age }).eq('id', pet.id)
  if (error) console.error(`✗ ${pet.name}: ${error.message}`)
  else { console.log(`✓ ${pet.name} → ${entry.age} años`); ok++ }
}
console.log(`\n${ok} actualizados, ${skip} sin edad`)
